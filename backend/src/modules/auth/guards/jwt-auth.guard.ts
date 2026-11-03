import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { JwtPayload } from '../types/jwt-payload.type';
import { AdminRole } from '../../../database/entities/admin.entity';
import {
  extractClientIp,
  extractServiceCandidate,
  isClientIpAllowed,
  isServiceKeyValid
} from './service-auth.helper';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request & { user?: JwtPayload }>();

    // 1. Try server-to-server service authentication (Situatsion Markaz Dashboard)
    if (this.tryAuthenticateService(request)) {
      return true;
    }

    // 2. Normal JWT token authentication for users
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Kirish huquqi yo‘q (Token topilmadi)');
    }

    try {
      const secret = this.configService.get<string>(
        'JWT_SECRET',
        'toza_hudud_jwt_secret_key_2026_super_secure'
      );
      const payload = this.jwtService.verify<JwtPayload>(token, { secret });
      request.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Token muddati o‘tgan yoki yaroqsiz');
    }
  }

  private tryAuthenticateService(request: Request & { user?: JwtPayload }): boolean {
    const configuredKey = String(
      this.configService.get<string>('DASHBOARD_SERVICE_KEY') || ''
    ).trim();

    if (!configuredKey || configuredKey.length < 16) {
      return false;
    }

    const candidate = extractServiceCandidate(request);
    if (!candidate || !isServiceKeyValid(candidate, configuredKey)) {
      return false;
    }

    const allowedIpsRaw = this.configService.get<string>('DASHBOARD_ALLOWED_IPS');
    const clientIp = extractClientIp(request);

    if (!isClientIpAllowed(clientIp, allowedIpsRaw)) {
      throw new ForbiddenException(
        `Dashboard xizmatiga ruxsat etilmagan IP manzil: ${clientIp || 'noma‘lum'}`
      );
    }

    request.user = {
      id: 0,
      username: 'dashboard_service',
      role: AdminRole.SUPERADMIN,
      districtId: null,
      workerId: null,
      fullName: 'Situatsion Markaz Dashboard Xizmati'
    };

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    if (type === 'Bearer' && token) {
      return token;
    }
    // Also support cookies if set
    return (request as Request & { cookies?: Record<string, string> }).cookies?.['access_token'];
  }
}
