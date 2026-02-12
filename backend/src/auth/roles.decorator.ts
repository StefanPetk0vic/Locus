import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../user/infrastructure/user.entity';

export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);