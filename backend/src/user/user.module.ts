import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserController } from './user.controller';
import { User } from './user.entity';
import { Driver } from './driver.entity';
import { Rider } from './rider.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Driver, Rider])],
  controllers: [UserController],
  providers: [],
  exports: [TypeOrmModule],
})
export class UserModule {}