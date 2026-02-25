export enum InvoiceStatus {
  PENDING = 'PENDING',
  AUTHORIZED = 'AUTHORIZED',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  CANCELLED = 'CANCELLED',
}

export class Invoice {
  constructor(
    public id: string,
    public rideId: string,
    public userId: string,
    public amount: number,
    public currency: string = 'RSD',
    public stripePaymentIntentId: string | null,
    public status: InvoiceStatus,
    public createdAt?: Date,
    public paidAt?: Date | null,
  ) {}

  markAuthorized(): void {
    this.status = InvoiceStatus.AUTHORIZED;
  }

  markPaid(): void {
    if (this.status === InvoiceStatus.PAID) {
      return;
    }
    this.status = InvoiceStatus.PAID;
    this.paidAt = new Date();
  }

  markFailed(): void {
    this.status = InvoiceStatus.FAILED;
  }

  markRefunded(): void {
    this.status = InvoiceStatus.REFUNDED;
  }

  markCancelled(): void {
    this.status = InvoiceStatus.CANCELLED;
  }
}
