/**
 * API Versioning Middleware
 * Supports versioned API routes: /api/v1/*, /api/v2/*, etc.
 */

import { NextRequest, NextResponse } from 'next/server';

export const API_VERSION = 'v1';
export const SUPPORTED_VERSIONS = ['v1'];
export const DEFAULT_VERSION = 'v1';

/**
 * Extract API version from request
 * Supports: URL path, Accept header, X-API-Version header
 */
export function getApiVersion(request: NextRequest): string {
  // 1. Check URL path: /api/v1/...
  const pathMatch = request.nextUrl.pathname.match(/^\/api\/(v\d+)\//);
  if (pathMatch && SUPPORTED_VERSIONS.includes(pathMatch[1])) {
    return pathMatch[1];
  }

  // 2. Check X-API-Version header
  const headerVersion = request.headers.get('X-API-Version');
  if (headerVersion && SUPPORTED_VERSIONS.includes(headerVersion)) {
    return headerVersion;
  }

  // 3. Check Accept header: application/vnd.upsc.v1+json
  const accept = request.headers.get('Accept');
  if (accept) {
    const acceptMatch = accept.match(/application\/vnd\.upsc\.(v\d+)\+json/);
    if (acceptMatch && SUPPORTED_VERSIONS.includes(acceptMatch[1])) {
      return acceptMatch[1];
    }
  }

  // 4. Default version
  return DEFAULT_VERSION;
}

/**
 * Validate API version
 */
export function validateApiVersion(version: string): {
  valid: boolean;
  error?: string;
} {
  if (!SUPPORTED_VERSIONS.includes(version)) {
    return {
      valid: false,
      error: `API version '${version}' is not supported. Supported versions: ${SUPPORTED_VERSIONS.join(', ')}`,
    };
  }

  return { valid: true };
}

/**
 * Add version headers to response
 */
export function addVersionHeaders(
  response: NextResponse,
  version: string
): NextResponse {
  response.headers.set('X-API-Version', version);
  response.headers.set('X-Supported-Versions', SUPPORTED_VERSIONS.join(', '));
  return response;
}

/**
 * Create versioned API response
 */
export function createVersionedResponse(
  data: any,
  version: string,
  status: number = 200
): NextResponse {
  const response = NextResponse.json(
    {
      version,
      data,
      timestamp: new Date().toISOString(),
    },
    { status }
  );

  return addVersionHeaders(response, version);
}

/**
 * Create versioned error response
 */
export function createVersionedError(
  error: string,
  version: string,
  status: number = 400
): NextResponse {
  const response = NextResponse.json(
    {
      version,
      error,
      timestamp: new Date().toISOString(),
    },
    { status }
  );

  return addVersionHeaders(response, version);
}

/**
 * Middleware to handle API versioning
 */
export function withApiVersion(
  handler: (request: NextRequest, version: string) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const version = getApiVersion(request);
    const validation = validateApiVersion(version);

    if (!validation.valid) {
      return createVersionedError(
        validation.error!,
        DEFAULT_VERSION,
        400
      );
    }

    try {
      const response = await handler(request, version);
      return addVersionHeaders(response, version);
    } catch (error) {
      console.error('[API Versioning] Error:', error);
      return createVersionedError(
        'Internal server error',
        version,
        500
      );
    }
  };
}

/**
 * Version-specific feature flags
 */
export const VERSION_FEATURES = {
  v1: {
    rateLimit: 10,
    maxPayloadSize: 1024 * 1024, // 1MB
    features: ['notes', 'quiz', 'current-affairs'],
  },
} as const;

/**
 * Get features for API version
 */
export function getVersionFeatures(version: string) {
  return VERSION_FEATURES[version as keyof typeof VERSION_FEATURES] || VERSION_FEATURES.v1;
}
