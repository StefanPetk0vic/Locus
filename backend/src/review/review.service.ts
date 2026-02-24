import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

import { ReviewRepository } from './review.repository';
import { RideRepository } from '../ride/ride.repository';
import { Review } from './domain/review.model';
import { RideStatus } from '../ride/domain/ride.model';
import { v4 as uuid } from 'uuid';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewService {
  constructor(
    private readonly reviewRepository: ReviewRepository,
    private readonly rideRepository: RideRepository,
  ) {}

  /** CREATE */
  async createReview(
    reviewerId: string,
    dto: CreateReviewDto,
  ): Promise<Review> {
    const ride = await this.rideRepository.findById(dto.rideId);

    if (!ride) {
      throw new NotFoundException('Ride not found');
    }

    if (ride.status !== RideStatus.COMPLETED) {
      throw new BadRequestException('Ride is not completed');
    }

    // mora biti deo vožnje
    const isRider = ride.riderId === reviewerId;
    const isDriver = ride.driverId === reviewerId;

    if (!isRider && !isDriver) {
      throw new ForbiddenException('You are not part of this ride');
    }

    // ne može 2x za istu vožnju
    const existing = await this.reviewRepository.findByRideAndReviewer(
      dto.rideId,
      reviewerId,
    );

    if (existing) {
      throw new BadRequestException('Review already exists');
    }

    const revieweeId = isRider ? ride.driverId : ride.riderId;

    if (!revieweeId) {
      throw new BadRequestException('Reviewee not found');
    }

    const review = new Review(
      uuid(),
      dto.rideId,
      reviewerId,
      revieweeId,
      dto.rating,
      dto.comment,
    );

    return this.reviewRepository.save(review);
  }

  /** READ – sve recenzije za korisnika */
  async getReviewsForUser(userId: string): Promise<Review[]> {
    return this.reviewRepository.findReviewsForUser(userId);
  }

  /** READ – prosečna ocena */
  async getAverageRatingForUser(userId: string): Promise<{
    average: number | null;
    count: number;
  }> {
    const [average, count] = await Promise.all([
      this.reviewRepository.getAverageRatingForUser(userId),
      this.reviewRepository.getRatingCountForUser(userId),
    ]);

    return { average, count };
  }

  /** DELETE (admin / optional) */
  async deleteReview(reviewId: string): Promise<void> {
    const review = await this.reviewRepository.findById(reviewId);

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    await this.reviewRepository.delete(reviewId);
  }
}
