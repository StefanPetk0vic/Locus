// vehicle.service.ts
import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { VehicleRepository } from './vehicle.repository';
import { Vehicle } from './domain/vehicle.model';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { v4 as uuid } from 'uuid';

@Injectable()
export class VehicleService {
  constructor(private readonly vehicleRepository: VehicleRepository) {}

  async createVehicle(driverId: string, dto: CreateVehicleDto) {
    if (!driverId) {
      throw new ForbiddenException('Only drivers can add vehicles');
    }

    const existing = await this.vehicleRepository.findByLicensePlate(
      driverId,
      dto.licensePlate,
    );
    if (existing) {
      throw new BadRequestException(
        `Vehicle with license plate ${dto.licensePlate} is already added by you`,
      );
    }

    const vehicle = new Vehicle(
      uuid(),
      driverId,
      dto.make,
      dto.model,
      dto.licensePlate,
      dto.color,
      true,
    );

    return this.vehicleRepository.save(vehicle);
  }

  async getDriverVehicles(driverId: string) {
    return this.vehicleRepository.findByDriver(driverId);
  }

  async setActiveVehicle(driverId: string, vehicleId: string) {
    const vehicles = await this.vehicleRepository.findByDriver(driverId);

    const target = vehicles.find((v) => v.id === vehicleId);
    if (!target) throw new NotFoundException('Vehicle not found');

    for (const v of vehicles) {
      v.isActive = v.id === vehicleId;
      await this.vehicleRepository.save(v);
    }

    return target;
  }

  async deleteVehicle(driverId: string, vehicleId: string) {
    const vehicle = await this.vehicleRepository.findById(vehicleId);
    if (!vehicle) throw new NotFoundException('Vehicle not found');

    if (vehicle.driverId !== driverId) {
      throw new ForbiddenException();
    }

    await this.vehicleRepository.delete(vehicleId);
  }

  async getActiveVehicleForDriver(driverId: string) {
    return this.vehicleRepository.findActiveVehicleForDriver(driverId);
  }
}
