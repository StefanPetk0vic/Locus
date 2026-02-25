import { ChildEntity, Column } from 'typeorm';
import { User } from './user.entity';

@ChildEntity('RIDER')
export class Rider extends User {
    @Column({ default: 0 })
    rides: number;

    @Column({ nullable: true })
    stripeCustomerId: string;

    @Column({ nullable: true })
    stripePaymentMethodId: string;
}