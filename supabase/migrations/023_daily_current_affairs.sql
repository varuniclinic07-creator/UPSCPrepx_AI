-- Migration 023: Daily Current Affairs Digest
-- Master Prompt v8.0 - Feature F2 (READ Mode)
-- Creates tables for daily CA digest, articles, syllabus mapping, MCQs, user tracking
-- Date: 2026-04-06

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm; -- For fuzzy text matching

-- ============================================================================
-- TABLE 1: daily_ca_digest
-- ============================================================================
CREATE TABLE IF NOT EXISTS daily_ca_digest (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date UNIQUE NOT NULL, -- The digest date
  title text NOT NULL, -- "Daily Current Affairs - 06 April 2026"
  summary text, -- Brief overview
  article_count integer DEFAULT 0, -- Number of articles
  is_published boolean DEFAULT false, -- Published status
  published_at timestamptz, -- When published (5:00 AM IST)
  generated_at timestamptz, -- When generated (4:30 AM IST)
  pdf_url text, -- Compiled PDF download
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index for fast date queries
CREATE INDEX idx_daily_ca_digest_date ON daily_ca_digest(date DESC);
CREATE INDEX idx_daily_ca_digest_published ON daily_ca_digest(is_published) WHERE is_published = true;

-- ============================================================================
-- TABLE 2: ca_sources (Whitelisted sources)
-- ============================================================================
CREATE TABLE IF NOT EXISTS ca_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE, -- Source name
  url text NOT NULL, -- Base URL
  rss_feed_url text, -- RSS feed if available
  api_endpoint text, -- API URL if available
  category text CHECK (category IN ('government', 'newspaper', 'magazine', 'broadcast')),
  is_active boolean DEFAULT true,
  priority integer CHECK (priority BETWEEN 1 AND 5), -- 1=highest
  last_crawled_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Seed whitelisted sources
INSERT INTO ca_sources (name, url, rss_feed_url, category, priority, is_active) VALUES
  ('Press Information Bureau', 'https://pib.gov.in', 'https://pib.gov.in/rss.aspx', 'government', 1, true),
  ('PRS Legislative', 'https://prsindia.org', NULL, 'government', 1, true),
  ('The Hindu', 'https://thehindu.com', 'https://thehindu.com/news/national/feeder/default.rss', 'newspaper', 2, true),
  ('Indian Express', 'https://indianexpress.com', 'https://indianexpress.com/section/india/feed/', 'newspaper', 2, true),
  ('All India Radio', 'https://allindiaradio.gov.in', NULL, 'broadcast', 2, true),
  ('Down To Earth', 'https://downtoearth.org.in', NULL, 'magazine', 3, true)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- TABLE 3: ca_articles (Individual articles)
-- ============================================================================
CREATE TABLE IF NOT EXISTS ca_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  digest_id uuid REFERENCES daily_ca_digest(id) ON DELETE CASCADE,
  source_id uuid REFERENCES ca_sources(id),
  title text NOT NULL, -- Article title
  title_hindi text, -- Hindi translation
  summary text, -- AI summary (English)
  summary_hindi text, -- AI summary (Hindi)
  full_content text, -- Full article text
  url text, -- Original source URL
  image_url text, -- Article thumbnail
  category text, -- Polity, Economy, Environment, etc.
  importance integer CHECK (importance BETWEEN 1 AND 5), -- 1-5 stars (AI determined)
  word_count integer,
  read_time_min integer, -- Estimated reading time
  is_published boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes for fast queries
CREATE INDEX idx_ca_articles_digest_id ON ca_articles(digest_id);
CREATE INDEX idx_ca_articles_source_id ON ca_articles(source_id);
CREATE INDEX idx_ca_articles_category ON ca_articles(category);
CREATE INDEX idx_ca_articles_importance ON ca_articles(importance DESC);
CREATE INDEX idx_ca_articles_published ON ca_articles(is_published) WHERE is_published = true;
CREATE INDEX idx_ca_articles_created ON ca_articles(created_at DESC);

-- Full-text search indexes
CREATE INDEX idx_ca_articles_title_fts ON ca_articles USING gin(to_tsvector('english', title));
CREATE INDEX idx_ca_articles_summary_fts ON ca_articles USING gin(to_tsvector('english', summary));

-- ============================================================================
-- TABLE 4: ca_syllabus_mapping (Article to UPSC syllabus links)
-- ============================================================================
CREATE TABLE IF NOT EXISTS ca_syllabus_mapping (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid REFERENCES ca_articles(id) ON DELETE CASCADE,
  syllabus_node_id uuid, -- References syllabus_nodes table
  subject text CHECK (subject IN ('GS1', 'GS2', 'GS3', 'GS4', 'Essay')),
  topic text NOT NULL, -- Specific topic name
  relevance_score integer CHECK (relevance_score BETWEEN 0 AND 100),
  created_at timestamptz DEFAULT now()
);

-- Indexes for fast filtering
CREATE INDEX idx_ca_syllabus_article_id ON ca_syllabus_mapping(article_id);
CREATE INDEX idx_ca_syllabus_subject ON ca_syllabus_mapping(subject);
CREATE INDEX idx_ca_syllabus_node_id ON ca_syllabus_mapping(syllabus_node_id);
CREATE INDEX idx_ca_syllabus_relevance ON ca_syllabus_mapping(relevance_score DESC);

-- ============================================================================
-- TABLE 5: ca_mcqs (Practice questions per article)
-- ============================================================================
CREATE TABLE IF NOT EXISTS ca_mcqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid REFERENCES ca_articles(id) ON DELETE CASCADE,
  question text NOT NULL, -- MCQ question
  question_hindi text, -- Hindi translation
  options jsonb NOT NULL, -- [{text, text_hindi, is_correct}]
  correct_answer integer CHECK (correct_answer BETWEEN 0 AND 3), -- Index of correct option
  explanation text, -- Why this answer (English)
  explanation_hindi text, -- Hindi explanation
  difficulty text CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
  bloom_taxonomy text CHECK (bloom_taxonomy IN ('Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create')),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_ca_mcqs_article_id ON ca_mcqs(article_id);
CREATE INDEX idx_ca_mcqs_difficulty ON ca_mcqs(difficulty);
CREATE INDEX idx_ca_mcqs_active ON ca_mcqs(is_active) WHERE is_active = true;

-- ============================================================================
-- TABLE 6: ca_user_reads (User reading tracking)
-- ============================================================================
CREATE TABLE IF NOT EXISTS ca_user_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  article_id uuid REFERENCES ca_articles(id) ON DELETE CASCADE,
  is_read boolean DEFAULT false,
  read_at timestamptz,
  time_spent_sec integer DEFAULT 0, -- Time spent reading
  is_bookmarked boolean DEFAULT false,
  bookmarked_at timestamptz,
  rating integer CHECK (rating BETWEEN 1 AND 5), -- User rating
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, article_id) -- One read record per user per article
);

-- Indexes for user queries
CREATE INDEX idx_ca_user_reads_user_id ON ca_user_reads(user_id);
CREATE INDEX idx_ca_user_reads_article_id ON ca_user_reads(article_id);
CREATE INDEX idx_ca_user_reads_bookmarked ON ca_user_reads(is_bookmarked) WHERE is_bookmarked = true;
CREATE INDEX idx_ca_user_reads_read_at ON ca_user_reads(read_at DESC);

-- ============================================================================
-- TABLE 7: ca_quiz_attempts (User MCQ attempts)
-- ============================================================================
CREATE TABLE IF NOT EXISTS ca_quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  mcq_id uuid REFERENCES ca_mcqs(id) ON DELETE CASCADE,
  selected_answer integer CHECK (selected_answer BETWEEN 0 AND 3), -- User's choice
  is_correct boolean,
  time_taken_sec integer, -- Time taken to answer
  attempted_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Indexes for analytics
CREATE INDEX idx_ca_quiz_attempts_user_id ON ca_quiz_attempts(user_id);
CREATE INDEX idx_ca_quiz_attempts_mcq_id ON ca_quiz_attempts(mcq_id);
CREATE INDEX idx_ca_quiz_attempts_correct ON ca_quiz_attempts(is_correct);
CREATE INDEX idx_ca_quiz_attempts_attempted_at ON ca_quiz_attempts(attempted_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE daily_ca_digest ENABLE ROW LEVEL SECURITY;
ALTER TABLE ca_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE ca_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ca_syllabus_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE ca_mcqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ca_user_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE ca_quiz_attempts ENABLE ROW LEVEL SECURITY;

-- daily_ca_digest: Anyone can read published digests
CREATE POLICY "Anyone can read published digests"
ON daily_ca_digest FOR SELECT
USING (is_published = true OR EXISTS (
  SELECT 1 FROM user_profiles up
  WHERE up.id = auth.uid() AND up.is_admin = true
));

-- ca_sources: Admins can manage, anyone can read active
CREATE POLICY "Anyone can read active sources"
ON ca_sources FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage sources"
ON ca_sources FOR ALL
USING (EXISTS (
  SELECT 1 FROM user_profiles up
  WHERE up.id = auth.uid() AND up.is_admin = true
));

-- ca_articles: Anyone can read published articles
CREATE POLICY "Anyone can read published articles"
ON ca_articles FOR SELECT
USING (
  is_published = true OR
  EXISTS (
    SELECT 1 FROM daily_ca_digest d
    WHERE d.id = ca_articles.digest_id AND d.is_published = true
  ) OR
  EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.id = auth.uid() AND up.is_admin = true
  )
);

-- ca_syllabus_mapping: Anyone can read
CREATE POLICY "Anyone can read syllabus mapping"
ON ca_syllabus_mapping FOR SELECT
USING (true);

-- ca_mcqs: Anyone can read active MCQs
CREATE POLICY "Anyone can read active MCQs"
ON ca_mcqs FOR SELECT
USING (is_active = true);

-- ca_user_reads: Users can only see their own data
CREATE POLICY "Users can only see own reads"
ON ca_user_reads FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reads"
ON ca_user_reads FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reads"
ON ca_user_reads FOR UPDATE
USING (auth.uid() = user_id);

-- ca_quiz_attempts: Users can only see their own attempts
CREATE POLICY "Users can only see own attempts"
ON ca_quiz_attempts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own attempts"
ON ca_quiz_attempts FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- View: Today's published articles with syllabus mapping
CREATE OR REPLACE VIEW v_today_ca_articles AS
SELECT
  a.id,
  a.title,
  a.title_hindi,
  a.summary,
  a.summary_hindi,
  a.image_url,
  a.importance,
  a.read_time_min,
  a.category,
  s.name as source_name,
  json_agg(
    json_build_object(
      'subject', sm.subject,
      'topic', sm.topic,
      'relevance_score', sm.relevance_score
    )
  ) as syllabus_mapping,
  (SELECT count(*) FROM ca_mcqs m WHERE m.article_id = a.id AND m.is_active = true) as mcq_count
FROM ca_articles a
LEFT JOIN ca_sources s ON a.source_id = s.id
LEFT JOIN ca_syllabus_mapping sm ON a.id = sm.article_id
INNER JOIN daily_ca_digest d ON a.digest_id = d.id
WHERE d.date = CURRENT_DATE
  AND a.is_published = true
GROUP BY a.id, s.name
ORDER BY a.importance DESC, a.created_at DESC;

-- View: User's reading progress for today
CREATE OR REPLACE VIEW v_user_today_progress AS
SELECT
  ur.user_id,
  count(*) FILTER (WHERE ur.is_read = true) as articles_read,
  count(*) FILTER (WHERE ur.is_bookmarked = true) as articles_bookmarked,
  count(*) as total_articles,
  round(count(*) FILTER (WHERE ur.is_read = true) * 100.0 / count(*), 2) as progress_percentage
FROM ca_user_reads ur
INNER JOIN ca_articles a ON ur.article_id = a.id
INNER JOIN daily_ca_digest d ON a.digest_id = d.id
WHERE d.date = CURRENT_DATE
GROUP BY ur.user_id;

-- View: User's MCQ performance stats
CREATE OR REPLACE VIEW v_user_mcq_stats AS
SELECT
  user_id,
  count(*) as total_attempts,
  count(*) FILTER (WHERE is_correct = true) as correct_answers,
  round(count(*) FILTER (WHERE is_correct = true) * 100.0 / count(*), 2) as accuracy_percentage,
  avg(time_taken_sec) as avg_time_per_question,
  max(attempted_at) as last_attempt_at
FROM ca_quiz_attempts
GROUP BY user_id;

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function: Get article with full details
CREATE OR REPLACE FUNCTION get_ca_article_full(article_id uuid)
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'id', a.id,
    'title', a.title,
    'title_hindi', a.title_hindi,
    'summary', a.summary,
    'summary_hindi', a.summary_hindi,
    'full_content', a.full_content,
    'image_url', a.image_url,
    'category', a.category,
    'importance', a.importance,
    'read_time_min', a.read_time_min,
    'source', s.name,
    'source_url', a.url,
    'syllabus_mapping', (
      SELECT json_agg(
        json_build_object(
          'subject', sm.subject,
          'topic', sm.topic,
          'relevance_score', sm.relevance_score
        )
      )
      FROM ca_syllabus_mapping sm
      WHERE sm.article_id = a.id
    ),
    'mcqs', (
      SELECT json_agg(
        json_build_object(
          'id', m.id,
          'question', m.question,
          'question_hindi', m.question_hindi,
          'options', m.options,
          'correct_answer', m.correct_answer,
          'explanation', m.explanation,
          'explanation_hindi', m.explanation_hindi,
          'difficulty', m.difficulty,
          'bloom_taxonomy', m.bloom_taxonomy
        )
      )
      FROM ca_mcqs m
      WHERE m.article_id = a.id AND m.is_active = true
    )
  ) INTO result
  FROM ca_articles a
  LEFT JOIN ca_sources s ON a.source_id = s.id
  WHERE a.id = article_id;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function: Mark article as read
CREATE OR REPLACE FUNCTION mark_article_as_read(
  p_article_id uuid,
  p_time_spent_sec integer DEFAULT 0
)
RETURNS void AS $$
BEGIN
  INSERT INTO ca_user_reads (user_id, article_id, is_read, read_at, time_spent_sec)
  VALUES (auth.uid(), p_article_id, true, now(), p_time_spent_sec)
  ON CONFLICT (user_id, article_id) DO UPDATE
  SET is_read = true,
      read_at = now(),
      time_spent_sec = GREATEST(ca_user_reads.time_spent_sec, p_time_spent_sec),
      updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Toggle bookmark
CREATE OR REPLACE FUNCTION toggle_article_bookmark(p_article_id uuid)
RETURNS boolean AS $$
DECLARE
  is_bookmarked boolean;
BEGIN
  INSERT INTO ca_user_reads (user_id, article_id, is_bookmarked, bookmarked_at)
  VALUES (auth.uid(), p_article_id, true, now())
  ON CONFLICT (user_id, article_id) DO UPDATE
  SET is_bookmarked = NOT ca_user_reads.is_bookmarked,
      bookmarked_at = CASE
        WHEN NOT ca_user_reads.is_bookmarked THEN now()
        ELSE ca_user_reads.bookmarked_at
      END,
      updated_at = now()
  RETURNING is_bookmarked INTO is_bookmarked;

  RETURN is_bookmarked;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Submit MCQ attempt
CREATE OR REPLACE FUNCTION submit_mcq_attempt(
  p_mcq_id uuid,
  p_selected_answer integer,
  p_time_taken_sec integer DEFAULT 0
)
RETURNS json AS $$
DECLARE
  v_correct_answer integer;
  v_is_correct boolean;
  v_attempt_id uuid;
BEGIN
  -- Get correct answer
  SELECT correct_answer INTO v_correct_answer
  FROM ca_mcqs
  WHERE id = p_mcq_id;

  v_is_correct := (p_selected_answer = v_correct_answer);

  -- Insert attempt
  INSERT INTO ca_quiz_attempts (user_id, mcq_id, selected_answer, is_correct, time_taken_sec)
  VALUES (auth.uid(), p_mcq_id, p_selected_answer, v_is_correct, p_time_taken_sec)
  RETURNING id INTO v_attempt_id;

  RETURN json_build_object(
    'attempt_id', v_attempt_id,
    'is_correct', v_is_correct,
    'correct_answer', v_correct_answer
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_daily_ca_digest_updated_at
  BEFORE UPDATE ON daily_ca_digest
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ca_sources_updated_at
  BEFORE UPDATE ON ca_sources
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ca_articles_updated_at
  BEFORE UPDATE ON ca_articles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ca_user_reads_updated_at
  BEFORE UPDATE ON ca_user_reads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE daily_ca_digest IS 'Daily current affairs digest compilations';
COMMENT ON TABLE ca_sources IS 'Whitelisted news sources (PIB, PRS, The Hindu, etc.)';
COMMENT ON TABLE ca_articles IS 'Individual current affairs articles with bilingual content';
COMMENT ON TABLE ca_syllabus_mapping IS 'Mapping between articles and UPSC syllabus topics';
COMMENT ON TABLE ca_mcqs IS 'Multiple choice questions for article practice';
COMMENT ON TABLE ca_user_reads IS 'User reading progress and bookmarks';
COMMENT ON TABLE ca_quiz_attempts IS 'User MCQ attempt history for analytics';

-- ============================================================================
-- END OF MIGRATION 023
-- ============================================================================
