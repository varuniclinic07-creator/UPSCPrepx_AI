-- 051_raw_input_hash_generated.sql
-- Convert raw_input_hash from application-computed to DB-generated column
-- Spec: GENERATED ALWAYS AS (md5(lower(trim(raw_input)))) STORED

-- Step 1: Drop the unique index on the old column
DROP INDEX IF EXISTS normalizer_cache_hash_idx;

-- Step 2: Drop the old plain-text column
ALTER TABLE upsc_input_normalizations DROP COLUMN IF EXISTS raw_input_hash;

-- Step 3: Add as a generated column (Postgres 12+)
ALTER TABLE upsc_input_normalizations
  ADD COLUMN raw_input_hash text GENERATED ALWAYS AS (md5(lower(trim(raw_input)))) STORED;

-- Step 4: Recreate the unique index
CREATE UNIQUE INDEX normalizer_cache_hash_idx
  ON upsc_input_normalizations(raw_input_hash);
