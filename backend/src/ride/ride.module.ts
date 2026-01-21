import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { RideEntity } from './infrastructure/ride.entity';
import { RideRepository } from './ride.repository';
import { RideService } from './ride.service';
import { RideController } from './ride.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([RideEntity]),
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
  providers: [RideRepository, RideService],
  exports: [RideRepository, RideService],
})
export class RideModule {}