import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import { Request } from 'express';
import {
  extractClientIp,
  extractServiceCandidate,
  isClientIpAllowed,
  isServiceKeyValid,
  normalizeIp
} from './service-auth.helper';

describe('service-auth.helper', () => {
  const validKey = 'sec_tozahudud_61dddf234b6cfae8decf99047fb6c27bc7f7af8767376d65';

  describe('extractServiceCandidate', () => {
    it('should extract candidate from x-service-key header', () => {
      const req = {
        headers: { 'x-service-key': validKey }
      } as unknown as Request;
      assert.strictEqual(extractServiceCandidate(req), validKey);
    });

    it('should extract candidate from x-api-key header', () => {
      const req = {
        headers: { 'x-api-key': validKey }
      } as unknown as Request;
      assert.strictEqual(extractServiceCandidate(req), validKey);
    });

    it('should extract candidate from Authorization Bearer header', () => {
      const req = {
        headers: { authorization: `Bearer ${validKey}` }
      } as unknown as Request;
      assert.strictEqual(extractServiceCandidate(req), validKey);
    });

    it('should return empty string when no service key header is present', () => {
      const req = {
        headers: {}
      } as unknown as Request;
      assert.strictEqual(extractServiceCandidate(req), '');
    });
  });

  describe('isServiceKeyValid', () => {
    it('should return true for matching keys with length >= 16', () => {
      assert.strictEqual(isServiceKeyValid(validKey, validKey), true);
    });

    it('should return false for mismatched keys', () => {
      assert.strictEqual(isServiceKeyValid('sec_tozahudud_wrong_key_1234567890', validKey), false);
    });

    it('should return false if configured key is shorter than 16 chars', () => {
      assert.strictEqual(isServiceKeyValid('short_key', 'short_key'), false);
    });

    it('should return false for empty candidate', () => {
      assert.strictEqual(isServiceKeyValid('', validKey), false);
    });
  });

  describe('normalizeIp', () => {
    it('should strip ::ffff: prefix from IPv4 mapped IPv6 addresses', () => {
      assert.strictEqual(normalizeIp('::ffff:192.168.1.100'), '192.168.1.100');
    });

    it('should normalize ::1 to 127.0.0.1', () => {
      assert.strictEqual(normalizeIp('::1'), '127.0.0.1');
    });

    it('should preserve standard IPv4 address', () => {
      assert.strictEqual(normalizeIp('192.168.1.1'), '192.168.1.1');
    });
  });

  describe('extractClientIp', () => {
    it('should extract first IP from x-forwarded-for header', () => {
      const req = {
        headers: { 'x-forwarded-for': '203.0.113.195, 70.41.3.18, 150.172.238.178' }
      } as unknown as Request;
      assert.strictEqual(extractClientIp(req), '203.0.113.195');
    });

    it('should fallback to x-real-ip when x-forwarded-for is missing', () => {
      const req = {
        headers: { 'x-real-ip': '198.51.100.42' }
      } as unknown as Request;
      assert.strictEqual(extractClientIp(req), '198.51.100.42');
    });

    it('should fallback to req.ip if headers are missing', () => {
      const req = {
        headers: {},
        ip: '127.0.0.1'
      } as unknown as Request;
      assert.strictEqual(extractClientIp(req), '127.0.0.1');
    });
  });

  describe('isClientIpAllowed', () => {
    it('should return true if allowedIpsRaw is undefined or empty', () => {
      assert.strictEqual(isClientIpAllowed('203.0.113.50', undefined), true);
      assert.strictEqual(isClientIpAllowed('203.0.113.50', ''), true);
    });

    it('should return true when client IP is in whitelist', () => {
      const whitelist = '127.0.0.1, 192.168.1.50, 10.0.0.1';
      assert.strictEqual(isClientIpAllowed('192.168.1.50', whitelist), true);
    });

    it('should return false when client IP is not in whitelist', () => {
      const whitelist = '127.0.0.1, 192.168.1.50';
      assert.strictEqual(isClientIpAllowed('203.0.113.99', whitelist), false);
    });

    it('should allow localhost variants when 127.0.0.1 is configured', () => {
      const whitelist = '127.0.0.1';
      assert.strictEqual(isClientIpAllowed('::1', whitelist), true);
    });
  });
});
