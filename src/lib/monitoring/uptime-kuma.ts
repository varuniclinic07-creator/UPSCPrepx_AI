const UPTIME_KUMA_URL = process.env.UPTIME_KUMA_URL || 'http://89.117.60.144:3003';
const UPTIME_KUMA_PUSH_KEY = process.env.UPTIME_KUMA_PUSH_KEY;

export async function pushHeartbeat(status: 'up' | 'down', msg?: string): Promise<void> {
  if (!UPTIME_KUMA_PUSH_KEY) return;

  try {
    await fetch(`${UPTIME_KUMA_URL}/api/push/${UPTIME_KUMA_PUSH_KEY}?status=${status}&msg=${encodeURIComponent(msg || '')}`);
  } catch (error) {
    console.error('[Uptime Kuma] Push failed:', error);
  }
}

export async function monitorService(serviceName: string, check: () => Promise<boolean>): Promise<void> {
  try {
    const isUp = await check();
    await pushHeartbeat(isUp ? 'up' : 'down', serviceName);
  } catch (error) {
    await pushHeartbeat('down', `${serviceName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
