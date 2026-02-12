import { User, UserRole } from './user.model';

export class Driver extends User {
  constructor(
    id: string,
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    public licensePlate: string,
    public isVerified: boolean = false,
    isAdmin: boolean = false,
  ) {
    super(id, email, password, firstName, lastName, UserRole.DRIVER, isAdmin);
  }

  getUserType(): string {
    return 'DRIVER';
  }

  verify(): void {
    if (this.isVerified) {
      throw new Error('Driver is already verified');
    }
    this.isVerified = true;
  }

  unverify(): void {
    if (!this.isVerified) {
      throw new Error('Driver is not verified');
    }
    this.isVerified = false;
  }

  canAcceptRides(): boolean {
    return this.isVerified;
  }

  updateLicensePlate(newPlate: string): void {
    if (!newPlate || newPlate.trim().length === 0) {
      throw new Error('License plate cannot be empty');
    }
    this.licensePlate = newPlate.trim();
  }
}
