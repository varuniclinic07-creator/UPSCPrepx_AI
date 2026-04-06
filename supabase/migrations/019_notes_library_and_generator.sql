-- BMAD Phase 4: Feature 10 - Notes Library & Agentic Notes Generator
-- Migration: 019_notes_library_and_generator.sql
-- Date: 2026-04-05
-- Description: Ready-to-use notes library (like Unacademy) + AI-powered notes generation with Agentic Intelligence
-- AI Providers: 9Router → Groq → Ollama (NOT A4F)

-- ============ NOTES LIBRARY (Ready-to-Use Notes) ============

-- Notes Library: Pre-existing notes users can browse immediately (like Unacademy)
CREATE TABLE IF NOT EXISTS notes_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(500) NOT NULL,
  topic VARCHAR(500) NOT NULL,
  subject VARCHAR(100) NOT NULL CHECK (subject IN ('GS1', 'GS2', 'GS3', 'GS4', 'CSAT', 'Essay', 'Prelims', 'Optional')),
  sub_subject VARCHAR(100),
  content_markdown TEXT NOT NULL,
  content_html TEXT,
  brevity_level VARCHAR(50) DEFAULT 'comprehensive' CHECK (brevity_level IN ('100', '250', '500', '1000', 'comprehensive')),
  word_count INTEGER,
  pdf_url TEXT,
  thumbnail_url TEXT,
  views_count INTEGER DEFAULT 0,
  downloads_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  is_premium BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT true,
  has_manim_diagrams BOOLEAN DEFAULT false,
  has_video_summary BOOLEAN DEFAULT false,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notes tags (many-to-many)
CREATE TABLE IF NOT EXISTS notes_tags (
  note_id UUID REFERENCES notes_library(id) ON DELETE CASCADE,
  tag VARCHAR(100) NOT NULL,
  PRIMARY KEY (note_id, tag)
);

-- Notes syllabus mapping
CREATE TABLE IF NOT EXISTS notes_syllabus_mapping (
  note_id UUID REFERENCES notes_library(id) ON DELETE CASCADE,
  syllabus_code VARCHAR(100) NOT NULL,
  syllabus_topic TEXT,
  PRIMARY KEY (note_id, syllabus_code)
);

-- Notes sources/citations (critical for accuracy)
CREATE TABLE IF NOT EXISTS notes_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID REFERENCES notes_library(id) ON DELETE CASCADE,
  source_name VARCHAR(255) NOT NULL,
  source_url TEXT,
  source_type VARCHAR(50) CHECK (source_type IN ('ncert', 'standard_book', 'government', 'coaching', 'current_affairs', 'report')),
  page_number INTEGER,
  chapter VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User bookmarks for notes
CREATE TABLE IF NOT EXISTS user_notes_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  note_id UUID REFERENCES notes_library(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, note_id)
);

-- User notes likes
CREATE TABLE IF NOT EXISTS user_notes_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  note_id UUID REFERENCES notes_library(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, note_id)
);

-- ============ USER GENERATED NOTES (Agentic Intelligence) ============

-- User Generated Notes (using Agentic Intelligence)
CREATE TABLE IF NOT EXISTS user_generated_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  topic VARCHAR(500) NOT NULL,
  brevity_level VARCHAR(50) DEFAULT 'comprehensive',
  content_markdown TEXT,
  content_html TEXT,
  pdf_url TEXT,
  status VARCHAR(50) DEFAULT 'processing' CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
  agentic_sources JSONB, -- Track which agentic systems were used
  ai_provider_used VARCHAR(100), -- Which AI provider generated this (9Router/Groq/Ollama)
  word_count INTEGER,
  has_manim_diagrams BOOLEAN DEFAULT false,
  has_video_summary BOOLEAN DEFAULT false,
  processing_started_at TIMESTAMP WITH TIME ZONE,
  processing_completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notes generation queue (for tracking async generation)
CREATE TABLE IF NOT EXISTS notes_generation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  topic VARCHAR(500) NOT NULL,
  brevity_level VARCHAR(50),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  priority INTEGER DEFAULT 0,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  agentic_systems_used JSONB,
  result_note_id UUID REFERENCES user_generated_notes(id),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- ============ ADMIN: MATERIALS LIBRARY ============

-- Admin: Static Materials Library (for agentic file search)
CREATE TABLE IF NOT EXISTS admin_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(500) NOT NULL,
  subject VARCHAR(100),
  category VARCHAR(100),
  file_type VARCHAR(50) CHECK (file_type IN ('pdf', 'docx', 'txt', 'epub', 'markdown')),
  file_url TEXT NOT NULL,
  file_size_bytes BIGINT,
  page_count INTEGER,
  description TEXT,
  is_standard BOOLEAN DEFAULT true, -- Standard material (primary source)
  is_reference BOOLEAN DEFAULT false, -- Reference material (supplementary)
  is_active BOOLEAN DEFAULT true,
  uploaded_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Materials tags
CREATE TABLE IF NOT EXISTS admin_materials_tags (
  material_id UUID REFERENCES admin_materials(id) ON DELETE CASCADE,
  tag VARCHAR(100) NOT NULL,
  PRIMARY KEY (material_id, tag)
);

-- ============ ADMIN: AI PROVIDER MANAGER ============

-- Admin: AI Provider Configuration (9Router → Groq → Ollama)
CREATE TABLE IF NOT EXISTS admin_ai_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_name VARCHAR(100) NOT NULL UNIQUE,
  provider_type VARCHAR(50) CHECK (provider_type IN ('cloud', 'local', 'hybrid')),
  base_url TEXT NOT NULL,
  api_key_encrypted TEXT,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0, -- Lower number = higher priority (9Router=1, Groq=2, Ollama=3)
  rate_limit_rpm INTEGER,
  rate_limit_concurrent INTEGER,
  default_model VARCHAR(100),
  config JSONB DEFAULT '{}',
  last_tested_at TIMESTAMP WITH TIME ZONE,
  is_healthy BOOLEAN DEFAULT true,
  health_check_error TEXT,
  total_requests INTEGER DEFAULT 0,
  failed_requests INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI Provider models
CREATE TABLE IF NOT EXISTS admin_ai_provider_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES admin_ai_providers(id) ON DELETE CASCADE,
  model_name VARCHAR(100) NOT NULL,
  model_display_name VARCHAR(255),
  max_tokens INTEGER,
  supports_vision BOOLEAN DEFAULT false,
  supports_function_calling BOOLEAN DEFAULT false,
  cost_per_1k_tokens DECIMAL(10,6),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============ ADMIN: CONTENT RULES ENGINE ============

-- Admin: Content Rules (accuracy, syllabus alignment, language)
CREATE TABLE IF NOT EXISTS admin_content_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name VARCHAR(255) NOT NULL,
  rule_type VARCHAR(50) CHECK (rule_type IN ('allowed_source', 'blocked_source', 'keyword_filter', 'syllabus_mapping', 'language_level', 'fact_check')),
  rule_config JSONB NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  applies_to TEXT[] DEFAULT '{notes,quiz,current_affairs}',
  priority INTEGER DEFAULT 0,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin: Feature Controls (enable/disable any feature)
CREATE TABLE IF NOT EXISTS admin_feature_controls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_name VARCHAR(100) NOT NULL UNIQUE,
  feature_display_name VARCHAR(255),
  is_enabled BOOLEAN DEFAULT true,
  is_visible BOOLEAN DEFAULT true,
  maintenance_mode BOOLEAN DEFAULT false,
  maintenance_message TEXT,
  limits_by_plan JSONB DEFAULT '{}',
  config JSONB DEFAULT '{}',
  updated_by UUID REFERENCES users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============ INDEXES ============

-- Notes Library indexes
CREATE INDEX IF NOT EXISTS notes_library_subject_idx ON notes_library(subject);
CREATE INDEX IF NOT EXISTS notes_library_topic_idx ON notes_library USING GIN(to_tsvector('english', topic));
CREATE INDEX IF NOT EXISTS notes_library_content_idx ON notes_library USING GIN(to_tsvector('english', content_markdown));
CREATE INDEX IF NOT EXISTS notes_library_published_idx ON notes_library(is_published) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS notes_library_premium_idx ON notes_library(is_premium);
CREATE INDEX IF NOT EXISTS notes_library_created_at_idx ON notes_library(created_at DESC);

-- Notes tags index
CREATE INDEX IF NOT EXISTS notes_tags_idx ON notes_tags(tag);

-- User bookmarks index
CREATE INDEX IF NOT EXISTS user_notes_bookmarks_user_idx ON user_notes_bookmarks(user_id);

-- User generated notes index
CREATE INDEX IF NOT EXISTS user_generated_notes_user_idx ON user_generated_notes(user_id);
CREATE INDEX IF NOT EXISTS user_generated_notes_status_idx ON user_generated_notes(status);

-- Admin materials indexes
CREATE INDEX IF NOT EXISTS admin_materials_subject_idx ON admin_materials(subject);
CREATE INDEX IF NOT EXISTS admin_materials_active_idx ON admin_materials(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS admin_materials_tags_idx ON admin_materials_tags(tag);

-- AI Providers index
CREATE INDEX IF NOT EXISTS admin_ai_providers_priority_idx ON admin_ai_providers(priority) WHERE is_active = true AND is_healthy = true;

-- Content rules index
CREATE INDEX IF NOT EXISTS admin_content_rules_type_idx ON admin_content_rules(rule_type);
CREATE INDEX IF NOT EXISTS admin_content_rules_active_idx ON admin_content_rules(is_active) WHERE is_active = true;

-- Feature controls index
CREATE INDEX IF NOT EXISTS admin_feature_controls_enabled_idx ON admin_feature_controls(is_enabled) WHERE is_enabled = true;

-- ============ ROW LEVEL SECURITY (RLS) ============

ALTER TABLE notes_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes_syllabus_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notes_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notes_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_generated_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes_generation_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_materials_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_ai_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_ai_provider_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_content_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_feature_controls ENABLE ROW LEVEL SECURITY;

-- Notes Library: Public read for published notes
CREATE POLICY "notes_library_public_read" ON notes_library
  FOR SELECT 
  USING (is_published = true);

-- Notes Library: Authenticated users can insert (via API)
CREATE POLICY "notes_library_auth_insert" ON notes_library
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

-- Notes Library: Only creators/admins can update
CREATE POLICY "notes_library_user_update" ON notes_library
  FOR UPDATE 
  USING (auth.uid() = created_by OR auth.jwt()->>'role' = 'admin');

-- User bookmarks: Users can manage their own
CREATE POLICY "user_notes_bookmarks_user" ON user_notes_bookmarks
  FOR ALL 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- User likes: Users can manage their own
CREATE POLICY "user_notes_likes_user" ON user_notes_likes
  FOR ALL 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- User generated notes: Users can read their own
CREATE POLICY "user_generated_notes_user_read" ON user_generated_notes
  FOR SELECT 
  USING (auth.uid() = user_id OR auth.jwt()->>'role' = 'admin');

-- User generated notes: Users can insert their own
CREATE POLICY "user_generated_notes_user_insert" ON user_generated_notes
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Generation queue: Users can read their own
CREATE POLICY "notes_generation_queue_user_read" ON notes_generation_queue
  FOR SELECT 
  USING (auth.uid() = user_id OR auth.jwt()->>'role' = 'admin');

-- Generation queue: Users can insert their own
CREATE POLICY "notes_generation_queue_user_insert" ON notes_generation_queue
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Admin materials: Public read for active materials
CREATE POLICY "admin_materials_public_read" ON admin_materials
  FOR SELECT 
  USING (is_active = true);

-- Admin materials: Only admins can modify
CREATE POLICY "admin_materials_admin_write" ON admin_materials
  FOR ALL 
  USING (auth.jwt()->>'role' = 'admin')
  WITH CHECK (auth.jwt()->>'role' = 'admin');

-- AI Providers: Only admins can access
CREATE POLICY "admin_ai_providers_admin" ON admin_ai_providers
  FOR ALL 
  USING (auth.jwt()->>'role' = 'admin')
  WITH CHECK (auth.jwt()->>'role' = 'admin');

-- Content Rules: Public read for active rules
CREATE POLICY "admin_content_rules_public_read" ON admin_content_rules
  FOR SELECT 
  USING (is_active = true);

-- Content Rules: Only admins can modify
CREATE POLICY "admin_content_rules_admin_write" ON admin_content_rules
  FOR ALL 
  USING (auth.jwt()->>'role' = 'admin')
  WITH CHECK (auth.jwt()->>'role' = 'admin');

-- Feature Controls: Public read
CREATE POLICY "admin_feature_controls_public_read" ON admin_feature_controls
  FOR SELECT 
  USING (true);

-- Feature Controls: Only admins can modify
CREATE POLICY "admin_feature_controls_admin_write" ON admin_feature_controls
  FOR ALL 
  USING (auth.jwt()->>'role' = 'admin')
  WITH CHECK (auth.jwt()->>'role' = 'admin');

-- ============ FUNCTIONS ============

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_notes_library_updated_at
  BEFORE UPDATE ON notes_library
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_materials_updated_at
  BEFORE UPDATE ON admin_materials
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_ai_providers_updated_at
  BEFORE UPDATE ON admin_ai_providers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_content_rules_updated_at
  BEFORE UPDATE ON admin_content_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_feature_controls_updated_at
  BEFORE UPDATE ON admin_feature_controls
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_note_views(note_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE notes_library 
  SET views_count = views_count + 1 
  WHERE id = note_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment download count
CREATE OR REPLACE FUNCTION increment_note_downloads(note_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE notes_library 
  SET downloads_count = downloads_count + 1 
  WHERE id = note_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to toggle like
CREATE OR REPLACE FUNCTION toggle_note_like(note_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  is_liked BOOLEAN;
BEGIN
  IF EXISTS (SELECT 1 FROM user_notes_likes WHERE user_id = auth.uid() AND note_id = toggle_note_like.note_id) THEN
    -- Unlike
    DELETE FROM user_notes_likes WHERE user_id = auth.uid() AND note_id = toggle_note_like.note_id;
    UPDATE notes_library SET likes_count = GREATEst(0, likes_count - 1) WHERE id = note_id;
    is_liked := false;
  ELSE
    -- Like
    INSERT INTO user_notes_likes (user_id, note_id) VALUES (auth.uid(), note_id);
    UPDATE notes_library SET likes_count = likes_count + 1 WHERE id = note_id;
    is_liked := true;
  END IF;
  RETURN is_liked;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============ SEED DATA: AI PROVIDERS (9Router → Groq → Ollama) ============

-- Insert AI Provider configuration (CRITICAL: NOT A4F)
INSERT INTO admin_ai_providers (provider_name, provider_type, base_url, priority, is_active, is_healthy, default_model, rate_limit_rpm, rate_limit_concurrent) VALUES
  ('9router', 'cloud', 'https://r94p885.9router.com/v1', 1, true, true, 'upsc', 60, 20),
  ('groq', 'cloud', 'https://api.groq.com/openai/v1', 2, true, true, 'groq/llama-3.3-70b-versatile', 30, 10),
  ('ollama', 'cloud', 'https://ollama.com/v1', 3, true, true, 'qwen3.5:397b-cloud', 20, 5)
ON CONFLICT (provider_name) DO UPDATE SET
  base_url = EXCLUDED.base_url,
  priority = EXCLUDED.priority,
  default_model = EXCLUDED.default_model;

-- ============ SEED DATA: FEATURE CONTROLS ============

INSERT INTO admin_feature_controls (feature_name, feature_display_name, is_enabled, is_visible, config) VALUES
  ('notes_library', 'Notes Library', true, true, '{"free_limit": 5, "premium_limit": -1}'),
  ('notes_generator', 'AI Notes Generator', true, true, '{"free_limit": 3, "premium_limit": -1}'),
  ('pdf_export', 'PDF Export', true, true, '{"free_limit": 2, "premium_limit": -1}'),
  ('manim_diagrams', 'Manim Diagrams', true, false, '{"premium_only": true}'),
  ('video_summary', 'Video Summary', true, false, '{"premium_only": true}')
ON CONFLICT (feature_name) DO UPDATE SET
  feature_display_name = EXCLUDED.feature_display_name;

-- ============ SEED DATA: CONTENT RULES ============

-- Allowed sources for notes generation
INSERT INTO admin_content_rules (rule_name, rule_type, rule_config, description, applies_to) VALUES
  ('Allowed Sources - NCERT', 'allowed_source', '{"sources": ["ncert", "government", "standard_book"]}', 'NCERT and government sources are always allowed', '{notes}'),
  ('Allowed Sources - Standard Books', 'allowed_source', '{"sources": ["laxmikanth", "spectrum", "ncert", "economic_survey"]}', 'Standard UPSC books are allowed', '{notes}'),
  ('Language Level', 'language_level', '{"grade_level": 10, "max_sentence_length": 25}', 'Content should be at 10th standard reading level', '{notes,quiz}'),
  ('Required Citations', 'fact_check', '{"require_citations": true, "min_sources": 1}', 'All notes must have at least one citation', '{notes}')
ON CONFLICT DO NOTHING;

-- ============ COMMENTS ============

COMMENT ON TABLE notes_library IS 'Ready-to-use notes library (like Unacademy) - users can browse and download immediately';
COMMENT ON TABLE user_generated_notes IS 'Notes generated by users using Agentic Intelligence (9Router → Groq → Ollama)';
COMMENT ON TABLE admin_materials IS 'Static materials library for agentic file search - uploaded by admins';
COMMENT ON TABLE admin_ai_providers IS 'AI Provider configuration - Priority: 9Router(1) → Groq(2) → Ollama(3), NOT A4F';
COMMENT ON TABLE admin_content_rules IS 'Content accuracy rules - syllabus alignment, language level, citations';
COMMENT ON TABLE admin_feature_controls IS 'Feature toggle system - enable/disable any app feature';

-- ============ MIGRATION COMPLETE ============

SELECT 'Migration 019: Notes Library & Agentic Notes Generator completed successfully' as status;
