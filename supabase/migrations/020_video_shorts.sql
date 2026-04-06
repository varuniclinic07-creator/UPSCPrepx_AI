-- BMAD Phase 4: Feature 6 - 60-Second Video Shorts
-- Migration: 020_video_shorts.sql
-- Date: 2026-04-05
-- Description: Video shorts library for social media and revision
-- AI Providers: 9Router → Groq → Ollama (NOT A4F)

-- ============ VIDEO SHORTS LIBRARY ============

-- Video Shorts (60-second UPSC explainers)
CREATE TABLE IF NOT EXISTS video_shorts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(500) NOT NULL,
  topic VARCHAR(500) NOT NULL,
  subject VARCHAR(100) NOT NULL CHECK (subject IN ('GS1', 'GS2', 'GS3', 'GS4', 'CSAT', 'Essay', 'Prelims', 'Optional', 'Current Affairs')),
  description TEXT,
  script TEXT NOT NULL,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration_seconds INTEGER DEFAULT 60,
  resolution VARCHAR(50) DEFAULT '1080x1920', -- Vertical for Shorts/Reels
  format VARCHAR(50) DEFAULT 'mp4',
  file_size_bytes BIGINT,
  views_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  downloads_count INTEGER DEFAULT 0,
  is_premium BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT true,
  seo_tags TEXT[],
  social_caption TEXT,
  hashtags TEXT[],
  ai_provider_used VARCHAR(100), -- Which AI generated the script
  has_manim_visuals BOOLEAN DEFAULT true,
  has_tts_audio BOOLEAN DEFAULT true,
  has_captions BOOLEAN DEFAULT true,
  language VARCHAR(50) DEFAULT 'english',
  generated_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Video Generation Queue
CREATE TABLE IF NOT EXISTS video_generation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  topic VARCHAR(500) NOT NULL,
  subject VARCHAR(100),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'script_generating', 'script_ready', 'audio_generating', 'audio_ready', 'video_rendering', 'completed', 'failed')),
  progress INTEGER DEFAULT 0,
  script TEXT,
  video_url TEXT,
  thumbnail_url TEXT,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  priority INTEGER DEFAULT 0,
  estimated_completion_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Social Media Posts (for scheduling)
CREATE TABLE IF NOT EXISTS video_social_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID REFERENCES video_shorts(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL CHECK (platform IN ('youtube', 'instagram', 'facebook', 'twitter', 'tiktok', 'linkedin')),
  post_status VARCHAR(50) DEFAULT 'draft' CHECK (post_status IN ('draft', 'scheduled', 'posted', 'failed')),
  scheduled_at TIMESTAMP WITH TIME ZONE,
  posted_at TIMESTAMP WITH TIME ZONE,
  post_url TEXT,
  post_id TEXT, -- Platform's post ID
  caption TEXT,
  hashtags TEXT[],
  engagement_data JSONB DEFAULT '{}', -- likes, comments, shares from platform
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User video bookmarks
CREATE TABLE IF NOT EXISTS user_video_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  video_id UUID REFERENCES video_shorts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, video_id)
);

-- User video likes
CREATE TABLE IF NOT EXISTS user_video_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  video_id UUID REFERENCES video_shorts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, video_id)
);

-- Video analytics (daily stats)
CREATE TABLE IF NOT EXISTS video_analytics_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID REFERENCES video_shorts(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  downloads INTEGER DEFAULT 0,
  avg_watch_time_seconds INTEGER DEFAULT 0,
  completion_rate DECIMAL(5,2) DEFAULT 0, -- Percentage who watched full video
  traffic_source JSONB DEFAULT '{}', -- {youtube: 50, instagram: 30, direct: 20}
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(video_id, date)
);

-- ============ INDEXES ============

-- Video shorts indexes
CREATE INDEX IF NOT EXISTS video_shorts_subject_idx ON video_shorts(subject);
CREATE INDEX IF NOT EXISTS video_shorts_published_idx ON video_shorts(is_published) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS video_shorts_created_at_idx ON video_shorts(created_at DESC);
CREATE INDEX IF NOT EXISTS video_shorts_premium_idx ON video_shorts(is_premium);
CREATE INDEX IF NOT EXISTS video_shorts_topic_idx ON video_shorts USING GIN(to_tsvector('english', topic));
CREATE INDEX IF NOT EXISTS video_shorts_seo_tags_idx ON video_shorts USING GIN(seo_tags);

-- Generation queue indexes
CREATE INDEX IF NOT EXISTS video_generation_queue_status_idx ON video_generation_queue(status);
CREATE INDEX IF NOT EXISTS video_generation_queue_user_idx ON video_generation_queue(user_id);
CREATE INDEX IF NOT EXISTS video_generation_queue_created_idx ON video_generation_queue(created_at DESC);

-- Social posts indexes
CREATE INDEX IF NOT EXISTS video_social_posts_platform_idx ON video_social_posts(platform);
CREATE INDEX IF NOT EXISTS video_social_posts_status_idx ON video_social_posts(post_status);
CREATE INDEX IF NOT EXISTS video_social_posts_scheduled_idx ON video_social_posts(scheduled_at) WHERE scheduled_at IS NOT NULL;

-- Bookmarks and likes indexes
CREATE INDEX IF NOT EXISTS user_video_bookmarks_user_idx ON user_video_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS user_video_likes_user_idx ON user_video_likes(user_id);

-- Analytics index
CREATE INDEX IF NOT EXISTS video_analytics_daily_video_date_idx ON video_analytics_daily(video_id, date DESC);

-- ============ ROW LEVEL SECURITY (RLS) ============

ALTER TABLE video_shorts ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_generation_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_video_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_video_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_analytics_daily ENABLE ROW LEVEL SECURITY;

-- Video shorts: Public read for published videos
CREATE POLICY "video_shorts_public_read" ON video_shorts
  FOR SELECT 
  USING (is_published = true);

-- Video shorts: Authenticated users can insert (via API)
CREATE POLICY "video_shorts_auth_insert" ON video_shorts
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

-- Video shorts: Only creators/admins can update
CREATE POLICY "video_shorts_user_update" ON video_shorts
  FOR UPDATE 
  USING (auth.uid() = generated_by OR auth.jwt()->>'role' = 'admin');

-- Generation queue: Users can read their own
CREATE POLICY "video_generation_queue_user_read" ON video_generation_queue
  FOR SELECT 
  USING (auth.uid() = user_id OR auth.jwt()->>'role' = 'admin');

-- Generation queue: Users can insert their own
CREATE POLICY "video_generation_queue_user_insert" ON video_generation_queue
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Social posts: Only admins can manage
CREATE POLICY "video_social_posts_admin" ON video_social_posts
  FOR ALL 
  USING (auth.jwt()->>'role' = 'admin')
  WITH CHECK (auth.jwt()->>'role' = 'admin');

-- User bookmarks: Users can manage their own
CREATE POLICY "user_video_bookmarks_user" ON user_video_bookmarks
  FOR ALL 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- User likes: Users can manage their own
CREATE POLICY "user_video_likes_user" ON user_video_likes
  FOR ALL 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Analytics: Public read
CREATE POLICY "video_analytics_daily_public_read" ON video_analytics_daily
  FOR SELECT 
  USING (true);

-- Analytics: Only admins can insert
CREATE POLICY "video_analytics_daily_admin_insert" ON video_analytics_daily
  FOR INSERT 
  WITH CHECK (auth.jwt()->>'role' = 'admin');

-- ============ FUNCTIONS ============

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_video_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_video_shorts_updated_at
  BEFORE UPDATE ON video_shorts
  FOR EACH ROW
  EXECUTE FUNCTION update_video_updated_at_column();

CREATE TRIGGER update_video_social_posts_updated_at
  BEFORE UPDATE ON video_social_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_video_updated_at_column();

-- Function to increment video views
CREATE OR REPLACE FUNCTION increment_video_views(video_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE video_shorts 
  SET views_count = views_count + 1 
  WHERE id = video_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to toggle video like
CREATE OR REPLACE FUNCTION toggle_video_like(video_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  is_liked BOOLEAN;
BEGIN
  IF EXISTS (SELECT 1 FROM user_video_likes WHERE user_id = auth.uid() AND video_id = toggle_video_like.video_id) THEN
    -- Unlike
    DELETE FROM user_video_likes WHERE user_id = auth.uid() AND video_id = toggle_video_like.video_id;
    UPDATE video_shorts SET likes_count = GREATEST(0, likes_count - 1) WHERE id = video_id;
    is_liked := false;
  ELSE
    -- Like
    INSERT INTO user_video_likes (user_id, video_id) VALUES (auth.uid(), video_id);
    UPDATE video_shorts SET likes_count = likes_count + 1 WHERE id = video_id;
    is_liked := true;
  END IF;
  RETURN is_liked;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record daily analytics
CREATE OR REPLACE FUNCTION record_video_analytics(
  p_video_id UUID,
  p_views INTEGER DEFAULT 0,
  p_likes INTEGER DEFAULT 0,
  p_shares INTEGER DEFAULT 0,
  p_downloads INTEGER DEFAULT 0,
  p_avg_watch_time INTEGER DEFAULT 0,
  p_completion_rate DECIMAL DEFAULT 0,
  p_traffic_source JSONB DEFAULT '{}'
)
RETURNS void AS $$
BEGIN
  INSERT INTO video_analytics_daily (
    video_id, date, views, likes, shares, downloads, 
    avg_watch_time_seconds, completion_rate, traffic_source
  )
  VALUES (
    p_video_id, CURRENT_DATE, p_views, p_likes, p_shares, p_downloads,
    p_avg_watch_time, p_completion_rate, p_traffic_source
  )
  ON CONFLICT (video_id, date) DO UPDATE SET
    views = video_analytics_daily.views + p_views,
    likes = video_analytics_daily.likes + p_likes,
    shares = video_analytics_daily.shares + p_shares,
    downloads = video_analytics_daily.downloads + p_downloads,
    avg_watch_time_seconds = (
      (video_analytics_daily.avg_watch_time_seconds * video_analytics_daily.views) + 
      (p_avg_watch_time * p_views)
    ) / NULLIF(video_analytics_daily.views + p_views, 0),
    completion_rate = (
      (video_analytics_daily.completion_rate * video_analytics_daily.views) + 
      (p_completion_rate * p_views)
    ) / NULLIF(video_analytics_daily.views + p_views, 0),
    traffic_source = video_analytics_daily.traffic_source || p_traffic_source;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============ SEED DATA: FEATURE CONTROLS ============

INSERT INTO admin_feature_controls (feature_name, feature_display_name, is_enabled, is_visible, config) VALUES
  ('video_shorts', '60-Second Video Shorts', true, true, '{"free_limit": 3, "premium_limit": -1}'),
  ('video_shorts_download', 'Download Video Shorts', true, true, '{"free_limit": 1, "premium_limit": -1}'),
  ('video_shorts_social', 'Social Media Scheduling', true, false, '{"premium_only": true}'),
  ('video_shorts_custom', 'Custom Video Generation', true, true, '{"free_limit": 1, "premium_limit": 10}')
ON CONFLICT (feature_name) DO UPDATE SET
  feature_display_name = EXCLUDED.feature_display_name;

-- ============ COMMENTS ============

COMMENT ON TABLE video_shorts IS '60-second UPSC explainer videos for social media and quick revision';
COMMENT ON TABLE video_generation_queue IS 'Queue for async video generation jobs';
COMMENT ON TABLE video_social_posts IS 'Social media posts for scheduling video shares';
COMMENT ON TABLE video_analytics_daily IS 'Daily analytics for video performance tracking';

-- ============ MIGRATION COMPLETE ============

SELECT 'Migration 020: Video Shorts completed successfully' as status;
