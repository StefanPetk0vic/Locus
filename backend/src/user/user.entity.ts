import { Entity, PrimaryGeneratedColumn, Column, TableInheritance, AfterLoad } from 'typeorm';

export enum UserRole {
    RIDER = 'RIDER',
    DRIVER = 'DRIVER',
}

@Entity('users')
@TableInheritance({ column: { type: 'varchar', name: 'role' } })
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({
        unique: true,
    })
    email: string;

    @Column()
    password: string;

    @Column()
    firstName: string;

    @Column()
    lastName: string;

    @Column({default: false})
    isAdmin: boolean;

    role: string;

    @AfterLoad()
    setRole() {

        
        if (this.constructor.name === 'Driver') {
            this.role = UserRole.DRIVER;
        } else if (this.constructor.name === 'Rider') {
            this.role = UserRole.RIDER;
        }
    }
}