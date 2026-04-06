-- ============================================
-- UPSC Content Crawler - Supabase Schema
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Main content table
CREATE TABLE IF NOT EXISTS upsc_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Source Information
    url TEXT NOT NULL,
    source_name TEXT NOT NULL,
    category TEXT NOT NULL,
    priority INTEGER NOT NULL,
    update_frequency TEXT NOT NULL,
    
    -- Content
    html_content TEXT,
    markdown_content TEXT NOT NULL,
    cleaned_content TEXT,
    
    -- Metadata
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Timestamps
    crawled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    
    -- Indexes for search
    search_vector TSVECTOR,
    
    UNIQUE(url, crawled_at)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_upsc_content_url ON upsc_content(url);
CREATE INDEX IF NOT EXISTS idx_upsc_content_category ON upsc_content(category);
CREATE INDEX IF NOT EXISTS idx_upsc_content_crawled_at ON upsc_content(crawled_at DESC);
CREATE INDEX IF NOT EXISTS idx_upsc_content_source_name ON upsc_content(source_name);
CREATE INDEX IF NOT EXISTS idx_upsc_content_priority ON upsc_content(priority);
CREATE INDEX IF NOT EXISTS idx_upsc_content_is_active ON upsc_content(is_active);

-- GIN index for JSONB metadata
CREATE INDEX IF NOT EXISTS idx_upsc_content_metadata ON upsc_content USING GIN(metadata);

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_upsc_content_search ON upsc_content USING GIN(search_vector);

-- Function to update search vector
CREATE OR REPLACE FUNCTION update_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('english', COALESCE(NEW.source_name, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.cleaned_content, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.markdown_content, '')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update search vector
CREATE TRIGGER upsc_content_search_vector_update
    BEFORE INSERT OR UPDATE OF source_name, cleaned_content, markdown_content
    ON upsc_content
    FOR EACH ROW
    EXECUTE FUNCTION update_search_vector();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER upsc_content_updated_at
    BEFORE UPDATE ON upsc_content
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Crawl Log Table (for monitoring)
-- ============================================

CREATE TABLE IF NOT EXISTS crawl_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Crawl Information
    source_name TEXT NOT NULL,
    url TEXT NOT NULL,
    status TEXT NOT NULL, -- 'success', 'failed', 'blocked'
    
    -- Details
    error_message TEXT,
    response_time_ms INTEGER,
    content_size_bytes INTEGER,
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Timestamp
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for crawl logs
CREATE INDEX IF NOT EXISTS idx_crawl_logs_created_at ON crawl_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crawl_logs_status ON crawl_logs(status);
CREATE INDEX IF NOT EXISTS idx_crawl_logs_source ON crawl_logs(source_name);

-- ============================================
-- Content Quality Table (for verification)
-- ============================================

CREATE TABLE IF NOT EXISTS content_quality (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_id UUID REFERENCES upsc_content(id) ON DELETE CASCADE,
    
    -- Quality Metrics
    relevance_score FLOAT,
    completeness_score FLOAT,
    freshness_score FLOAT,
    accuracy_score FLOAT,
    overall_score FLOAT,
    
    -- Verification
    verified_by TEXT,
    verification_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for content quality
CREATE INDEX IF NOT EXISTS idx_content_quality_content_id ON content_quality(content_id);
CREATE INDEX IF NOT EXISTS idx_content_quality_overall_score ON content_quality(overall_score DESC);

-- ============================================
-- Content Tags Table (for categorization)
-- ============================================

CREATE TABLE IF NOT EXISTS content_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_id UUID REFERENCES upsc_content(id) ON DELETE CASCADE,
    tag TEXT NOT NULL,
    tag_type TEXT, -- 'topic', 'subtopic', 'keyword', 'ministry', etc.
    confidence FLOAT DEFAULT 1.0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for tags
CREATE INDEX IF NOT EXISTS idx_content_tags_content_id ON content_tags(content_id);
CREATE INDEX IF NOT EXISTS idx_content_tags_tag ON content_tags(tag);
CREATE INDEX IF NOT EXISTS idx_content_tags_type ON content_tags(tag_type);

-- ============================================
-- Useful Views
-- ============================================

-- View for latest content by source
CREATE OR REPLACE VIEW latest_content_by_source AS
SELECT DISTINCT ON (source_name)
    id,
    source_name,
    url,
    category,
    crawled_at,
    metadata->>'word_count' as word_count
FROM upsc_content
WHERE is_active = TRUE
ORDER BY source_name, crawled_at DESC;

-- View for daily content summary
CREATE OR REPLACE VIEW daily_content_summary AS
SELECT 
    DATE(crawled_at) as date,
    category,
    COUNT(*) as content_count,
    AVG((metadata->>'word_count')::integer) as avg_word_count,
    SUM((metadata->>'word_count')::integer) as total_words
FROM upsc_content
WHERE is_active = TRUE
GROUP BY DATE(crawled_at), category
ORDER BY date DESC, category;

-- View for crawl statistics
CREATE OR REPLACE VIEW crawl_statistics AS
SELECT 
    DATE(created_at) as date,
    status,
    COUNT(*) as count,
    AVG(response_time_ms) as avg_response_time,
    SUM(content_size_bytes) as total_size_bytes
FROM crawl_logs
GROUP BY DATE(created_at), status
ORDER BY date DESC, status;

-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS
ALTER TABLE upsc_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE crawl_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_quality ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_tags ENABLE ROW LEVEL SECURITY;

-- Policy for public read access to active content
CREATE POLICY "Public read access to active content" 
    ON upsc_content FOR SELECT 
    USING (is_active = TRUE);

-- Policy for service role full access (for crawler)
CREATE POLICY "Service role full access" 
    ON upsc_content FOR ALL 
    USING (auth.role() = 'service_role');

-- Similar policies for other tables
CREATE POLICY "Service role logs access" 
    ON crawl_logs FOR ALL 
    USING (auth.role() = 'service_role');

CREATE POLICY "Service role quality access" 
    ON content_quality FOR ALL 
    USING (auth.role() = 'service_role');

CREATE POLICY "Service role tags access" 
    ON content_tags FOR ALL 
    USING (auth.role() = 'service_role');

-- ============================================
-- Functions for Content Management
-- ============================================

-- Function to search content
CREATE OR REPLACE FUNCTION search_content(search_query TEXT, limit_count INTEGER DEFAULT 20)
RETURNS TABLE (
    id UUID,
    source_name TEXT,
    category TEXT,
    url TEXT,
    markdown_content TEXT,
    crawled_at TIMESTAMPTZ,
    rank REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.source_name,
        c.category,
        c.url,
        c.markdown_content,
        c.crawled_at,
        ts_rank(c.search_vector, plainto_tsquery('english', search_query)) as rank
    FROM upsc_content c
    WHERE c.is_active = TRUE
        AND c.search_vector @@ plainto_tsquery('english', search_query)
    ORDER BY rank DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get content by category and date range
CREATE OR REPLACE FUNCTION get_content_by_category_date(
    cat TEXT,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
    id UUID,
    source_name TEXT,
    url TEXT,
    markdown_content TEXT,
    crawled_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.source_name,
        c.url,
        c.markdown_content,
        c.crawled_at
    FROM upsc_content c
    WHERE c.is_active = TRUE
        AND c.category = cat
        AND c.crawled_at BETWEEN start_date AND end_date
    ORDER BY c.crawled_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup old content (keep last 6 months)
CREATE OR REPLACE FUNCTION cleanup_old_content()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    WITH deleted AS (
        DELETE FROM upsc_content
        WHERE crawled_at < NOW() - INTERVAL '6 months'
            AND is_verified = FALSE
        RETURNING *
    )
    SELECT COUNT(*) INTO deleted_count FROM deleted;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Comments
-- ============================================

COMMENT ON TABLE upsc_content IS 'Main table storing all crawled UPSC content';
COMMENT ON TABLE crawl_logs IS 'Logs of all crawl attempts for monitoring';
COMMENT ON TABLE content_quality IS 'Quality metrics and verification status for content';
COMMENT ON TABLE content_tags IS 'Tags and categorization for content items';

COMMENT ON COLUMN upsc_content.search_vector IS 'Full-text search vector for fast searching';
COMMENT ON COLUMN upsc_content.metadata IS 'JSON metadata including hash, word count, etc.';
