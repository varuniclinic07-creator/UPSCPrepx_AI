const PLAUSIBLE_URL = process.env.PLAUSIBLE_URL || '';
const PLAUSIBLE_DOMAIN = process.env.PLAUSIBLE_DOMAIN || 'aimasteryedu.in';

interface PlausibleEvent {
  name: string;
  url: string;
  domain?: string;
  props?: Record<string, string | number>;
}

export async function trackEvent(event: PlausibleEvent): Promise<void> {
  if (process.env.NODE_ENV !== 'production') return;

  try {
    await fetch(`${PLAUSIBLE_URL}/api/event`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'UPSC-CSE-Master/1.0',
      },
      body: JSON.stringify({
        name: event.name,
        url: event.url,
        domain: event.domain || PLAUSIBLE_DOMAIN,
        props: event.props,
      }),
    });
  } catch (error) {
    console.error('[Plausible] Track event failed:', error);
  }
}

export function trackPageView(url: string, props?: Record<string, string>): void {
  trackEvent({
    name: 'pageview',
    url,
    props,
  });
}

export function trackNoteGeneration(topic: string, subject: string): void {
  trackEvent({
    name: 'note_generated',
    url: '/api/notes/generate',
    props: { topic, subject },
  });
}

export function trackQuizAttempt(topic: string, score: number): void {
  trackEvent({
    name: 'quiz_completed',
    url: '/api/quiz/submit',
    props: { topic, score: score.toString() },
  });
}

export function trackSubscription(tier: string, amount: number): void {
  trackEvent({
    name: 'subscription_purchased',
    url: '/api/payments/create',
    props: { tier, amount: amount.toString() },
  });
}
