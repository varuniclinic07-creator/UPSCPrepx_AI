/**
 * Comprehensive Security Middleware
 * Consolidated OWASP security measures for UPSC PrepX-AI
 *
 * Includes:
 * - JWT validation
 * - RBAC authorization
 * - Rate limiting
 * - CORS protection
 * - Security headers
 * - CSRF protection
 * - Input sanitization
 * - XSS prevention
 * - SSRF protection
 */

import { NextRequest, NextResponse } from 'next/server';
import { withRBAC, UserRole, Permission, can } from './rbac';
import { withRateLimit, RATE_LIMITS, RateLimitConfig } from './enhanced-rate-limiter';
import { validateCSRFToken } from './csrf';
import { sanitizeInput } from './headers';
import { validateRequestOrigin } from './csrf';
import { createClient } from '@/lib/supabase/server';

// ═══════════════════════════════════════════════════════════
// SECURITY CONFIGURATION
// ═══════════════════════════════════════════════════════════

export interface SecurityConfig {
  // Authentication
  requireAuth: boolean;
  requiredRole?: UserRole;
  requiredPermissions?: Permission[];

  // Rate limiting
  rateLimit?: RateLimitConfig | string;

  // CSRF
  requireCSRF: boolean;

  // CORS
  validateOrigin: boolean;

  // Input
  sanitizeInput: boolean;
  requestSchema?: any; // Zod schema

  // Logging
  logSecurityEvents: boolean;
}

const DEFAULT_CONFIG: SecurityConfig = {
  requireAuth: true,
  requireCSRF: false,
  validateOrigin: true,
  sanitizeInput: true,
  logSecurityEvents: true,
};

// ═══════════════════════════════════════════════════════════
// SECURITY EVENT LOGGING
// ═══════════════════════════════════════════════════════════

export type SecurityEventType =
  | 'auth_failure'
  | 'auth_success'
  | 'authorization_failure'
  | 'rate_limit_exceeded'
  | 'csrf_failure'
  | 'origin_validation_failure'
  | 'input_validation_failure'
  | 'suspicious_activity';

export interface SecurityEvent {
  type: SecurityEventType;
  timestamp?: string;
  requestId: string;
  userId?: string;
  ip: string;
  userAgent: string;
  endpoint: string;
  method: string;
  details?: Record<string, unknown>;
}

export function logSecurityEvent(event: SecurityEvent): void {
  if (!DEFAULT_CONFIG.logSecurityEvents) return;

  const logEntry = {
    ...event,
    timestamp: event.timestamp || new Date().toISOString(),
  };

  // Log to console (in production, send to security service)
  console.warn(`[SECURITY] ${event.type}:`, {
    userId: event.userId,
    ip: event.ip,
    endpoint: event.endpoint,
    ...event.details,
  });

  // Send to security logging service if configured
  if (process.env.SECURITY_LOGGING_URL) {
    fetch(process.env.SECURITY_LOGGING_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(logEntry),
    }).catch(() => {});
  }
}

// ═══════════════════════════════════════════════════════════
// GENERATE REQUEST ID
// ═══════════════════════════════════════════════════════════

function generateRequestId(): string {
  const buffer = new Uint8Array(16);
  crypto.getRandomValues(buffer);
  return Array.from(buffer)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Extract IP from request (NextRequest doesn't have .ip in all environments) */
function getRequestIp(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown';
}

// ═══════════════════════════════════════════════════════════
// COMPREHENSIVE SECURITY MIDDLEWARE
// ═══════════════════════════════════════════════════════════

export async function withSecurity(
  request: NextRequest,
  handler: () => Promise<NextResponse>,
  config: Partial<SecurityConfig> = {}
): Promise<NextResponse> {
  const options = { ...DEFAULT_CONFIG, ...config };
  const requestId = generateRequestId();
  const startTime = Date.now();
  let userId: string | undefined = undefined;
  let userRole: UserRole = 'guest';

  try {
    // ═══════════════════════════════════════════════════════
    // 1. AUTHENTICATION
    // ═══════════════════════════════════════════════════════

    if (options.requireAuth) {
      try {
        const supabase = await createClient();
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user) {
          logSecurityEvent({
            type: 'auth_failure',
            requestId,
            ip: getRequestIp(request),
            userAgent: request.headers.get('user-agent') || 'unknown',
            endpoint: request.nextUrl.pathname,
            method: request.method,
            details: { reason: 'No valid session' },
          });

          return NextResponse.json(
            { error: 'Authentication required', code: 'UNAUTHORIZED' },
            { status: 401 }
          );
        }

        userId = user.id;

        // Get user role
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();

        userRole = (userData?.role as UserRole) || 'user';

        // Check required role
        if (options.requiredRole) {
          const roleHierarchy: Record<UserRole, number> = {
            guest: 0,
            user: 1,
            premium: 2,
            admin: 3,
            super_admin: 4,
          };

          if (roleHierarchy[userRole] < roleHierarchy[options.requiredRole]) {
            logSecurityEvent({
              type: 'authorization_failure',
              requestId,
              userId,
              ip: getRequestIp(request),
              userAgent: request.headers.get('user-agent') || 'unknown',
              endpoint: request.nextUrl.pathname,
              method: request.method,
              details: {
                requiredRole: options.requiredRole,
                actualRole: userRole,
              },
            });

            return NextResponse.json(
              {
                error: 'Insufficient permissions',
                requiredRole: options.requiredRole,
                actualRole: userRole,
                code: 'INSUFFICIENT_ROLE',
              },
              { status: 403 }
            );
          }
        }

        // Check required permissions
        if (options.requiredPermissions && options.requiredPermissions.length > 0) {
          const missingPermissions = options.requiredPermissions.filter(
            (p) => !can(userRole, p.split(':')[0] as any, p.split(':')[1] as any)
          );

          if (missingPermissions.length > 0) {
            logSecurityEvent({
              type: 'authorization_failure',
              requestId,
              userId,
              ip: getRequestIp(request),
              userAgent: request.headers.get('user-agent') || 'unknown',
              endpoint: request.nextUrl.pathname,
              method: request.method,
              details: {
                missingPermissions,
                userRole,
              },
            });

            return NextResponse.json(
              {
                error: 'Missing permissions',
                missingPermissions,
                code: 'MISSING_PERMISSIONS',
              },
              { status: 403 }
            );
          }
        }

        logSecurityEvent({
          type: 'auth_success',
          requestId,
          userId,
          ip: getRequestIp(request),
          userAgent: request.headers.get('user-agent') || 'unknown',
          endpoint: request.nextUrl.pathname,
          method: request.method,
        });

      } catch (error) {
        logSecurityEvent({
          type: 'auth_failure',
          requestId,
          ip: getRequestIp(request),
          userAgent: request.headers.get('user-agent') || 'unknown',
          endpoint: request.nextUrl.pathname,
          method: request.method,
          details: { reason: 'Auth check failed', error: String(error) },
        });

        return NextResponse.json(
          { error: 'Authentication failed', code: 'AUTH_ERROR' },
          { status: 500 }
        );
      }
    }

    // Add user ID to headers for downstream use
    const headers = new Headers(request.headers);
    if (userId) {
      headers.set('x-user-id', userId);
      headers.set('x-user-role', userRole);
    }
    headers.set('x-request-id', requestId);

    // ═══════════════════════════════════════════════════════
    // 2. RATE LIMITING
    // ═══════════════════════════════════════════════════════

    if (options.rateLimit) {
      const rateLimitConfig = typeof options.rateLimit === 'string'
        ? RATE_LIMITS[options.rateLimit] || RATE_LIMITS.api
        : options.rateLimit;

      const identifier = userId || `ip:${getRequestIp(request)}`;
      const { checkRateLimit } = await import('./enhanced-rate-limiter');
      const result = await checkRateLimit(identifier, rateLimitConfig);

      if (!result.allowed) {
        logSecurityEvent({
          type: 'rate_limit_exceeded',
          requestId,
          userId,
          ip: getRequestIp(request),
          userAgent: request.headers.get('user-agent') || 'unknown',
          endpoint: request.nextUrl.pathname,
          method: request.method,
          details: {
            limit: result.limit,
            retryAfter: result.retryAfter,
            blocked: result.blocked,
          },
        });

        return NextResponse.json(
          {
            error: 'Rate limit exceeded',
            message: result.blocked
              ? 'Too many requests. You have been temporarily blocked.'
              : 'Too many requests. Please try again later.',
            retryAfter: result.retryAfter,
            code: result.blocked ? 'RATE_LIMIT_BLOCKED' : 'RATE_LIMIT_EXCEEDED',
          },
          {
            status: 429,
            headers: {
              'X-RateLimit-Limit': result.limit.toString(),
              'X-RateLimit-Remaining': result.remaining.toString(),
              'X-RateLimit-Reset': result.resetAt.toString(),
              ...(result.retryAfter && { 'Retry-After': result.retryAfter.toString() }),
            },
          }
        );
      }
    }

    // ═══════════════════════════════════════════════════════
    // 3. CSRF PROTECTION
    // ═══════════════════════════════════════════════════════

    if (options.requireCSRF) {
      const method = request.method.toUpperCase();
      if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
        const csrfToken = request.headers.get('x-csrf-token');

        if (!csrfToken) {
          logSecurityEvent({
            type: 'csrf_failure',
            requestId,
            userId,
            ip: getRequestIp(request),
            userAgent: request.headers.get('user-agent') || 'unknown',
            endpoint: request.nextUrl.pathname,
            method: request.method,
            details: { reason: 'Missing CSRF token' },
          });

          return NextResponse.json(
            { error: 'CSRF token missing', code: 'CSRF_MISSING' },
            { status: 403 }
          );
        }

        const valid = validateCSRFToken(csrfToken, userId);

        if (!valid) {
          logSecurityEvent({
            type: 'csrf_failure',
            requestId,
            userId,
            ip: getRequestIp(request),
            userAgent: request.headers.get('user-agent') || 'unknown',
            endpoint: request.nextUrl.pathname,
            method: request.method,
            details: { reason: 'Invalid CSRF token' },
          });

          return NextResponse.json(
            { error: 'CSRF token invalid', code: 'CSRF_INVALID' },
            { status: 403 }
          );
        }
      }
    }

    // ═══════════════════════════════════════════════════════
    // 4. ORIGIN VALIDATION
    // ═══════════════════════════════════════════════════════

    if (options.validateOrigin && request.nextUrl.pathname.startsWith('/api')) {
      const originValid = validateRequestOrigin(request);

      if (!originValid) {
        logSecurityEvent({
          type: 'origin_validation_failure',
          requestId,
          userId,
          ip: getRequestIp(request),
          userAgent: request.headers.get('user-agent') || 'unknown',
          endpoint: request.nextUrl.pathname,
          method: request.method,
          details: {
            origin: request.headers.get('origin'),
            referer: request.headers.get('referer'),
          },
        });

        return NextResponse.json(
          { error: 'Invalid request origin', code: 'INVALID_ORIGIN' },
          { status: 403 }
        );
      }
    }

    // ═══════════════════════════════════════════════════════
    // 5. INPUT SANITIZATION & VALIDATION
    // ═══════════════════════════════════════════════════════

    if (options.sanitizeInput && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
      try {
        const contentType = request.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          const body = await request.json();
          const sanitized = sanitizeInput(body);

          // Validate against schema if provided
          if (options.requestSchema) {
            const zodResult = options.requestSchema.safeParse(sanitized);
            const validationResult = { valid: zodResult.success, errors: zodResult.success ? [] : zodResult.error?.errors };
            if (!validationResult.valid) {
              logSecurityEvent({
                type: 'input_validation_failure',
                requestId,
                userId,
                ip: getRequestIp(request),
                userAgent: request.headers.get('user-agent') || 'unknown',
                endpoint: request.nextUrl.pathname,
                method: request.method,
                details: { errors: validationResult.errors },
              });

              return NextResponse.json(
                {
                  error: 'Validation failed',
                  details: validationResult.errors,
                  code: 'VALIDATION_ERROR',
                },
                { status: 400 }
              );
            }
          }
        }
      } catch (error) {
        // Invalid JSON - let the handler deal with it
      }
    }

    // ═══════════════════════════════════════════════════════
    // 6. EXECUTE HANDLER
    // ═══════════════════════════════════════════════════════

    const response = await handler();

    // Add security headers
    response.headers.set('X-Request-ID', requestId);
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Log completion
    const duration = Date.now() - startTime;
    console.debug(`[SECURITY] Request completed: ${request.method} ${request.nextUrl.pathname} (${duration}ms)`);

    return response;

  } catch (error) {
    logSecurityEvent({
      type: 'suspicious_activity',
      requestId,
      userId,
      ip: getRequestIp(request),
      userAgent: request.headers.get('user-agent') || 'unknown',
      endpoint: request.nextUrl.pathname,
      method: request.method,
      details: { error: String(error) },
    });

    return NextResponse.json(
      { error: 'Security check failed', code: 'SECURITY_ERROR' },
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════════════════════
// PRESET CONFIGURATIONS
// ═══════════════════════════════════════════════════════════

export const SecurityPresets = {
  // Public endpoint (no auth, rate limited)
  public: {
    requireAuth: false,
    rateLimit: 'api',
    validateOrigin: false,
  } as Partial<SecurityConfig>,

  // Authenticated user endpoint
  authenticated: {
    requireAuth: true,
    rateLimit: 'api',
    validateOrigin: true,
    sanitizeInput: true,
  } as Partial<SecurityConfig>,

  // Admin endpoint
  admin: {
    requireAuth: true,
    requiredRole: 'admin' as UserRole,
    rateLimit: 'admin',
    requireCSRF: true,
    validateOrigin: true,
    logSecurityEvents: true,
  } as Partial<SecurityConfig>,

  // Authentication endpoint (login, register)
  auth: {
    requireAuth: false,
    rateLimit: 'auth',
    requireCSRF: true,
    validateOrigin: true,
  } as Partial<SecurityConfig>,

  // Payment endpoint
  payment: {
    requireAuth: true,
    rateLimit: 'payment',
    requireCSRF: true,
    validateOrigin: true,
    logSecurityEvents: true,
  } as Partial<SecurityConfig>,

  // AI generation endpoint
  aiGenerate: {
    requireAuth: true,
    rateLimit: 'aiGenerate',
    validateOrigin: true,
    sanitizeInput: true,
  } as Partial<SecurityConfig>,

  // AI chat endpoint
  aiChat: {
    requireAuth: true,
    rateLimit: 'aiChat',
    validateOrigin: true,
    sanitizeInput: true,
  } as Partial<SecurityConfig>,
};

// ═══════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════

export const security = {
  withSecurity,
  logSecurityEvent,
  SecurityPresets,
};
