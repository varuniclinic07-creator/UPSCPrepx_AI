-- 059_v8_knowledge_chunks.sql
-- Fresh v8 embeddings table for Knowledge Agent retrieval.
-- pgvector 1536-dim (text-embedding-3-small).

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS v8_knowledge_chunks (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id   text NOT NULL,
  topic_id    text,
  source_type text NOT NULL CHECK (source_type IN ('note','pyq','ca','user_pdf')),
  chunk_text  text NOT NULL,
  embedding   vector(1536) NOT NULL,
  meta        jsonb NOT NULL DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS v8_chunks_source_idx ON v8_knowledge_chunks(source_id);
CREATE INDEX IF NOT EXISTS v8_chunks_topic_idx  ON v8_knowledge_chunks(topic_id);
CREATE INDEX IF NOT EXISTS v8_chunks_embed_idx  ON v8_knowledge_chunks
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

ALTER TABLE v8_knowledge_chunks ENABLE ROW LEVEL SECURITY;
-- Service role bypass is intended access; no permissive policies needed.
