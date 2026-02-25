import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PaymentRepository } from './payment.repository';
import { Invoice, InvoiceStatus } from './domain/invoice.model';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rider } from '../user/infrastructure/rider.entity';

@Injectable()
export class PaymentService {
  private readonly stripe: Stripe;
  private readonly logger = new Logger(PaymentService.name);
  private readonly webhookSecret: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly paymentRepository: PaymentRepository,
    @InjectRepository(Rider)
    private readonly riderRepo: Repository<Rider>,
  ) {
    this.stripe = new Stripe(
      this.configService.get<string>('STRIPE_SECRET_KEY')!,
      { apiVersion: '2025-04-30.basil' as any },
    );
    this.webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET') || '';
  }

  async addPaymentMethod(riderId: string, cardToken: string) {
    const rider = await this.riderRepo.findOne({ where: { id: riderId } });
    if (!rider) throw new NotFoundException('Rider not found');

    let customerId = rider.stripeCustomerId;
    if (!customerId) {
      const customer = await this.stripe.customers.create({
        email: rider.email,
        name: `${rider.firstName} ${rider.lastName}`,
        metadata: { riderId: rider.id },
      });
      customerId = customer.id;
      rider.stripeCustomerId = customerId;
    }

    const paymentMethod = await this.stripe.paymentMethods.create({
      type: 'card',
      card: { token: cardToken },
    });

    await this.stripe.paymentMethods.attach(paymentMethod.id, {
      customer: customerId,
    });

    await this.stripe.customers.update(customerId, {
      invoice_settings: { default_payment_method: paymentMethod.id },
    });

    rider.stripePaymentMethodId = paymentMethod.id;
    await this.riderRepo.save(rider);

    this.logger.log(`Payment method added for rider ${riderId}`);

    return {
      last4: paymentMethod.card?.last4,
      brand: paymentMethod.card?.brand,
      expMonth: paymentMethod.card?.exp_month,
      expYear: paymentMethod.card?.exp_year,
    };
  }

  async getPaymentMethod(riderId: string) {
    const rider = await this.riderRepo.findOne({ where: { id: riderId } });
    if (!rider) throw new NotFoundException('Rider not found');

    if (!rider.stripePaymentMethodId) {
      return null;
    }

    try {
      const pm = await this.stripe.paymentMethods.retrieve(rider.stripePaymentMethodId);
      return {
        id: pm.id,
        last4: pm.card?.last4,
        brand: pm.card?.brand,
        expMonth: pm.card?.exp_month,
        expYear: pm.card?.exp_year,
      };
    } catch {
      return null;
    }
  }

  async removePaymentMethod(riderId: string) {
    const rider = await this.riderRepo.findOne({ where: { id: riderId } });
    if (!rider) throw new NotFoundException('Rider not found');

    if (rider.stripePaymentMethodId) {
      try {
        await this.stripe.paymentMethods.detach(rider.stripePaymentMethodId);
      } catch (err) {
        this.logger.warn(`Failed to detach PM from Stripe: ${err.message}`);
      }
      rider.stripePaymentMethodId = null as any;
      await this.riderRepo.save(rider);
    }

    return { message: 'Payment method removed' };
  }


  async authorizeRidePayment(
    riderId: string,
    rideId: string,
    amountRSD: number,
  ): Promise<{ paymentIntentId: string; invoiceId: string }> {
    const rider = await this.riderRepo.findOne({ where: { id: riderId } });
    if (!rider) throw new NotFoundException('Rider not found');
    if (!rider.stripeCustomerId || !rider.stripePaymentMethodId) {
      throw new BadRequestException(
        'No payment method on file. Please add a card before requesting a ride.',
      );
    }

    const existing = await this.paymentRepository.findInvoiceByRideId(rideId);
    if (existing && existing.stripePaymentIntentId) {
      this.logger.log(`Ride ${rideId} already has PaymentIntent ${existing.stripePaymentIntentId}`);
      return { paymentIntentId: existing.stripePaymentIntentId, invoiceId: existing.id };
    }

    const amountInSmallestUnit = Math.round(amountRSD * 100); // RSD → para

    try {
      const paymentIntent = await this.stripe.paymentIntents.create(
        {
          amount: amountInSmallestUnit,
          currency: 'rsd',
          customer: rider.stripeCustomerId,
          payment_method: rider.stripePaymentMethodId,
          capture_method: 'manual',
          confirm: true,
          off_session: true,
          metadata: { rideId, riderId },
        },
        { idempotencyKey: `ride-auth-${rideId}` },
      );

      if (
        paymentIntent.status !== 'requires_capture' &&
        paymentIntent.status !== 'succeeded'
      ) {
        throw new BadRequestException(
          `Payment authorization failed (status: ${paymentIntent.status}). Please check your card.`,
        );
      }

      const invoiceId = crypto.randomUUID();

      this.logger.log(
        `Authorized ${amountRSD} RSD for ride ${rideId} — PI: ${paymentIntent.id}`,
      );

      return { paymentIntentId: paymentIntent.id, invoiceId };
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      this.logger.error(`Stripe authorization error: ${err.message}`);
      throw new BadRequestException(
        'Payment authorization failed. Insufficient funds or card declined.',
      );
    }
  }

  async saveRideInvoice(
    invoiceId: string,
    rideId: string,
    riderId: string,
    amountRSD: number,
    paymentIntentId: string,
  ): Promise<void> {
    const invoice = new Invoice(
      invoiceId,
      rideId,
      riderId,
      amountRSD,
      'RSD',
      paymentIntentId,
      InvoiceStatus.AUTHORIZED,
    );
    await this.paymentRepository.saveInvoice(invoice);
    this.logger.log(`Invoice ${invoiceId} saved for ride ${rideId}`);
  }


  async captureRidePayment(rideId: string): Promise<Invoice> {
    const invoice = await this.paymentRepository.findInvoiceByRideId(rideId);
    if (!invoice) {
      throw new NotFoundException(`No invoice found for ride ${rideId}`);
    }

    if (invoice.status === InvoiceStatus.PAID) {
      this.logger.log(`Invoice for ride ${rideId} already paid — skipping capture`);
      return invoice;
    }

    if (!invoice.stripePaymentIntentId) {
      throw new BadRequestException('No PaymentIntent linked to this invoice');
    }

    try {
      const paymentIntent = await this.stripe.paymentIntents.capture(
        invoice.stripePaymentIntentId,
        {},
        { idempotencyKey: `ride-capture-${rideId}` },
      );

      if (paymentIntent.status === 'succeeded') {
        invoice.markPaid();
      } else {
        invoice.markFailed();
      }
    } catch (err) {
      this.logger.error(`Stripe capture error for ride ${rideId}: ${err.message}`);
      invoice.markFailed();
    }

    return this.paymentRepository.saveInvoice(invoice);
  }


  async cancelRidePayment(rideId: string): Promise<void> {
    const invoice = await this.paymentRepository.findInvoiceByRideId(rideId);
    if (!invoice || !invoice.stripePaymentIntentId) return;

    if (invoice.status === InvoiceStatus.PAID || invoice.status === InvoiceStatus.CANCELLED) {
      return; // already finalized
    }

    try {
      await this.stripe.paymentIntents.cancel(invoice.stripePaymentIntentId, {}, {
        idempotencyKey: `ride-cancel-${rideId}`,
      } as any);
      invoice.markCancelled();
      await this.paymentRepository.saveInvoice(invoice);
      this.logger.log(`Cancelled payment for ride ${rideId}`);
    } catch (err) {
      this.logger.warn(`Failed to cancel PI for ride ${rideId}: ${err.message}`);
    }
  }

  async getInvoicesForUser(userId: string): Promise<Invoice[]> {
    return this.paymentRepository.findInvoicesForUser(userId);
  }

  async handleWebhook(rawBody: Buffer, signature: string): Promise<void> {
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        this.webhookSecret,
      );
    } catch (err) {
      this.logger.error(`Webhook signature verification failed: ${err.message}`);
      throw new BadRequestException('Invalid webhook signature');
    }

    const alreadyProcessed = await this.paymentRepository.isEventProcessed(event.id);
    if (alreadyProcessed) {
      this.logger.log(`Webhook event ${event.id} already processed — skipping`);
      return;
    }

    this.logger.log(`Processing webhook event: ${event.type} (${event.id})`);

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const pi = event.data.object as Stripe.PaymentIntent;
        const invoice = await this.paymentRepository.findInvoiceByPaymentIntentId(pi.id);
        if (invoice && invoice.status !== InvoiceStatus.PAID) {
          invoice.markPaid();
          await this.paymentRepository.saveInvoice(invoice);
          this.logger.log(`Invoice ${invoice.id} marked PAID via webhook`);
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const pi = event.data.object as Stripe.PaymentIntent;
        const invoice = await this.paymentRepository.findInvoiceByPaymentIntentId(pi.id);
        if (invoice) {
          invoice.markFailed();
          await this.paymentRepository.saveInvoice(invoice);
          this.logger.log(`Invoice ${invoice.id} marked FAILED via webhook`);
        }
        break;
      }

      case 'payment_intent.canceled': {
        const pi = event.data.object as Stripe.PaymentIntent;
        const invoice = await this.paymentRepository.findInvoiceByPaymentIntentId(pi.id);
        if (invoice) {
          invoice.markCancelled();
          await this.paymentRepository.saveInvoice(invoice);
          this.logger.log(`Invoice ${invoice.id} marked CANCELLED via webhook`);
        }
        break;
      }

      default:
        this.logger.log(`Unhandled webhook event type: ${event.type}`);
    }

    await this.paymentRepository.markEventProcessed(event.id, event.type);
  }
}
