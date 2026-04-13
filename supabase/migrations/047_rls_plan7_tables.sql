-- 047_rls_plan7_tables.sql
-- RLS policies for tables created in Plans 1-7
-- Uses existing helpers: public.get_user_id(), public.is_admin()

-- ─── Enable RLS ─────────────────────────────────────────────────
ALTER TABLE knowledge_nodes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_edges           ENABLE ROW LEVEL SECURITY;
ALTER TABLE upsc_input_normalizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_mastery              ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_queue             ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_runs                ENABLE ROW LEVEL SECURITY;

-- ─── knowledge_nodes: public read, admin write ──────────────────
CREATE POLICY "knowledge_nodes_public_read"
  ON knowledge_nodes FOR SELECT USING (true);
CREATE POLICY "knowledge_nodes_admin_write"
  ON knowledge_nodes FOR ALL USING (public.is_admin());

-- ─── knowledge_edges: public read, admin write ──────────────────
CREATE POLICY "knowledge_edges_public_read"
  ON knowledge_edges FOR SELECT USING (true);
CREATE POLICY "knowledge_edges_admin_write"
  ON knowledge_edges FOR ALL USING (public.is_admin());

-- ─── upsc_input_normalizations: public read, admin write ────────
CREATE POLICY "normalizations_public_read"
  ON upsc_input_normalizations FOR SELECT USING (true);
CREATE POLICY "normalizations_admin_write"
  ON upsc_input_normalizations FOR ALL USING (public.is_admin());

-- ─── user_mastery: user owns, admin full ────────────────────────
CREATE POLICY "user_mastery_own_select"
  ON user_mastery FOR SELECT
  USING (user_id = public.get_user_id() OR public.is_admin());
CREATE POLICY "user_mastery_own_insert"
  ON user_mastery FOR INSERT
  WITH CHECK (user_id = public.get_user_id() OR public.is_admin());
CREATE POLICY "user_mastery_own_update"
  ON user_mastery FOR UPDATE
  USING (user_id = public.get_user_id() OR public.is_admin());
CREATE POLICY "user_mastery_admin_delete"
  ON user_mastery FOR DELETE USING (public.is_admin());

-- ─── content_queue: admin only ──────────────────────────────────
CREATE POLICY "content_queue_admin"
  ON content_queue FOR ALL USING (public.is_admin());

-- ─── agent_runs: admin only ────────────────────────────────────
CREATE POLICY "agent_runs_admin"
  ON agent_runs FOR ALL USING (public.is_admin());
