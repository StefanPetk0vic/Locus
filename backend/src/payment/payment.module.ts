import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { InvoiceEntity } from './infrastructure/invoice.entity';
import { ProcessedEventEntity } from './infrastructure/processed-event.entity';
import { PaymentRepository } from './payment.repository';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { Rider } from '../user/infrastructure/rider.entity';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([InvoiceEntity, ProcessedEventEntity, Rider]),
  ],
  controllers: [PaymentController],
  providers: [PaymentRepository, PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}
