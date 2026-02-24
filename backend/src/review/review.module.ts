// review.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ReviewEntity } from './infrastructure/review.entity';
import { ReviewRepository } from './review.repository';
import { ReviewService } from './review.service';
import { ReviewController } from './review.controller';
import { RideModule } from '../ride/ride.module';

@Module({
  imports: [TypeOrmModule.forFeature([ReviewEntity]), RideModule],
  providers: [ReviewRepository, ReviewService],
  controllers: [ReviewController],
})
export class ReviewModule {}
