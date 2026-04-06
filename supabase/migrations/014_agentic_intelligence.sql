-- ═══════════════════════════════════════════════════════════════════════════
-- AGENTIC INTELLIGENCE DATABASE SCHEMA
-- Migration: 014_agentic_intelligence.sql
-- Adds: AI Providers, Materials Library, Content Rules, Agentic Systems
-- ═══════════════════════════════════════════════════════════════════════════

-- Enable vector extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS vector;

-- ═══════════════════════════════════════════════════════════════════════════
-- AI PROVIDERS TABLE - Support for 50+ AI Providers
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS ai_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Provider Info
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    provider_type VARCHAR(50) NOT NULL, -- openai, anthropic, google, local, etc.
    
    -- API Configuration
    api_base_url TEXT NOT NULL,
    api_key_encrypted TEXT, -- Encrypted with app secret
    api_version VARCHAR(20),
    
    -- Models
    available_models JSONB DEFAULT '[]'::jsonb, -- [{id, name, context_length, pricing}]
    default_model VARCHAR(100),
    
    -- Rate Limits
    rate_limit_rpm INTEGER DEFAULT 60,
    rate_limit_tpm INTEGER DEFAULT 100000,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_default BOOLEAN DEFAULT FALSE,
    last_health_check TIMESTAMPTZ,
    health_status VARCHAR(20) DEFAULT 'unknown', -- healthy, degraded, down
    
    -- Usage
    total_requests INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    total_cost DECIMAL(10, 4) DEFAULT 0,
    
    -- Config
    extra_headers JSONB DEFAULT '{}'::jsonb,
    extra_params JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pre-populate with major providers
INSERT INTO ai_providers (name, slug, provider_type, api_base_url, available_models, is_active) VALUES
-- OpenAI Compatible
('OpenAI', 'openai', 'openai', 'https://api.openai.com/v1', '[{"id":"gpt-4o","name":"GPT-4o"},{"id":"gpt-4-turbo","name":"GPT-4 Turbo"}]', false),
('Anthropic', 'anthropic', 'anthropic', 'https://api.anthropic.com/v1', '[{"id":"claude-3-opus","name":"Claude 3 Opus"},{"id":"claude-3-sonnet","name":"Claude 3 Sonnet"}]', false),
('Google AI', 'google', 'google', 'https://generativelanguage.googleapis.com/v1', '[{"id":"gemini-pro","name":"Gemini Pro"}]', false),
('Groq', 'groq', 'openai', 'https://api.groq.com/openai/v1', '[{"id":"llama-3.3-70b-versatile","name":"Llama 3.3 70B"}]', true),
('A4F', 'a4f', 'openai', 'https://api.a4f.co/v1', '[{"id":"provider-8/claude-sonnet-4.5","name":"Claude Sonnet 4.5"}]', true),
('DeepSeek', 'deepseek', 'openai', 'https://api.deepseek.com/v1', '[{"id":"deepseek-chat","name":"DeepSeek Chat"}]', false),
('Mistral AI', 'mistral', 'openai', 'https://api.mistral.ai/v1', '[{"id":"mistral-large","name":"Mistral Large"}]', false),
('Together AI', 'together', 'openai', 'https://api.together.xyz/v1', '[]', false),
('Ollama', 'ollama', 'openai', 'http://localhost:11434/v1', '[]', false),
('OpenRouter', 'openrouter', 'openai', 'https://openrouter.ai/api/v1', '[]', false)
ON CONFLICT (slug) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════
-- STATIC MATERIALS LIBRARY - Study Materials Management
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS static_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- File Info
    name VARCHAR(255) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(20) NOT NULL, -- pdf, docx, txt, epub
    file_size INTEGER,
    file_url TEXT NOT NULL, -- MinIO URL
    
    -- Categorization
    subject VARCHAR(100) NOT NULL, -- History, Geography, Polity, etc.
    category VARCHAR(100), -- NCERT, Standard Book, Reference, etc.
    tags TEXT[] DEFAULT '{}',
    
    -- Metadata
    author VARCHAR(255),
    publisher VARCHAR(255),
    edition VARCHAR(50),
    year INTEGER,
    
    -- Processing Status
    is_processed BOOLEAN DEFAULT FALSE,
    processing_status VARCHAR(20) DEFAULT 'pending', -- pending, processing, completed, failed
    processed_at TIMESTAMPTZ,
    chunk_count INTEGER DEFAULT 0,
    
    -- Quality
    is_standard BOOLEAN DEFAULT FALSE, -- Standard textbook or reference
    priority INTEGER DEFAULT 0, -- Higher = more authoritative
    
    -- Usage
    search_count INTEGER DEFAULT 0,
    last_searched_at TIMESTAMPTZ,
    
    uploaded_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- MATERIAL CHUNKS - For Agentic File Search
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS material_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    material_id UUID REFERENCES static_materials(id) ON DELETE CASCADE,
    
    -- Content
    content TEXT NOT NULL,
    chunk_index INTEGER NOT NULL,
    
    -- Location
    page_number INTEGER,
    section_title VARCHAR(255),
    chapter VARCHAR(255),
    
    -- Embedding (optional, for hybrid search)
    embedding vector(1536), -- OpenAI embedding size
    
    -- Metadata
    word_count INTEGER,
    has_table BOOLEAN DEFAULT FALSE,
    has_image BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- CONTENT RULES ENGINE - Content Filtering & Validation
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS content_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Rule Info
    name VARCHAR(100) NOT NULL,
    description TEXT,
    rule_type VARCHAR(50) NOT NULL, -- source_filter, keyword_filter, syllabus_check, etc.
    
    -- Rule Definition
    rule_config JSONB NOT NULL,
    
    -- Scope
    applies_to TEXT[] DEFAULT '{}', -- Feature IDs, empty = all
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    priority INTEGER DEFAULT 0, -- Higher = checked first
    
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- FEATURE CONFIGURATION - Feature Management
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS feature_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Feature Info
    feature_id VARCHAR(100) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    
    -- Status
    is_enabled BOOLEAN DEFAULT TRUE,
    is_visible BOOLEAN DEFAULT TRUE,
    maintenance_mode BOOLEAN DEFAULT FALSE,
    maintenance_message TEXT,
    
    -- Access Control
    min_subscription_tier VARCHAR(20) DEFAULT 'trial', -- trial, basic, premium
    usage_limit_trial INTEGER,
    usage_limit_basic INTEGER,
    usage_limit_premium INTEGER,
    
    -- AI Config
    default_ai_provider VARCHAR(50),
    default_ai_model VARCHAR(100),
    fallback_ai_provider VARCHAR(50),
    
    -- Preview Content (for feature cards)
    preview_type VARCHAR(50), -- text, image, video
    preview_content JSONB,
    preview_updated_at TIMESTAMPTZ,
    
    -- Analytics
    total_usage INTEGER DEFAULT 0,
    last_used_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default feature configurations
INSERT INTO feature_config (feature_id, display_name, description, icon, min_subscription_tier) VALUES
('notes-generation', 'Smart Study Notes', 'Get comprehensive notes on any UPSC topic', '📚', 'trial'),
('current-affairs', 'Daily Current Affairs', 'Today''s important news for UPSC', '📰', 'trial'),
('quiz', 'Practice Quiz', 'Test your knowledge with practice questions', '🧠', 'trial'),
('mock-interview', 'Mock Interview', 'Practice with AI interviewer', '🎤', 'premium'),
('essay-evaluation', 'Essay Review', 'Get feedback on your essays', '✍️', 'basic'),
('answer-writing', 'Answer Writing Practice', 'Learn to write perfect answers', '📝', 'basic'),
('pyq-analysis', 'Previous Questions', 'Analyze past exam patterns', '📊', 'trial'),
('daily-schedule', 'Study Planner', 'Personalized daily study schedule', '📅', 'trial'),
('mind-maps', 'Topic Maps', 'Visual connections between topics', '🗺️', 'basic')
ON CONFLICT (feature_id) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════
-- AGENTIC SEARCH CACHE - Results Caching
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS agentic_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Query
    query_hash VARCHAR(64) NOT NULL, -- SHA256 of query
    query_text TEXT NOT NULL,
    
    -- Source
    source_type VARCHAR(50) NOT NULL, -- web_search, doc_thinker, file_search
    
    -- Result
    result_data JSONB NOT NULL,
    source_urls TEXT[],
    
    -- Validity
    expires_at TIMESTAMPTZ NOT NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- UPSC SYLLABUS REFERENCE - Topic Mapping
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS upsc_syllabus (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    paper VARCHAR(20) NOT NULL, -- Prelims_GS, GS1, GS2, GS3, GS4, Essay
    subject VARCHAR(100) NOT NULL,
    topic VARCHAR(255) NOT NULL,
    subtopics TEXT[],
    
    keywords TEXT[], -- For content matching
    
    priority INTEGER DEFAULT 0, -- Exam importance
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pre-populate syllabus (key topics)
INSERT INTO upsc_syllabus (paper, subject, topic, keywords) VALUES
('GS1', 'History', 'Ancient India', ARRAY['indus valley', 'vedic', 'maurya', 'gupta']),
('GS1', 'History', 'Medieval India', ARRAY['delhi sultanate', 'mughal', 'vijayanagar']),
('GS1', 'History', 'Modern India', ARRAY['british', 'freedom struggle', 'gandhi']),
('GS1', 'Geography', 'Physical Geography', ARRAY['geomorphology', 'climatology']),
('GS1', 'Geography', 'Indian Geography', ARRAY['physiography', 'drainage', 'climate']),
('GS2', 'Polity', 'Constitution', ARRAY['fundamental rights', 'dpsp', 'amendment']),
('GS2', 'Polity', 'Governance', ARRAY['parliament', 'executive', 'judiciary']),
('GS2', 'International Relations', 'India and World', ARRAY['foreign policy', 'neighbours']),
('GS3', 'Economy', 'Indian Economy', ARRAY['planning', 'poverty', 'employment']),
('GS3', 'Environment', 'Ecology', ARRAY['biodiversity', 'climate change', 'pollution']),
('GS3', 'Science', 'Science & Tech', ARRAY['space', 'nuclear', 'it']),
('GS4', 'Ethics', 'Ethics Concepts', ARRAY['integrity', 'aptitude', 'emotional intelligence'])
ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════
-- AGENTIC QUERY LOGS - Analytics & Tracking
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS agentic_query_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    
    query TEXT NOT NULL,
    intent VARCHAR(50), -- web_search, doc_analyze, file_search, combined
    
    services_used TEXT[], -- Which agentic services were called
    sources_count INTEGER DEFAULT 0,
    tokens_used INTEGER DEFAULT 0,
    
    response_time_ms INTEGER,
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- INDEXES
-- ═══════════════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_ai_providers_active ON ai_providers(is_active);
CREATE INDEX IF NOT EXISTS idx_ai_providers_slug ON ai_providers(slug);

CREATE INDEX IF NOT EXISTS idx_static_materials_subject ON static_materials(subject);
CREATE INDEX IF NOT EXISTS idx_static_materials_processed ON static_materials(is_processed);
CREATE INDEX IF NOT EXISTS idx_static_materials_category ON static_materials(category);

CREATE INDEX IF NOT EXISTS idx_material_chunks_material ON material_chunks(material_id);
CREATE INDEX IF NOT EXISTS idx_material_chunks_embedding ON material_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_content_rules_active ON content_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_content_rules_type ON content_rules(rule_type);

CREATE INDEX IF NOT EXISTS idx_feature_config_enabled ON feature_config(is_enabled);
CREATE INDEX IF NOT EXISTS idx_feature_config_feature_id ON feature_config(feature_id);

CREATE INDEX IF NOT EXISTS idx_agentic_cache_hash ON agentic_cache(query_hash);
CREATE INDEX IF NOT EXISTS idx_agentic_cache_expires ON agentic_cache(expires_at);

CREATE INDEX IF NOT EXISTS idx_upsc_syllabus_paper ON upsc_syllabus(paper);
CREATE INDEX IF NOT EXISTS idx_upsc_syllabus_subject ON upsc_syllabus(subject);

CREATE INDEX IF NOT EXISTS idx_agentic_logs_user ON agentic_query_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_agentic_logs_created ON agentic_query_logs(created_at DESC);

-- ═══════════════════════════════════════════════════════════════════════════
-- RLS POLICIES
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE ai_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE static_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE agentic_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE upsc_syllabus ENABLE ROW LEVEL SECURITY;
ALTER TABLE agentic_query_logs ENABLE ROW LEVEL SECURITY;

-- AI Providers: Admins only
CREATE POLICY "Admins manage AI providers" ON ai_providers
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Users can view active providers" ON ai_providers
    FOR SELECT USING (is_active = true);

-- Static Materials: Admins manage, users view
CREATE POLICY "Admins manage materials" ON static_materials
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Users view processed materials" ON static_materials
    FOR SELECT USING (is_processed = true);

-- Material Chunks: Follow materials access
CREATE POLICY "Users view chunks of accessible materials" ON material_chunks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM static_materials
            WHERE id = material_chunks.material_id
            AND is_processed = true
        )
    );

-- Content Rules: Admins only
CREATE POLICY "Admins manage content rules" ON content_rules
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Feature Config: Admins manage, users view enabled
CREATE POLICY "Admins manage features" ON feature_config
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Users view enabled features" ON feature_config
    FOR SELECT USING (is_enabled = true AND is_visible = true);

-- Agentic Cache: Public read (for caching)
CREATE POLICY "Public can read cache" ON agentic_cache
    FOR SELECT USING (expires_at > NOW());

CREATE POLICY "System can manage cache" ON agentic_cache
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- UPSC Syllabus: Public read
CREATE POLICY "Public can read syllabus" ON upsc_syllabus
    FOR SELECT USING (true);

-- Query Logs: Users own their logs
CREATE POLICY "Users own query logs" ON agentic_query_logs
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins view all logs" ON agentic_query_logs
    FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

-- ═══════════════════════════════════════════════════════════════════════════
-- END OF MIGRATION 014
-- ═══════════════════════════════════════════════════════════════════════════
