import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserController } from './user.controller';
import { User } from './infrastructure/user.entity';
import { Driver } from './infrastructure/driver.entity';
import { Rider } from './infrastructure/rider.entity';
import { UserRepository } from './user.repository';
import { UserService } from './user.service';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, Driver, Rider]), RedisModule],
  controllers: [UserController],
  providers: [UserRepository, UserService],
  exports: [TypeOrmModule, UserRepository, UserService],
})
export class UserModule {}
