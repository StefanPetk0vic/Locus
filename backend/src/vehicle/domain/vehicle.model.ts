export class Vehicle {
  constructor(
    public readonly id: string,
    public readonly driverId: string,
    public make: string,
    public model: string,
    public licensePlate: string,
    public color: string,
    public isActive: boolean = true,
    public createdAt?: Date,
  ) {}
}
