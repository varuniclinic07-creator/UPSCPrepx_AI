#!/usr/bin/env node
/**
 * Standalone, zero-dependency seed for admin + test-premium users.
 * Uses only Node 18+ built-in fetch. Safe to run anywhere Node is installed.
 *
 * Usage:
 *   SUPABASE_URL=https://xxx.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=eyJ... \
 *   node scripts/seed-admin-standalone.mjs
 */

const SEED_USERS = [
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

const URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL || !KEY) {
  console.error('[seed] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const authHeaders = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  'Content-Type': 'application/json',
};

async function json(res) {
  const body = await res.text();
  try {
    return { ok: res.ok, status: res.status, data: body ? JSON.parse(body) : null };
  } catch {
    return { ok: res.ok, status: res.status, data: body };
  }
}

async function findUserByEmail(email) {
  let page = 1;
  const perPage = 200;
  while (page < 50) {
    const res = await fetch(
      `${URL}/auth/v1/admin/users?page=${page}&per_page=${perPage}`,
      { headers: authHeaders },
    );
    const { ok, status, data } = await json(res);
    if (!ok) throw new Error(`listUsers failed ${status}: ${JSON.stringify(data)}`);
    const users = data?.users || [];
    const match = users.find((u) => (u.email || '').toLowerCase() === email.toLowerCase());
    if (match) return match;
    if (users.length < perPage) return null;
    page += 1;
  }
  return null;
}

async function createUser(user) {
  const res = await fetch(`${URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: { name: user.name },
    }),
  });
  const { ok, status, data } = await json(res);
  if (!ok) throw new Error(`createUser failed ${status}: ${JSON.stringify(data)}`);
  return data.id || data.user?.id;
}

async function updateUser(id, user) {
  const res = await fetch(`${URL}/auth/v1/admin/users/${id}`, {
    method: 'PUT',
    headers: authHeaders,
    body: JSON.stringify({
      password: user.password,
      email_confirm: true,
      user_metadata: { name: user.name },
    }),
  });
  const { ok, status, data } = await json(res);
  if (!ok) throw new Error(`updateUser failed ${status}: ${JSON.stringify(data)}`);
  return id;
}

async function upsertPublicUser(id, u) {
  const now = new Date();
  const future = new Date(now);
  future.setFullYear(now.getFullYear() + 5);

  const row = {
    id,
    email: u.email,
    name: u.name,
    role: u.role,
    subscription_tier: u.tier,
    subscription_status: 'active',
    subscription_ends_at: future.toISOString(),
    trial_used: true,
    post_trial: false,
  };

  const res = await fetch(`${URL}/rest/v1/users?on_conflict=id`, {
    method: 'POST',
    headers: {
      ...authHeaders,
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify(row),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`upsert public.users failed ${res.status}: ${body}`);
  }

  // Re-assert status=active via PATCH, because an `on insert` trigger on
  // public.users resets newly-inserted rows to 'trial' even when we upsert
  // with 'active'. PATCH hits the row post-trigger so the value sticks.
  const patch = await fetch(
    `${URL}/rest/v1/users?id=eq.${encodeURIComponent(id)}`,
    {
      method: 'PATCH',
      headers: {
        ...authHeaders,
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        subscription_status: 'active',
        subscription_tier: u.tier,
        role: u.role,
        trial_used: true,
        post_trial: false,
      }),
    },
  );
  if (!patch.ok) {
    const body = await patch.text();
    console.warn(`  • post-insert PATCH warning ${patch.status}: ${body}`);
  }
}

async function upsertSubscription(id) {
  const now = new Date();
  const future = new Date(now);
  future.setFullYear(now.getFullYear() + 5);

  const row = {
    user_id: id,
    status: 'active',
    current_period_start: now.toISOString(),
    current_period_end: future.toISOString(),
    cancel_at_period_end: false,
  };

  const res = await fetch(`${URL}/rest/v1/user_subscriptions?on_conflict=user_id`, {
    method: 'POST',
    headers: {
      ...authHeaders,
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify(row),
  });
  if (!res.ok) {
    const body = await res.text();
    console.warn(`  • user_subscriptions upsert warning ${res.status}: ${body}`);
  }
}

async function main() {
  for (const u of SEED_USERS) {
    console.log(`\n→ ${u.email} (${u.role}, ${u.tier})`);

    const existing = await findUserByEmail(u.email);
    let id;
    if (existing) {
      console.log(`  • exists ${existing.id} — resetting password + metadata`);
      id = await updateUser(existing.id, u);
    } else {
      console.log('  • creating');
      id = await createUser(u);
    }

    await upsertPublicUser(id, u);
    await upsertSubscription(id);
    console.log(`  ✓ ${u.email} ready (id=${id})`);
  }

  console.log('\nAll seed users up to date.\n');
  for (const u of SEED_USERS) {
    console.log(`  ${u.role.padEnd(5)} — ${u.email} / ${u.password}`);
  }
  console.log();
}

main().catch((err) => {
  console.error('\n[seed] Fatal:', err);
  process.exit(1);
});
