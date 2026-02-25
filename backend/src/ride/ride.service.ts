import { Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { RideRepository } from './ride.repository';
import { Ride, RideStatus } from './domain/ride.model';
import { UserService } from '../user/user.service';
import { VehicleService } from 'src/vehicle/vehicle.service';
import { RedisService } from '../redis/redis.service';
import { PaymentService } from '../payment/payment.service';

const BATCH_SIZE = 5;
const MAX_DRIVERS = 15;    // 3 batches
const NEARBY_RADIUS_KM = 10;
const BATCH_TTL_SECONDS = 300;

@Injectable()
export class RideService {
  constructor(
    private readonly rideRepository: RideRepository,
    private readonly userService: UserService,
    private readonly vehicleService: VehicleService,
    private readonly redisService: RedisService,
    private readonly paymentService: PaymentService,
    @Inject('RIDE_SERVICE') private readonly kafkaClient: ClientKafka,
  ) {}

  async requestRide(
    riderId: string,
    pickupLat: number,
    pickupLng: number,
    destLat: number,
    destLng: number,
    price?: number,
  ) {
    // Calculate price if not provided
    const ridePrice = price ?? this.calculatePrice(pickupLat, pickupLng, destLat, destLng);

    const rideId = crypto.randomUUID();

    // Pre-authorize payment — will throw if card declined / insufficient funds
    let paymentIntentId: string | null = null;
    let invoiceId: string | null = null;
    try {
      const auth = await this.paymentService.authorizeRidePayment(
        riderId,
        rideId,
        ridePrice,
      );
      paymentIntentId = auth.paymentIntentId;
      invoiceId = auth.invoiceId;
    } catch (err) {
      throw new BadRequestException(
        err.message || 'Payment authorization failed. Please check your card.',
      );
    }

    const newRide = new Ride(
      rideId,
      pickupLat,
      pickupLng,
      destLat,
      destLng,
      RideStatus.REQUESTED,
      riderId,
      null,
      ridePrice,
      undefined,
      paymentIntentId,
    );

    const savedRide = await this.rideRepository.save(newRide);

    // Save the invoice AFTER the ride exists (FK constraint)
    if (invoiceId && paymentIntentId) {
      await this.paymentService.saveRideInvoice(
        invoiceId,
        savedRide.id,
        riderId,
        ridePrice,
        paymentIntentId,
      );
    }

    // Find nearby drivers and store batches BEFORE emitting to Kafka
    const nearbyDriverIds = await this.redisService.georadiusNearby(
      'drivers:active',
      pickupLng,
      pickupLat,
      NEARBY_RADIUS_KM,
      'km',
      MAX_DRIVERS,
    );

    const batches: string[][] = [];
    for (let i = 0; i < nearbyDriverIds.length; i += BATCH_SIZE) {
      batches.push(nearbyDriverIds.slice(i, i + BATCH_SIZE));
    }

    await this.storeBatches(savedRide.id, batches);

    this.kafkaClient.emit('ride.requested', {
      id: savedRide.id,
      pickupLat: savedRide.pickupLat,
      pickupLng: savedRide.pickupLng,
      destinationLat: savedRide.destinationLat,
      destinationLng: savedRide.destinationLng,
      status: savedRide.status,
      riderId: savedRide.riderId,
      driverId: savedRide.driverId,
      createdAt: savedRide.createdAt,
    });

    return savedRide;
  }

  async acceptRide(rideId: string, driverId: string) {
    const ride = await this.rideRepository.findById(rideId);
    if (!ride) throw new Error('Ride not found');

    ride.assignDriver(driverId);

    const updatedRide = await this.rideRepository.save(ride);

    await this.cleanupBatches(rideId);

    this.kafkaClient.emit('ride.accepted', {
      rideId,
      driverId,
      riderId: ride.riderId,
      status: updatedRide.status,
    });

    return updatedRide;
  }

  async findRideById(rideId: string): Promise<Ride | null> {
    return this.rideRepository.findById(rideId);
  }

  async startRide(rideId: string, driverId: string): Promise<Ride> {
    const ride = await this.rideRepository.findById(rideId);
    if (!ride) throw new Error('Ride not found');
    if (ride.driverId !== driverId)
      throw new Error('You are not the driver of this ride');

    ride.startRide();

    const updatedRide = await this.rideRepository.save(ride);

    this.kafkaClient.emit('ride.started', {
      rideId,
      riderId: ride.riderId,
      driverId: ride.driverId,
      status: updatedRide.status,
    });

    return updatedRide;
  }

  async cancelRide(rideId: string, userId: string): Promise<Ride> {
    const ride = await this.rideRepository.findById(rideId);
    if (!ride) throw new Error('Ride not found');
    if (ride.riderId !== userId && ride.driverId !== userId) {
      throw new Error('You are not part of this ride');
    }

    ride.cancelRide();

    const updatedRide = await this.rideRepository.save(ride);

    // Cancel the pre-authorized payment
    await this.paymentService.cancelRidePayment(rideId);

    this.kafkaClient.emit('ride.cancelled', {
      rideId,
      riderId: ride.riderId,
      driverId: ride.driverId,
      status: updatedRide.status,
    });

    return updatedRide;
  }

  async completeRide(rideId: string): Promise<Ride> {
    const ride = await this.rideRepository.findById(rideId);
    if (!ride) throw new Error('Ride not found');

    ride.completeRide();

    const updatedRide = await this.rideRepository.save(ride);

    await this.userService.incrementRiderRideCount(ride.riderId);

    // Capture the pre-authorized payment
    let paymentStatus = 'success';
    try {
      const invoice = await this.paymentService.captureRidePayment(rideId);
      paymentStatus = invoice.status;
    } catch (err) {
      paymentStatus = 'failed';
    }

    this.kafkaClient.emit('ride.completed', {
      rideId,
      riderId: ride.riderId,
      driverId: ride.driverId,
      status: updatedRide.status,
      paymentStatus,
    });

    return updatedRide;
  }

  async getCompletedRidesForRider(riderId: string) {
    return this.rideRepository.findCompletedRidesForRider(riderId);
  }

  async getCompletedRidesForDriver(driverId: string) {
    return this.rideRepository.findCompletedRidesForDriver(driverId);
  }

  async getVehicleForRide(rideId: string) {
    const ride = await this.rideRepository.findById(rideId);
    if (!ride) throw new NotFoundException('Ride not found');

    if (!ride.driverId)
      throw new NotFoundException('Ride has no assigned driver yet');

    const vehicle = await this.vehicleService.getActiveVehicleForDriver(
      ride.driverId,
    );
    if (!vehicle) throw new NotFoundException('Driver has no active vehicle');

    return {
      make: vehicle.make,
      model: vehicle.model,
      licensePlate: vehicle.licensePlate,
      color: vehicle.color,
      driverId: ride.driverId,
      rideId: ride.id,
    };
  }

  async storeBatches(rideId: string, batches: string[][]): Promise<void> {
    await this.redisService.set(`ride:batches:${rideId}`, batches, BATCH_TTL_SECONDS);
    await this.redisService.set(`ride:batch:index:${rideId}`, 0, BATCH_TTL_SECONDS);
  }

  /**
   * Calculate ride price using the Haversine distance.
   * Formula: 150 RSD base + 100 RSD per km
   */
  private calculatePrice(
    pickupLat: number,
    pickupLng: number,
    destLat: number,
    destLng: number,
  ): number {
    const R = 6371000; // Earth radius in metres
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const dLat = toRad(destLat - pickupLat);
    const dLng = toRad(destLng - pickupLng);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(pickupLat)) * Math.cos(toRad(destLat)) * Math.sin(dLng / 2) ** 2;
    const distanceMeters = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const km = distanceMeters / 1000;
    return Math.round(150 + 100 * km);
  }

  async getCurrentBatch(rideId: string): Promise<string[] | null> {
    const batches = await this.redisService.get<string[][]>(`ride:batches:${rideId}`);
    const index = await this.redisService.get<number>(`ride:batch:index:${rideId}`);
    if (!batches || index === null || index >= batches.length) return null;
    return batches[index];
  }

  async advanceBatch(rideId: string): Promise<string[] | null> {
    const ride = await this.rideRepository.findById(rideId);
    if (!ride || ride.status !== RideStatus.REQUESTED) {
      await this.cleanupBatches(rideId);
      return null;
    }

    const batches = await this.redisService.get<string[][]>(`ride:batches:${rideId}`);
    const index = await this.redisService.get<number>(`ride:batch:index:${rideId}`);
    if (!batches || index === null) return null;

    const nextIndex = index + 1;
    if (nextIndex >= batches.length) {
      await this.cleanupBatches(rideId);
      return null;
    }

    await this.redisService.set(`ride:batch:index:${rideId}`, nextIndex, BATCH_TTL_SECONDS);
    return batches[nextIndex];
  }

  async cleanupBatches(rideId: string): Promise<void> {
    await this.redisService.del(`ride:batches:${rideId}`);
    await this.redisService.del(`ride:batch:index:${rideId}`);
  }
}
