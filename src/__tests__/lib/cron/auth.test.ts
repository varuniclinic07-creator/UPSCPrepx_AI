/**
 * @jest-environment node
 */

describe('cron auth helper', () => {
  beforeEach(() => {
    delete process.env.CRON_SECRET;
    delete process.env.HERMES_GATEWAY_TOKEN;
    jest.resetModules();
  });

  it('authorizes requests with CRON_SECRET bearer token', async () => {
    process.env.CRON_SECRET = 'cron-secret';
    const { isAuthorizedCronRequest } = await import('@/lib/cron/auth');

    const request = new Request('http://localhost/api/cron/test', {
      headers: { authorization: 'Bearer cron-secret' },
    });

    expect(isAuthorizedCronRequest(request)).toBe(true);
  });

  it('authorizes requests with HERMES_GATEWAY_TOKEN when cron secret is unavailable', async () => {
    process.env.HERMES_GATEWAY_TOKEN = 'hermes-token';
    const { isAuthorizedCronRequest } = await import('@/lib/cron/auth');

    const request = new Request('http://localhost/api/cron/test', {
      headers: { authorization: 'Bearer hermes-token' },
    });

    expect(isAuthorizedCronRequest(request)).toBe(true);
  });

  it('rejects requests with wrong bearer token', async () => {
    process.env.CRON_SECRET = 'cron-secret';
    process.env.HERMES_GATEWAY_TOKEN = 'hermes-token';
    const { isAuthorizedCronRequest } = await import('@/lib/cron/auth');

    const request = new Request('http://localhost/api/cron/test', {
      headers: { authorization: 'Bearer wrong-token' },
    });

    expect(isAuthorizedCronRequest(request)).toBe(false);
  });
});
