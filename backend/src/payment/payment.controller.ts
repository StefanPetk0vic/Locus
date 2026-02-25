import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  UseGuards,
  Req,
  Headers,
  HttpCode,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import { PaymentService } from './payment.service';
import { GetUser } from '../auth/get-user.decorator';
import { User } from '../user/infrastructure/user.entity';

@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('add-card')
  @UseGuards(AuthGuard('jwt'))
  async addCard(
    @Body('cardToken') cardToken: string,
    @GetUser() user: User,
  ) {
    return this.paymentService.addPaymentMethod(user.id, cardToken);
  }

  @Get('method')
  @UseGuards(AuthGuard('jwt'))
  async getPaymentMethod(@GetUser() user: User) {
    return this.paymentService.getPaymentMethod(user.id);
  }

  @Delete('method')
  @UseGuards(AuthGuard('jwt'))
  async removePaymentMethod(@GetUser() user: User) {
    return this.paymentService.removePaymentMethod(user.id);
  }

  @Get('invoices')
  @UseGuards(AuthGuard('jwt'))
  async getInvoices(@GetUser() user: User) {
    return this.paymentService.getInvoicesForUser(user.id);
  }

  @Post('webhook')
  @HttpCode(200)
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    const rawBody = req.rawBody;
    if (!rawBody) {
      return { received: false, error: 'No raw body' };
    }
    await this.paymentService.handleWebhook(rawBody, signature);
    return { received: true };
  }
}
