export class Review {
  constructor(
    public readonly id: string,
    public readonly rideId: string,
    public readonly reviewerId: string,
    public readonly revieweeId: string,
    public readonly rating: number,
    public readonly comment?: string,
    public readonly createdAt?: Date,
  ) {
    this.validate();
  }

  private validate(): void {
    if (this.rating < 1 || this.rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    if (this.reviewerId === this.revieweeId) {
      throw new Error('User cannot review themselves');
    }
  }
}
