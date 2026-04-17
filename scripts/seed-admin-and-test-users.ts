/**
 * Seed Admin + Test Premium User
 * ------------------------------------------------------------
 * Idempotently creates two accounts in the live Supabase project:
 *
 *   1. Super-admin (role='admin', tier='premium_plus')
 *   2. Test premium user (role='user', tier='premium_plus')
 *
 * These credentials are intended for internal use only and are documented in
 * ADMIN_CREDENTIALS.md. Re-running this script will reset the passwords
 * listed below and re-assert the roles / subscription tiers.
 *
 * Requirements:
 *   - SUPABASE_URL env var (or NEXT_PUBLIC_SUPABASE_URL)
 *   - SUPABASE_SERVICE_ROLE_KEY env var
 *
 * Run:
 *   npx tsx scripts/seed-admin-and-test-users.ts
 */

import { createClient, type User } from '@supabase/supabase-js';

type SeedUser = {
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'user';
  tier: 'premium' | 'premium_plus';
};

const SEED_USERS: SeedUser[] = [
  {
    email: 'admin@upscprepx.ai',
    password: 'AdminChanakya2026!',
    name: 'Platform Admin',
    role: 'admin',
    tier: 'premium_plus',
  },
  {
    email: 'test-premium@upscprepx.ai',
    password: 'TestPremium2026!',
    name: 'Test Premium User',
    role: 'user',
    tier: 'premium_plus',
  },
];

async function main() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    console.error(
      '\n[seed] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Set them in your shell before running.\n',
    );
    process.exit(1);
  }

  const supabase = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  for (const seed of SEED_USERS) {
    console.log(`\n→ Seeding ${seed.email} (${seed.role}, ${seed.tier})`);

    // Check if auth user already exists by paging listUsers.
    const existing = await findAuthUserByEmail(supabase, seed.email);

    let authUserId: string;
    if (existing) {
      console.log(`  • auth user exists (${existing.id}) — updating password + metadata`);
      const { data: updated, error: updateErr } = await supabase.auth.admin.updateUserById(existing.id, {
        password: seed.password,
        email_confirm: true,
        user_metadata: { name: seed.name },
      });
      if (updateErr) throw updateErr;
      authUserId = updated.user!.id;
    } else {
      console.log('  • creating new auth user');
      const { data: created, error: createErr } = await supabase.auth.admin.createUser({
        email: seed.email,
        password: seed.password,
        email_confirm: true,
        user_metadata: { name: seed.name },
      });
      if (createErr) throw createErr;
      authUserId = created.user!.id;
    }

    // Upsert into public.users with role + subscription_tier.
    const now = new Date();
    const farFuture = new Date(now);
    farFuture.setFullYear(now.getFullYear() + 5);

    const { error: upsertErr } = await supabase.from('users').upsert(
      {
        id: authUserId,
        email: seed.email,
        name: seed.name,
        role: seed.role,
        subscription_tier: seed.tier,
        subscription_status: 'active',
        subscription_ends_at: farFuture.toISOString(),
        trial_used: true,
        post_trial: false,
      } as any,
      { onConflict: 'id' },
    );
    if (upsertErr) throw upsertErr;

    // Upsert an active subscription row so entitlement middleware passes.
    const { error: subErr } = await (supabase.from('user_subscriptions') as any).upsert(
      {
        user_id: authUserId,
        status: 'active',
        current_period_start: now.toISOString(),
        current_period_end: farFuture.toISOString(),
        cancel_at_period_end: false,
      },
      { onConflict: 'user_id' },
    );
    if (subErr) {
      console.warn(`  • user_subscriptions upsert warning: ${subErr.message}`);
    }

    console.log(`  ✓ ${seed.email} ready`);
  }

  console.log('\nAll seed users are up to date.\n');
  console.log('Credentials:');
  for (const u of SEED_USERS) {
    console.log(`  ${u.role.padEnd(5)} — ${u.email} / ${u.password}`);
  }
  console.log();
}

async function findAuthUserByEmail(
  supabase: ReturnType<typeof createClient>,
  email: string,
): Promise<User | null> {
  let page = 1;
  const perPage = 200;
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const match = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (match) return match;
    if (data.users.length < perPage) return null;
    page += 1;
    if (page > 50) return null; // safety cap
  }
}

main().catch((err) => {
  console.error('\n[seed] Fatal:', err);
  process.exit(1);
});
