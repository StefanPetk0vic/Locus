import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { RideRepository } from './ride.repository';
import { Ride, RideStatus } from './domain/ride.model';
import { UserService } from '../user/user.service';
import { VehicleService } from 'src/vehicle/vehicle.service';
import { RedisService } from '../redis/redis.service';

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
    @Inject('RIDE_SERVICE') private readonly kafkaClient: ClientKafka,
  ) {}

  async requestRide(
    riderId: string,
    pickupLat: number,
    pickupLng: number,
    destLat: number,
    destLng: number,
  ) {
    const newRide = new Ride(
      crypto.randomUUID(),
      pickupLat,
      pickupLng,
      destLat,
      destLng,
      RideStatus.REQUESTED,
      riderId,
    );

    const savedRide = await this.rideRepository.save(newRide);

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

    this.kafkaClient.emit('ride.completed', {
      rideId,
      riderId: ride.riderId,
      driverId: ride.driverId,
      status: updatedRide.status,
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
