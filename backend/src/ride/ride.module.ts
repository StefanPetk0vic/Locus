import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RideEntity } from './infrastructure/ride.entity';
import { RideRepository } from './ride.repository';
import { RideService } from './ride.service';
import { RideController } from './ride.controller';
import { RideGateway } from './ride.gateway';
import { User } from '../user/infrastructure/user.entity';
import { UserModule } from '../user/user.module';
import { VehicleModule } from 'src/vehicle/vehicle.module';
import { RedisModule } from '../redis/redis.module';
import { PaymentModule } from '../payment/payment.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([RideEntity, User]),
    UserModule,
    VehicleModule,
    RedisModule,
    PaymentModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
      }),
      inject: [ConfigService],
    }),
    ClientsModule.register([
      {
        name: 'RIDE_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'ride',
            brokers: ['localhost:9092'],
          },
          consumer: {
            groupId: 'ride-consumer-group',
          },
        },
      },
    ]),
  ],
  controllers: [RideController],
  providers: [RideRepository, RideService, RideGateway],
  exports: [RideRepository, RideService, RideGateway],
})
export class RideModule {}
