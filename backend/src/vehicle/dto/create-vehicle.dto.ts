import { IsString } from 'class-validator';

export class CreateVehicleDto {
  @IsString()
  make: string;

  @IsString()
  model: string;

  @IsString()
  licensePlate: string;

  @IsString()
  color: string;
}
