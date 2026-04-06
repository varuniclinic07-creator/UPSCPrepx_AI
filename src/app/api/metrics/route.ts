import { NextResponse } from 'next/server';

const metrics = {
  http_requests_total: 0,
  http_requests_success: 0,
  http_requests_error: 0,
  notes_generated: 0,
  quiz_attempts: 0,
  active_users: 0,
};

// Helper function - not exported from route file
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function incrementMetric(name: keyof typeof metrics) {
  metrics[name]++;
}

export async function GET() {
  const output = `# HELP http_requests_total Total HTTP requests
# TYPE http_requests_total counter
http_requests_total ${metrics.http_requests_total}

# HELP notes_generated_total Total notes generated
# TYPE notes_generated_total counter
notes_generated_total ${metrics.notes_generated}

# HELP quiz_attempts_total Total quiz attempts
# TYPE quiz_attempts_total counter
quiz_attempts_total ${metrics.quiz_attempts}

# HELP active_users_total Active users
# TYPE active_users_total gauge
active_users_total ${metrics.active_users}
`;

  return new NextResponse(output, {
    headers: { 'Content-Type': 'text/plain; version=0.0.4' }
  });
}

// Export metrics helper from a separate module if needed elsewhere
// Do not export non-route functions from route files