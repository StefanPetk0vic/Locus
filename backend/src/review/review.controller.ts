import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { ReviewService } from './review.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { GetUser } from '../auth/get-user.decorator';

@Controller('reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post('Create')
  async createReview(
    @GetUser() user: { id: string; role: string },
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewService.createReview(user.id, dto);
  }

  @Get('/user/:userId')
  async getReviewsForUser(@Param('userId') userId: string) {
    return this.reviewService.getReviewsForUser(userId);
  }

  @Get('/user/:userId/rating')
  async getAverageRating(@Param('userId') userId: string) {
    return this.reviewService.getAverageRatingForUser(userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('/me')
  getMyReviews(@GetUser() user) {
    return this.reviewService.getReviewsForUser(user.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('/me/rating')
  getMyRating(@GetUser() user) {
    return this.reviewService.getAverageRatingForUser(user.id);
  }
}
