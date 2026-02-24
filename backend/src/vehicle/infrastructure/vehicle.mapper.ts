// infrastructure/vehicle.mapper.ts
import { Vehicle } from '../domain/vehicle.model';
import { VehicleEntity } from './vehicle.entity';

export class VehicleMapper {
  static toDomain(entity: VehicleEntity): Vehicle {
    return new Vehicle(
      entity.id,
      entity.driverId,
      entity.make,
      entity.model,
      entity.licensePlate,
      entity.color,
      entity.isActive,
      entity.createdAt,
    );
  }

  static toEntity(domain: Vehicle): VehicleEntity {
    const entity = new VehicleEntity();
    entity.id = domain.id;
    entity.driverId = domain.driverId;
    entity.make = domain.make;
    entity.model = domain.model;
    entity.licensePlate = domain.licensePlate;
    entity.color = domain.color;
    entity.isActive = domain.isActive;
    return entity;
  }
}
