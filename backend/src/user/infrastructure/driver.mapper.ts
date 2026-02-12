import { Driver as DriverModel } from '../domain/driver.model';
import { Driver as DriverEntity } from './driver.entity';

export class DriverMapper {
  static toDomain(entity: DriverEntity): DriverModel {
    return new DriverModel(
      entity.id,
      entity.email,
      entity.password,
      entity.firstName,
      entity.lastName,
      entity.licensePlate,
      entity.isVerified,
      entity.isAdmin,
    );
  }

  static toEntity(domain: DriverModel): DriverEntity {
    const entity = new DriverEntity();
    entity.id = domain.id;
    entity.email = domain.email;
    entity.password = domain.password;
    entity.firstName = domain.firstName;
    entity.lastName = domain.lastName;
    entity.licensePlate = domain.licensePlate;
    entity.isVerified = domain.isVerified;
    entity.isAdmin = domain.isAdmin;
    return entity;
  }
}
