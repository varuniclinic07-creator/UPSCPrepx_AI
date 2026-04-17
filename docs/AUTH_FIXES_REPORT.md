# Auth Fixes Implementation Report

**Date:** 2026-04-17
**Scope:** Fix two production auth failures reported by the user.

---

## Problems reported

1. **Email/password login fails with** `"Database error querying schema"` on the
   production site (`https://upscbyvarunsh.aimasteryedu.in/`).
2. **Google OAuth redirects to** `https://0.0.0.0:3000/login?error=...` which
   browsers reject with `ERR_ADDRESS_INVALID`.

---

## 1. `Database error querying schema`

### Root cause

Supabase auth logs showed:

```
error finding user: sql: Scan error on column index 8, name "email_change":
converting NULL to string is unsupported
```

GoTrue (the Go-based Supabase Auth service) scans several `auth.users` text
columns into a Go `string` rather than `sql.NullString`. Any row with `NULL`
in those columns causes the entire `/token` request to 500, which surfaces to
the client as the generic `Database error querying schema`.

Affected columns: `email_change`, `email_change_token_new`,
`email_change_token_current`, `phone_change`, `phone_change_token`,
`confirmation_token`, `recovery_token`, `reauthentication_token`.

Audit showed 2 of 3 `auth.users` rows had `NULL` in `email_change`,
`email_change_token_new`, and `recovery_token`.

### Fix

`UPDATE auth.users SET <col> = COALESCE(<col>, '')` for all affected columns.
GoTrue itself writes empty strings (never NULL) for new users, so this is safe.

- **Applied immediately** via Supabase SQL execution (verified: 0 NULLs remain).
- **Tracked in migration** `supabase/migrations/053_fix_auth_users_null_tokens.sql`
  so the fix survives restores and applies to any dev branch.

---

## 2. Google OAuth `0.0.0.0:3000` redirect

### Root cause

Two code paths both fell back to a hostname that bound as `0.0.0.0`:

1. `getAppUrl()` in `src/lib/utils/url-validator.ts` returned
   `window.location.origin` in dev — if the dev server was reached via
   `0.0.0.0:3000`, the OAuth `redirectTo` became `http://0.0.0.0:3000/auth/callback`.
2. `/auth/callback/route.ts` used `new URL(request.url).origin` to build the
   post-error redirect to `/login`, inheriting the same bad host from the
   Host header.

`0.0.0.0` is a valid *bind* address for a server but not a routable *client*
address — browsers reject it with `ERR_ADDRESS_INVALID`.

### Fix

- `src/lib/utils/url-validator.ts` — added `normalizeBrowserUrl()` which
  rewrites `0.0.0.0`, `::`, and `[::]` hostnames to `localhost`. Applied to
  every return path of `getAppUrl()`.
- `src/app/auth/callback/route.ts` — added `resolveRedirectOrigin()` which
  prefers `NEXT_PUBLIC_APP_URL` / `NEXTAUTH_URL` (validated for placeholders),
  falling back to the request origin with the same `0.0.0.0 → localhost`
  rewrite. All redirect URLs in the callback now use this normalized origin.

---

## Files changed

| File | Change |
|------|--------|
| `supabase/migrations/053_fix_auth_users_null_tokens.sql` | **New** — documents and tracks the NULL-token fix |
| `src/lib/utils/url-validator.ts` | Added `normalizeBrowserUrl()`; applied to `getAppUrl()` return paths |
| `src/app/auth/callback/route.ts` | Added `resolveRedirectOrigin()`; use it instead of raw `request.url` origin |

No DB schema changes. No environment variable changes.

---

## Verification

- **Login error:** `SELECT COUNT(*) FROM auth.users WHERE email_change IS NULL` → 0 (was 2). Test user email/password sign-in should now succeed.
- **OAuth redirect:** Even if dev server is reached via `0.0.0.0:3000`, the Google flow's `redirectTo` and any error redirect will now use `localhost:3000`. In production the env-driven `NEXT_PUBLIC_APP_URL` / Coolify URL takes priority (unchanged behavior).

---

## Still outstanding (from the same user message)

- **UI gap analysis:** User provided 5 reference UI images + 1 ZIP at `C:\Users\DR-VARUNI\Downloads\WhatsApp Image 2026-04-17 at 8.49.*` and 7 built-UI screenshots at `C:\Users\DR-VARUNI\Downloads\WhatsApp Image 2026-04-17 at 8.52.*` for visual comparison. Not covered in this report — auth errors were fixed first because they block all users.
