// review.module.ts
import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

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
export class ReviewModule implements OnModuleInit {
  constructor(private readonly dataSource: DataSource) {}

  /**
   * Ensure the reviews table has a composite unique on (rideId, reviewerId)
   * so BOTH ride participants can leave a review.
   * Drops any stale single-column unique on rideId that TypeORM sync
   * may have left behind.
   */
  async onModuleInit() {
    try {
      const stale: { constraint_name: string }[] = await this.dataSource.query(`
        SELECT tc.constraint_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        WHERE tc.table_name   = 'reviews'
          AND tc.constraint_type = 'UNIQUE'
        GROUP BY tc.constraint_name
        HAVING COUNT(*) = 1
           AND BOOL_OR(kcu.column_name = 'rideId')
      `);

      for (const row of stale) {
        await this.dataSource.query(
          `ALTER TABLE reviews DROP CONSTRAINT "${row.constraint_name}"`,
        );
        console.log(
          `[ReviewModule] Dropped stale unique constraint: ${row.constraint_name}`,
        );
      }
    } catch {
      // table may not exist yet on first run – ignore
    }
  }
}
