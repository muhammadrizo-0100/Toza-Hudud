import { Request } from 'express';
import { timingSafeEqual } from 'node:crypto';

/**
 * Extracts service key candidate from standard headers:
 * - x-service-key
 * - x-api-key
 * - Authorization: Bearer <token>
 */
export function extractServiceCandidate(req: Request): string {
  const headers = req.headers;
  const rawServiceKey =
    headers['x-service-key'] ??
    headers['X-Service-Key'] ??
    headers['X-SERVICE-KEY'] ??
    '';
  const serviceKey = Array.isArray(rawServiceKey)
    ? rawServiceKey[0]
    : String(rawServiceKey);

  const rawApiKey =
    headers['x-api-key'] ??
    headers['X-Api-Key'] ??
    headers['X-API-KEY'] ??
    '';
  const apiKey = Array.isArray(rawApiKey) ? rawApiKey[0] : String(rawApiKey);

  const authHeader = String(headers['authorization'] || '').trim();
  let bearerToken = '';
  if (authHeader.toLowerCase().startsWith('bearer ')) {
    bearerToken = authHeader.slice(7).trim();
  }

  const candidate = serviceKey || apiKey || bearerToken;
  return candidate.trim();
}

/**
 * Validates candidate against configured service key using timingSafeEqual
 * to prevent timing side-channel attacks.
 */
export function isServiceKeyValid(
  candidate: string,
  configuredKey: string,
): boolean {
  const cleanKey = configuredKey.trim();
  const cleanCandidate = candidate.trim();

  if (!cleanKey || cleanKey.length < 16 || !cleanCandidate) {
    return false;
  }

  const configuredBuf = Buffer.from(cleanKey);
  const candidateBuf = Buffer.from(cleanCandidate);

  return (
    configuredBuf.length === candidateBuf.length &&
    timingSafeEqual(configuredBuf, candidateBuf)
  );
}

/**
 * Strips IPv6-mapped IPv4 prefix (::ffff:) and normalizes ::1
 */
export function normalizeIp(rawIp: string): string {
  let ip = (rawIp || '').trim();
  if (ip.startsWith('::ffff:')) {
    ip = ip.slice(7);
  }
  if (ip === '::1') {
    return '127.0.0.1';
  }
  return ip;
}

/**
 * Extracts client IP considering x-forwarded-for, req.ip and socket address.
 */
export function extractClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const rawForwarded = Array.isArray(forwarded) ? forwarded[0] : forwarded;
    const firstIp = rawForwarded.split(',')[0].trim();
    if (firstIp) {
      return normalizeIp(firstIp);
    }
  }

  const realIp = req.headers['x-real-ip'];
  if (realIp) {
    const rawReal = Array.isArray(realIp) ? realIp[0] : realIp;
    if (rawReal) {
      return normalizeIp(rawReal);
    }
  }

  const expressIp = typeof req.ip === 'string' ? req.ip : '';
  const remoteAddress =
    typeof req.socket?.remoteAddress === 'string'
      ? req.socket.remoteAddress
      : '';

  return normalizeIp(expressIp || remoteAddress);
}

/**
 * Checks if the client IP is in the allowed IP list.
 * If allowedIpsRaw is empty or undefined, access is permitted (disabled restriction).
 */
export function isClientIpAllowed(
  clientIp: string,
  allowedIpsRaw: string | undefined,
): boolean {
  const raw = String(allowedIpsRaw || '').trim();
  if (!raw) {
    return true;
  }

  const normalizedClient = normalizeIp(clientIp);
  const allowedSet = new Set(
    raw
      .split(',')
      .map((item) => normalizeIp(item))
      .filter(Boolean),
  );

  if (allowedSet.has(normalizedClient)) {
    return true;
  }

  const isLocalClient =
    normalizedClient === '127.0.0.1' || normalizedClient === 'localhost';
  const allowsLocal =
    allowedSet.has('127.0.0.1') || allowedSet.has('localhost');

  return isLocalClient && allowsLocal;
}
