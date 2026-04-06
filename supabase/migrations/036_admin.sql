-- ============================================================================
-- Migration 036: Admin Features & Push Notifications
-- Master Prompt v8.0 - F18-F20 (Admin, Community, Mobile)
-- ============================================================================

-- 1. Admin Audit Logs (Track admin actions)
CREATE TABLE IF NOT EXISTS admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL, -- e.g. 'SUSPEND_USER', 'GRANT_XP', 'DELETE_CONTENT'
  target_id UUID,
  target_type TEXT, -- 'USER', 'VIDEO', 'NOTE'
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. System Settings (Global configuration)
CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY, -- e.g. 'MAINTENANCE_MODE', 'MAX_VIDEO_GEN_PER_DAY'
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- 3. Mobile Offline Cache Manifest
CREATE TABLE IF NOT EXISTS offline_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL, -- 'VIDEO', 'PDF', 'NOTES'
  content_id UUID NOT NULL,
  file_url TEXT NOT NULL,
  file_size_bytes BIGINT,
  downloaded_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  UNIQUE(user_id, content_type, content_id)
);

-- 4. Push Notification Tokens
CREATE TABLE IF NOT EXISTS push_notification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  token TEXT NOT NULL, -- Expo Push Token
  device_type TEXT DEFAULT 'ANDROID',
  enabled BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, token)
);

-- Indexes
CREATE INDEX idx_admin_logs_action ON admin_logs(action);
CREATE INDEX idx_offline_cache_user ON offline_cache(user_id);
CREATE INDEX idx_push_tokens_user ON push_notification_tokens(user_id);

-- RLS
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE offline_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_notification_tokens ENABLE ROW LEVEL SECURITY;

-- Policies for Push Tokens & Offline Cache
CREATE POLICY "Users view own push tokens" ON push_notification_tokens FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users manage own push tokens" ON push_notification_tokens FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own offline cache" ON offline_cache FOR ALL USING (auth.uid() = user_id);