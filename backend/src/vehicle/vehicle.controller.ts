import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { VehicleService } from './vehicle.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { GetUser } from '../auth/get-user.decorator';
import { UserRole } from 'src/user/infrastructure';

@Controller('vehicles')
export class VehicleController {
  constructor(private readonly vehicleService: VehicleService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post('add')
  createVehicle(
    @GetUser() user: { id: string; role: string },
    @Body() dto: CreateVehicleDto,
  ) {
    if (user.role !== UserRole.DRIVER) {
      throw new ForbiddenException('Only drivers can add vehicles');
    }
    return this.vehicleService.createVehicle(user.id, dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  getMyVehicles(@GetUser() user: { id: string }) {
    return this.vehicleService.getDriverVehicles(user.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':id/activate')
  activateVehicle(
    @GetUser() user: { id: string },
    @Param('id') vehicleId: string,
  ) {
    return this.vehicleService.setActiveVehicle(user.id, vehicleId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  deleteVehicle(
    @GetUser() user: { id: string },
    @Param('id') vehicleId: string,
  ) {
    return this.vehicleService.deleteVehicle(user.id, vehicleId);
  }
}
