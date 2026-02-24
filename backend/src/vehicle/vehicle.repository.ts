// vehicle.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VehicleEntity } from './infrastructure/vehicle.entity';
import { Vehicle } from './domain/vehicle.model';
import { VehicleMapper } from './infrastructure/vehicle.mapper';

@Injectable()
export class VehicleRepository {
  constructor(
    @InjectRepository(VehicleEntity)
    private readonly repo: Repository<VehicleEntity>,
  ) {}

  async save(vehicle: Vehicle): Promise<Vehicle> {
    const entity = VehicleMapper.toEntity(vehicle);
    const saved = await this.repo.save(entity);
    return VehicleMapper.toDomain(saved);
  }

  async findById(id: string): Promise<Vehicle | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? VehicleMapper.toDomain(entity) : null;
  }

  async findByDriver(driverId: string): Promise<Vehicle[]> {
    const entities = await this.repo.find({
      where: { driverId },
      order: { createdAt: 'DESC' },
    });
    return entities.map(VehicleMapper.toDomain);
  }

  async findActiveVehicleForDriver(driverId: string): Promise<Vehicle | null> {
    const entity = await this.repo.findOne({
      where: { driverId, isActive: true },
    });
    return entity ? VehicleMapper.toDomain(entity) : null;
  }

  async findByLicensePlate(
    driverId: string,
    licensePlate: string,
  ): Promise<Vehicle | null> {
    const entity = await this.repo.findOne({
      where: { driverId, licensePlate },
    });
    if (!entity) return null;
    return VehicleMapper.toDomain(entity);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
