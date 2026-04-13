-- 041_normalizer_cache.sql
-- Normalizer resolution cache for O(1) lookups

CREATE TABLE IF NOT EXISTS upsc_input_normalizations (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  raw_input         text NOT NULL,
  raw_input_hash    text NOT NULL,
  resolved_subject  text,
  resolved_topic    text,
  resolved_subtopic text,
  node_id           uuid REFERENCES knowledge_nodes(id) ON DELETE SET NULL,
  method            text NOT NULL CHECK (method IN ('exact','fuzzy','ai')),
  confidence        float NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  created_at        timestamptz DEFAULT now()
);

-- Hash is md5 of lowercased, trimmed input — computed by application layer
CREATE UNIQUE INDEX IF NOT EXISTS normalizer_cache_hash_idx
  ON upsc_input_normalizations(raw_input_hash);

CREATE INDEX IF NOT EXISTS normalizer_cache_subject_idx
  ON upsc_input_normalizations(resolved_subject);
