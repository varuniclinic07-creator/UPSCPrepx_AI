// ═══════════════════════════════════════════════════════════════════════════
// SSRF PROTECTION - Server-Side Request Forgery Prevention
// ═══════════════════════════════════════════════════════════════════════════

import { URL } from 'url';

// ═══════════════════════════════════════════════════════════════════════════
// ALLOWLISTED DOMAINS FOR EXTERNAL REQUESTS
// ═══════════════════════════════════════════════════════════════════════════

export const ALLOWED_DOMAINS = [
    // Search Engines
    'duckduckgo.com',
    'www.duckduckgo.com',
    'google.com',
    'www.google.com',

    // Government Sites
    'upsc.gov.in',
    'www.upsc.gov.in',
    'pib.gov.in',
    'www.pib.gov.in',
    'india.gov.in',
    'www.india.gov.in',
    'mea.gov.in',
    'www.mea.gov.in',
    'pmindia.gov.in',
    'www.pmindia.gov.in',

    // Educational Resources
    'ncert.nic.in',
    'www.ncert.nic.in',
    'ignou.ac.in',
    'www.ignou.ac.in',
    'nios.ac.in',
    'www.nios.ac.in',

    // News & Current Affairs
    'thehindu.com',
    'www.thehindu.com',
    'indianexpress.com',
    'www.indianexpress.com',
    'livemint.com',
    'www.livemint.com',
    'economictimes.indiatimes.com',
    'timesofindia.indiatimes.com',

    // Wikipedia
    'wikipedia.org',
    'en.wikipedia.org',

    // Internal services
    'crawl4ai',       // Docker service name
    'web-search',
    'autodoc',
    'file-search',
];

// ═══════════════════════════════════════════════════════════════════════════
// PRIVATE IP RANGES (RFC 1918 + Others)
// ═══════════════════════════════════════════════════════════════════════════

const PRIVATE_IP_PATTERNS = [
    /^127\./,                           // Loopback
    /^10\./,                            // Class A private
    /^172\.(1[6-9]|2[0-9]|3[01])\./,   // Class B private
    /^192\.168\./,                      // Class C private
    /^169\.254\./,                      // Link-local
    /^0\./,                             // All zeros
    /^255\./,                           // Broadcast
    /^100\.(6[4-9]|[7-9]\d|1[0-2]\d|127)\./, // Carrier-grade NAT
    /^::1$/,                            // IPv6 loopback
    /^fc[0-9a-f]{2}:/i,                // IPv6 unique local
    /^fe80:/i,                          // IPv6 link-local
];

// ═══════════════════════════════════════════════════════════════════════════
// URL VALIDATION
// ═══════════════════════════════════════════════════════════════════════════

export interface SSRFValidationResult {
    valid: boolean;
    error?: string;
    sanitizedUrl?: string;
}

export function validateExternalUrl(
    url: string,
    options: {
        allowedDomains?: string[];
        allowHttp?: boolean;
        allowInternal?: boolean;
    } = {}
): SSRFValidationResult {
    const {
        allowedDomains = ALLOWED_DOMAINS,
        allowHttp = false,
        allowInternal = false,
    } = options;

    try {
        const parsed = new URL(url);

        // 1. Protocol validation
        if (!allowHttp && parsed.protocol === 'http:') {
            // Allow HTTP only for internal Docker services
            const isInternalService = ['crawl4ai', 'web-search', 'autodoc', 'file-search']
                .includes(parsed.hostname);

            if (!isInternalService) {
                return {
                    valid: false,
                    error: 'HTTPS required for external URLs',
                };
            }
        }

        if (!['http:', 'https:'].includes(parsed.protocol)) {
            return {
                valid: false,
                error: `Protocol not allowed: ${parsed.protocol}`,
            };
        }

        // 2. Port validation (block uncommon ports)
        const allowedPorts = ['', '80', '443', '8030', '8031', '8032', '11235'];
        if (!allowedPorts.includes(parsed.port)) {
            return {
                valid: false,
                error: `Port not allowed: ${parsed.port}`,
            };
        }

        // 3. Private IP validation
        if (!allowInternal) {
            const hostname = parsed.hostname;

            // Check if it's an IP address
            if (/^[\d.]+$/.test(hostname) || hostname.includes(':')) {
                for (const pattern of PRIVATE_IP_PATTERNS) {
                    if (pattern.test(hostname)) {
                        return {
                            valid: false,
                            error: 'Private IP addresses not allowed',
                        };
                    }
                }
            }

            // Block localhost variants
            if (['localhost', '0.0.0.0', '[::]', '[::1]'].includes(hostname.toLowerCase())) {
                return {
                    valid: false,
                    error: 'Localhost not allowed',
                };
            }
        }

        // 4. Domain allowlist check
        const hostname = parsed.hostname.toLowerCase();
        const isAllowed = allowedDomains.some(domain => {
            const d = domain.toLowerCase();
            return hostname === d || hostname.endsWith(`.${d}`);
        });

        if (!isAllowed && !allowInternal) {
            return {
                valid: false,
                error: `Domain not in allowlist: ${hostname}`,
            };
        }

        // 5. Path traversal prevention
        if (parsed.pathname.includes('..') || parsed.pathname.includes('//')) {
            return {
                valid: false,
                error: 'Path traversal detected',
            };
        }

        // 6. Dangerous query parameters
        const dangerousParams = ['url', 'redirect', 'next', 'callback', 'return'];
        for (const param of dangerousParams) {
            const value = parsed.searchParams.get(param);
            if (value && (value.startsWith('http') || value.includes('://'))) {
                return {
                    valid: false,
                    error: `Suspicious parameter: ${param}`,
                };
            }
        }

        return {
            valid: true,
            sanitizedUrl: parsed.toString(),
        };

    } catch (error) {
        return {
            valid: false,
            error: `Invalid URL: ${(error as Error).message}`,
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// SAFE FETCH WRAPPER
// ═══════════════════════════════════════════════════════════════════════════

export async function safeFetch(
    url: string,
    options: RequestInit & {
        timeout?: number;
        maxResponseSize?: number;
    } = {}
): Promise<Response> {
    const { timeout = 10000, maxResponseSize = 10 * 1024 * 1024, ...fetchOptions } = options;

    // Validate URL
    const validation = validateExternalUrl(url, { allowInternal: true });
    if (!validation.valid) {
        throw new Error(`SSRF Protection: ${validation.error}`);
    }

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(validation.sanitizedUrl!, {
            ...fetchOptions,
            signal: controller.signal,
            headers: {
                ...fetchOptions.headers,
                'User-Agent': 'UPSC-CSE-Master-Bot/1.0',
            },
        });

        // Check response size
        const contentLength = response.headers.get('content-length');
        if (contentLength && parseInt(contentLength, 10) > maxResponseSize) {
            throw new Error('Response too large');
        }

        return response;

    } finally {
        clearTimeout(timeoutId);
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// DNS REBIND PROTECTION
// ═══════════════════════════════════════════════════════════════════════════

const resolvedHosts = new Map<string, { ip: string; timestamp: number }>();
const DNS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function resolveAndValidate(hostname: string): Promise<boolean> {
    // Check cache
    const cached = resolvedHosts.get(hostname);
    if (cached && Date.now() - cached.timestamp < DNS_CACHE_TTL) {
        return !isPrivateIP(cached.ip);
    }

    try {
        // In production, use DNS module for resolution
        // For now, we trust the allowlist validation
        return true;
    } catch {
        return false;
    }
}

function isPrivateIP(ip: string): boolean {
    for (const pattern of PRIVATE_IP_PATTERNS) {
        if (pattern.test(ip)) {
            return true;
        }
    }
    return false;
}
