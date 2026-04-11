/**
 * Distributed Tracing with OpenTelemetry
 * Tempo integration for request flow tracking across services
 * OWASP-compliant tracing for UPSC PrepX-AI
 */

// ═══════════════════════════════════════════════════════════
// TRACE CONTEXT
// ═══════════════════════════════════════════════════════════

export interface SpanContext {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
}

export interface SpanAttributes {
  [key: string]: string | number | boolean | undefined;
}

export interface SpanEvent {
  name: string;
  timestamp: string;
  attributes?: SpanAttributes;
}

export interface Span {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  name: string;
  kind: 'internal' | 'server' | 'client' | 'producer' | 'consumer';
  startTime: number;
  endTime?: number;
  status: 'unset' | 'ok' | 'error';
  attributes: SpanAttributes;
  events: SpanEvent[];
  error?: Error;
}

// ═══════════════════════════════════════════════════════════
// TRACE GENERATION
// ═══════════════════════════════════════════════════════════

function generateId(length: number = 16): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function generateTraceId(): string {
  return generateId(16);
}

export function generateSpanId(): string {
  return generateId(8);
}

// ═══════════════════════════════════════════════════════════
// IN-MEMORY STORE (for development)
// ═══════════════════════════════════════════════════════════

const spansStore = new Map<string, Span>();
const tracesStore = new Map<string, Span[]>();

const MAX_SPANS_PER_TRACE = 1000;
const MAX_TRACES = 10000;

// ═══════════════════════════════════════════════════════════
// TRACER CLASS
// ═══════════════════════════════════════════════════════════

export class Tracer {
  private serviceName: string;
  private environment: string;

  constructor(serviceName: string, environment: string) {
    this.serviceName = serviceName;
    this.environment = environment;
  }

  /**
   * Start a new span
   */
  startSpan(
    name: string,
    options: {
      parentContext?: SpanContext;
      kind?: Span['kind'];
      attributes?: SpanAttributes;
      startTime?: number;
    } = {}
  ): Span {
    const traceId = options.parentContext?.traceId || generateTraceId();
    const spanId = generateSpanId();
    const parentSpanId = options.parentContext?.spanId;

    const span: Span = {
      traceId,
      spanId,
      parentSpanId: parentSpanId,
      name,
      kind: options.kind || 'internal',
      startTime: options.startTime || Date.now(),
      status: 'unset',
      attributes: {
        'service.name': this.serviceName,
        'deployment.environment': this.environment,
        ...options.attributes,
      },
      events: [],
    };

    // Store span
    spansStore.set(spanId, span);

    // Add to trace
    if (!tracesStore.has(traceId)) {
      tracesStore.set(traceId, []);
    }
    const traceSpans = tracesStore.get(traceId)!;
    if (traceSpans.length < MAX_SPANS_PER_TRACE) {
      traceSpans.push(span);
    }

    // Limit total traces
    if (tracesStore.size > MAX_TRACES) {
      const oldestTrace = tracesStore.keys().next().value;
      if (oldestTrace) {
        tracesStore.delete(oldestTrace);
      }
    }

    return span;
  }

  /**
   * End a span
   */
  endSpan(span: Span, options: { status?: Span['status']; error?: Error } = {}): void {
    span.endTime = Date.now();
    span.status = options.status || 'ok';
    if (options.error) {
      span.error = options.error;
      span.attributes['error.message'] = options.error.message;
      span.attributes['error.stack'] = options.error.stack;
    }
  }

  /**
   * Add event to span
   */
  addEvent(span: Span, eventName: string, attributes?: SpanAttributes): void {
    span.events.push({
      name: eventName,
      timestamp: new Date().toISOString(),
      attributes,
    });
  }

  /**
   * Set span attribute
   */
  setAttribute(span: Span, key: string, value: string | number | boolean): void {
    span.attributes[key] = value;
  }

  /**
   * Create context from span for child spans
   */
  getSpanContext(span: Span): SpanContext {
    return {
      traceId: span.traceId,
      spanId: span.spanId,
    };
  }

  /**
   * Extract trace context from headers
   */
  extractContext(headers: Record<string, string | undefined>): SpanContext | undefined {
    const traceparent = headers['traceparent'] || headers['x-traceparent'];
    if (!traceparent) return undefined;

    // W3C Trace Context format: version-traceId-parentSpanId-flags
    const parts = traceparent.split('-');
    if (parts.length !== 4) return undefined;

    return {
      traceId: parts[1],
      spanId: parts[2],
    };
  }

  /**
   * Inject trace context into headers
   */
  injectContext(span: Span, headers: Record<string, string>): void {
    headers['traceparent'] = `00-${span.traceId}-${span.spanId}-01`;
    headers['x-trace-id'] = span.traceId;
    headers['x-span-id'] = span.spanId;
  }
}

// ═══════════════════════════════════════════════════════════
// DEFAULT TRACER
// ═══════════════════════════════════════════════════════════

export const tracer = new Tracer(
  process.env.SERVICE_NAME || 'upsc-prepx-ai',
  process.env.NODE_ENV || 'development'
);

// ═══════════════════════════════════════════════════════════
// ASYNC LOCAL STORAGE FOR CONTEXT
// ═══════════════════════════════════════════════════════════

// Simple async context propagation (Node.js 18+)
const asyncLocalStorage = new Map<string, Span>();

export function getCurrentSpan(): Span | undefined {
  const requestId = AsyncLocalStorage.getStore()?.requestId;
  if (requestId) {
    return asyncLocalStorage.get(requestId);
  }
  return undefined;
}

export function setCurrentSpan(span: Span, requestId: string): void {
  asyncLocalStorage.set(requestId, span);
}

// Shim for AsyncLocalStorage if not available
const AsyncLocalStorage = (globalThis as any).AsyncLocalStorage || class {
  getStore() { return {}; }
  run(store: any, fn: any) { return fn(); }
};

// ═══════════════════════════════════════════════════════════
// TRACE WRAPPER FOR ASYNC FUNCTIONS
// ═══════════════════════════════════════════════════════════

export async function withTrace<T>(
  name: string,
  fn: () => Promise<T>,
  options: {
    parentSpan?: Span;
    kind?: Span['kind'];
    attributes?: SpanAttributes;
  } = {}
): Promise<T> {
  const span = tracer.startSpan(name, {
    parentContext: options.parentSpan ? tracer.getSpanContext(options.parentSpan) : undefined,
    kind: options.kind,
    attributes: options.attributes,
  });

  try {
    const result = await fn();
    tracer.endSpan(span, { status: 'ok' });
    return result;
  } catch (error) {
    tracer.endSpan(span, { status: 'error', error: error as Error });
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════
// HTTP TRACE MIDDLEWARE
// ═══════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';

export function withTracing(
  handler: (request: NextRequest) => Promise<NextResponse>
): (request: NextRequest) => Promise<NextResponse> {
  return async (request: NextRequest) => {
    const requestId = crypto.randomUUID();

    // Extract incoming trace context
    const incomingContext = tracer.extractContext({
      traceparent: request.headers.get('traceparent') || undefined,
    });

    // Start root span
    const span = tracer.startSpan(`${request.method} ${request.nextUrl.pathname}`, {
      parentContext: incomingContext,
      kind: 'server',
      attributes: {
        'http.method': request.method,
        'http.url': request.url,
        'http.target': request.nextUrl.pathname,
        'http.user_agent': request.headers.get('user-agent'),
        'http.client_ip': request.ip || 'unknown',
      },
    });

    // Inject context into outgoing headers
    const responseHeaders = new Headers();
    tracer.injectContext(span, Object.fromEntries(responseHeaders.entries()));
    responseHeaders.set('x-request-id', requestId);
    responseHeaders.set('x-trace-id', span.traceId);

    try {
      const response = await handler(request);

      // Add trace headers to response
      response.headers.set('x-trace-id', span.traceId);
      response.headers.set('x-span-id', span.spanId);

      // Record response attributes
      tracer.setAttribute(span, 'http.status_code', response.status);

      const contentLength = response.headers.get('content-length');
      if (contentLength) {
        tracer.setAttribute(span, 'http.response_content_length', parseInt(contentLength));
      }

      tracer.endSpan(span, { status: response.status >= 400 ? 'error' : 'ok' });

      return response;
    } catch (error) {
      tracer.endSpan(span, { status: 'error', error: error as Error });
      throw error;
    }
  };
}

// ═══════════════════════════════════════════════════════════
// AI TRACE MIDDLEWARE
// ═══════════════════════════════════════════════════════════

export async function withAITrace<T>(
  provider: string,
  model: string,
  fn: () => Promise<T>,
  options: {
    parentSpan?: Span;
    tokens?: { prompt: number; completion: number };
    cost?: number;
  } = {}
): Promise<T> {
  return withTrace(`AI: ${provider}/${model}`, fn, {
    parentSpan: options.parentSpan,
    kind: 'client',
    attributes: {
      'ai.provider': provider,
      'ai.model': model,
      ...(options.tokens && {
        'ai.prompt_tokens': options.tokens.prompt,
        'ai.completion_tokens': options.tokens.completion,
      }),
      ...(options.cost && { 'ai.cost_usd': options.cost }),
    },
  });
}

// ═══════════════════════════════════════════════════════════
// DATABASE TRACE MIDDLEWARE
// ═══════════════════════════════════════════════════════════

export async function withDBTrace<T>(
  table: string,
  operation: string,
  fn: () => Promise<T>,
  options: {
    parentSpan?: Span;
  } = {}
): Promise<T> {
  return withTrace(`DB: ${operation} ${table}`, fn, {
    parentSpan: options.parentSpan,
    kind: 'client',
    attributes: {
      'db.table': table,
      'db.operation': operation,
    },
  });
}

// ═══════════════════════════════════════════════════════════
// EXPORT TRACES TO TEMPO
// ═══════════════════════════════════════════════════════════

export async function exportTracesToTempo(): Promise<void> {
  const tempoUrl = process.env.TEMPO_URL;
  if (!tempoUrl) return;

  // Convert spans to Tempo/OTLP format
  const traces: any[] = [];

  for (const [traceId, spans] of tracesStore.entries()) {
    traces.push({
      trace_id: traceId,
      resource_spans: [
        {
          resource: {
            attributes: [
              { key: 'service.name', value: { string_value: 'upsc-prepx-ai' } },
              { key: 'deployment.environment', value: { string_value: process.env.NODE_ENV || 'development' } },
            ],
          },
          scope_spans: [
            {
              scope: { name: 'upsc-prepx-ai' },
              spans: spans.map((span) => ({
                trace_id: span.traceId,
                span_id: span.spanId,
                parent_span_id: span.parentSpanId || '',
                name: span.name,
                kind: span.kind.toUpperCase(),
                start_time_unix_nano: span.startTime * 1e6,
                end_time_unix_nano: (span.endTime || Date.now()) * 1e6,
                status: {
                  code: span.status === 'error' ? 'STATUS_CODE_ERROR' : 'STATUS_CODE_OK',
                  message: span.error?.message || '',
                },
                attributes: Object.entries(span.attributes).map(([key, value]) => ({
                  key,
                  value: {
                    string_value: typeof value === 'string' ? value : String(value),
                  },
                })),
                events: span.events.map((event) => ({
                  time_unix_nano: new Date(event.timestamp).getTime() * 1e6,
                  name: event.name,
                  attributes: event.attributes
                    ? Object.entries(event.attributes).map(([key, value]) => ({
                        key,
                        value: { string_value: String(value) },
                      }))
                    : [],
                })),
              })),
            },
          ],
        },
      ],
    });
  }

  try {
    await fetch(`${tempoUrl}/tempo/api/push`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ traces }),
    });
  } catch (error) {
    console.error('[Tracing] Failed to export traces to Tempo:', error);
  }
}

// Auto-export traces every 30 seconds
if (process.env.TEMPO_URL && typeof setInterval !== 'undefined') {
  setInterval(() => {
    exportTracesToTempo().catch(console.error);
  }, 30000);
}

// ═══════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════

export const tracing = {
  tracer,
  withTrace,
  withTracing,
  withAITrace,
  withDBTrace,
  getCurrentSpan,
  setCurrentSpan,
  exportTracesToTempo,
};
