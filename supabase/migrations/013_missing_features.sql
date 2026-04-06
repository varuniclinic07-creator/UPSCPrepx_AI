-- ═══════════════════════════════════════════════════════════════
-- MISSING FEATURES
-- Migration: 013_missing_features.sql
-- Adds tables for: Mock Interview, User Feedback, AI Chat
-- ═══════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════
-- MOCK INTERVIEW SESSIONS
-- For practice/mock-interview feature
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.mock_interview_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Interview details
    topic VARCHAR(255) NOT NULL,
    subject VARCHAR(100),
    difficulty VARCHAR(20) DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
    
    -- Interview content
    questions JSONB DEFAULT '[]'::jsonb,
    answers JSONB DEFAULT '[]'::jsonb,
    
    -- Evaluation
    score INTEGER,
    max_score INTEGER,
    feedback JSONB,
    strengths TEXT[],
    weaknesses TEXT[],
    
    -- Timing
    duration_seconds INTEGER,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    
    -- Metadata
    model_used VARCHAR(50),
    tokens_used INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mock_interviews_user ON mock_interview_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_mock_interviews_topic ON mock_interview_sessions(topic);
CREATE INDEX IF NOT EXISTS idx_mock_interviews_date ON mock_interview_sessions(created_at DESC);

-- ═══════════════════════════════════════════════════════════════
-- USER FEEDBACK
-- For feedback widget component
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.user_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Feedback details
    type VARCHAR(30) NOT NULL CHECK (type IN ('bug', 'feature', 'feedback', 'complaint', 'praise')),
    subject VARCHAR(255),
    message TEXT NOT NULL,
    
    -- Context
    page_url VARCHAR(500),
    browser_info JSONB,
    screenshot_url VARCHAR(500),
    
    -- Rating
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    
    -- Status tracking
    status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'in_progress', 'resolved', 'closed')),
    admin_response TEXT,
    resolved_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feedback_user ON user_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_type ON user_feedback(type);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON user_feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_date ON user_feedback(created_at DESC);

-- ═══════════════════════════════════════════════════════════════
-- AI CHAT SESSIONS
-- For storing chat history with AI
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Chat details
    title VARCHAR(255),
    context VARCHAR(50), -- 'notes', 'quiz', 'general', 'current_affairs'
    
    -- Messages stored as JSONB array
    -- [{role: 'user', content: '...', timestamp: '...'}, ...]
    messages JSONB DEFAULT '[]'::jsonb,
    
    -- AI model info
    model VARCHAR(50),
    provider VARCHAR(50),
    
    -- Usage tracking
    tokens_used INTEGER DEFAULT 0,
    message_count INTEGER DEFAULT 0,
    
    -- Metadata
    is_archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_user ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_context ON chat_sessions(context);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_date ON chat_sessions(updated_at DESC);

-- ═══════════════════════════════════════════════════════════════
-- ENABLE RLS ON NEW TABLES
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE mock_interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════
-- RLS POLICIES
-- ═══════════════════════════════════════════════════════════════

-- Mock interviews: Users own their data
DROP POLICY IF EXISTS "Users own mock interviews" ON mock_interview_sessions;
CREATE POLICY "Users own mock interviews"
    ON mock_interview_sessions FOR ALL
    USING (user_id = public.get_user_id());

-- User feedback: Anyone can submit, admins can view all
DROP POLICY IF EXISTS "Anyone can submit feedback" ON user_feedback;
CREATE POLICY "Anyone can submit feedback"
    ON user_feedback FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view own feedback" ON user_feedback;
CREATE POLICY "Users can view own feedback"
    ON user_feedback FOR SELECT
    USING (user_id = public.get_user_id() OR public.is_admin());

DROP POLICY IF EXISTS "Admins can manage feedback" ON user_feedback;
CREATE POLICY "Admins can manage feedback"
    ON user_feedback FOR ALL
    USING (public.is_admin());

-- Chat sessions: Users own their data
DROP POLICY IF EXISTS "Users own chat sessions" ON chat_sessions;
CREATE POLICY "Users own chat sessions"
    ON chat_sessions FOR ALL
    USING (user_id = public.get_user_id());

-- ═══════════════════════════════════════════════════════════════
-- HELPER FUNCTIONS
-- ═══════════════════════════════════════════════════════════════

-- Function to add message to chat session (SQL injection safe)
CREATE OR REPLACE FUNCTION add_chat_message(
    p_session_id UUID,
    p_role VARCHAR(20),
    p_content TEXT
) RETURNS void AS $$
BEGIN
    UPDATE chat_sessions
    SET 
        messages = messages || jsonb_build_object(
            'role', p_role,
            'content', p_content,
            'timestamp', NOW()
        ),
        message_count = message_count + 1,
        updated_at = NOW()
    WHERE id = p_session_id AND user_id = public.get_user_id();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get interview statistics
CREATE OR REPLACE FUNCTION get_interview_stats(p_user_id UUID)
RETURNS TABLE(
    total_interviews INTEGER,
    avg_score NUMERIC,
    best_score INTEGER,
    total_time_seconds INTEGER,
    top_topics TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER,
        ROUND(AVG(score)::NUMERIC, 1),
        MAX(score),
        SUM(duration_seconds)::INTEGER,
        ARRAY_AGG(DISTINCT topic ORDER BY topic) FILTER (WHERE score > 70)
    FROM mock_interview_sessions
    WHERE user_id = p_user_id AND completed_at IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════════════
-- END OF MIGRATION 013
-- ═══════════════════════════════════════════════════════════════
