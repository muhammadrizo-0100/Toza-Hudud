import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { JwtPayload } from '../types/jwt-payload.type';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request & { user?: JwtPayload }>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Kirish huquqi yo‘q (Token topilmadi)');
    }

    try {
      const secret = this.configService.get<string>('JWT_SECRET', 'toza_hudud_jwt_secret_key_2026_super_secure');
      const payload = this.jwtService.verify<JwtPayload>(token, { secret });
      request.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Token muddati o‘tgan yoki yaroqsiz');
    }
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
