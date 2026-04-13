/**
 * Web Push Delivery Service
 *
 * Sends push notifications via VAPID/web-push to registered browsers.
 * Cleans expired subscriptions (410 Gone) automatically.
 */

import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

// Configure VAPID keys if available
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:admin@upscprepx.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

let _sb: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (!_sb)
    _sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  return _sb;
}

interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

/**
 * Send web push to all registered devices for a user
 * Returns number of successful deliveries
 */
export async function sendPushToUser(
  userId: string,
  payload: PushPayload
): Promise<number> {
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    return 0; // VAPID not configured — skip silently
  }

  const supabase = getSupabase();

  const { data: tokens } = await supabase
    .from('push_notification_tokens')
    .select('id, token')
    .eq('user_id', userId)
    .eq('enabled', true);

  if (!tokens || tokens.length === 0) return 0;

  let sent = 0;
  for (const t of tokens) {
    try {
      const subscription = JSON.parse(t.token);
      if (!subscription.endpoint) continue;

      await webpush.sendNotification(
        subscription,
        JSON.stringify(payload)
      );
      sent++;
    } catch (err: any) {
      // 410 Gone = subscription expired, clean up
      if (err.statusCode === 410 || err.statusCode === 404) {
        await supabase
          .from('push_notification_tokens')
          .delete()
          .eq('id', t.id);
      }
      console.error(`Push failed for token ${t.id}:`, err.message);
    }
  }

  return sent;
}
