import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Rider } from '../../user/rider.entity';
import { Driver } from '../../user/driver.entity';
import { RideStatus } from '../domain/ride.model';

@Entity('rides')
export class RideEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('float')
  pickupLat: number;

  @Column('float')
  pickupLng: number;

  @Column('float')
  destinationLat: number;

  @Column('float')
  destinationLng: number;

  @Column({
    type: 'enum',
    enum: RideStatus,
    default: RideStatus.REQUESTED,
  })
  status: RideStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  price: number;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  riderId: string;

  @ManyToOne(() => Rider)
  @JoinColumn({ name: 'riderId' })
  rider: Rider;

  @Column({ nullable: true })
  driverId: string;

  @ManyToOne(() => Driver, { nullable: true })
  @JoinColumn({ name: 'driverId' })
  driver: Driver;
}