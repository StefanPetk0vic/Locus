import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { RideEntity } from '../../ride/infrastructure/ride.entity';
import { User } from '../../user/infrastructure/user.entity';

@Entity('reviews')
@Unique(['rideId', 'reviewerId'])
export class ReviewEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int' })
  rating: number;

  @Column({ type: 'text', nullable: true })
  comment?: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column()
  rideId: string;

  @ManyToOne(() => RideEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'rideId' })
  ride: RideEntity;

  @Column()
  reviewerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'reviewerId' })
  reviewer: User;

  @Column()
  revieweeId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'revieweeId' })
  reviewee: User;
}
