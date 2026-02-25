import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../user/infrastructure/user.entity';
import { RideEntity } from '../../ride/infrastructure/ride.entity';
import { InvoiceStatus } from '../domain/invoice.model';

@Entity('invoices')
export class InvoiceEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  rideId: string;

  @ManyToOne(() => RideEntity)
  @JoinColumn({ name: 'rideId' })
  ride: RideEntity;

  @Column()
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ default: 'RSD' })
  currency: string;

  @Index({ unique: true })
  @Column({ nullable: true, unique: true })
  stripePaymentIntentId: string;

  @Column({
    type: 'enum',
    enum: InvoiceStatus,
    default: InvoiceStatus.PENDING,
  })
  status: InvoiceStatus;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  paidAt: Date;
}
