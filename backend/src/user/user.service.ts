import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { UserRepository } from './user.repository';
import { User } from './domain/user.model';
import { Driver } from './domain/driver.model';
import { Rider } from './domain/rider.model';
import Redis from 'ioredis';
import { RedisService } from 'src/redis/redis.service';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository, private readonly redisService: RedisService) {
    this.redisService.ping().then((res) => console.log('Redis ping response:', res)).catch((err) => console.error('Redis ping error:', err));
  }

  async getUserProfile(userId: string): Promise<User> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
    return user;
  }

  async getUserByEmail(email: string): Promise<User> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }
    return user;
  }

  async getAllDrivers(): Promise<Driver[]> {
    return await this.userRepository.findAllDrivers();
  }

  async getAllRiders(): Promise<Rider[]> {
    return await this.userRepository.findAllRiders();
  }

  async getVerifiedDrivers(): Promise<Driver[]> {
    return await this.userRepository.findVerifiedDrivers();
  }

  async verifyDriver(driverId: string): Promise<Driver> {
    const user = await this.userRepository.findById(driverId);
    
    if (!user) {
      throw new NotFoundException(`Driver with ID ${driverId} not found`);
    }

    if (!(user instanceof Driver)) {
      throw new ConflictException('User is not a driver');
    }

    user.verify();
    
    return await this.userRepository.save(user) as Driver;
  }

  async unverifyDriver(driverId: string): Promise<Driver> {
    const user = await this.userRepository.findById(driverId);
    
    if (!user) {
      throw new NotFoundException(`Driver with ID ${driverId} not found`);
    }

    if (!(user instanceof Driver)) {
      throw new ConflictException('User is not a driver');
    }

    user.unverify();
    
    return await this.userRepository.save(user) as Driver;
  }

  async updateDriverLicensePlate(driverId: string, newPlate: string): Promise<Driver> {
    const user = await this.userRepository.findById(driverId);
    
    if (!user) {
      throw new NotFoundException(`Driver with ID ${driverId} not found`);
    }

    if (!(user instanceof Driver)) {
      throw new ConflictException('User is not a driver');
    }

    user.updateLicensePlate(newPlate);
    
    return await this.userRepository.save(user) as Driver;
  }

  async incrementRiderRideCount(riderId: string): Promise<Rider> {
    const user = await this.userRepository.findById(riderId);
    
    if (!user) {
      throw new NotFoundException(`Rider with ID ${riderId} not found`);
    }

    if (!(user instanceof Rider)) {
      throw new ConflictException('User is not a rider');
    }

    user.incrementRideCount();
    
    return await this.userRepository.save(user) as Rider;
  }

  async getRiderDiscount(riderId: string): Promise<number> {
    const user = await this.userRepository.findById(riderId);
    
    if (!user) {
      throw new NotFoundException(`Rider with ID ${riderId} not found`);
    }

    if (!(user instanceof Rider)) {
      throw new ConflictException('User is not a rider');
    }

    return user.getDiscountPercentage();
  }

  async isFrequentRider(riderId: string): Promise<boolean> {
    const user = await this.userRepository.findById(riderId);
    
    if (!user) {
      throw new NotFoundException(`Rider with ID ${riderId} not found`);
    }

    if (!(user instanceof Rider)) {
      throw new ConflictException('User is not a rider');
    }

    return user.isFrequentRider();
  }

  async banUser(userId: string): Promise<void> {
    const user = await this.userRepository.findById(userId);
    
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    await this.userRepository.delete(userId);
  }

  async canDriverAcceptRides(driverId: string): Promise<boolean> {
    const user = await this.userRepository.findById(driverId);
    
    if (!user) {
      throw new NotFoundException(`Driver with ID ${driverId} not found`);
    }

    if (!(user instanceof Driver)) {
      throw new ConflictException('User is not a driver');
    }

    return user.canAcceptRides();
  }

  async updateDriverLocation(driverId: string, longitude: number, latitude: number) {
    const user = await this.userRepository.findById(driverId);
    if (!user) {
      throw new NotFoundException(`Driver with ID ${driverId} not found`);
    }
    if (!(user instanceof Driver)) {
      throw new ConflictException('User is not a driver');
    }
    return this.redisService.geoadd('drivers:active', longitude, latitude, driverId);
  }
}
