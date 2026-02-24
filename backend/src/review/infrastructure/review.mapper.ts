import { Review } from '../domain/review.model';
import { ReviewEntity } from './review.entity';

export class ReviewMapper {
  static toDomain(entity: ReviewEntity): Review {
    return new Review(
      entity.id,
      entity.rideId,
      entity.reviewerId,
      entity.revieweeId,
      entity.rating,
      entity.comment,
      entity.createdAt,
    );
  }

  static toEntity(domain: Review): ReviewEntity {
    const entity = new ReviewEntity();
    entity.id = domain.id;
    entity.rideId = domain.rideId;
    entity.reviewerId = domain.reviewerId;
    entity.revieweeId = domain.revieweeId;
    entity.rating = domain.rating;
    entity.comment = domain.comment;
    return entity;
  }
}
