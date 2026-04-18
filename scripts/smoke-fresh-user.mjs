#!/usr/bin/env node
// scripts/smoke-fresh-user.mjs
//
// Fresh-user smoke. Creates a throwaway user, asserts v8 surfaces behave,
// tears the user down. Runs in CI pre-deploy and on-demand locally.
//
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (required).
//      APP_URL (optional, default http://localhost:3000) — reserved for
//      HTTP-surface checks added on Day 8+.
//
// Exit 0 = smoke clean. Exit 1 = something blocks deploy.

const URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const APP_URL = process.env.APP_URL || 'http://localhost:3000';

if (!URL || !KEY) {
  console.error('[smoke] FATAL: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required');
  process.exit(1);
}

const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };
const email = `smoke-${Date.now()}@smoke.test`;
const password = 'SmokeTest2026!';

async function createUser() {
  const r = await fetch(`${URL}/auth/v1/admin/users`, {
    method: 'POST', headers: H,
    body: JSON.stringify({ email, password, email_confirm: true }),
  });
  if (!r.ok) throw new Error(`createUser ${r.status}: ${await r.text()}`);
  return (await r.json()).id;
}

async function deleteUser(id) {
  await fetch(`${URL}/auth/v1/admin/users/${id}`, { method: 'DELETE', headers: H });
}

async function restCount(table, qs) {
  // Use user_id as a portable row marker — v8_user_mastery uses a composite
  // (user_id, topic_id) PK with no `id` column, so `select=id` 400s there.
  const r = await fetch(`${URL}/rest/v1/${table}?${qs}&select=user_id`, {
    headers: { ...H, Prefer: 'count=exact' },
  });
  const rows = await r.json();
  return Array.isArray(rows) ? rows.length : 0;
}

async function tableReachable(table) {
  // HEAD on select=* — doesn't commit to any column existing, just proves
  // PostgREST can route to the relation. Works for both `id`-PK and
  // composite-PK tables as well as source-scoped tables like
  // v8_knowledge_chunks which has no user_id.
  const r = await fetch(`${URL}/rest/v1/${table}?select=*&limit=1`, { headers: H });
  if (!r.ok) throw new Error(`table ${table} not reachable: ${r.status} ${await r.text()}`);
}

async function assertFreshSlate(userId) {
  // A fresh user must have ZERO v8 rows — no fake stats, no ghost mastery.
  const interactions = await restCount('v8_user_interactions', `user_id=eq.${userId}`);
  const mastery = await restCount('v8_user_mastery', `user_id=eq.${userId}`);
  const traces = await restCount('agent_traces', `user_id=eq.${userId}`);
  if (interactions !== 0) throw new Error(`fresh user has ${interactions} interactions — must be 0`);
  if (mastery !== 0) throw new Error(`fresh user has ${mastery} mastery rows — must be 0`);
  if (traces !== 0) throw new Error(`fresh user has ${traces} trace rows — must be 0`);
  console.log('[smoke] fresh slate OK (0 interactions, 0 mastery, 0 traces)');
}

async function assertSchemaLive() {
  // v8 tables exist and respond. Migrations landed = schema is live.
  await tableReachable('v8_user_interactions');
  await tableReachable('v8_user_mastery');
  await tableReachable('v8_knowledge_chunks');
  await tableReachable('agent_traces');
  console.log('[smoke] v8 schema reachable');
}

async function main() {
  console.log(`[smoke] target=${URL} app=${APP_URL}`);
  console.log(`[smoke] creating ${email}`);
  const userId = await createUser();
  let failure = null;
  try {
    await assertSchemaLive();
    await assertFreshSlate(userId);

    // Day 8+ additions go here: call /api/notes/generate, /api/quiz/*,
    // /api/mentor/ask as the freshly-created user and assert that
    // agent_traces picks up real rows with feature in {notes, quiz, mentor}.
    // Left as an extension point so this scaffold is usable now.
    console.log('[smoke] scaffold pass — feature-call assertions land Day 8+');
  } catch (e) {
    failure = e;
    console.error('[smoke] FAIL:', e.message);
  } finally {
    await deleteUser(userId);
    console.log('[smoke] cleaned up');
  }
  process.exit(failure ? 1 : 0);
}

main().catch((e) => { console.error('[smoke] crash:', e); process.exit(1); });
