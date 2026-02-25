export enum RideStatus {
  REQUESTED = 'REQUESTED',
  ACCEPTED = 'ACCEPTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export class Ride {
  constructor(
    public id: string,
    public pickupLat: number,
    public pickupLng: number,
    public destinationLat: number,
    public destinationLng: number,
    public status: RideStatus,
    public riderId: string,
    public driverId?: string | null,
    public price?: number,
    public createdAt?: Date,
    public stripePaymentIntentId?: string | null,
  ) {}

  assignDriver(driverId: string) {
    if (this.status !== RideStatus.REQUESTED) {
      throw new Error('Ride is not available for acceptance.');
    }
    this.driverId = driverId;
    this.status = RideStatus.ACCEPTED;
  }

  startRide() {
    if (this.status !== RideStatus.ACCEPTED) {
      throw new Error('Ride must be accepted to start.');
    }
    this.status = RideStatus.IN_PROGRESS;
  }

  cancelRide() {
    if (this.status === RideStatus.IN_PROGRESS) {
      throw new Error('Ride cannot be cancelled while in progress.');
    }
    if (this.status === RideStatus.COMPLETED || this.status === RideStatus.CANCELLED) {
      throw new Error('Ride is already finished.');
    }
    this.status = RideStatus.CANCELLED;
  }

  completeRide() {
    if (this.status !== RideStatus.IN_PROGRESS) {
        throw new Error('Ride must be in progress to be completed.');
    }
    this.status = RideStatus.COMPLETED;
  }
}