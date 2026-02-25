import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
    rawBody: true, // enables req.rawBody for Stripe webhook signature verification
  });

  app.enableCors({
    origin: true,
    credentials: true,
  });

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        brokers: ['localhost:9092'],
      },
      consumer: {
        groupId: 'locus-consumer',
      },
    },
  });

  await app.startAllMicroservices();
  await app.listen(3000, '0.0.0.0');
  
  Logger.log(`Application is running on: http://localhost:3000`, 'Bootstrap');
  Logger.log(`Network access: http://192.168.1.9:3000`, 'Bootstrap');
}
bootstrap();