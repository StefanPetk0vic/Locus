import { Ride, RideStatus } from '../domain/ride.model';
import { RideEntity } from './ride.entity';

export class RideMapper {
  static toDomain(entity: RideEntity): Ride {
    return new Ride(
      entity.id,
      entity.pickupLat,
      entity.pickupLng,
      entity.destinationLat,
      entity.destinationLng,
      entity.status,
      entity.riderId,
      entity.driverId,
      entity.price ? Number(entity.price) : undefined,
      entity.createdAt,
    );
  }

  static toEntity(domain: Ride): RideEntity {
    const entity = new RideEntity();
    entity.id = domain.id;
    entity.pickupLat = domain.pickupLat;
    entity.pickupLng = domain.pickupLng;
    entity.destinationLat = domain.destinationLat;
    entity.destinationLng = domain.destinationLng;
    entity.status = domain.status;
    entity.riderId = domain.riderId;
    if (domain.driverId) entity.driverId = domain.driverId;
    if (domain.price) entity.price = domain.price;
    return entity;
  }
}