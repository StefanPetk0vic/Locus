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
  ) {}

  assignDriver(driverId: string) {
    if (this.status !== RideStatus.REQUESTED) {
      throw new Error('Ride is not available for acceptance.');
    }
    this.driverId = driverId;
    this.status = RideStatus.ACCEPTED;
  }

  completeRide() {
    if (this.status !== RideStatus.IN_PROGRESS) {
        throw new Error('Ride must be in progress to be completed.');
    }
    this.status = RideStatus.COMPLETED;
  }
}