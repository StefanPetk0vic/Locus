import { User, UserRole } from './user.model';

export class Rider extends User {
  constructor(
    id: string,
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    public rides: number = 0,
    isAdmin: boolean = false,
  ) {
    super(id, email, password, firstName, lastName, UserRole.RIDER, isAdmin);
  }

  getUserType(): string {
    return 'RIDER';
  }

  incrementRideCount(): void {
    this.rides++;
  }

  getTotalRides(): number {
    return this.rides;
  }

  isFrequentRider(): boolean {
    return this.rides >= 10;
  }

  canRequestRide(): boolean {
    return true;
  }

  getDiscountPercentage(): number {
    if (this.rides >= 50) return 20;
    if (this.rides >= 20) return 10;
    if (this.rides >= 10) return 5;
    return 0;
  }
}
