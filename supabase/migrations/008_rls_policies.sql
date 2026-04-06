-- ═══════════════════════════════════════════════════════════════
-- UPSC CSE MASTER - ROW LEVEL SECURITY (RLS) POLICIES
-- Migration: 008_rls_policies.sql
-- Description: Security policies for all tables
-- ═══════════════════════════════════════════════════════════════

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE current_affairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE trial_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE static_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE lecture_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE lecture_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_lectures ENABLE ROW LEVEL SECURITY;
ALTER TABLE lecture_watch_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_newspapers ENABLE ROW LEVEL SECURITY;
ALTER TABLE magazines ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenth_class_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE government_schemes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════
-- HELPER FUNCTIONS FOR POLICIES
-- Note: Cannot create functions in auth schema on Supabase Cloud
-- Using public schema with auth.uid() from Supabase
-- ═══════════════════════════════════════════════════════════════

-- Helper to get current user ID (uses built-in auth.uid())
CREATE OR REPLACE FUNCTION public.get_user_id() RETURNS UUID AS $$
  SELECT COALESCE(
    auth.uid(),
    (current_setting('request.jwt.claim.sub', true))::uuid
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin() RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE id = public.get_user_id()
    AND role IN ('admin', 'super_admin')
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_super_admin() RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE id = public.get_user_id()
    AND role = 'super_admin'
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════════════
-- USERS TABLE POLICIES
-- ═══════════════════════════════════════════════════════════════

CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (id = public.get_user_id());

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (id = public.get_user_id())
  WITH CHECK (id = public.get_user_id());

CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can update users"
  ON users FOR UPDATE
  USING (is_admin());

-- ═══════════════════════════════════════════════════════════════
-- NOTES TABLE POLICIES
-- ═══════════════════════════════════════════════════════════════

CREATE POLICY "Users can view own notes"
  ON notes FOR SELECT
  USING (user_id = public.get_user_id());

CREATE POLICY "Users can create own notes"
  ON notes FOR INSERT
  WITH CHECK (user_id = public.get_user_id());

CREATE POLICY "Users can update own notes"
  ON notes FOR UPDATE
  USING (user_id = public.get_user_id());

CREATE POLICY "Users can delete own notes"
  ON notes FOR DELETE
  USING (user_id = public.get_user_id());

-- ═══════════════════════════════════════════════════════════════
-- QUIZZES & ATTEMPTS POLICIES
-- ═══════════════════════════════════════════════════════════════

CREATE POLICY "Users can view own quizzes"
  ON quizzes FOR SELECT
  USING (user_id = public.get_user_id());

CREATE POLICY "Users can create own quizzes"
  ON quizzes FOR INSERT
  WITH CHECK (user_id = public.get_user_id());

CREATE POLICY "Users can view own quiz attempts"
  ON quiz_attempts FOR SELECT
  USING (user_id = public.get_user_id());

CREATE POLICY "Users can create own quiz attempts"
  ON quiz_attempts FOR INSERT
  WITH CHECK (user_id = public.get_user_id());

-- ═══════════════════════════════════════════════════════════════
-- CURRENT AFFAIRS POLICIES (Public for post-trial users)
-- ═══════════════════════════════════════════════════════════════

CREATE POLICY "Everyone can view current affairs"
  ON current_affairs FOR SELECT
  USING (true); -- Public access

CREATE POLICY "Admins can manage current affairs"
  ON current_affairs FOR ALL
  USING (is_admin());

-- ═══════════════════════════════════════════════════════════════
-- SUBSCRIPTION POLICIES
-- ═══════════════════════════════════════════════════════════════

CREATE POLICY "Users can view own subscriptions"
  ON user_subscriptions FOR SELECT
  USING (user_id = public.get_user_id());

CREATE POLICY "Admins can view all subscriptions"
  ON user_subscriptions FOR SELECT
  USING (is_admin());

CREATE POLICY "Users can view own payments"
  ON payment_transactions FOR SELECT
  USING (user_id = public.get_user_id());

CREATE POLICY "Users can view own invoices"
  ON invoices FOR SELECT
  USING (user_id = public.get_user_id());

CREATE POLICY "Admins can view all payments"
  ON payment_transactions FOR SELECT
  USING (is_admin());

-- ═══════════════════════════════════════════════════════════════
-- TRIAL POLICIES
-- ═══════════════════════════════════════════════════════════════

CREATE POLICY "Users can view own trial"
  ON trial_sessions FOR SELECT
  USING (user_id = public.get_user_id());

CREATE POLICY "Admins can view all trials"
  ON trial_sessions FOR SELECT
  USING (is_admin());

-- ═══════════════════════════════════════════════════════════════
-- AI PROVIDERS POLICIES (Admin only)
-- ═══════════════════════════════════════════════════════════════

CREATE POLICY "Admins can manage AI providers"
  ON ai_providers FOR ALL
  USING (is_admin());

-- ═══════════════════════════════════════════════════════════════
-- DOCUMENTS POLICIES
-- ═══════════════════════════════════════════════════════════════

CREATE POLICY "Users can view own documents"
  ON document_uploads FOR SELECT
  USING (user_id = public.get_user_id());

CREATE POLICY "Users can upload documents"
  ON document_uploads FOR INSERT
  WITH CHECK (user_id = public.get_user_id());

CREATE POLICY "Users can delete own documents"
  ON document_uploads FOR DELETE
  USING (user_id = public.get_user_id());

CREATE POLICY "Users can view own chat sessions"
  ON document_chat_sessions FOR ALL
  USING (user_id = public.get_user_id());

-- ═══════════════════════════════════════════════════════════════
-- STATIC MATERIALS POLICIES
-- ═══════════════════════════════════════════════════════════════

CREATE POLICY "Users can view public materials"
  ON static_materials FOR SELECT
  USING (is_public = true OR is_admin());

CREATE POLICY "Admins can manage materials"
  ON static_materials FOR ALL
  USING (is_admin());

-- ═══════════════════════════════════════════════════════════════
-- LECTURES POLICIES
-- ═══════════════════════════════════════════════════════════════

CREATE POLICY "Users can view own lecture jobs"
  ON lecture_jobs FOR ALL
  USING (user_id = public.get_user_id());

CREATE POLICY "Users can view own lecture chapters"
  ON lecture_chapters FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM lecture_jobs
      WHERE lecture_jobs.id = lecture_chapters.job_id
      AND lecture_jobs.user_id = public.get_user_id()
    )
  );

CREATE POLICY "Users can view own lectures"
  ON user_lectures FOR ALL
  USING (user_id = public.get_user_id());

CREATE POLICY "Users can view own watch history"
  ON lecture_watch_history FOR ALL
  USING (user_id = public.get_user_id());

-- ═══════════════════════════════════════════════════════════════
-- NEWSPAPERS & MAGAZINES POLICIES (Free for all)
-- ═══════════════════════════════════════════════════════════════

CREATE POLICY "Everyone can view newspapers"
  ON daily_newspapers FOR SELECT
  USING (is_free = true OR is_admin());

CREATE POLICY "Everyone can view magazines"
  ON magazines FOR SELECT
  USING (is_free = true OR is_admin());

CREATE POLICY "Admins can manage content"
  ON daily_newspapers FOR ALL
  USING (is_admin());

CREATE POLICY "Admins can manage magazines"
  ON magazines FOR ALL
  USING (is_admin());

-- ═══════════════════════════════════════════════════════════════
-- 10TH CLASS NOTES POLICIES
-- ═══════════════════════════════════════════════════════════════

CREATE POLICY "Users can view accessible notes"
  ON tenth_class_notes FOR SELECT
  USING (
    is_free = true 
    OR is_admin()
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id = public.get_user_id()
      AND users.subscription_tier >= min_tier
    )
  );

CREATE POLICY "Admins can manage 10th notes"
  ON tenth_class_notes FOR ALL
  USING (is_admin());

-- ═══════════════════════════════════════════════════════════════
-- GOVERNMENT SCHEMES POLICIES
-- ═══════════════════════════════════════════════════════════════

CREATE POLICY "Everyone can view schemes"
  ON government_schemes FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage schemes"
  ON government_schemes FOR ALL
  USING (is_admin());

-- ═══════════════════════════════════════════════════════════════
-- BOOKMARKS POLICIES
-- ═══════════════════════════════════════════════════════════════

CREATE POLICY "Users can manage own bookmarks"
  ON user_bookmarks FOR ALL
  USING (user_id = public.get_user_id());

-- ═══════════════════════════════════════════════════════════════
-- STUDY PLANNER POLICIES
-- ═══════════════════════════════════════════════════════════════

CREATE POLICY "Users can manage own study plans"
  ON study_plans FOR ALL
  USING (user_id = public.get_user_id());

CREATE POLICY "Users can manage own study sessions"
  ON study_sessions FOR ALL
  USING (user_id = public.get_user_id());

-- ═══════════════════════════════════════════════════════════════
-- FEATURE CONFIG POLICIES (Public read, admin write)
-- ═══════════════════════════════════════════════════════════════

CREATE POLICY "Everyone can view feature config"
  ON feature_config FOR SELECT
  USING (is_visible = true OR is_admin());

CREATE POLICY "Admins can manage features"
  ON feature_config FOR ALL
  USING (is_admin());

CREATE POLICY "Everyone can view all features"
  ON all_features FOR SELECT
  USING (is_visible = true OR is_admin());

CREATE POLICY "Admins can manage all features"
  ON all_features FOR ALL
  USING (is_admin());

-- ═══════════════════════════════════════════════════════════════
-- LEADS POLICIES (Admin only)
-- ═══════════════════════════════════════════════════════════════

CREATE POLICY "Admins can manage leads"
  ON leads FOR ALL
  USING (is_admin());

-- Allow anonymous lead creation (for landing page forms)
CREATE POLICY "Anyone can create leads"
  ON leads FOR INSERT
  WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════════
-- IP RESTRICTIONS POLICIES (Admin only)
-- ═══════════════════════════════════════════════════════════════

CREATE POLICY "Admins can view IP registrations"
  ON ip_registrations FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can manage IP rules"
  ON ip_rules FOR ALL
  USING (is_admin());

-- ═══════════════════════════════════════════════════════════════
-- END OF MIGRATION 008
-- ═══════════════════════════════════════════════════════════════
