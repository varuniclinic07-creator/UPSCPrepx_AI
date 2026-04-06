-- ═══════════════════════════════════════════════════════════════
-- UPSC CSE MASTER - 3-HOUR LECTURE SYSTEM
-- Migration: 006_lecture_tables.sql
-- Description: Complete lecture generation and management system
-- ═══════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════
-- LECTURE JOBS
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.lecture_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Lecture Info
    topic VARCHAR(500) NOT NULL,
    subject_slug VARCHAR(100) REFERENCES subjects(slug),
    language VARCHAR(20) DEFAULT 'english',
    target_duration INTEGER DEFAULT 180, -- minutes
    
    -- Status Tracking
    status VARCHAR(20) DEFAULT 'queued' CHECK (status IN (
        'queued', 'outline', 'scripting', 'visuals', 'audio', 
        'compiling', 'merging', 'ready', 'failed'
    )),
    current_phase VARCHAR(50),
    current_chapter INTEGER DEFAULT 0,
    total_chapters INTEGER DEFAULT 18,
    progress_percent INTEGER DEFAULT 0,
    
    -- Output
    outline JSONB,
    chapters JSONB DEFAULT '[]'::jsonb,
    video_url TEXT,
    notes_pdf_url TEXT,
    
    -- Timing
    started_at TIMESTAMPTZ,
    estimated_completion TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    -- Error Handling
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    
    -- Usage Tracking
    ai_providers_used JSONB DEFAULT '{}'::jsonb, -- Track which providers used
    total_ai_calls INTEGER DEFAULT 0,
    total_cost DECIMAL(10, 4) DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_lecture_jobs_user_id ON lecture_jobs(user_id);
CREATE INDEX idx_lecture_jobs_status ON lecture_jobs(status);
CREATE INDEX idx_lecture_jobs_created_at ON lecture_jobs(created_at DESC);

-- ═══════════════════════════════════════════════════════════════
-- LECTURE CHAPTERS
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.lecture_chapters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID REFERENCES lecture_jobs(id) ON DELETE CASCADE,
    chapter_number INTEGER NOT NULL,
    
    -- Content
    title VARCHAR(255) NOT NULL,
    duration INTEGER, -- target minutes
    subtopics TEXT[],
    
    -- Generated Content
    script TEXT,
    visual_prompts JSONB, -- Array of visual descriptions
    
    -- Assets
    image_urls TEXT[],
    audio_url TEXT,
    video_segment_url TEXT,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
        'pending', 'script_ready', 'visuals_ready', 
        'audio_ready', 'compiled'
    )),
    
    -- Timing
    script_generated_at TIMESTAMPTZ,
    visuals_generated_at TIMESTAMPTZ,
    audio_generated_at TIMESTAMPTZ,
    compiled_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(job_id, chapter_number)
);

CREATE INDEX idx_lecture_chapters_job_id ON lecture_chapters(job_id);
CREATE INDEX idx_lecture_chapters_status ON lecture_chapters(status);

-- ═══════════════════════════════════════════════════════════════
-- LECTURE QUEUE (BullMQ metadata)
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.lecture_queue_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lecture_job_id UUID REFERENCES lecture_jobs(id) ON DELETE CASCADE,
    
    -- Queue Info
    queue_name VARCHAR(50) NOT NULL, -- outline, script, visuals, audio, compile
    job_data JSONB NOT NULL,
    priority INTEGER DEFAULT 5,
    
    -- Status
    status VARCHAR(20) DEFAULT 'waiting' CHECK (status IN (
        'waiting', 'active', 'completed', 'failed', 'delayed'
    )),
    
    -- Timing
    added_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    -- Results
    result JSONB,
    error TEXT,
    
    -- Retries
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_lecture_queue_jobs_lecture_job_id ON lecture_queue_jobs(lecture_job_id);
CREATE INDEX idx_lecture_queue_jobs_status ON lecture_queue_jobs(status);
CREATE INDEX idx_lecture_queue_jobs_queue_name ON lecture_queue_jobs(queue_name);

-- ═══════════════════════════════════════════════════════════════
-- USER LECTURE LIBRARY
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.user_lectures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    lecture_job_id UUID REFERENCES lecture_jobs(id) ON DELETE SET NULL,
    
    -- Lecture Info
    title VARCHAR(500) NOT NULL,
    subject_slug VARCHAR(100) REFERENCES subjects(slug),
    duration_minutes INTEGER,
    total_chapters INTEGER,
    
    -- Access
    video_url TEXT NOT NULL,
    notes_pdf_url TEXT,
    thumbnail_url TEXT,
    
    -- Engagement
    views INTEGER DEFAULT 0,
    last_watched_position INTEGER DEFAULT 0, -- seconds
    watch_progress DECIMAL(5, 2) DEFAULT 0.00, -- percentage
    is_completed BOOLEAN DEFAULT FALSE,
    is_bookmarked BOOLEAN DEFAULT FALSE,
    
    -- Rating
    user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_lectures_user_id ON user_lectures(user_id);
CREATE INDEX idx_user_lectures_subject ON user_lectures(subject_slug);

-- ═══════════════════════════════════════════════════════════════
-- LECTURE WATCH HISTORY
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.lecture_watch_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    lecture_id UUID REFERENCES user_lectures(id) ON DELETE CASCADE,
    
    -- Watch Session
    chapter_number INTEGER,
    watched_from_seconds INTEGER,
    watched_to_seconds INTEGER,
    duration_seconds INTEGER,
    
    -- Device
    device_type VARCHAR(50),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_lecture_watch_history_user_id ON lecture_watch_history(user_id);
CREATE INDEX idx_lecture_watch_history_lecture_id ON lecture_watch_history(lecture_id);

-- ═══════════════════════════════════════════════════════════════
-- LECTURE GENERATION LIMITS
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.user_lecture_limits (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    
    -- Monthly Limits (reset on subscription renewal)
    monthly_limit INTEGER,
    monthly_used INTEGER DEFAULT 0,
    monthly_reset_at TIMESTAMPTZ,
    
    -- Daily Limits
    daily_limit INTEGER,
    daily_used INTEGER DEFAULT 0,
    daily_reset_at TIMESTAMPTZ,
    
    -- Total
    total_generated INTEGER DEFAULT 0,
    
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function to check lecture generation limit
CREATE OR REPLACE FUNCTION can_generate_lecture(p_user_id UUID)
RETURNS TABLE(
    can_generate BOOLEAN,
    reason TEXT,
    monthly_remaining INTEGER,
    daily_remaining INTEGER
) AS $$
DECLARE
    v_user RECORD;
    v_limits RECORD;
    v_plan RECORD;
BEGIN
    -- Get user
    SELECT * INTO v_user FROM users WHERE id = p_user_id;
    
    -- Get plan limits
    SELECT limits->'lectures' as lecture_limits
    INTO v_plan
    FROM subscription_plans
    WHERE tier = v_user.subscription_tier;
    
    -- Get or create user limits
    INSERT INTO user_lecture_limits (user_id, monthly_limit, daily_limit, monthly_reset_at, daily_reset_at)
    VALUES (
        p_user_id,
        (v_plan.lecture_limits->>'monthly')::INTEGER,
        (v_plan.lecture_limits->>'daily')::INTEGER,
        NOW() + INTERVAL '1 month',
        NOW() + INTERVAL '1 day'
    )
    ON CONFLICT (user_id) DO UPDATE
    SET 
        monthly_limit = EXCLUDED.monthly_limit,
        daily_limit = EXCLUDED.daily_limit
    RETURNING * INTO v_limits;
    
    -- Reset if needed
    IF v_limits.monthly_reset_at < NOW() THEN
        UPDATE user_lecture_limits
        SET monthly_used = 0, monthly_reset_at = NOW() + INTERVAL '1 month'
        WHERE user_id = p_user_id
        RETURNING * INTO v_limits;
    END IF;
    
    IF v_limits.daily_reset_at < NOW() THEN
        UPDATE user_lecture_limits
        SET daily_used = 0, daily_reset_at = NOW() + INTERVAL '1 day'
        WHERE user_id = p_user_id
        RETURNING * INTO v_limits;
    END IF;
    
    -- Check limits
    IF v_limits.monthly_limit IS NOT NULL AND v_limits.monthly_used >= v_limits.monthly_limit THEN
        RETURN QUERY SELECT FALSE, 'Monthly lecture limit reached', 0, 0;
    ELSIF v_limits.daily_limit IS NOT NULL AND v_limits.daily_used >= v_limits.daily_limit THEN
        RETURN QUERY SELECT FALSE, 'Daily lecture limit reached', 
            v_limits.monthly_limit - v_limits.monthly_used, 0;
    ELSE
        RETURN QUERY SELECT TRUE, 'Can generate', 
            COALESCE(v_limits.monthly_limit - v_limits.monthly_used, 999),
            COALESCE(v_limits.daily_limit - v_limits.daily_used, 999);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to increment lecture usage
CREATE OR REPLACE FUNCTION increment_lecture_usage(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE user_lecture_limits
    SET 
        monthly_used = monthly_used + 1,
        daily_used = daily_used + 1,
        total_generated = total_generated + 1,
        updated_at = NOW()
    WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════
-- END OF MIGRATION 006
-- ═══════════════════════════════════════════════════════════════
