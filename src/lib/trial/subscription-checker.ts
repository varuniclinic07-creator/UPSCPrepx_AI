/**
 * Subscription checker shim — delegates to check-access
 * Created to resolve missing module import in studio routes
 */
import { checkAccess, type FeatureKey } from '@/lib/auth/check-access';

export async function checkSubscriptionAccess(
  userId: string,
  feature: string
): Promise<{ allowed: boolean; tier: string; remaining?: number }> {
  const result = await checkAccess(userId, feature as FeatureKey);

  return {
    allowed: result.allowed,
    tier: (result as any).tier || 'free',
    remaining: result.remaining,
  };
}
