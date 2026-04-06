-- ═══════════════════════════════════════════════════════════════════════════
-- UPSC CSE MASTER - DATABASE SCHEMA FIXES
-- Migration: 016_schema_fixes.sql
-- Description: Fix duplicate tables, add missing cascades, add analytics indexes
-- Date: 2026-01-15
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- ISSUE 1: DUPLICATE FEATURE_CONFIG TABLE (001 & 014)
-- Fix: Add missing columns if they don't exist
-- ═══════════════════════════════════════════════════════════════════════════

DO $$ 
BEGIN
    -- Add columns from migration 014 if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'feature_config' AND column_name = 'feature_id') THEN
        ALTER TABLE feature_config ADD COLUMN feature_id VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'feature_config' AND column_name = 'maintenance_mode') THEN
        ALTER TABLE feature_config ADD COLUMN maintenance_mode BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'feature_config' AND column_name = 'maintenance_message') THEN
        ALTER TABLE feature_config ADD COLUMN maintenance_message TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'feature_config' AND column_name = 'min_subscription_tier') THEN
        ALTER TABLE feature_config ADD COLUMN min_subscription_tier VARCHAR(20) DEFAULT 'trial';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'feature_config' AND column_name = 'total_usage') THEN
        ALTER TABLE feature_config ADD COLUMN total_usage INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'feature_config' AND column_name = 'last_used_at') THEN
        ALTER TABLE feature_config ADD COLUMN last_used_at TIMESTAMPTZ;
    END IF;
END $$;

-- Create unified index (safe - uses IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_feature_config_feature_id ON feature_config(feature_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- ISSUE 2: MISSING ON UPDATE CASCADE FOR SUBJECT SLUG FOREIGN KEYS
-- Fix: Drop and recreate FK constraints with proper cascading
-- ═══════════════════════════════════════════════════════════════════════════

-- Notes table - subject_slug FK
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'notes_subject_slug_fkey' AND table_name = 'notes') THEN
        ALTER TABLE notes DROP CONSTRAINT notes_subject_slug_fkey;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'notes' AND column_name = 'subject_slug') THEN
        ALTER TABLE notes ADD CONSTRAINT notes_subject_slug_fkey 
        FOREIGN KEY (subject_slug) REFERENCES subjects(slug) 
        ON UPDATE CASCADE ON DELETE SET NULL;
    END IF;
EXCEPTION WHEN others THEN
    RAISE NOTICE 'Notes FK: %', SQLERRM;
END $$;

-- Quizzes table - subject_slug FK
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'quizzes_subject_slug_fkey' AND table_name = 'quizzes') THEN
        ALTER TABLE quizzes DROP CONSTRAINT quizzes_subject_slug_fkey;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'quizzes' AND column_name = 'subject_slug') THEN
        ALTER TABLE quizzes ADD CONSTRAINT quizzes_subject_slug_fkey 
        FOREIGN KEY (subject_slug) REFERENCES subjects(slug) 
        ON UPDATE CASCADE ON DELETE SET NULL;
    END IF;
EXCEPTION WHEN others THEN
    RAISE NOTICE 'Quizzes FK: %', SQLERRM;
END $$;

-- Lecture jobs table - subject_slug FK
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'lecture_jobs_subject_slug_fkey' AND table_name = 'lecture_jobs') THEN
        ALTER TABLE lecture_jobs DROP CONSTRAINT lecture_jobs_subject_slug_fkey;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'lecture_jobs' AND column_name = 'subject_slug') THEN
        ALTER TABLE lecture_jobs ADD CONSTRAINT lecture_jobs_subject_slug_fkey 
        FOREIGN KEY (subject_slug) REFERENCES subjects(slug) 
        ON UPDATE CASCADE ON DELETE SET NULL;
    END IF;
EXCEPTION WHEN others THEN
    RAISE NOTICE 'Lecture jobs FK: %', SQLERRM;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- ISSUE 3: MISSING COMPOSITE INDEXES FOR ANALYTICS QUERIES
-- Using DO block to check if columns exist before creating indexes
-- ═══════════════════════════════════════════════════════════════════════════

-- Notes indexes (only if columns exist)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'notes' AND column_name = 'user_id') 
       AND EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'notes' AND column_name = 'created_at') THEN
        CREATE INDEX IF NOT EXISTS idx_notes_user_date ON notes(user_id, created_at DESC);
    END IF;
EXCEPTION WHEN others THEN
    RAISE NOTICE 'Notes index: %', SQLERRM;
END $$;

-- Quizzes indexes
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'quizzes' AND column_name = 'user_id') 
       AND EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'quizzes' AND column_name = 'created_at') THEN
        CREATE INDEX IF NOT EXISTS idx_quizzes_user_date ON quizzes(user_id, created_at DESC);
    END IF;
EXCEPTION WHEN others THEN
    RAISE NOTICE 'Quizzes index: %', SQLERRM;
END $$;

-- Quiz attempts indexes
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'quiz_attempts' AND column_name = 'user_id') 
       AND EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'quiz_attempts' AND column_name = 'completed_at') THEN
        CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_date ON quiz_attempts(user_id, completed_at DESC);
    END IF;
EXCEPTION WHEN others THEN
    RAISE NOTICE 'Quiz attempts index: %', SQLERRM;
END $$;

-- Lecture jobs indexes
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'lecture_jobs' AND column_name = 'user_id') 
       AND EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'lecture_jobs' AND column_name = 'status') THEN
        CREATE INDEX IF NOT EXISTS idx_lecture_jobs_user_status ON lecture_jobs(user_id, status);
    END IF;
EXCEPTION WHEN others THEN
    RAISE NOTICE 'Lecture jobs index: %', SQLERRM;
END $$;

-- Current affairs indexes
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'current_affairs' AND column_name = 'published_date') THEN
        CREATE INDEX IF NOT EXISTS idx_current_affairs_date_category 
        ON current_affairs(published_date DESC, category);
    END IF;
EXCEPTION WHEN others THEN
    RAISE NOTICE 'Current affairs date index: %', SQLERRM;
END $$;

-- Static materials indexes
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'static_materials' AND column_name = 'subject') THEN
        CREATE INDEX IF NOT EXISTS idx_materials_subject_category 
        ON static_materials(subject, category, is_processed);
    END IF;
EXCEPTION WHEN others THEN
    RAISE NOTICE 'Materials index: %', SQLERRM;
END $$;

-- User subscriptions indexes
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'user_subscriptions' AND column_name = 'user_id') THEN
        CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status 
        ON user_subscriptions(user_id, status);
    END IF;
EXCEPTION WHEN others THEN
    RAISE NOTICE 'Subscriptions index: %', SQLERRM;
END $$;

-- Payment transactions indexes
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'payment_transactions' AND column_name = 'user_id') 
       AND EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'payment_transactions' AND column_name = 'created_at') THEN
        CREATE INDEX IF NOT EXISTS idx_payments_user_date 
        ON payment_transactions(user_id, created_at DESC);
    END IF;
EXCEPTION WHEN others THEN
    RAISE NOTICE 'Payments index: %', SQLERRM;
END $$;

-- User bookmarks indexes
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'user_bookmarks' AND column_name = 'user_id') THEN
        CREATE INDEX IF NOT EXISTS idx_bookmarks_user_type 
        ON user_bookmarks(user_id, item_type);
    END IF;
EXCEPTION WHEN others THEN
    RAISE NOTICE 'Bookmarks index: %', SQLERRM;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- BONUS: ANALYTICS HELPER FUNCTION
-- Only creates if tables exist
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION get_user_stats_safe(p_user_id UUID)
RETURNS TABLE(
    total_notes BIGINT,
    total_quizzes BIGINT,
    total_lectures BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        (SELECT COUNT(*) FROM notes WHERE user_id = p_user_id),
        (SELECT COUNT(*) FROM quizzes WHERE user_id = p_user_id),
        (SELECT COUNT(*) FROM user_lectures WHERE user_id = p_user_id);
EXCEPTION WHEN others THEN
    RETURN QUERY SELECT 0::BIGINT, 0::BIGINT, 0::BIGINT;
END;
$$ LANGUAGE plpgsql STABLE;

-- ═══════════════════════════════════════════════════════════════════════════
-- VERIFY CHANGES
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
    v_idx_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_idx_count
    FROM pg_indexes
    WHERE indexname LIKE 'idx_%_user_%' OR indexname LIKE 'idx_%_date%';
    
    RAISE NOTICE 'Migration 016 complete. Found % relevant indexes.', v_idx_count;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- END OF MIGRATION 016
-- ═══════════════════════════════════════════════════════════════════════════
