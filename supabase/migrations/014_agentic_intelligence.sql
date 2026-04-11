-- ═══════════════════════════════════════════════════════════════════════════
-- AGENTIC INTELLIGENCE DATABASE SCHEMA
-- Migration: 014_agentic_intelligence.sql
-- Order: EXTENSION → CREATE TABLES → ALTER TABLES → INSERTS → INDEXES → RLS
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── 1. EXTENSION ────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS vector;

-- ─── 2. CREATE TABLES (no-ops if already exist) ──────────────────────────────

CREATE TABLE IF NOT EXISTS ai_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    provider_type VARCHAR(50) NOT NULL,
    api_base_url TEXT NOT NULL,
    api_key_encrypted TEXT,
    api_version VARCHAR(20),
    available_models JSONB DEFAULT '[]'::jsonb,
    default_model VARCHAR(100),
    rate_limit_rpm INTEGER DEFAULT 60,
    rate_limit_tpm INTEGER DEFAULT 100000,
    is_active BOOLEAN DEFAULT TRUE,
    is_default BOOLEAN DEFAULT FALSE,
    last_health_check TIMESTAMPTZ,
    health_status VARCHAR(20) DEFAULT 'unknown',
    total_requests INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    total_cost DECIMAL(10, 4) DEFAULT 0,
    extra_headers JSONB DEFAULT '{}'::jsonb,
    extra_params JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS static_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(20) NOT NULL,
    file_size INTEGER,
    file_url TEXT NOT NULL,
    subject VARCHAR(100) NOT NULL,
    category VARCHAR(100),
    tags TEXT[] DEFAULT '{}',
    author VARCHAR(255),
    publisher VARCHAR(255),
    edition VARCHAR(50),
    year INTEGER,
    is_processed BOOLEAN DEFAULT FALSE,
    processing_status VARCHAR(20) DEFAULT 'pending',
    processed_at TIMESTAMPTZ,
    chunk_count INTEGER DEFAULT 0,
    is_standard BOOLEAN DEFAULT FALSE,
    priority INTEGER DEFAULT 0,
    search_count INTEGER DEFAULT 0,
    last_searched_at TIMESTAMPTZ,
    uploaded_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS material_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    material_id UUID REFERENCES static_materials(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    chunk_index INTEGER NOT NULL,
    page_number INTEGER,
    section_title VARCHAR(255),
    chapter VARCHAR(255),
    embedding vector(1536),
    word_count INTEGER,
    has_table BOOLEAN DEFAULT FALSE,
    has_image BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS content_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    rule_type VARCHAR(50) NOT NULL,
    rule_config JSONB NOT NULL,
    applies_to TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    priority INTEGER DEFAULT 0,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS feature_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feature_id VARCHAR(100) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    is_enabled BOOLEAN DEFAULT TRUE,
    is_visible BOOLEAN DEFAULT TRUE,
    maintenance_mode BOOLEAN DEFAULT FALSE,
    maintenance_message TEXT,
    min_subscription_tier VARCHAR(20) DEFAULT 'trial',
    usage_limit_trial INTEGER,
    usage_limit_basic INTEGER,
    usage_limit_premium INTEGER,
    default_ai_provider VARCHAR(50),
    default_ai_model VARCHAR(100),
    fallback_ai_provider VARCHAR(50),
    preview_type VARCHAR(50),
    preview_content JSONB,
    preview_updated_at TIMESTAMPTZ,
    total_usage INTEGER DEFAULT 0,
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agentic_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query_hash VARCHAR(64) NOT NULL,
    query_text TEXT NOT NULL,
    source_type VARCHAR(50) NOT NULL,
    result_data JSONB NOT NULL,
    source_urls TEXT[],
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS upsc_syllabus (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paper VARCHAR(20) NOT NULL,
    subject VARCHAR(100) NOT NULL,
    topic VARCHAR(255) NOT NULL,
    subtopics TEXT[],
    keywords TEXT[],
    priority INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agentic_query_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    query TEXT NOT NULL,
    intent VARCHAR(50),
    services_used TEXT[],
    sources_count INTEGER DEFAULT 0,
    tokens_used INTEGER DEFAULT 0,
    response_time_ms INTEGER,
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 3. SCHEMA UPGRADES (add missing columns to pre-existing tables) ──────────

-- ai_providers
ALTER TABLE ai_providers ADD COLUMN IF NOT EXISTS name VARCHAR(100);
ALTER TABLE ai_providers ADD COLUMN IF NOT EXISTS slug VARCHAR(50);
ALTER TABLE ai_providers ADD COLUMN IF NOT EXISTS provider_type VARCHAR(50);
ALTER TABLE ai_providers ADD COLUMN IF NOT EXISTS api_base_url TEXT;
ALTER TABLE ai_providers ADD COLUMN IF NOT EXISTS api_key_encrypted TEXT;
ALTER TABLE ai_providers ADD COLUMN IF NOT EXISTS api_version VARCHAR(20);
ALTER TABLE ai_providers ADD COLUMN IF NOT EXISTS available_models JSONB DEFAULT '[]';
ALTER TABLE ai_providers ADD COLUMN IF NOT EXISTS default_model VARCHAR(100);
ALTER TABLE ai_providers ADD COLUMN IF NOT EXISTS rate_limit_rpm INTEGER DEFAULT 60;
ALTER TABLE ai_providers ADD COLUMN IF NOT EXISTS rate_limit_tpm INTEGER DEFAULT 100000;
ALTER TABLE ai_providers ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE ai_providers ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT FALSE;
ALTER TABLE ai_providers ADD COLUMN IF NOT EXISTS last_health_check TIMESTAMPTZ;
ALTER TABLE ai_providers ADD COLUMN IF NOT EXISTS health_status VARCHAR(20) DEFAULT 'unknown';
ALTER TABLE ai_providers ADD COLUMN IF NOT EXISTS total_requests INTEGER DEFAULT 0;
ALTER TABLE ai_providers ADD COLUMN IF NOT EXISTS total_tokens INTEGER DEFAULT 0;
ALTER TABLE ai_providers ADD COLUMN IF NOT EXISTS total_cost DECIMAL(10,4) DEFAULT 0;
ALTER TABLE ai_providers ADD COLUMN IF NOT EXISTS extra_headers JSONB DEFAULT '{}';
ALTER TABLE ai_providers ADD COLUMN IF NOT EXISTS extra_params JSONB DEFAULT '{}';
DO $$ BEGIN
  ALTER TABLE ai_providers ADD CONSTRAINT ai_providers_slug_key UNIQUE (slug);
EXCEPTION WHEN duplicate_object THEN null; WHEN duplicate_table THEN null; WHEN others THEN null; END $$;

-- static_materials
ALTER TABLE static_materials ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE static_materials ADD COLUMN IF NOT EXISTS file_name VARCHAR(255);
ALTER TABLE static_materials ADD COLUMN IF NOT EXISTS file_type VARCHAR(20);
ALTER TABLE static_materials ADD COLUMN IF NOT EXISTS file_size INTEGER;
ALTER TABLE static_materials ADD COLUMN IF NOT EXISTS file_url TEXT;
ALTER TABLE static_materials ADD COLUMN IF NOT EXISTS subject VARCHAR(100);
ALTER TABLE static_materials ADD COLUMN IF NOT EXISTS category VARCHAR(100);
ALTER TABLE static_materials ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE static_materials ADD COLUMN IF NOT EXISTS author VARCHAR(255);
ALTER TABLE static_materials ADD COLUMN IF NOT EXISTS publisher VARCHAR(255);
ALTER TABLE static_materials ADD COLUMN IF NOT EXISTS edition VARCHAR(50);
ALTER TABLE static_materials ADD COLUMN IF NOT EXISTS year INTEGER;
ALTER TABLE static_materials ADD COLUMN IF NOT EXISTS is_processed BOOLEAN DEFAULT FALSE;
ALTER TABLE static_materials ADD COLUMN IF NOT EXISTS processing_status VARCHAR(20) DEFAULT 'pending';
ALTER TABLE static_materials ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ;
ALTER TABLE static_materials ADD COLUMN IF NOT EXISTS chunk_count INTEGER DEFAULT 0;
ALTER TABLE static_materials ADD COLUMN IF NOT EXISTS is_standard BOOLEAN DEFAULT FALSE;
ALTER TABLE static_materials ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 0;
ALTER TABLE static_materials ADD COLUMN IF NOT EXISTS search_count INTEGER DEFAULT 0;
ALTER TABLE static_materials ADD COLUMN IF NOT EXISTS last_searched_at TIMESTAMPTZ;
ALTER TABLE static_materials ADD COLUMN IF NOT EXISTS uploaded_by UUID;

-- material_chunks
ALTER TABLE material_chunks ADD COLUMN IF NOT EXISTS material_id UUID;
ALTER TABLE material_chunks ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE material_chunks ADD COLUMN IF NOT EXISTS chunk_index INTEGER;
ALTER TABLE material_chunks ADD COLUMN IF NOT EXISTS page_number INTEGER;
ALTER TABLE material_chunks ADD COLUMN IF NOT EXISTS section_title VARCHAR(255);
ALTER TABLE material_chunks ADD COLUMN IF NOT EXISTS chapter VARCHAR(255);
ALTER TABLE material_chunks ADD COLUMN IF NOT EXISTS word_count INTEGER;
ALTER TABLE material_chunks ADD COLUMN IF NOT EXISTS has_table BOOLEAN DEFAULT FALSE;
ALTER TABLE material_chunks ADD COLUMN IF NOT EXISTS has_image BOOLEAN DEFAULT FALSE;

-- content_rules
ALTER TABLE content_rules ADD COLUMN IF NOT EXISTS name VARCHAR(100);
ALTER TABLE content_rules ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE content_rules ADD COLUMN IF NOT EXISTS rule_type VARCHAR(50);
ALTER TABLE content_rules ADD COLUMN IF NOT EXISTS rule_config JSONB;
ALTER TABLE content_rules ADD COLUMN IF NOT EXISTS applies_to TEXT[] DEFAULT '{}';
ALTER TABLE content_rules ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE content_rules ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 0;
ALTER TABLE content_rules ADD COLUMN IF NOT EXISTS created_by UUID;

-- feature_config
ALTER TABLE feature_config ADD COLUMN IF NOT EXISTS name VARCHAR(100);
ALTER TABLE feature_config ADD COLUMN IF NOT EXISTS feature_id VARCHAR(100);
ALTER TABLE feature_config ADD COLUMN IF NOT EXISTS display_name VARCHAR(100);
ALTER TABLE feature_config ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE feature_config ADD COLUMN IF NOT EXISTS icon VARCHAR(50);
ALTER TABLE feature_config ADD COLUMN IF NOT EXISTS is_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE feature_config ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT TRUE;
ALTER TABLE feature_config ADD COLUMN IF NOT EXISTS maintenance_mode BOOLEAN DEFAULT FALSE;
ALTER TABLE feature_config ADD COLUMN IF NOT EXISTS maintenance_message TEXT;
ALTER TABLE feature_config ADD COLUMN IF NOT EXISTS min_subscription_tier VARCHAR(20) DEFAULT 'trial';
ALTER TABLE feature_config ADD COLUMN IF NOT EXISTS usage_limit_trial INTEGER;
ALTER TABLE feature_config ADD COLUMN IF NOT EXISTS usage_limit_basic INTEGER;
ALTER TABLE feature_config ADD COLUMN IF NOT EXISTS usage_limit_premium INTEGER;
ALTER TABLE feature_config ADD COLUMN IF NOT EXISTS default_ai_provider VARCHAR(50);
ALTER TABLE feature_config ADD COLUMN IF NOT EXISTS default_ai_model VARCHAR(100);
ALTER TABLE feature_config ADD COLUMN IF NOT EXISTS fallback_ai_provider VARCHAR(50);
ALTER TABLE feature_config ADD COLUMN IF NOT EXISTS preview_type VARCHAR(50);
ALTER TABLE feature_config ADD COLUMN IF NOT EXISTS preview_content JSONB;
ALTER TABLE feature_config ADD COLUMN IF NOT EXISTS preview_updated_at TIMESTAMPTZ;
ALTER TABLE feature_config ADD COLUMN IF NOT EXISTS total_usage INTEGER DEFAULT 0;
ALTER TABLE feature_config ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMPTZ;
DO $$ BEGIN
  ALTER TABLE feature_config ALTER COLUMN name DROP NOT NULL;
EXCEPTION WHEN others THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE feature_config ADD CONSTRAINT feature_config_feature_id_key UNIQUE (feature_id);
EXCEPTION WHEN duplicate_object THEN null; WHEN duplicate_table THEN null; WHEN others THEN null; END $$;

-- agentic_cache
ALTER TABLE agentic_cache ADD COLUMN IF NOT EXISTS query_hash VARCHAR(64);
ALTER TABLE agentic_cache ADD COLUMN IF NOT EXISTS query_text TEXT;
ALTER TABLE agentic_cache ADD COLUMN IF NOT EXISTS source_type VARCHAR(50);
ALTER TABLE agentic_cache ADD COLUMN IF NOT EXISTS result_data JSONB;
ALTER TABLE agentic_cache ADD COLUMN IF NOT EXISTS source_urls TEXT[];
ALTER TABLE agentic_cache ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- upsc_syllabus
ALTER TABLE upsc_syllabus ADD COLUMN IF NOT EXISTS paper VARCHAR(20);
ALTER TABLE upsc_syllabus ADD COLUMN IF NOT EXISTS subject VARCHAR(100);
ALTER TABLE upsc_syllabus ADD COLUMN IF NOT EXISTS topic VARCHAR(255);
ALTER TABLE upsc_syllabus ADD COLUMN IF NOT EXISTS subtopics TEXT[];
ALTER TABLE upsc_syllabus ADD COLUMN IF NOT EXISTS keywords TEXT[];
ALTER TABLE upsc_syllabus ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 0;

-- agentic_query_logs
ALTER TABLE agentic_query_logs ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE agentic_query_logs ADD COLUMN IF NOT EXISTS query TEXT;
ALTER TABLE agentic_query_logs ADD COLUMN IF NOT EXISTS intent VARCHAR(50);
ALTER TABLE agentic_query_logs ADD COLUMN IF NOT EXISTS services_used TEXT[];
ALTER TABLE agentic_query_logs ADD COLUMN IF NOT EXISTS sources_count INTEGER DEFAULT 0;
ALTER TABLE agentic_query_logs ADD COLUMN IF NOT EXISTS tokens_used INTEGER DEFAULT 0;
ALTER TABLE agentic_query_logs ADD COLUMN IF NOT EXISTS response_time_ms INTEGER;
ALTER TABLE agentic_query_logs ADD COLUMN IF NOT EXISTS success BOOLEAN DEFAULT TRUE;
ALTER TABLE agentic_query_logs ADD COLUMN IF NOT EXISTS error_message TEXT;

-- Backfill legacy nulls
UPDATE feature_config SET feature_id = id::text WHERE feature_id IS NULL;
UPDATE feature_config SET name = feature_id WHERE name IS NULL;

-- ─── 4. INSERTS (safe: ON CONFLICT DO NOTHING) ────────────────────────────────

INSERT INTO ai_providers (name, slug, provider_type, api_base_url, available_models, is_active) VALUES
('OpenAI',       'openai',     'openai',    'https://api.openai.com/v1',                    '[{"id":"gpt-4o","name":"GPT-4o"},{"id":"gpt-4-turbo","name":"GPT-4 Turbo"}]', false),
('Anthropic',    'anthropic',  'anthropic', 'https://api.anthropic.com/v1',                 '[{"id":"claude-3-opus","name":"Claude 3 Opus"},{"id":"claude-3-sonnet","name":"Claude 3 Sonnet"}]', false),
('Google AI',    'google',     'google',    'https://generativelanguage.googleapis.com/v1', '[{"id":"gemini-pro","name":"Gemini Pro"}]', false),
('Groq',         'groq',       'openai',    'https://api.groq.com/openai/v1',               '[{"id":"llama-3.3-70b-versatile","name":"Llama 3.3 70B"}]', true),
('A4F',          'a4f',        'openai',    'https://api.a4f.co/v1',                        '[{"id":"provider-8/claude-sonnet-4.5","name":"Claude Sonnet 4.5"}]', true),
('DeepSeek',     'deepseek',   'openai',    'https://api.deepseek.com/v1',                  '[{"id":"deepseek-chat","name":"DeepSeek Chat"}]', false),
('Mistral AI',   'mistral',    'openai',    'https://api.mistral.ai/v1',                    '[{"id":"mistral-large","name":"Mistral Large"}]', false),
('Together AI',  'together',   'openai',    'https://api.together.xyz/v1',                  '[]', false),
('Ollama',       'ollama',     'openai',    'http://localhost:11434/v1',                     '[]', false),
('OpenRouter',   'openrouter', 'openai',    'https://openrouter.ai/api/v1',                 '[]', false)
ON CONFLICT DO NOTHING;

INSERT INTO feature_config (feature_id, display_name, description, icon, min_subscription_tier) VALUES
('notes-generation', 'Smart Study Notes',        'Get comprehensive notes on any UPSC topic',    '📚', 'trial'),
('current-affairs',  'Daily Current Affairs',     'Today''s important news for UPSC',             '📰', 'trial'),
('quiz',             'Practice Quiz',             'Test your knowledge with practice questions',   '🧠', 'trial'),
('mock-interview',   'Mock Interview',            'Practice with AI interviewer',                 '🎤', 'premium'),
('essay-evaluation', 'Essay Review',              'Get feedback on your essays',                  '✍️', 'basic'),
('answer-writing',   'Answer Writing Practice',   'Learn to write perfect answers',               '📝', 'basic'),
('pyq-analysis',     'Previous Questions',        'Analyze past exam patterns',                   '📊', 'trial'),
('daily-schedule',   'Study Planner',             'Personalized daily study schedule',            '📅', 'trial'),
('mind-maps',        'Topic Maps',                'Visual connections between topics',            '🗺️', 'basic')
ON CONFLICT DO NOTHING;

INSERT INTO upsc_syllabus (paper, subject, topic, keywords) VALUES
('GS1', 'History',                 'Ancient India',        ARRAY['indus valley', 'vedic', 'maurya', 'gupta']),
('GS1', 'History',                 'Medieval India',       ARRAY['delhi sultanate', 'mughal', 'vijayanagar']),
('GS1', 'History',                 'Modern India',         ARRAY['british', 'freedom struggle', 'gandhi']),
('GS1', 'Geography',               'Physical Geography',   ARRAY['geomorphology', 'climatology']),
('GS1', 'Geography',               'Indian Geography',     ARRAY['physiography', 'drainage', 'climate']),
('GS2', 'Polity',                  'Constitution',         ARRAY['fundamental rights', 'dpsp', 'amendment']),
('GS2', 'Polity',                  'Governance',           ARRAY['parliament', 'executive', 'judiciary']),
('GS2', 'International Relations', 'India and World',      ARRAY['foreign policy', 'neighbours']),
('GS3', 'Economy',                 'Indian Economy',       ARRAY['planning', 'poverty', 'employment']),
('GS3', 'Environment',             'Ecology',              ARRAY['biodiversity', 'climate change', 'pollution']),
('GS3', 'Science',                 'Science & Tech',       ARRAY['space', 'nuclear', 'it']),
('GS4', 'Ethics',                  'Ethics Concepts',      ARRAY['integrity', 'aptitude', 'emotional intelligence'])
ON CONFLICT DO NOTHING;

-- ─── 5. INDEXES ───────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_ai_providers_active       ON ai_providers(is_active);
CREATE INDEX IF NOT EXISTS idx_ai_providers_slug         ON ai_providers(slug);

CREATE INDEX IF NOT EXISTS idx_static_materials_subject  ON static_materials(subject);
CREATE INDEX IF NOT EXISTS idx_static_materials_processed ON static_materials(is_processed);
CREATE INDEX IF NOT EXISTS idx_static_materials_category ON static_materials(category);

CREATE INDEX IF NOT EXISTS idx_material_chunks_material  ON material_chunks(material_id);
CREATE INDEX IF NOT EXISTS idx_material_chunks_embedding ON material_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_content_rules_active      ON content_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_content_rules_type        ON content_rules(rule_type);

CREATE INDEX IF NOT EXISTS idx_feature_config_enabled    ON feature_config(is_enabled);
CREATE INDEX IF NOT EXISTS idx_feature_config_feature_id ON feature_config(feature_id);

CREATE INDEX IF NOT EXISTS idx_agentic_cache_hash        ON agentic_cache(query_hash);
CREATE INDEX IF NOT EXISTS idx_agentic_cache_expires     ON agentic_cache(expires_at);

CREATE INDEX IF NOT EXISTS idx_upsc_syllabus_paper       ON upsc_syllabus(paper);
CREATE INDEX IF NOT EXISTS idx_upsc_syllabus_subject     ON upsc_syllabus(subject);

CREATE INDEX IF NOT EXISTS idx_agentic_logs_user         ON agentic_query_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_agentic_logs_created      ON agentic_query_logs(created_at DESC);

-- ─── 6. RLS ───────────────────────────────────────────────────────────────────

ALTER TABLE ai_providers       ENABLE ROW LEVEL SECURITY;
ALTER TABLE static_materials   ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_chunks    ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_rules      ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_config     ENABLE ROW LEVEL SECURITY;
ALTER TABLE agentic_cache      ENABLE ROW LEVEL SECURITY;
ALTER TABLE upsc_syllabus      ENABLE ROW LEVEL SECURITY;
ALTER TABLE agentic_query_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage AI providers"               ON ai_providers;
DROP POLICY IF EXISTS "Users can view active providers"          ON ai_providers;
DROP POLICY IF EXISTS "Admins manage materials"                  ON static_materials;
DROP POLICY IF EXISTS "Users view processed materials"           ON static_materials;
DROP POLICY IF EXISTS "Users view chunks of accessible materials" ON material_chunks;
DROP POLICY IF EXISTS "Admins manage content rules"              ON content_rules;
DROP POLICY IF EXISTS "Admins manage features"                   ON feature_config;
DROP POLICY IF EXISTS "Users view enabled features"              ON feature_config;
DROP POLICY IF EXISTS "Public can read cache"                    ON agentic_cache;
DROP POLICY IF EXISTS "System can manage cache"                  ON agentic_cache;
DROP POLICY IF EXISTS "Public can read syllabus"                 ON upsc_syllabus;
DROP POLICY IF EXISTS "Users own query logs"                     ON agentic_query_logs;
DROP POLICY IF EXISTS "Admins view all logs"                     ON agentic_query_logs;

CREATE POLICY "Admins manage AI providers"        ON ai_providers       FOR ALL    USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Users can view active providers"   ON ai_providers       FOR SELECT USING (is_active = true);
CREATE POLICY "Admins manage materials"           ON static_materials   FOR ALL    USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Users view processed materials"    ON static_materials   FOR SELECT USING (is_processed = true);
CREATE POLICY "Users view chunks of accessible materials" ON material_chunks FOR SELECT USING (
    EXISTS (SELECT 1 FROM static_materials WHERE id = material_chunks.material_id AND is_processed = true)
);
CREATE POLICY "Admins manage content rules"       ON content_rules      FOR ALL    USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admins manage features"            ON feature_config     FOR ALL    USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Users view enabled features"       ON feature_config     FOR SELECT USING (is_enabled = true AND is_visible = true);
CREATE POLICY "Public can read cache"             ON agentic_cache      FOR SELECT USING (expires_at > NOW());
CREATE POLICY "System can manage cache"           ON agentic_cache      FOR ALL    USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY "Public can read syllabus"          ON upsc_syllabus      FOR SELECT USING (true);
CREATE POLICY "Users own query logs"              ON agentic_query_logs FOR ALL    USING (auth.uid() = user_id);
CREATE POLICY "Admins view all logs"              ON agentic_query_logs FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

-- ═══════════════════════════════════════════════════════════════════════════
-- END OF MIGRATION 014
-- ═══════════════════════════════════════════════════════════════════════════
