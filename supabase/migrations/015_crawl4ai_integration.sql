-- ═══════════════════════════════════════════════════════════════
-- CRAWL4AI INTEGRATION
-- Migration: 015_crawl4ai_integration.sql
-- Enhances current_affairs table for web scraping
-- ═══════════════════════════════════════════════════════════════

-- Add crawl metadata columns
ALTER TABLE current_affairs ADD COLUMN IF NOT EXISTS crawl_metadata JSONB DEFAULT '{}'::jsonb;
ALTER TABLE current_affairs ADD COLUMN IF NOT EXISTS content_hash VARCHAR(64);
ALTER TABLE current_affairs ADD COLUMN IF NOT EXISTS last_crawled_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE current_affairs ADD COLUMN IF NOT EXISTS crawl_source VARCHAR(100);

-- Create index for deduplication
CREATE INDEX IF NOT EXISTS idx_current_affairs_hash ON current_affairs(content_hash);
CREATE INDEX IF NOT EXISTS idx_current_affairs_crawl_source ON current_affairs(crawl_source);

-- Function to generate content hash
CREATE OR REPLACE FUNCTION generate_content_hash(p_content TEXT)
RETURNS VARCHAR(64) AS $$
BEGIN
  RETURN encode(digest(p_content, 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to check for duplicate content
CREATE OR REPLACE FUNCTION check_duplicate_content(p_hash VARCHAR(64))
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM current_affairs 
    WHERE content_hash = p_hash 
    AND created_at > NOW() - INTERVAL '7 days'
  );
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate content hash
CREATE OR REPLACE FUNCTION set_content_hash()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.full_content IS NOT NULL THEN
    NEW.content_hash = generate_content_hash(NEW.full_content);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_content_hash ON current_affairs;
CREATE TRIGGER trigger_set_content_hash
  BEFORE INSERT OR UPDATE ON current_affairs
  FOR EACH ROW
  EXECUTE FUNCTION set_content_hash();

-- Create crawl statistics view
CREATE OR REPLACE VIEW crawl_statistics AS
SELECT 
  crawl_source,
  COUNT(*) as total_articles,
  MAX(last_crawled_at) as last_crawl,
  COUNT(DISTINCT DATE(created_at)) as days_active,
  AVG(LENGTH(full_content)) as avg_content_length
FROM current_affairs
WHERE crawl_source IS NOT NULL
GROUP BY crawl_source
ORDER BY total_articles DESC;

-- ═══════════════════════════════════════════════════════════════
-- END OF MIGRATION 015
-- ═══════════════════════════════════════════════════════════════
