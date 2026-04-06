-- ═══════════════════════════════════════════════════════════════
-- UPSC CSE MASTER - AGENTIC INTELLIGENCE TABLES
-- Migration: 005_agentic_tables.sql
-- Description: Web search, AutoDocThinker, File search systems
-- ═══════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════
-- AI PROVIDERS (50+ providers support)
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.ai_providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Provider Info
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    provider_type VARCHAR(50) NOT NULL, -- openai, anthropic, google, local, etc.
    
    -- API Configuration
    api_base_url TEXT NOT NULL,
    api_key_encrypted TEXT, -- Encrypted with app secret
    api_version VARCHAR(20),
    
    -- Models
    available_models JSONB DEFAULT '[]'::jsonb,
    default_model VARCHAR(100),
    
    -- Rate Limits
    rate_limit_rpm INTEGER DEFAULT 60,
    rate_limit_tpm INTEGER DEFAULT 100000,
    rate_limit_current_usage INTEGER DEFAULT 0,
    rate_limit_reset_at TIMESTAMPTZ,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_default BOOLEAN DEFAULT FALSE,
    health_status VARCHAR(20) DEFAULT 'unknown', -- healthy, degraded, down
    last_health_check TIMESTAMPTZ,
    
    -- Usage Tracking
    total_requests INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    total_cost DECIMAL(10, 4) DEFAULT 0,
    
    -- Configuration
    extra_headers JSONB DEFAULT '{}'::jsonb,
    extra_params JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_providers_slug ON ai_providers(slug);
CREATE INDEX idx_ai_providers_active ON ai_providers(is_active) WHERE is_active = TRUE;

-- ═══════════════════════════════════════════════════════════════
-- AGENTIC WEB SEARCH (DuckDuckGo)
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.agentic_web_searches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Query Info
    query TEXT NOT NULL,
    intent VARCHAR(100), -- current_affairs, research, fact_check
    
    -- Search Results
    results JSONB, -- Array of {title, url, snippet, source}
    total_results INTEGER,
    sources_used TEXT[],
    
    -- Processing
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    processing_time_ms INTEGER,
    
    -- Cache
    cache_key VARCHAR(64), -- Hash of query for caching
    cached_until TIMESTAMPTZ,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_agentic_web_searches_user_id ON agentic_web_searches(user_id);
CREATE INDEX idx_agentic_web_searches_cache_key ON agentic_web_searches(cache_key);
CREATE INDEX idx_agentic_web_searches_created_at ON agentic_web_searches(created_at DESC);

-- ═══════════════════════════════════════════════════════════════
-- AUTODOC THINKER (Document RAG)
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.document_uploads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- File Info
    filename VARCHAR(255) NOT NULL,
    file_type VARCHAR(50), -- pdf, docx, txt
    file_size_bytes BIGINT,
    file_url TEXT NOT NULL,
    
    -- Processing
    status VARCHAR(20) DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'processing', 'ready', 'failed')),
    total_pages INTEGER,
    total_chunks INTEGER,
    
    -- Content
    extracted_text TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Analysis
    summary TEXT,
    key_topics TEXT[],
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.document_chat_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    document_id UUID REFERENCES document_uploads(id) ON DELETE CASCADE,
    
    -- Session Info
    title VARCHAR(255),
    
    -- Messages
    messages JSONB DEFAULT '[]'::jsonb, -- Array of {role, content, timestamp}
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_document_uploads_user_id ON document_uploads(user_id);
CREATE INDEX idx_document_chat_sessions_user_id ON document_chat_sessions(user_id);
CREATE INDEX idx_document_chat_sessions_document_id ON document_chat_sessions(document_id);

-- ═══════════════════════════════════════════════════════════════
-- AGENTIC FILE SEARCH (Dynamic Navigation)
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.static_materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Material Info
    title VARCHAR(255) NOT NULL,
    type VARCHAR(50), -- ncert, standard_book, government_report, magazine
    subject_slug VARCHAR(100) REFERENCES subjects(slug),
    
    -- File
    file_url TEXT NOT NULL,
    file_type VARCHAR(50),
    file_size_bytes BIGINT,
    
    -- Classification
    category VARCHAR(100), -- history, polity, geography, etc.
    tags TEXT[],
    standard VARCHAR(20), -- For NCERTs: 6, 7, 8, 9, 10, 11, 12
    
    -- Access Control
    is_public BOOLEAN DEFAULT FALSE,
    min_tier VARCHAR(20) DEFAULT 'trial',
    
    -- Metadata
    author VARCHAR(255),
    publisher VARCHAR(255),
    published_year INTEGER,
    description TEXT,
    
    -- Tracking
    download_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    
    -- Admin
    uploaded_by UUID REFERENCES users(id),
    is_approved BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_static_materials_subject ON static_materials(subject_slug);
CREATE INDEX idx_static_materials_category ON static_materials(category);
CREATE INDEX idx_static_materials_type ON static_materials(type);

CREATE TABLE IF NOT EXISTS public.file_search_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Search Query
    query TEXT NOT NULL,
    intent VARCHAR(100),
    
    -- Navigation Path
    materials_explored UUID[], -- Array of static_materials IDs
    navigation_path JSONB, -- Detailed path with reasoning
    
    -- Results
    results JSONB,
    confidence_score DECIMAL(3, 2),
    
    -- Performance
    processing_time_ms INTEGER,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_file_search_sessions_user_id ON file_search_sessions(user_id);

-- ═══════════════════════════════════════════════════════════════
-- CONTENT REFINER & SYLLABUS VALIDATOR
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.upsc_syllabus_topics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Topic Info
    subject_slug VARCHAR(100) REFERENCES subjects(slug),
    topic_name VARCHAR(255) NOT NULL,
    sub_topics TEXT[],
    
    -- Syllabus Reference
    paper VARCHAR(50), -- prelims, mains_gs1, mains_gs2, mains_gs3, mains_gs4, essay
    section VARCHAR(100),
    
    -- Keywords
    keywords TEXT[],
    related_topics TEXT[],
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_upsc_syllabus_topics_subject ON upsc_syllabus_topics(subject_slug);
CREATE INDEX idx_upsc_syllabus_topics_paper ON upsc_syllabus_topics(paper);

CREATE TABLE IF NOT EXISTS public.content_validation_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Rule Info
    rule_name VARCHAR(100) UNIQUE NOT NULL,
    rule_type VARCHAR(50), -- source_filter, keyword_filter, syllabus_check
    
    -- Configuration
    allowed_sources TEXT[],
    blocked_sources TEXT[],
    required_keywords TEXT[],
    blocked_keywords TEXT[],
    
    -- Scoring
    min_relevance_score DECIMAL(3, 2) DEFAULT 0.70,
    min_accuracy_score DECIMAL(3, 2) DEFAULT 0.80,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    applies_to_features TEXT[], -- Which features this rule applies to
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════
-- AGENTIC ORCHESTRATOR LOGS
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.agentic_orchestrator_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Request Info
    query TEXT NOT NULL,
    intent VARCHAR(100),
    
    -- Routing Decision
    systems_used VARCHAR(50)[], -- web_search, doc_thinker, file_search
    routing_reasoning TEXT,
    
    -- Results
    combined_results JSONB,
    confidence_score DECIMAL(3, 2),
    
    -- Performance
    total_processing_time_ms INTEGER,
    web_search_time_ms INTEGER,
    doc_thinker_time_ms INTEGER,
    file_search_time_ms INTEGER,
    
    -- Status
    status VARCHAR(20) DEFAULT 'success',
    error_message TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_agentic_orchestrator_logs_user_id ON agentic_orchestrator_logs(user_id);
CREATE INDEX idx_agentic_orchestrator_logs_created_at ON agentic_orchestrator_logs(created_at DESC);

-- ═══════════════════════════════════════════════════════════════
-- END OF MIGRATION 005
-- ═══════════════════════════════════════════════════════════════
