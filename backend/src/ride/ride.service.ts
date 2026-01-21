import { Inject, Injectable } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { RideRepository } from './ride.repository';
import { Ride, RideStatus } from './domain/ride.model';

@Injectable()
export class RideService {
  constructor(
    private readonly rideRepository: RideRepository,
    @Inject('RIDE_SERVICE') private readonly kafkaClient: ClientKafka,
  ) {}

  async requestRide(riderId: string, pickupLat: number, pickupLng: number, destLat: number, destLng: number) {
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

    this.kafkaClient.emit('ride.requested', JSON.stringify(savedRide));

    return savedRide;
  }

  async acceptRide(rideId: string, driverId: string) {
    const ride = await this.rideRepository.findById(rideId);
    if (!ride) throw new Error('Ride not found');

    ride.assignDriver(driverId);

    const updatedRide = await this.rideRepository.save(ride);

    this.kafkaClient.emit('ride.accepted', { rideId, driverId, status: updatedRide.status });

    return updatedRide;
  }
}