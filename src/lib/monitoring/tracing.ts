interface Span {
  name: string;
  startTime: number;
  endTime?: number;
  attributes: Record<string, any>;
}

const spans: Span[] = [];

export function startSpan(name: string, attributes: Record<string, any> = {}): Span {
  const span: Span = {
    name,
    startTime: Date.now(),
    attributes,
  };
  spans.push(span);
  return span;
}

export function endSpan(span: Span) {
  span.endTime = Date.now();
}

export function getSpans() {
  return spans.slice(-100); // Keep last 100 spans
}

export function traceRequest(name: string, fn: () => Promise<any>) {
  const span = startSpan(name);
  return fn().finally(() => endSpan(span));
}
