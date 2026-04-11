/**
 * Phase 17: Zero-Trust — Internal Service Token Signing & Verification
 *
 * Service-to-service calls must include a signed JWT scoped to the calling
 * service. This prevents any external actor from spoofing an internal call
 * even if they know an internal URL.
 *
 * Token format:
 *   Header: { alg: "HS256", typ: "JWT" }
 *   Payload: { iss: <service>, aud: <target>, iat, exp, jti }
 *
 * The signing secret is derived from ENCRYPTION_KEY (server-only env var)
 * and is never exposed to the client bundle.
 */

import { createHmac, randomBytes } from 'crypto';

// ═══════════════════════════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════════════════════════

/** Token TTL in seconds — short-lived to limit blast radius */
const TOKEN_TTL_SECONDS = 300; // 5 minutes

/** Known internal services that can issue tokens */
export type ServiceName =
  | 'web'
  | 'api'
  | 'worker'
  | 'ai-router'
  | 'queue-processor'
  | 'admin';

function getSigningSecret(): string {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) throw new Error('ENCRYPTION_KEY is not set — service tokens cannot be issued');
  // Derive a dedicated sub-key for service tokens
  return `service-token:${key}`;
}

// ═══════════════════════════════════════════════════════════════════════════
// JWT HELPERS (minimal, no external dep)
// ═══════════════════════════════════════════════════════════════════════════

function b64url(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function sign(header: string, payload: string, secret: string): string {
  const data = `${header}.${payload}`;
  return createHmac('sha256', secret).update(data).digest('base64url');
}

function encodeSegment(obj: Record<string, unknown>): string {
  return b64url(JSON.stringify(obj));
}

function decode(segment: string): Record<string, unknown> {
  return JSON.parse(Buffer.from(segment, 'base64url').toString('utf8'));
}

// ═══════════════════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════════════════

export interface ServiceTokenPayload {
  iss: ServiceName;  // Issuing service
  aud: ServiceName;  // Intended target service
  iat: number;       // Issued at (unix seconds)
  exp: number;       // Expires at (unix seconds)
  jti: string;       // Unique token ID (for replay detection)
}

/**
 * Issue a short-lived signed JWT for a service-to-service call.
 *
 * @example
 * const token = issueServiceToken('api', 'worker');
 * fetch('/internal/queue/enqueue', {
 *   headers: { 'x-service-token': token }
 * });
 */
export function issueServiceToken(issuer: ServiceName, audience: ServiceName): string {
  const secret = getSigningSecret();
  const now = Math.floor(Date.now() / 1000);

  const header = encodeSegment({ alg: 'HS256', typ: 'JWT' });
  const payload = encodeSegment({
    iss: issuer,
    aud: audience,
    iat: now,
    exp: now + TOKEN_TTL_SECONDS,
    jti: randomBytes(16).toString('hex'),
  });
  const signature = sign(header, payload, secret);

  return `${header}.${payload}.${signature}`;
}

/**
 * Verify a service token from an incoming internal request.
 * Throws on any verification failure.
 *
 * @example
 * const payload = verifyServiceToken(req.headers.get('x-service-token'), 'worker');
 * // payload.iss tells you which service is calling
 */
export function verifyServiceToken(
  token: string,
  expectedAudience: ServiceName
): ServiceTokenPayload {
  if (!token) throw new Error('Service token is missing');

  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Malformed service token');

  const [headerB64, payloadB64, sig] = parts;
  const secret = getSigningSecret();

  // Verify signature
  const expectedSig = sign(headerB64, payloadB64, secret);
  if (expectedSig !== sig) throw new Error('Invalid service token signature');

  // Decode and validate claims
  const payload = decode(payloadB64) as unknown as ServiceTokenPayload;
  const now = Math.floor(Date.now() / 1000);

  if (payload.exp < now) throw new Error('Service token has expired');
  if (payload.aud !== expectedAudience) {
    throw new Error(`Token audience mismatch: expected ${expectedAudience}, got ${payload.aud}`);
  }

  return payload;
}

/**
 * Express-style middleware helper — validates the x-service-token header
 * and returns the payload, or null if verification fails.
 *
 * Routes that are internal-only should call this instead of user auth.
 */
export function extractServiceToken(
  headers: Headers | Record<string, string | null>,
  audience: ServiceName
): ServiceTokenPayload | null {
  try {
    const token =
      headers instanceof Headers
        ? headers.get('x-service-token')
        : (headers as Record<string, string | null>)['x-service-token'];

    if (!token) return null;
    return verifyServiceToken(token, audience);
  } catch {
    return null;
  }
}
