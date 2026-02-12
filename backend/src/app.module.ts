import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { User } from './user/infrastructure/user.entity';
import { Driver } from './user/infrastructure/driver.entity';
import { Rider } from './user/infrastructure/rider.entity';
import { RideModule } from './ride/ride.module';
import { RideEntity } from './ride/infrastructure/ride.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST') ?? 'localhost',
        port: +configService.get('DB_PORT') || 5433,
        username: configService.get('DB_USERNAME') ?? 'elfak',
        password: configService.get('DB_PASSWORD') ?? 'locus123',
        database: configService.get('DB_NAME') ?? 'locus',
        entities: [User, Driver, Rider, RideEntity],
        synchronize: true,
      }),
    }),
    AuthModule,
    UserModule,
    RideModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}