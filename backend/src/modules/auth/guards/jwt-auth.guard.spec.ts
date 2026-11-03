import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AdminRole } from '../../../database/entities/admin.entity';
import { JwtPayload } from '../types/jwt-payload.type';

describe('JwtAuthGuard (Service Key & JWT)', () => {
  const serviceKey = 'sec_tozahudud_61dddf234b6cfae8decf99047fb6c27bc7f7af8767376d65';

  function createMockContext(req: Partial<Request> & { user?: JwtPayload }): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => req as unknown as Request & { user?: JwtPayload }
      })
    } as unknown as ExecutionContext;
  }

  function createGuard(configMap: Record<string, string>, jwtVerifyFn?: (token: string) => JwtPayload) {
    const configService = {
      get: <T = string>(key: string, defaultValue?: T): T => {
        return (configMap[key] ?? defaultValue) as T;
      }
    } as unknown as ConfigService;

    const jwtService = {
      verify: (token: string) => {
        if (jwtVerifyFn) return jwtVerifyFn(token);
        throw new Error('JWT verification failed');
      }
    } as unknown as JwtService;

    return new JwtAuthGuard(jwtService, configService);
  }

  it('should authenticate service request with valid x-service-key and allowed IP', () => {
    const guard = createGuard({
      DASHBOARD_SERVICE_KEY: serviceKey,
      DASHBOARD_ALLOWED_IPS: '127.0.0.1'
    });

    const req: Partial<Request> & { user?: JwtPayload } = {
      headers: { 'x-service-key': serviceKey },
      ip: '127.0.0.1'
    };

    const result = guard.canActivate(createMockContext(req));
    assert.strictEqual(result, true);
    assert.strictEqual(req.user?.role, AdminRole.SUPERADMIN);
    assert.strictEqual(req.user?.username, 'dashboard_service');
  });

  it('should throw ForbiddenException if service key is valid but IP is not allowed', () => {
    const guard = createGuard({
      DASHBOARD_SERVICE_KEY: serviceKey,
      DASHBOARD_ALLOWED_IPS: '127.0.0.1'
    });

    const req: Partial<Request> & { user?: JwtPayload } = {
      headers: { authorization: `Bearer ${serviceKey}` },
      ip: '198.51.100.5'
    };

    assert.throws(() => {
      guard.canActivate(createMockContext(req));
    }, ForbiddenException);
  });

  it('should fallback to JWT verification if no service key is present', () => {
    const mockUser: JwtPayload = {
      id: 5,
      username: 'manager_1',
      role: AdminRole.MANAGER,
      districtId: 2,
      fullName: 'Tuman Menejeri'
    };

    const guard = createGuard(
      { DASHBOARD_SERVICE_KEY: serviceKey },
      () => mockUser
    );

    const req: Partial<Request> & { user?: JwtPayload } = {
      headers: { authorization: 'Bearer user_access_jwt_token_sample' }
    };

    const result = guard.canActivate(createMockContext(req));
    assert.strictEqual(result, true);
    assert.strictEqual(req.user?.username, 'manager_1');
    assert.strictEqual(req.user?.role, AdminRole.MANAGER);
  });

  it('should throw UnauthorizedException when neither service key nor token is provided', () => {
    const guard = createGuard({ DASHBOARD_SERVICE_KEY: serviceKey });
    const req: Partial<Request> & { user?: JwtPayload } = {
      headers: {}
    };

    assert.throws(() => {
      guard.canActivate(createMockContext(req));
    }, UnauthorizedException);
  });
});
