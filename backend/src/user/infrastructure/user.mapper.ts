import { User as UserModel, UserRole } from '../domain/user.model';
import { Driver as DriverModel } from '../domain/driver.model';
import { Rider as RiderModel } from '../domain/rider.model';
import { User as UserEntity } from './user.entity';
import { Driver as DriverEntity } from './driver.entity';
import { Rider as RiderEntity } from './rider.entity';

export class UserMapper {
  static toDomain(entity: UserEntity): UserModel {
    if (entity instanceof DriverEntity) {
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
    } else if (entity instanceof RiderEntity) {
      return new RiderModel(
        entity.id,
        entity.email,
        entity.password,
        entity.firstName,
        entity.lastName,
        entity.rides,
        entity.isAdmin,
        entity.stripeCustomerId ?? null,
        entity.stripePaymentMethodId ?? null,
      );
    }
    throw new Error('Unknown user entity type');
  }

  static toEntity(domain: UserModel): UserEntity {
    if (domain instanceof DriverModel) {
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
    } else if (domain instanceof RiderModel) {
      const entity = new RiderEntity();
      entity.id = domain.id;
      entity.email = domain.email;
      entity.password = domain.password;
      entity.firstName = domain.firstName;
      entity.lastName = domain.lastName;
      entity.rides = domain.rides;
      entity.isAdmin = domain.isAdmin;
      if (domain.stripeCustomerId) entity.stripeCustomerId = domain.stripeCustomerId;
      if (domain.stripePaymentMethodId) entity.stripePaymentMethodId = domain.stripePaymentMethodId;
      return entity;
    }
    throw new Error('Unknown user domain type');
  }
}
