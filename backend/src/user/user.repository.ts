import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User as UserEntity } from './infrastructure/user.entity';
import { Driver as DriverEntity } from './infrastructure/driver.entity';
import { Rider as RiderEntity } from './infrastructure/rider.entity';
import { User as UserModel } from './domain/user.model';
import { Driver as DriverModel } from './domain/driver.model';
import { Rider as RiderModel } from './domain/rider.model';
import { UserMapper } from './infrastructure/user.mapper';
import { DriverMapper } from './infrastructure/driver.mapper';
import { RiderMapper } from './infrastructure/rider.mapper';

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(DriverEntity)
    private readonly driverRepository: Repository<DriverEntity>,
    @InjectRepository(RiderEntity)
    private readonly riderRepository: Repository<RiderEntity>,
  ) {}

  async save(user: UserModel): Promise<UserModel> {
    const entity = UserMapper.toEntity(user);
    
    if (entity instanceof DriverEntity) {
      const savedEntity = await this.driverRepository.save(entity);
      return DriverMapper.toDomain(savedEntity);
    } else if (entity instanceof RiderEntity) {
      const savedEntity = await this.riderRepository.save(entity);
      return RiderMapper.toDomain(savedEntity);
    }
    
    throw new Error('Unknown user type');
  }

  async findById(id: string): Promise<UserModel | null> {
    const entity = await this.userRepository.findOne({ where: { id } });
    if (!entity) return null;
    return UserMapper.toDomain(entity);
  }

  async findByEmail(email: string): Promise<UserModel | null> {
    const entity = await this.userRepository.findOne({ where: { email } });
    if (!entity) return null;
    return UserMapper.toDomain(entity);
  }

  async findAllDrivers(): Promise<DriverModel[]> {
    const entities = await this.driverRepository.find();
    return entities.map(entity => DriverMapper.toDomain(entity));
  }

  async findAllRiders(): Promise<RiderModel[]> {
    const entities = await this.riderRepository.find();
    return entities.map(entity => RiderMapper.toDomain(entity));
  }

  async findVerifiedDrivers(): Promise<DriverModel[]> {
    const entities = await this.driverRepository.find({
      where: { isVerified: true },
    });
    return entities.map(entity => DriverMapper.toDomain(entity));
  }

  async delete(id: string): Promise<void> {
    await this.userRepository.delete(id);
  }
}
