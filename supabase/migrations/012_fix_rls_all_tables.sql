-- ═══════════════════════════════════════════════════════════════
-- COMPREHENSIVE RLS FIX - RUN THIS IN SUPABASE SQL EDITOR
-- This enables RLS on ALL tables and adds default restrictive policies
-- ═══════════════════════════════════════════════════════════════

-- First, enable RLS on ALL tables in public schema
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public')
    LOOP
        EXECUTE 'ALTER TABLE public.' || quote_ident(r.tablename) || ' ENABLE ROW LEVEL SECURITY';
        RAISE NOTICE 'Enabled RLS on: %', r.tablename;
    END LOOP;
END $$;

-- ═══════════════════════════════════════════════════════════════
-- MISSING TABLES FROM 008 - ADD POLICIES NOW
-- ═══════════════════════════════════════════════════════════════

-- subscription_plans (public read, admin write)
DROP POLICY IF EXISTS "Everyone can view plans" ON subscription_plans;
CREATE POLICY "Everyone can view plans"
  ON subscription_plans FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage plans" ON subscription_plans;
CREATE POLICY "Admins can manage plans"
  ON subscription_plans FOR ALL USING (public.is_admin());

-- subjects (public read)
DROP POLICY IF EXISTS "Everyone can view subjects" ON subjects;
CREATE POLICY "Everyone can view subjects"
  ON subjects FOR SELECT USING (true);

-- post_trial_access_rules (admin only)
DROP POLICY IF EXISTS "Admins can manage trial rules" ON post_trial_access_rules;
CREATE POLICY "Admins can manage trial rules"
  ON post_trial_access_rules FOR ALL USING (public.is_admin());

-- agentic_web_searches (user owns)
DROP POLICY IF EXISTS "Users can view own searches" ON agentic_web_searches;
CREATE POLICY "Users can view own searches"
  ON agentic_web_searches FOR ALL USING (user_id = public.get_user_id());

-- file_search_sessions (user owns)
DROP POLICY IF EXISTS "Users can manage own file searches" ON file_search_sessions;
CREATE POLICY "Users can manage own file searches"
  ON file_search_sessions FOR ALL USING (user_id = public.get_user_id());

-- upsc_syllabus_topics (public read)
DROP POLICY IF EXISTS "Everyone can view syllabus" ON upsc_syllabus_topics;
CREATE POLICY "Everyone can view syllabus"
  ON upsc_syllabus_topics FOR SELECT USING (true);

-- content_validation_rules (admin only)
DROP POLICY IF EXISTS "Admins can manage validation rules" ON content_validation_rules;
CREATE POLICY "Admins can manage validation rules"
  ON content_validation_rules FOR ALL USING (public.is_admin());

-- agentic_orchestrator_logs (admin only)
DROP POLICY IF EXISTS "Admins can view orchestrator logs" ON agentic_orchestrator_logs;
CREATE POLICY "Admins can view orchestrator logs"
  ON agentic_orchestrator_logs FOR SELECT USING (public.is_admin());

-- lecture_queue_jobs (user owns)
DROP POLICY IF EXISTS "Users can view own queue jobs" ON lecture_queue_jobs;
CREATE POLICY "Users can view own queue jobs"
  ON lecture_queue_jobs FOR ALL USING (user_id = public.get_user_id());

-- user_lecture_limits (user owns)
DROP POLICY IF EXISTS "Users can view own limits" ON user_lecture_limits;
CREATE POLICY "Users can view own limits"
  ON user_lecture_limits FOR SELECT USING (user_id = public.get_user_id());

-- event_store (admin only)
DROP POLICY IF EXISTS "Admins can view events" ON event_store;
CREATE POLICY "Admins can view events"
  ON event_store FOR SELECT USING (public.is_admin());

-- security_audit_log (admin only)
DROP POLICY IF EXISTS "Admins can view audit logs" ON security_audit_log;
CREATE POLICY "Admins can view audit logs"
  ON security_audit_log FOR SELECT USING (public.is_admin());

-- referral_codes (user owns via user_id column)
DROP POLICY IF EXISTS "Users can view own referral code" ON referral_codes;
CREATE POLICY "Users can view own referral code"
  ON referral_codes FOR SELECT USING (user_id = public.get_user_id());
DROP POLICY IF EXISTS "Admins can manage referral codes" ON referral_codes;
CREATE POLICY "Admins can manage referral codes"
  ON referral_codes FOR ALL USING (public.is_admin());

-- referrals (user owns as referrer or referee)
DROP POLICY IF EXISTS "Users can view own referrals" ON referrals;
CREATE POLICY "Users can view own referrals"
  ON referrals FOR SELECT USING (
    referrer_id = public.get_user_id() OR referee_id = public.get_user_id()
  );

-- promo_codes (public read active only, no user_id column)
DROP POLICY IF EXISTS "Active promos visible" ON promo_codes;
CREATE POLICY "Active promos visible"
  ON promo_codes FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS "Admins can manage promos" ON promo_codes;
CREATE POLICY "Admins can manage promos"
  ON promo_codes FOR ALL USING (public.is_admin());

-- promo_code_usage (user owns)
DROP POLICY IF EXISTS "Users can view own promo usage" ON promo_code_usage;
CREATE POLICY "Users can view own promo usage"
  ON promo_code_usage FOR SELECT USING (user_id = public.get_user_id());

-- notifications (user owns)
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT USING (user_id = public.get_user_id());
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE USING (user_id = public.get_user_id());

-- notification_preferences (user_id is PRIMARY KEY, not regular column)
DROP POLICY IF EXISTS "Users can manage own notification prefs" ON notification_preferences;
CREATE POLICY "Users can manage own notification prefs"
  ON notification_preferences FOR ALL USING (user_id = public.get_user_id());

-- onboarding_progress (user_id is PRIMARY KEY, not regular column)
DROP POLICY IF EXISTS "Users can manage own onboarding" ON onboarding_progress;
CREATE POLICY "Users can manage own onboarding"
  ON onboarding_progress FOR ALL USING (user_id = public.get_user_id());

-- ═══════════════════════════════════════════════════════════════
-- VERIFY RLS STATUS
-- ═══════════════════════════════════════════════════════════════

SELECT 
    t.tablename,
    CASE WHEN c.relrowsecurity THEN '✅ Protected' ELSE '❌ UNPROTECTED!' END as rls_status
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
WHERE t.schemaname = 'public'
ORDER BY t.tablename;
