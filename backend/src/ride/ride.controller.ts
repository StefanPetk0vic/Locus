import {
  Controller,
  Post,
  Body,
  Param,
  Patch,
  UseGuards,
  OnModuleInit,
  Inject,
  Logger,
  Get,
  NotFoundException,
} from '@nestjs/common';
import { ClientKafka, EventPattern, Payload } from '@nestjs/microservices';
import { RideService } from './ride.service';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from '../auth/get-user.decorator';
import { User, UserRole } from '../user/infrastructure/user.entity';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { RideGateway } from './ride.gateway';

import type { JwtPayload } from '../auth/jwt.strategy';

@Controller('rides')
export class RideController implements OnModuleInit {
  private readonly logger = new Logger(RideController.name);

  constructor(
    private readonly rideService: RideService,
    private readonly rideGateway: RideGateway,
    @Inject('RIDE_SERVICE') private readonly kafkaClient: ClientKafka,
  ) {}

  async onModuleInit() {
    this.kafkaClient.subscribeToResponseOf('ride.requested');
    this.kafkaClient.subscribeToResponseOf('ride.accepted');
    await this.kafkaClient.connect();
  }

  @Post('/request')
  @UseGuards(AuthGuard('jwt'))
  async requestRide(
    @Body()
    body: {
      pickupLat: number;
      pickupLng: number;
      destLat: number;
      destLng: number;
      price?: number;
    },
    @GetUser() user: User,
  ) {
    const riderId = user.id;
    return this.rideService.requestRide(
      riderId,
      body.pickupLat,
      body.pickupLng,
      body.destLat,
      body.destLng,
      body.price,
    );
  }

  @Patch('/:id/accept')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.DRIVER)
  async acceptRide(@Param('id') rideId: string, @GetUser() user: User) {
    const driverId = user.id;
    return this.rideService.acceptRide(rideId, driverId);
  }

  @Post('/:id/location')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.DRIVER)
  async updateDriverLocation(
    @Param('id') rideId: string,
    @Body() body: { lat: number; lng: number },
    @GetUser() driver: User,
  ) {
    this.logger.log(
      `Driver ${driver.id} updating location for ride ${rideId}: (${body.lat}, ${body.lng})`,
    );

    const ride = await this.rideService.findRideById(rideId);

    if (!ride) {
      return { error: 'Ride not found' };
    }

    if (ride.driverId !== driver.id) {
      return { error: 'You are not the driver of this ride' };
    }

    this.rideGateway.notifyRiderAboutDriverLocation(ride.riderId, {
      rideId,
      driverId: driver.id,
      location: {
        lat: body.lat,
        lng: body.lng,
      },
      timestamp: new Date(),
    });

    return { status: 'ok', message: 'Location sent to rider' };
  }

  @Patch('/:id/cancel')
  @UseGuards(AuthGuard('jwt'))
  async cancelRide(@Param('id') rideId: string, @GetUser() user: User) {
    return this.rideService.cancelRide(rideId, user.id);
  }

  @Patch('/:id/start')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.DRIVER)
  async startRide(@Param('id') rideId: string, @GetUser() driver: User) {
    const ride = await this.rideService.startRide(rideId, driver.id);
    this.rideGateway.notifyRiderAboutRideStarted(ride.riderId, {
      rideId: ride.id,
      driverId: ride.driverId,
      status: ride.status,
    });
    return ride;
  }

  @Patch('/:id/complete')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.DRIVER)
  async completeRide(@Param('id') rideId: string, @GetUser() driver: User) {
    const ride = await this.rideService.findRideById(rideId);
    if (!ride) throw new Error('Ride not found');
    if (ride.driverId !== driver.id)
      throw new Error('You are not the driver of this ride');
    const completed = await this.rideService.completeRide(rideId);
    this.rideGateway.notifyRiderAboutRideCompleted(completed.riderId, {
      rideId: completed.id,
      driverId: completed.driverId,
      status: completed.status,
      price: completed.price,
      paymentStatus: 'PAID',
    });
    return completed;
  }

  @EventPattern('ride.requested')
  async handleRideRequested(@Payload() message: any) {
    this.logger.log('Nova voznja zatrazena:', message);

    const rideData = {
      rideId: message.id,
      riderId: message.riderId,
      pickup: { lat: message.pickupLat, lng: message.pickupLng },
      destination: { lat: message.destinationLat, lng: message.destinationLng },
      timestamp: new Date(),
    };

    const firstBatch = await this.rideService.getCurrentBatch(message.id);

    if (firstBatch && firstBatch.length > 0) {
      this.logger.log(`Starting batch matching for ride ${message.id} with ${firstBatch.length} drivers`);
      await this.rideGateway.notifyBatchOfDrivers(rideData, firstBatch, message.id);
    } else {
      this.logger.warn(`No nearby drivers found for ride ${message.id}, broadcasting to all`);
      this.rideGateway.server.to('drivers').emit('ride.requested', rideData);
    }
  }

  @EventPattern('ride.accepted')
  async handleRideAccepted(@Payload() payload: any) {
    const message = payload?.value ?? payload;

    this.logger.log('Voznja prihvacena:', message);

    if (!message?.riderId) {
      this.logger.error('ride.accepted payload missing riderId', payload);
      return;
    }

    this.rideGateway.cancelBatchTimeout(message.rideId);

    this.rideGateway.notifyRiderAboutAcceptedRide(message.riderId, {
      rideId: message.rideId,
      driverId: message.driverId,
      status: 'accepted',
      timestamp: new Date(),
    });
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Get('completed')
  async getCompletedRides(@GetUser() user: JwtPayload) {
    if (user.role === 'DRIVER') {
      console.log(user.role);
      return this.rideService.getCompletedRidesForDriver(user.id);
    } else {
      console.log(user.role);
      return this.rideService.getCompletedRidesForRider(user.id);
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('/:id/vehicle')
  async getVehicleForRide(@Param('id') rideId: string, @GetUser() user: User) {
    const ride = await this.rideService.findRideById(rideId);
    if (!ride) throw new NotFoundException('Ride not found');
    if (ride.riderId !== user.id)
      throw new NotFoundException('You are not the rider for this ride');
    return this.rideService.getVehicleForRide(rideId);
  }
}
