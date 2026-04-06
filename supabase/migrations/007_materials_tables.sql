-- ═══════════════════════════════════════════════════════════════
-- UPSC CSE MASTER - MATERIALS & CONTENT LIBRARY
-- Migration: 007_materials_tables.sql
-- Description: Static materials, magazines, newspapers, PDFs
-- ═══════════════════════════════════════════════════════════════

-- NOTE: static_materials table already created in 005_agentic_tables.sql
-- This migration adds additional content tables

-- ═══════════════════════════════════════════════════════════════
-- DAILY NEWSPAPERS (The Hindu, Indian Express from preppyq.in)
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.daily_newspapers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Newspaper Info
    publication VARCHAR(100) NOT NULL, -- the_hindu, indian_express
    edition VARCHAR(50), -- national, delhi, mumbai
    
    -- Date
    publish_date DATE NOT NULL,
    
    -- Content
    pdf_url TEXT,
    articles JSONB DEFAULT '[]'::jsonb, -- Array of {title, content, category, upsc_relevance}
    
    -- Scraping Info
    source_url TEXT,
    scraped_at TIMESTAMPTZ,
    scraping_status VARCHAR(20) DEFAULT 'pending',
    
    -- Access
    is_free BOOLEAN DEFAULT TRUE, -- Always free post-trial
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(publication, publish_date)
);

CREATE INDEX idx_daily_newspapers_date ON daily_newspapers(publish_date DESC);
CREATE INDEX idx_daily_newspapers_publication ON daily_newspapers(publication);

-- ═══════════════════════════════════════════════════════════════
-- MAGAZINES (Yojana, Kurukshetra from chahalacademy)
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.magazines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Magazine Info
    name VARCHAR(100) NOT NULL, -- yojana, kurukshetra
    issue_month VARCHAR(20) NOT NULL, -- january, february
    issue_year INTEGER NOT NULL,
    
    -- Content
    title VARCHAR(500),
    theme VARCHAR(255),
    pdf_url TEXT,
    thumbnail_url TEXT,
    
    -- Articles
    articles JSONB DEFAULT '[]'::jsonb,
    
    -- Scraping Info
    source_url TEXT,
    scraped_at TIMESTAMPTZ,
    
    -- Access
    is_free BOOLEAN DEFAULT TRUE,
    
    -- Engagement
    download_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(name, issue_month, issue_year)
);

CREATE INDEX idx_magazines_date ON magazines(issue_year DESC, issue_month);
CREATE INDEX idx_magazines_name ON magazines(name);

-- ═══════════════════════════════════════════════════════════════
-- 10TH CLASS NOTES (Chapter-format, simplified language)
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.tenth_class_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Subject & Chapter
    subject_slug VARCHAR(100) REFERENCES subjects(slug),
    chapter_number INTEGER NOT NULL,
    chapter_title VARCHAR(255) NOT NULL,
    
    -- Content (Simplified for 10th standard)
    summary TEXT NOT NULL,
    key_concepts JSONB, -- Array of concept objects
    important_terms JSONB, -- Glossary
    diagrams_urls TEXT[],
    
    -- Learning Aids
    mnemonics TEXT[],
    examples TEXT[],
    quick_facts TEXT[],
    
    -- Practice
    practice_questions JSONB,
    
    -- PDF
    pdf_url TEXT,
    
    -- UPSC Relevance
    upsc_connections TEXT,
    related_current_affairs TEXT[],
    
    -- Access
    is_free BOOLEAN DEFAULT FALSE,
    min_tier VARCHAR(20) DEFAULT 'basic',
    
    -- Engagement
    views INTEGER DEFAULT 0,
    helpful_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(subject_slug, chapter_number)
);

CREATE INDEX idx_tenth_class_notes_subject ON tenth_class_notes(subject_slug);

-- ═══════════════════════════════════════════════════════════════
-- GOVERNMENT SCHEMES & VALUE ADDITIONS
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.government_schemes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Scheme Info
    scheme_name VARCHAR(255) NOT NULL,
    ministry VARCHAR(255),
    launched_year INTEGER,
    
    -- Details
    objective TEXT,
    beneficiaries TEXT,
    budget_allocation TEXT,
    key_features TEXT[],
    
    -- Classification
    category VARCHAR(100), -- social_welfare, economic, infrastructure
    subject_slug VARCHAR(100) REFERENCES subjects(slug),
    
    -- UPSC Relevance
    upsc_relevance TEXT,
    prelims_importance BOOLEAN DEFAULT FALSE,
    mains_importance BOOLEAN DEFAULT FALSE,
    interview_importance BOOLEAN DEFAULT FALSE,
    
    -- Sources
    official_website TEXT,
    pib_links TEXT[],
    
    -- Engagement
    views INTEGER DEFAULT 0,
    is_bookmarked_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_government_schemes_category ON government_schemes(category);
CREATE INDEX idx_government_schemes_subject ON government_schemes(subject_slug);

-- ═══════════════════════════════════════════════════════════════
-- 34 FEATURES CONFIGURATION
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.all_features (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Feature Identity
    feature_slug VARCHAR(100) UNIQUE NOT NULL,
    feature_name VARCHAR(255) NOT NULL,
    category VARCHAR(50), -- content, practice, analysis, tools
    
    -- Display
    icon VARCHAR(50),
    description TEXT,
    preview_content TEXT, -- Live preview for dashboard
    
    -- Access Control
    is_enabled BOOLEAN DEFAULT TRUE,
    is_visible BOOLEAN DEFAULT TRUE,
    min_tier VARCHAR(20) DEFAULT 'trial',
    
    -- Limits
    trial_limit INTEGER, -- NULL = unlimited
    basic_limit INTEGER,
    premium_limit INTEGER,
    premium_plus_limit INTEGER,
    
    -- UI Position
    sort_order INTEGER DEFAULT 0,
    show_on_dashboard BOOLEAN DEFAULT TRUE,
    dashboard_priority INTEGER,
    
    -- Implementation Status
    is_implemented BOOLEAN DEFAULT FALSE,
    implementation_notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════
-- USER BOOKMARKS (For any content type)
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.user_bookmarks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Polymorphic reference
    content_type VARCHAR(50) NOT NULL, -- note, quiz, ca, lecture, scheme, material
    content_id UUID NOT NULL,
    
    -- Metadata
    title VARCHAR(500),
    thumbnail_url TEXT,
    
    -- Organization
    folder VARCHAR(100), -- Optional folder/tag
    tags TEXT[],
    notes TEXT, -- User's personal notes
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, content_type, content_id)
);

CREATE INDEX idx_user_bookmarks_user_id ON user_bookmarks(user_id);
CREATE INDEX idx_user_bookmarks_content ON user_bookmarks(content_type, content_id);

-- ═══════════════════════════════════════════════════════════════
-- STUDY PLANNER
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.study_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Plan Info
    plan_name VARCHAR(255) NOT NULL,
    target_exam_date DATE,
    
    -- Goals
    dailygoals JSONB, -- {hours, topics, practice_questions}
    weekly_goals JSONB,
    monthly_goals JSONB,
    
    -- Schedule
    schedule JSONB, -- Array of daily schedules
    
    -- Progress
    completion_percent DECIMAL(5, 2) DEFAULT 0.00,
    streak_days INTEGER DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.study_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES study_plans(id) ON DELETE SET NULL,
    
    -- Session Info
    session_date DATE NOT NULL DEFAULT CURRENT_DATE,
    subject_slug VARCHAR(100)REFERENCES subjects(slug),
    topics_covered TEXT[],
    
    -- Duration
    duration_minutes INTEGER,
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    
    -- Activities
    notes_created INTEGER DEFAULT 0,
    quizzes_attempted INTEGER DEFAULT 0,
    ca_articles_read INTEGER DEFAULT 0,
    
    -- Self-assessment
    productivity_rating INTEGER CHECK (productivity_rating >= 1 AND productivity_rating <= 5),
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_study_plans_user_id ON study_plans(user_id);
CREATE INDEX idx_study_sessions_user_id ON study_sessions(user_id);
CREATE INDEX idx_study_sessions_date ON study_sessions(session_date DESC);

-- ═══════════════════════════════════════════════════════════════
-- END OF MIGRATION 007
-- ═══════════════════════════════════════════════════════════════
