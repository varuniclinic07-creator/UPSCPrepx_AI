CREATE OR REPLACE FUNCTION v8_match_chunks(
  query_embedding vector(1536),
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
