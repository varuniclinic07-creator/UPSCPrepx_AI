/**
 * POST /api/onboarding/start
 * 
 * Initialize onboarding session for new user.
 * Creates user profile and activates 3-day trial.
 * 
 * Master Prompt v8.0 - F1 Smart Onboarding
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

let _sb: ReturnType<typeof createClient> | null = null;
function getSupabase() { if (!_sb) _sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!); return _sb; }

/**
 * Request validation schema
 */
const startOnboardingSchema = z.object({
  user_id: z.string().uuid(),
  email: z.string().email(),
});

/**
 * Start onboarding session
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request
    const body = await request.json();
    const { user_id, email } = startOnboardingSchema.parse(body);

    // Check if user already has onboarding in progress
    const { data: existingProfile } = await getSupabase()
      .from('user_profiles')
      .select('user_id, onboarding_completed')
      .eq('user_id', user_id)
      .single();

    if (existingProfile?.onboarding_completed) {
      return NextResponse.json(
        {
          success: false,
          error: 'Onboarding already completed',
          redirect: '/dashboard',
        },
        { status: 400 }
      );
    }

    // Create or update user profile
    const { error: profileError } = await getSupabase()
      .from('user_profiles')
      .upsert({
        user_id,
        onboarding_completed: false,
        created_at: new Date().toISOString(),
      })
      .eq('user_id', user_id);

    if (profileError) {
      console.error('Error creating user profile:', profileError);
      throw profileError;
    }

    // Check if trial subscription exists
    const { data: existingSubscription } = await getSupabase()
      .from('subscriptions')
      .select('id, status, trial_expires_at')
      .eq('user_id', user_id)
      .eq('status', 'trial')
      .single();

    let trial_expires_at: string;

    if (existingSubscription) {
      trial_expires_at = existingSubscription.trial_expires_at;
    } else {
      // Create trial subscription
      const { data: freePlan } = await getSupabase()
        .from('plans')
        .select('id')
        .eq('slug', 'free')
        .single();

      if (!freePlan) {
        throw new Error('Free plan not found');
      }

      const trialExpiresAt = new Date();
      trialExpiresAt.setDate(trialExpiresAt.getDate() + 3);

      const { data: newSubscription, error: subError } = await getSupabase()
        .from('subscriptions')
        .insert({
          user_id,
          plan_id: freePlan.id,
          status: 'trial',
          trial_started_at: new Date().toISOString(),
          trial_expires_at: trialExpiresAt.toISOString(),
          auto_renew: false,
        })
        .select('trial_expires_at')
        .single();

      if (subError || !newSubscription) {
        throw subError || new Error('Failed to create trial subscription');
      }

      trial_expires_at = newSubscription.trial_expires_at;
    }

    // Log audit event
    await getSupabase().from('audit_logs').insert({
      user_id,
      action: 'onboarding_started',
      resource_type: 'user_profile',
      details: { email },
    });

    return NextResponse.json({
      success: true,
      user_id,
      email,
      trial_active: true,
      trial_expires_at,
      onboarding_completed: existingProfile?.onboarding_completed || false,
    });
  } catch (error) {
    console.error('Error starting onboarding:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to start onboarding',
      },
      { status: 500 }
    );
  }
}
