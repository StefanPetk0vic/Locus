import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ReviewEntity } from './infrastructure/review.entity';
import { Review } from './domain/review.model';
import { ReviewMapper } from './infrastructure/review.mapper';

@Injectable()
export class ReviewRepository {
  constructor(
    @InjectRepository(ReviewEntity)
    private readonly typeOrmRepository: Repository<ReviewEntity>,
  ) {}

  async save(review: Review): Promise<Review> {
    const entity = ReviewMapper.toEntity(review);
    const savedEntity = await this.typeOrmRepository.save(entity);
    return ReviewMapper.toDomain(savedEntity);
  }

  async findById(id: string): Promise<Review | null> {
    const entity = await this.typeOrmRepository.findOne({
      where: { id },
    });

    if (!entity) return null;
    return ReviewMapper.toDomain(entity);
  }

  async findByRideAndReviewer(
    rideId: string,
    reviewerId: string,
  ): Promise<Review | null> {
    const entity = await this.typeOrmRepository.findOne({
      where: { rideId, reviewerId },
    });

    if (!entity) return null;
    return ReviewMapper.toDomain(entity);
  }

  async findReviewsForUser(userId: string): Promise<Review[]> {
    const entities = await this.typeOrmRepository.find({
      where: { revieweeId: userId },
      order: { createdAt: 'DESC' },
    });

    return entities.map(ReviewMapper.toDomain);
  }

  async getAverageRatingForUser(userId: string): Promise<number | null> {
    const result = await this.typeOrmRepository
      .createQueryBuilder('review')
      .select('AVG(review.rating)', 'avg')
      .where('review.revieweeId = :userId', { userId })
      .getRawOne();

    if (!result || result.avg === null) return null;
    return Number(result.avg);
  }

  async getRatingCountForUser(userId: string): Promise<number> {
    return this.typeOrmRepository.count({
      where: { revieweeId: userId },
    });
  }

  async delete(id: string): Promise<void> {
    await this.typeOrmRepository.delete(id);
  }
}
