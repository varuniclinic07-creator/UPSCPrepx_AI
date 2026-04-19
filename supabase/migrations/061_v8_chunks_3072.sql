-- 061_v8_chunks_3072.sql
-- Repoint v8_knowledge_chunks.embedding from 1536-dim (OpenAI text-embedding-3-small)
-- to 3072-dim (9Router gemini/gemini-embedding-2-preview).
--
-- Safe: no production data in v8_knowledge_chunks yet (Phase-1, never ingested
-- real traffic). If re-run later against a populated table, TRUNCATE first —
-- pgvector ALTER TYPE on non-empty column will fail.

-- Drop IVFFlat index (tied to old dimension).
DROP INDEX IF EXISTS v8_chunks_embed_idx;

-- Drop RPC that signatures 1536-dim; recreated below at 3072.
DROP FUNCTION IF EXISTS v8_match_chunks(vector, int, text, text);

-- Wipe any stale rows (dev-only data) so ALTER TYPE can succeed.
TRUNCATE TABLE v8_knowledge_chunks;

ALTER TABLE v8_knowledge_chunks
  ALTER COLUMN embedding TYPE vector(3072);

-- IVFFlat currently caps at 2000-dim in pgvector; at 3072 we must use HNSW
-- (supports up to 2000 for ivfflat, but HNSW handles 3072). If HNSW not
-- available, fall back to no ANN index — exact search still works, just
-- slower at scale. Phase-1 volumes are tiny (<10k chunks), exact is fine.
DO $$
BEGIN
  BEGIN
    EXECUTE 'CREATE INDEX v8_chunks_embed_idx ON v8_knowledge_chunks
             USING hnsw (embedding vector_cosine_ops)';
  EXCEPTION WHEN others THEN
    -- HNSW unavailable on this pgvector version; exact search only.
    RAISE NOTICE 'HNSW unavailable, skipping ANN index on v8_knowledge_chunks';
  END;
END $$;

-- Recreate RPC at 3072-dim.
CREATE OR REPLACE FUNCTION v8_match_chunks(
  query_embedding vector(3072),
  match_count int,
  topic_filter text DEFAULT NULL,
  source_type_filter text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  source_id text,
  topic_id text,
  source_type text,
  chunk_text text,
  meta jsonb,
  similarity float
)
LANGUAGE sql STABLE AS $$
  SELECT id, source_id, topic_id, source_type, chunk_text, meta,
         1 - (embedding <=> query_embedding) AS similarity
  FROM v8_knowledge_chunks
  WHERE (topic_filter IS NULL OR topic_id = topic_filter)
    AND (source_type_filter IS NULL OR source_type = source_type_filter)
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;
