import { Controller, Post, Body, Param, Patch, UseGuards, OnModuleInit, Inject } from '@nestjs/common';
import { ClientKafka, EventPattern, Payload } from '@nestjs/microservices';
import { RideService } from './ride.service';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from '../auth/get-user.decorator';
import { User } from '../user/user.entity';

@Controller('rides')
export class RideController implements OnModuleInit {
  constructor(
    private readonly rideService: RideService,
    @Inject('RIDE_SERVICE') private readonly kafkaClient: ClientKafka
  ) {}

  async onModuleInit() {
    this.kafkaClient.subscribeToResponseOf('ride.requested');
    this.kafkaClient.subscribeToResponseOf('ride.accepted');
    await this.kafkaClient.connect();
  }

  @Post('/request')
  @UseGuards(AuthGuard('jwt'))
  async requestRide(
    @Body() body: { pickupLat: number; pickupLng: number; destLat: number; destLng: number },
    @GetUser() user: User
  ) {
    const riderId = user.id;
    return this.rideService.requestRide(riderId, body.pickupLat, body.pickupLng, body.destLat, body.destLng);
  }

  @Patch('/:id/accept')
  @UseGuards(AuthGuard('jwt'))
  async acceptRide(@Param('id') rideId: string, @GetUser() user: User) {
    const driverId = user.id; 
    return this.rideService.acceptRide(rideId, driverId);
  }


  @EventPattern('ride.requested')
  async handleRideRequested(@Payload() message: any) {
    console.log('⚡ [KAFKA] Nova vožnja zatražena:', message);
    // Ovde bi išla logika za obaveštavanje vozača preko Websocketa
  }

  @EventPattern('ride.accepted')
  async handleRideAccepted(@Payload() message: any) {
    console.log('✅ [KAFKA] Vožnja prihvaćena:', message);
    // Obaveštavanje putnika da je vozilo krenulo
  }
}