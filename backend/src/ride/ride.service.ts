import { Inject, Injectable } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { RideRepository } from './ride.repository';
import { Ride, RideStatus } from './domain/ride.model';
import { UserService } from '../user/user.service';

@Injectable()
export class RideService {
  constructor(
    private readonly rideRepository: RideRepository,
    private readonly userService: UserService,
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
}
