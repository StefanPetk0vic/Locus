import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RideEntity } from './infrastructure/ride.entity';
import { Ride } from './domain/ride.model';
import { RideMapper } from './infrastructure/ride.mapper';

@Injectable()
export class RideRepository {
  constructor(
    @InjectRepository(RideEntity)
    private readonly typeOrmRepository: Repository<RideEntity>,
  ) {}

  async save(ride: Ride): Promise<Ride> {
    const entity = RideMapper.toEntity(ride);
    const savedEntity = await this.typeOrmRepository.save(entity);
    return RideMapper.toDomain(savedEntity);
  }

  async findById(id: string): Promise<Ride | null> {
    const entity = await this.typeOrmRepository.findOne({ where: { id } });
    if (!entity) return null;
    return RideMapper.toDomain(entity);
  }

  async findAvailableRides(): Promise<Ride[]> {
    const entities = await this.typeOrmRepository.find({
      where: { status: 'REQUESTED' } as any,
    });
    return entities.map(entity => RideMapper.toDomain(entity));
  }
}