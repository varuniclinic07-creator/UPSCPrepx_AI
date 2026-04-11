-- ═══════════════════════════════════════════════════════════════
-- EDGE COMPUTING ADMIN CONTROL SYSTEM
-- Migration: 018_edge_computing_admin_control.sql
-- Description: Usage tracking, feature flags, remote commands for mobile edge computing
-- ═══════════════════════════════════════════════════════════════

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ═══════════════════════════════════════════════════════════════
-- USAGE TRACKING
-- Track all feature usage per user for quota enforcement
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.usage_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    feature VARCHAR(100) NOT NULL,
    duration_seconds INTEGER,
    quality VARCHAR(50),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast querying
CREATE INDEX IF NOT EXISTS idx_usage_user_id ON public.usage_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_feature ON public.usage_tracking(feature);
CREATE INDEX IF NOT EXISTS idx_usage_created_at ON public.usage_tracking(created_at);
CREATE INDEX IF NOT EXISTS idx_usage_user_feature_date 
    ON public.usage_tracking(user_id, feature, created_at);

-- Comments
COMMENT ON TABLE public.usage_tracking IS 'Tracks feature usage per user for quota enforcement';
COMMENT ON COLUMN public.usage_tracking.metadata IS 'Additional context like video_id, quality, etc.';

-- ═══════════════════════════════════════════════════════════════
-- FEATURE FLAGS (ADMIN CONTROL)
-- Admin can enable/disable features globally or by plan
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.feature_flags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    feature_key VARCHAR(100) UNIQUE NOT NULL,
    feature_name VARCHAR(255) NOT NULL,
    is_enabled BOOLEAN DEFAULT true NOT NULL,
    plan_restrictions JSONB DEFAULT '{"free": false, "basic": true, "premium": true, "premium_plus": true}'::jsonb,
    global_limit INTEGER DEFAULT -1,  -- -1 for unlimited
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_feature_flags_key ON public.feature_flags(feature_key);

-- Comments
COMMENT ON TABLE public.feature_flags IS 'Admin-controlled feature flags for remote enable/disable';
COMMENT ON COLUMN public.feature_flags.plan_restrictions IS 'JSON: {"free": true/false, "basic": true/false, ...}';
COMMENT ON COLUMN public.feature_flags.global_limit IS '-1 = unlimited, otherwise max uses per day';

-- Insert default feature flags
INSERT INTO public.feature_flags (feature_key, feature_name, is_enabled, plan_restrictions, global_limit, description) VALUES
('video_generation', 'AI Video Generation', true, '{"free": false, "basic": true, "premium": true, "premium_plus": true}', -1, 'Generate lecture videos using Remotion'),
('animation_generation', 'AI Animation Generation', true, '{"free": false, "basic": false, "premium": true, "premium_plus": true}', -1, 'Create animations using Manim'),
('ai_notes', 'AI Smart Notes', true, '{"free": true, "basic": true, "premium": true, "premium_plus": true}', -1, 'Generate smart notes from syllabus'),
('answer_evaluation', 'AI Answer Evaluation', true, '{"free": false, "basic": true, "premium": true, "premium_plus": true}', -1, 'Evaluate UPSC Mains-style answers'),
('quiz_generation', 'AI Quiz Generation', true, '{"free": true, "basic": true, "premium": true, "premium_plus": true}', -1, 'Generate quizzes from topics'),
('spaced_repetition', 'Spaced Repetition System', true, '{"free": true, "basic": true, "premium": true, "premium_plus": true}', -1, 'Flashcard-based learning with SM-2 algorithm')
ON CONFLICT (feature_key) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════
-- USER STATISTICS (AGGREGATED)
-- Pre-computed statistics for fast dashboard loading
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.user_statistics (
    user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    total_videos_generated INTEGER DEFAULT 0 NOT NULL,
    total_animations_generated INTEGER DEFAULT 0 NOT NULL,
    total_video_duration_seconds INTEGER DEFAULT 0 NOT NULL,
    last_video_generated_at TIMESTAMPTZ,
    total_api_calls INTEGER DEFAULT 0 NOT NULL,
    total_storage_used_bytes BIGINT DEFAULT 0 NOT NULL,
    total_notes_generated INTEGER DEFAULT 0 NOT NULL,
    total_quizzes_attempted INTEGER DEFAULT 0 NOT NULL,
    average_quiz_score NUMERIC(5,2) DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for admin queries
CREATE INDEX IF NOT EXISTS idx_user_statistics_total_videos 
    ON public.user_statistics(total_videos_generated DESC);

-- Comments
COMMENT ON TABLE public.user_statistics IS 'Aggregated user statistics for fast dashboard loading';

-- ═══════════════════════════════════════════════════════════════
-- REMOTE COMMANDS (ADMIN → MOBILE)
-- Admin can send commands to mobile clients
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.remote_commands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    command_type VARCHAR(50) NOT NULL CHECK (command_type IN (
        'enable_feature',
        'disable_feature',
        'reset_limits',
        'force_upgrade',
        'clear_cache',
        'update_config'
    )),
    command_params JSONB DEFAULT '{}'::jsonb,
    is_executed BOOLEAN DEFAULT false NOT NULL,
    executed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

-- Indexes for mobile polling
CREATE INDEX IF NOT EXISTS idx_remote_commands_user_id ON public.remote_commands(user_id);
CREATE INDEX IF NOT EXISTS idx_remote_commands_executed 
    ON public.remote_commands(is_executed) WHERE is_executed = false;
CREATE INDEX IF NOT EXISTS idx_remote_commands_expires 
    ON public.remote_commands(expires_at) WHERE expires_at IS NOT NULL;

-- Comments
COMMENT ON TABLE public.remote_commands IS 'Admin commands to mobile clients for remote control';
COMMENT ON COLUMN public.remote_commands.command_params IS 'Command-specific parameters';

-- ═══════════════════════════════════════════════════════════════
-- API KEY STORAGE (USER GROQ KEYS)
-- Encrypted storage for user-provided API keys
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.user_api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    provider VARCHAR(50) NOT NULL CHECK (provider IN ('groq', 'openai', 'anthropic')),
    encrypted_key TEXT NOT NULL,
    key_hash VARCHAR(64) NOT NULL,  -- For validation without decryption
    is_active BOOLEAN DEFAULT true NOT NULL,
    last_validated TIMESTAMPTZ,
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, provider)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_api_keys_user_id ON public.user_api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_user_api_keys_provider ON public.user_api_keys(provider);

-- Comments
COMMENT ON TABLE public.user_api_keys IS 'Encrypted storage for user-provided API keys (Groq, etc.)';
COMMENT ON COLUMN public.user_api_keys.key_hash IS 'SHA-256 hash for validation without decrypting';

-- ═══════════════════════════════════════════════════════════════
-- VIDEO GENERATION TASKS
-- Track video generation tasks for status polling
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.video_generation_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    topic VARCHAR(500) NOT NULL,
    subtopic VARCHAR(500),
    duration_minutes INTEGER DEFAULT 5 NOT NULL,
    include_animation BOOLEAN DEFAULT true NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' NOT NULL 
        CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    script_text TEXT,
    storyboard_json JSONB,
    remotion_output_url TEXT,
    manim_output_url TEXT,
    final_video_url TEXT,
    thumbnail_url TEXT,
    error_message TEXT,
    groq_api_calls INTEGER DEFAULT 0,
    processing_time_seconds INTEGER,
    quality VARCHAR(50) DEFAULT '720p',
    file_size_bytes BIGINT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ
);

-- Indexes for user queries
CREATE INDEX IF NOT EXISTS idx_video_tasks_user_id ON public.video_generation_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_video_tasks_status ON public.video_generation_tasks(status);
CREATE INDEX IF NOT EXISTS idx_video_tasks_created_at 
    ON public.video_generation_tasks(created_at DESC);

-- Comments
COMMENT ON TABLE public.video_generation_tasks IS 'Track video generation tasks for status polling';
COMMENT ON COLUMN public.video_generation_tasks.storyboard_json IS 'Scene-by-scene storyboard generated by AI';

-- ═══════════════════════════════════════════════════════════════
-- FUNCTION: UPDATE USER STATISTICS
-- Automatically update statistics on usage insert
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.update_user_statistics_on_usage()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert or update user statistics
    INSERT INTO public.user_statistics (user_id, total_videos_generated, total_video_duration_seconds, last_video_generated_at, updated_at)
    VALUES (
        NEW.user_id,
        CASE WHEN NEW.feature = 'video_generation' THEN 1 ELSE 0 END,
        CASE WHEN NEW.feature = 'video_generation' THEN COALESCE(NEW.duration_seconds, 0) ELSE 0 END,
        CASE WHEN NEW.feature = 'video_generation' THEN NEW.created_at ELSE NULL END,
        NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        total_videos_generated = user_statistics.total_videos_generated + 
            CASE WHEN NEW.feature = 'video_generation' THEN 1 ELSE 0 END,
        total_video_duration_seconds = user_statistics.total_video_duration_seconds + 
            CASE WHEN NEW.feature = 'video_generation' THEN COALESCE(NEW.duration_seconds, 0) ELSE 0 END,
        last_video_generated_at = CASE 
            WHEN NEW.feature = 'video_generation' THEN NEW.created_at 
            ELSE user_statistics.last_video_generated_at 
        END,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for automatic statistics update
DROP TRIGGER IF EXISTS trg_update_user_statistics ON public.usage_tracking;
CREATE TRIGGER trg_update_user_statistics
    AFTER INSERT ON public.usage_tracking
    FOR EACH ROW
    EXECUTE FUNCTION public.update_user_statistics_on_usage();

-- ═══════════════════════════════════════════════════════════════
-- FUNCTION: CHECK DAILY USAGE
-- Returns daily usage count for a user and feature
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.get_daily_usage(
    p_user_id UUID,
    p_feature VARCHAR(100)
)
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM public.usage_tracking
    WHERE user_id = p_user_id
      AND feature = p_feature
      AND created_at >= date_trunc('day', NOW());
    
    RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════
-- FUNCTION: CHECK MONTHLY USAGE
-- Returns monthly usage count for a user and feature
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.get_monthly_usage(
    p_user_id UUID,
    p_feature VARCHAR(100)
)
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM public.usage_tracking
    WHERE user_id = p_user_id
      AND feature = p_feature
      AND created_at >= date_trunc('month', NOW());
    
    RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════
-- FUNCTION: GET PENDING REMOTE COMMANDS
-- Returns unexecuted commands for a user
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.get_pending_remote_commands(
    p_user_id UUID
)
RETURNS TABLE (
    id UUID,
    command_type VARCHAR(50),
    command_params JSONB,
    created_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT rc.id, rc.command_type, rc.command_params, rc.created_at, rc.expires_at
    FROM public.remote_commands rc
    WHERE rc.user_id = p_user_id
      AND rc.is_executed = false
      AND (rc.expires_at IS NULL OR rc.expires_at > NOW())
    ORDER BY rc.created_at ASC;
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Ensure users can only access their own data
-- ═══════════════════════════════════════════════════════════════

-- Enable RLS on all new tables
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.remote_commands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_generation_tasks ENABLE ROW LEVEL SECURITY;

-- Usage tracking: Users can only see their own usage
DROP POLICY IF EXISTS "Users can view own usage" ON public.usage_tracking;
CREATE POLICY "Users can view own usage" ON public.usage_tracking
    FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Service role can insert usage" ON public.usage_tracking;
CREATE POLICY "Service role can insert usage" ON public.usage_tracking
    FOR INSERT WITH CHECK (auth.uid() IS NULL);  -- Service role only

-- Feature flags: Public read (for mobile app to check)
DROP POLICY IF EXISTS "Public can view feature flags" ON public.feature_flags;
CREATE POLICY "Public can view feature flags" ON public.feature_flags
    FOR SELECT USING (true);

-- User statistics: Users can only see their own stats
DROP POLICY IF EXISTS "Users can view own statistics" ON public.user_statistics;
CREATE POLICY "Users can view own statistics" ON public.user_statistics
    FOR SELECT USING (user_id = auth.uid());

-- Remote commands: Users can only see their own commands
DROP POLICY IF EXISTS "Users can view own commands" ON public.remote_commands;
CREATE POLICY "Users can view own commands" ON public.remote_commands
    FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Service role can insert commands" ON public.remote_commands;
CREATE POLICY "Service role can insert commands" ON public.remote_commands
    FOR INSERT WITH CHECK (auth.uid() IS NULL);  -- Service role only

DROP POLICY IF EXISTS "Users can mark commands as executed" ON public.remote_commands;
CREATE POLICY "Users can mark commands as executed" ON public.remote_commands
    FOR UPDATE USING (user_id = auth.uid())
    WITH CHECK (is_executed = true);

-- User API keys: Users can only see their own keys
DROP POLICY IF EXISTS "Users can view own API keys" ON public.user_api_keys;
CREATE POLICY "Users can view own API keys" ON public.user_api_keys
    FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own API keys" ON public.user_api_keys;
CREATE POLICY "Users can insert own API keys" ON public.user_api_keys
    FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own API keys" ON public.user_api_keys;
CREATE POLICY "Users can update own API keys" ON public.user_api_keys
    FOR UPDATE USING (user_id = auth.uid());

-- Video generation tasks: Users can only see their own tasks
DROP POLICY IF EXISTS "Users can view own video tasks" ON public.video_generation_tasks;
CREATE POLICY "Users can view own video tasks" ON public.video_generation_tasks
    FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own video tasks" ON public.video_generation_tasks;
CREATE POLICY "Users can insert own video tasks" ON public.video_generation_tasks
    FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own video tasks" ON public.video_generation_tasks;
CREATE POLICY "Users can update own video tasks" ON public.video_generation_tasks
    FOR UPDATE USING (user_id = auth.uid());

-- ═══════════════════════════════════════════════════════════════
-- SEED DATA FOR FEATURE FLAGS
-- ═══════════════════════════════════════════════════════════════

-- Update feature flags if they already exist
UPDATE public.feature_flags SET
    is_enabled = true,
    updated_at = NOW()
WHERE feature_key IN ('video_generation', 'animation_generation', 'ai_notes', 'answer_evaluation');

-- ═══════════════════════════════════════════════════════════════
-- VERIFICATION QUERIES
-- ═══════════════════════════════════════════════════════════════

-- Verify tables created
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' AND table_name LIKE '%usage%';

-- Verify feature flags
-- SELECT feature_key, feature_name, is_enabled FROM public.feature_flags;

-- Verify functions
-- SELECT routine_name FROM information_schema.routines 
-- WHERE routine_schema = 'public' AND routine_type = 'FUNCTION';

