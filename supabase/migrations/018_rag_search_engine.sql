-- BMAD Phase 4: Feature 18 - RAG-based Perfect UPSC Search Engine
-- Migration: 018_rag_search_engine.sql
-- Date: 2026-04-05
-- Description: Enable vector search across UPSC content with source citations

-- Enable pgvector extension for semantic search
CREATE EXTENSION IF NOT EXISTS vector;

-- Search index table: Core table for RAG search
CREATE TABLE IF NOT EXISTS search_index (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL,
  content_type VARCHAR(50) NOT NULL CHECK (content_type IN ('note', 'article', 'video', 'quiz', 'current_affairs', 'scheme', 'book_chapter')),
  title TEXT NOT NULL,
  content_text TEXT NOT NULL,
  embedding vector(1536),
  source VARCHAR(100),
  source_url TEXT,
  book_reference JSONB CHECK (book_reference IS NULL OR jsonb_typeof(book_reference) = 'object'),
  syllabus_tags TEXT[],
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Search history: Track user searches (premium feature)
CREATE TABLE IF NOT EXISTS search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  filters JSONB,
  results_count INTEGER,
  search_time_ms INTEGER,
  clicked_result_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Saved searches: Allow users to save important searches (premium feature)
CREATE TABLE IF NOT EXISTS saved_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  query TEXT NOT NULL,
  filters JSONB,
  last_results_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Search analytics: Track search performance and usage
CREATE TABLE IF NOT EXISTS search_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query TEXT NOT NULL,
  results_count INTEGER,
  search_time_ms INTEGER,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for vector similarity search (cosine similarity)
-- Using ivfflat for efficient approximate nearest neighbor search
CREATE INDEX IF NOT EXISTS search_index_embedding_idx 
ON search_index USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Create index for full-text search (fallback when vector search not needed)
CREATE INDEX IF NOT EXISTS search_index_content_text_idx 
ON search_index USING GIN (to_tsvector('english', content_text));

-- Create index for syllabus tags (array overlap queries)
CREATE INDEX IF NOT EXISTS search_index_syllabus_tags_idx 
ON search_index USING GIN (syllabus_tags);

-- Create index for content type filtering
CREATE INDEX IF NOT EXISTS search_index_content_type_idx 
ON search_index USING btree (content_type);

-- Create index for source filtering
CREATE INDEX IF NOT EXISTS search_index_source_idx 
ON search_index USING btree (source);

-- Create index for search history by user
CREATE INDEX IF NOT EXISTS search_history_user_id_idx 
ON search_history USING btree (user_id);

-- Create index for search history by date
CREATE INDEX IF NOT EXISTS search_history_created_at_idx 
ON search_history USING btree (created_at);

-- Create index for saved searches by user
CREATE INDEX IF NOT EXISTS saved_searches_user_id_idx 
ON saved_searches USING btree (user_id);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE search_index ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_analytics ENABLE ROW LEVEL SECURITY;

-- Search Index Policies
-- Public read access (content is indexed from public sources)
CREATE POLICY "search_index_public_read" ON search_index
  FOR SELECT 
  USING (true);

-- Only authenticated users can insert/update search index (via API)
CREATE POLICY "search_index_auth_insert" ON search_index
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "search_index_auth_update" ON search_index
  FOR UPDATE 
  USING (auth.role() = 'authenticated');

CREATE POLICY "search_index_auth_delete" ON search_index
  FOR DELETE 
  USING (auth.role() = 'authenticated');

-- Search History Policies
-- Users can read their own search history
CREATE POLICY "search_history_user_read" ON search_history
  FOR SELECT 
  USING (auth.uid() = user_id OR auth.uid() IS NULL);

-- Users can insert their own search history
CREATE POLICY "search_history_user_insert" ON search_history
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL);

-- Users can delete their own search history
CREATE POLICY "search_history_user_delete" ON search_history
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Saved Searches Policies
-- Users can read their own saved searches
CREATE POLICY "saved_searches_user_read" ON saved_searches
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Users can insert their own saved searches
CREATE POLICY "saved_searches_user_insert" ON saved_searches
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own saved searches
CREATE POLICY "saved_searches_user_update" ON saved_searches
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Users can delete their own saved searches
CREATE POLICY "saved_searches_user_delete" ON saved_searches
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Search Analytics Policies
-- Public read for aggregated analytics
CREATE POLICY "search_analytics_public_read" ON search_analytics
  FOR SELECT 
  USING (true);

-- Authenticated users can insert analytics
CREATE POLICY "search_analytics_auth_insert" ON search_analytics
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for search_index updated_at
CREATE TRIGGER update_search_index_updated_at
  BEFORE UPDATE ON search_index
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for saved_searches updated_at
CREATE TRIGGER update_saved_searches_updated_at
  BEFORE UPDATE ON saved_searches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to generate embedding for search content
-- This will be called from the API when indexing content
CREATE OR REPLACE FUNCTION generate_search_embedding(content_text TEXT)
RETURNS vector(1536) AS $$
DECLARE
  embedding vector(1536);
BEGIN
  -- Note: Actual embedding generation happens in API via AI service
  -- This is a placeholder for future database function integration
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to search content with vector similarity
CREATE OR REPLACE FUNCTION search_content(
  query_embedding vector(1536),
  filter_sources TEXT[] DEFAULT NULL,
  filter_content_types TEXT[] DEFAULT NULL,
  filter_syllabus_tags TEXT[] DEFAULT NULL,
  limit_results INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content_text TEXT,
  source VARCHAR,
  source_url TEXT,
  book_reference JSONB,
  syllabus_tags TEXT[],
  content_type VARCHAR,
  similarity FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    si.id,
    si.title,
    si.content_text,
    si.source,
    si.source_url,
    si.book_reference,
    si.syllabus_tags,
    si.content_type,
    1 - (si.embedding <=> query_embedding) as similarity
  FROM search_index si
  WHERE 1=1
    AND (filter_sources IS NULL OR si.source = ANY(filter_sources))
    AND (filter_content_types IS NULL OR si.content_type = ANY(filter_content_types))
    AND (filter_syllabus_tags IS NULL OR si.syllabus_tags && filter_syllabus_tags)
  ORDER BY si.embedding <=> query_embedding
  LIMIT limit_results;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on search function to authenticated users
GRANT EXECUTE ON FUNCTION search_content TO authenticated;

-- Comment documenting the migration
COMMENT ON TABLE search_index IS 'RAG search index for UPSC content with vector embeddings for semantic search';
COMMENT ON TABLE search_history IS 'User search history for premium features and analytics';
COMMENT ON TABLE saved_searches IS 'Saved searches for premium users to track important queries';
COMMENT ON TABLE search_analytics IS 'Search performance analytics and usage tracking';
COMMENT ON FUNCTION search_content IS 'Search content using vector similarity with optional filters';

-- Insert initial analytics event
INSERT INTO search_analytics (query, results_count, search_time_ms)
VALUES ('migration_018_completed', 0, 0);

-- Migration complete
SELECT 'Migration 018: RAG Search Engine completed successfully' as status;
