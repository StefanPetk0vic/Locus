import { Invoice, InvoiceStatus } from '../domain/invoice.model';
import { InvoiceEntity } from './invoice.entity';

export class InvoiceMapper {
  static toDomain(entity: InvoiceEntity): Invoice {
    return new Invoice(
      entity.id,
      entity.rideId,
      entity.userId,
      Number(entity.amount),
      entity.currency,
      entity.stripePaymentIntentId,
      entity.status,
      entity.createdAt,
      entity.paidAt,
    );
  }

  static toEntity(domain: Invoice): InvoiceEntity {
    const entity = new InvoiceEntity();
    entity.id = domain.id;
    entity.rideId = domain.rideId;
    entity.userId = domain.userId;
    entity.amount = domain.amount;
    entity.currency = domain.currency;
    if (domain.stripePaymentIntentId) {
      entity.stripePaymentIntentId = domain.stripePaymentIntentId;
    }
    entity.status = domain.status;
    if (domain.paidAt) {
      entity.paidAt = domain.paidAt;
    }
    return entity;
  }
}
