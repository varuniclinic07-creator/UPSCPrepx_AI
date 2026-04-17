-- 053_fix_auth_users_null_tokens.sql
--
-- Fixes GoTrue error: `error finding user: sql: Scan error on column index 8,
-- name "email_change": converting NULL to string is unsupported` which surfaces
-- to the client as "500: Database error querying schema" during sign-in.
--
-- Root cause: Supabase/GoTrue scans several auth.users text columns into Go
-- `string` (not `sql.NullString`). Rows with NULL in any of these columns cause
-- the entire /token request to fail. These columns are semantically empty
-- strings; GoTrue itself writes '' (not NULL) for newly created users. Any
-- pre-existing NULLs (usually from manual imports or old migrations) must be
-- normalized.
--
-- Safe because GoTrue treats '' and NULL equivalently for these fields.

UPDATE auth.users SET
  email_change                = COALESCE(email_change, ''),
  email_change_token_new      = COALESCE(email_change_token_new, ''),
  email_change_token_current  = COALESCE(email_change_token_current, ''),
  phone_change                = COALESCE(phone_change, ''),
  phone_change_token          = COALESCE(phone_change_token, ''),
  confirmation_token          = COALESCE(confirmation_token, ''),
  recovery_token              = COALESCE(recovery_token, ''),
  reauthentication_token      = COALESCE(reauthentication_token, '')
WHERE
     email_change               IS NULL
  OR email_change_token_new     IS NULL
  OR email_change_token_current IS NULL
  OR phone_change               IS NULL
  OR phone_change_token         IS NULL
  OR confirmation_token         IS NULL
  OR recovery_token             IS NULL
  OR reauthentication_token     IS NULL;
