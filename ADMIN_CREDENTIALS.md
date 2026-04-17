# Admin & Test Credentials

> Internal only. Do not share outside the core team. These are bootstrap
> credentials created by `scripts/seed-admin-and-test-users.ts` so you can
> log in to the live deployment, exercise the admin panel, and smoke-test
> premium-gated features end-to-end.

---

## URLs

| Target          | URL                                                         |
| --------------- | ----------------------------------------------------------- |
| Production app  | `https://upscbyvarunsh.aimasteryedu.in`                     |
| Login           | `https://upscbyvarunsh.aimasteryedu.in/login`               |
| Dashboard       | `https://upscbyvarunsh.aimasteryedu.in/dashboard`           |
| Admin panel     | `https://upscbyvarunsh.aimasteryedu.in/admin`               |
| Admin dashboard | `https://upscbyvarunsh.aimasteryedu.in/admin/dashboard`     |
| Hermes agents   | `https://upscbyvarunsh.aimasteryedu.in/admin/hermes`        |
| Supabase studio | `https://supabase.com/dashboard/project/emotqkukvfwjycvwfvyj` |

If you're running locally:

| Target           | URL                                      |
| ---------------- | ---------------------------------------- |
| App (dev)        | `http://localhost:3000`                  |
| Admin (dev)      | `http://localhost:3000/admin`            |

---

## Accounts

### Platform admin (super-user)

| Field    | Value                                |
| -------- | ------------------------------------ |
| Email    | `admin@upscprepx.ai`                 |
| Password | `AdminChanakya2026!`                 |
| Role     | `admin` (full access, RLS bypass)    |
| Tier     | `premium_plus`                       |
| Scope    | All admin routes (`/admin/**`)       |

What this account can do:

- Read/write every table via RLS admin policies.
- Access `/admin`: user management, AI provider console, content queue,
  Hermes job feed, subscription overrides, audit log.
- Trigger cron endpoints manually.
- Override subscription tiers on any account.

### Test premium user (demo journey)

| Field    | Value                                     |
| -------- | ----------------------------------------- |
| Email    | `test-premium@upscprepx.ai`               |
| Password | `TestPremium2026!`                        |
| Role     | `user`                                    |
| Tier     | `premium_plus`                            |
| Scope    | All paid features; no admin access        |

Use this account to verify:

- Premium feature unlocks (video lectures, mains evaluation, mindmaps, etc.).
- PDF exports without the free-tier watermark.
- Personalized planner generation.
- The full onboarding-to-streak progression without admin entitlements.

---

## How to (re)provision these accounts

```bash
# 1. Export service-role credentials (NEVER commit these):
export SUPABASE_URL=https://emotqkukvfwjycvwfvyj.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=<service-role-key-from-supabase-dashboard>

# 2. Run the idempotent seed script:
npx tsx scripts/seed-admin-and-test-users.ts
```

The script:

1. Creates the auth user if missing, or resets the password if it already
   exists (so these passwords are authoritative after every run).
2. Upserts the row in `public.users` with `role`, `subscription_tier`,
   `subscription_status`, and a 5-year `subscription_ends_at`.
3. Upserts an active row in `public.user_subscriptions` to keep the
   entitlement middleware happy.

Run it again any time a teammate forgets the password — passwords reset
cleanly without losing the underlying user IDs, saved notes, quiz
history, or any other user-scoped data.

---

## Rotation reminder

These are **shared test credentials** and must be rotated before any
production launch that admits external users. When you rotate:

1. Edit `SEED_USERS` in `scripts/seed-admin-and-test-users.ts`.
2. Re-run the script.
3. Update this file.
4. Rotate any CI / pen-test automation that references the old values.
