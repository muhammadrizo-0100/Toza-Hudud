import { SetMetadata } from '@nestjs/common';
import { AdminRole } from '../../../database/entities/admin.entity';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: (AdminRole | 'AnyAuthenticated')[]) => SetMetadata(ROLES_KEY, roles);
