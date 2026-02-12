import { ChildEntity, Column } from 'typeorm';
import { User } from './user.entity';

@ChildEntity('DRIVER')
export class Driver extends User {
  @Column()
  licensePlate: string;

  @Column({ default: false })
  isVerified: boolean;
}