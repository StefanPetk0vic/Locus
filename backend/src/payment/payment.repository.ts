import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InvoiceEntity } from './infrastructure/invoice.entity';
import { ProcessedEventEntity } from './infrastructure/processed-event.entity';
import { Invoice } from './domain/invoice.model';
import { InvoiceMapper } from './infrastructure/invoice.mapper';

@Injectable()
export class PaymentRepository {
  constructor(
    @InjectRepository(InvoiceEntity)
    private readonly invoiceRepo: Repository<InvoiceEntity>,
    @InjectRepository(ProcessedEventEntity)
    private readonly processedEventRepo: Repository<ProcessedEventEntity>,
  ) {}


  async saveInvoice(invoice: Invoice): Promise<Invoice> {
    const entity = InvoiceMapper.toEntity(invoice);
    const saved = await this.invoiceRepo.save(entity);
    return InvoiceMapper.toDomain(saved);
  }

  async findInvoiceById(id: string): Promise<Invoice | null> {
    const entity = await this.invoiceRepo.findOne({ where: { id } });
    return entity ? InvoiceMapper.toDomain(entity) : null;
  }

  async findInvoiceByRideId(rideId: string): Promise<Invoice | null> {
    const entity = await this.invoiceRepo.findOne({ where: { rideId } });
    return entity ? InvoiceMapper.toDomain(entity) : null;
  }

  async findInvoiceByPaymentIntentId(stripePaymentIntentId: string): Promise<Invoice | null> {
    const entity = await this.invoiceRepo.findOne({ where: { stripePaymentIntentId } });
    return entity ? InvoiceMapper.toDomain(entity) : null;
  }

  async findInvoicesForUser(userId: string): Promise<Invoice[]> {
    const entities = await this.invoiceRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    return entities.map(InvoiceMapper.toDomain);
  }

  async isEventProcessed(eventId: string): Promise<boolean> {
    const exists = await this.processedEventRepo.findOne({ where: { eventId } });
    return !!exists;
  }

  async markEventProcessed(eventId: string, type: string): Promise<void> {
    const event = new ProcessedEventEntity();
    event.eventId = eventId;
    event.type = type;
    await this.processedEventRepo.save(event);
  }
}
