export enum UserRole {
  RIDER = 'RIDER',
  DRIVER = 'DRIVER',
}

export abstract class User {
  constructor(
    public id: string,
    public email: string,
    public password: string,
    public firstName: string,
    public lastName: string,
    public role: UserRole,
    public isAdmin: boolean = false,
  ) {}

  getFullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  isAdministrator(): boolean {
    return this.isAdmin;
  }

  canAccessAdminPanel(): boolean {
    return this.isAdmin;
  }

  abstract getUserType(): string;
}
