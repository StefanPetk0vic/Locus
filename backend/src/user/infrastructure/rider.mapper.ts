import { Rider as RiderModel } from '../domain/rider.model';
import { Rider as RiderEntity } from './rider.entity';

export class RiderMapper {
  static toDomain(entity: RiderEntity): RiderModel {
    return new RiderModel(
      entity.id,
      entity.email,
      entity.password,
      entity.firstName,
      entity.lastName,
      entity.rides,
      entity.isAdmin,
    );
  }

  static toEntity(domain: RiderModel): RiderEntity {
    const entity = new RiderEntity();
    entity.id = domain.id;
    entity.email = domain.email;
    entity.password = domain.password;
    entity.firstName = domain.firstName;
    entity.lastName = domain.lastName;
    entity.rides = domain.rides;
    entity.isAdmin = domain.isAdmin;
    return entity;
  }
}
