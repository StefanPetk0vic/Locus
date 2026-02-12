import {Injectable, UnauthorizedException, ConflictException} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {AuthCredentialsDTO, LoginCredentialsDTO} from './dto/auth-credentials.dto';
import * as bcrypt from 'bcrypt';
import {JwtService} from '@nestjs/jwt';

import {User} from '../user/infrastructure/user.entity';
import { Rider } from '../user/infrastructure/rider.entity';
import { Driver } from '../user/infrastructure/driver.entity';
import { UserRole } from '../user/infrastructure/user.entity';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
        @InjectRepository(Driver)
        private driverRepository: Repository<Driver>,
        @InjectRepository(Rider)
        private riderRepository: Repository<Rider>,
        private jwtService: JwtService,
    ) {}

    async register(authCredentialsDTO: AuthCredentialsDTO): Promise<void> {
    const { email, password, firstName, lastName, licensePlate, role } = authCredentialsDTO;
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    try {
        if (role === UserRole.DRIVER && licensePlate) {
            const driver = new Driver();
            driver.email = email;
            driver.password = hashedPassword;
            driver.firstName = firstName;
            driver.lastName = lastName;
            driver.licensePlate = licensePlate;
            driver.isAdmin = false;
            await this.driverRepository.save(driver);
        } else {
            const rider = new Rider();
            rider.email = email;
            rider.password = hashedPassword;
            rider.firstName = firstName;
            rider.lastName = lastName;
            rider.isAdmin = false;
            await this.riderRepository.save(rider);
        }
    } catch (error) {
        if (error.code === "23505") {
            throw new ConflictException('Email already exists');
        }
        throw error;
    }
}

    async login(loginCredentials: LoginCredentialsDTO): Promise<{accessToken: string}>
    {
        const {email, password} = loginCredentials;

        const user = await this.userRepository.findOne({where: {email}});

        if (user && await bcrypt.compare(password, user.password)) {
            const payload = {email: user.email, id: user.id, is_admin: user.isAdmin};
            const accessToken = this.jwtService.sign(payload);
            return {accessToken};
        } else {
            throw new UnauthorizedException('Invalid credentials');
        }
    }
}