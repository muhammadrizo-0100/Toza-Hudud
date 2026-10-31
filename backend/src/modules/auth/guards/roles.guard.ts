import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { AdminRole } from '../../../database/entities/admin.entity';
import { JwtPayload } from '../types/jwt-payload.type';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<(AdminRole | 'AnyAuthenticated')[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true; // No roles required
    }

    const { user } = context.switchToHttp().getRequest<{ user?: JwtPayload }>();
    if (!user) {
      throw new ForbiddenException('Foydalanuvchi ma’lumotlari topilmadi');
    }

    if (requiredRoles.includes('AnyAuthenticated')) {
      return true;
    }

    const hasRole = requiredRoles.includes(user.role);
    if (!hasRole) {
      throw new ForbiddenException('Ushbu amalni bajarish uchun sizda yetarli ruxsat yo‘q');
    }

    return true;
  }
}
