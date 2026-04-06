-- ═══════════════════════════════════════════════════════════════
-- UPSC CSE MASTER - INITIAL SCHEMA
-- Migration: 001_initial_schema.sql
-- Description: Core tables for users, roles, authentication
-- ═══════════════════════════════════════════════════════════════

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ═══════════════════════════════════════════════════════════════
-- USERS & AUTHENTICATION
-- ═══════════════════════════════════════════════════════════════

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Profile
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    phone VARCHAR(20),
    avatar_url TEXT,
    
    -- Role & Access
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin')),
    subscription_tier VARCHAR(20) DEFAULT 'trial' CHECK (subscription_tier IN ('trial', 'basic', 'premium', 'premium_plus')),
    subscription_status VARCHAR(20) DEFAULT 'active' CHECK (subscription_status IN ('active', 'expired', 'cancelled', 'trial')),
    subscription_ends_at TIMESTAMPTZ,
    
    -- Trial System
    trial_started_at TIMESTAMPTZ,
    trial_ends_at TIMESTAMPTZ,
    trial_used BOOLEAN DEFAULT FALSE,
    post_trial BOOLEAN DEFAULT FALSE, -- True after trial expiry
    
    -- Preferences
    preferences JSONB DEFAULT '{
        "language": "english",
        "theme": "dark",
        "notifications": true,
        "studyGoals": {}
    }'::jsonb,
    
    -- Tracking
    last_seen_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_subscription_tier ON users(subscription_tier);
CREATE INDEX idx_users_role ON users(role);

-- ═══════════════════════════════════════════════════════════════
-- SUBJECTS & CATEGORIES
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    icon VARCHAR(50),
    color VARCHAR(20),
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════
-- NOTES SYSTEM
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Content
    topic VARCHAR(500) NOT NULL,
    subject_slug VARCHAR(100) REFERENCES subjects(slug),
    content JSONB NOT NULL, -- {summary, detailedNotes, keyPoints, upscRelevance, etc}
    
    -- AI Generation
    ai_provider VARCHAR(100),
    ai_model VARCHAR(100),
    generation_method VARCHAR(50) DEFAULT 'agentic',
    sources TEXT[], -- URLs/citations
    
    -- User Interaction
    is_bookmarked BOOLEAN DEFAULT FALSE,
    views INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notes_user_id ON notes(user_id);
CREATE INDEX idx_notes_subject ON notes(subject_slug);
CREATE INDEX idx_notes_created_at ON notes(created_at DESC);

-- ═══════════════════════════════════════════════════════════════
-- QUIZ SYSTEM
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.quizzes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Quiz Info
    title VARCHAR(255) NOT NULL,
    topic VARCHAR(500),
    subject_slug VARCHAR(100) REFERENCES subjects(slug),
    difficulty VARCHAR(20) CHECK (difficulty IN ('easy', 'medium', 'hard')),
    
    -- Questions
    questions JSONB NOT NULL, -- Array of question objects
    total_questions INTEGER NOT NULL,
    
    -- AI Generation
    ai_provider VARCHAR(100),
    ai_model VARCHAR(100),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.quiz_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Results
    answers JSONB NOT NULL, -- User's answers
    score INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    correct_answers INTEGER NOT NULL,
    
    -- Time Tracking
    started_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    time_taken_seconds INTEGER
);

CREATE INDEX idx_quiz_attempts_user_id ON quiz_attempts(user_id);
CREATE INDEX idx_quiz_attempts_quiz_id ON quiz_attempts(quiz_id);

-- ═══════════════════════════════════════════════════════════════
-- CURRENT AFFAIRS
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.current_affairs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Content
    title VARCHAR(500) NOT NULL,
    summary TEXT NOT NULL,
    full_content TEXT,
    category VARCHAR(100),
    
    -- UPSC Relevance
    upsc_relevance TEXT,
    prelims_relevance BOOLEAN DEFAULT FALSE,
    mains_relevance BOOLEAN DEFAULT FALSE,
    pyq_connections TEXT[],
    
    -- Sources
    source_url TEXT,
    source_name VARCHAR(255),
    published_date DATE NOT NULL,
    
    -- Engagement
    views INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_current_affairs_date ON current_affairs(published_date DESC);
CREATE INDEX idx_current_affairs_category ON current_affairs(category);

-- ═══════════════════════════════════════════════════════════════
-- FEATURE CONFIGURATION
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.feature_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Feature Info
    name VARCHAR(100) UNIQUE NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    
    -- Access Control
    is_enabled BOOLEAN DEFAULT TRUE,
    is_visible BOOLEAN DEFAULT TRUE,
    min_tier VARCHAR(20) DEFAULT 'trial' CHECK (min_tier IN ('trial', 'basic', 'premium', 'premium_plus')),
    
    -- Limits per tier
    limits_per_tier JSONB DEFAULT '{
        "trial": {"daily": 5, "total": 50},
        "basic": {"daily": 20, "total": null},
        "premium": {"daily": null, "total": null},
        "premium_plus": {"daily": null, "total": null}
    }'::jsonb,
    
    -- UI
    sort_order INTEGER DEFAULT 0,
    preview_content TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════
-- LEADS (Marketing)
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Contact Info
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    
    -- Lead Source
    source VARCHAR(100), -- google, facebook, direct, referral
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100),
    
    -- Status
    status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'lost')),
    notes TEXT,
    
    -- Tracking
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_leads_status ON leads(status);

-- ═══════════════════════════════════════════════════════════════
-- UPDATED_AT TRIGGER FUNCTION
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON notes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_current_affairs_updated_at BEFORE UPDATE ON current_affairs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_feature_config_updated_at BEFORE UPDATE ON feature_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ═══════════════════════════════════════════════════════════════
-- END OF MIGRATION 001
-- ═══════════════════════════════════════════════════════════════
