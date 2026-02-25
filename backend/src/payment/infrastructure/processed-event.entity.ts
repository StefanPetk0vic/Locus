import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';


@Entity('stripe_processed_events')
export class ProcessedEventEntity {
  @PrimaryColumn()
  eventId: string;

  @Column()
  type: string;

  @CreateDateColumn()
  processedAt: Date;
}
