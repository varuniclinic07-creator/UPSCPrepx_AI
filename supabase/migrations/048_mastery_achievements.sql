-- 048_mastery_achievements.sql
-- Mastery-based badge achievements for gamification

INSERT INTO achievements (code, name, description, icon, xp_reward) VALUES
  ('FIRST_MASTERED',    'Knowledge Seed',    'Master your first topic',                   'seedling',    100),
  ('MASTERY_10',        'Knowledge Garden',   'Master 10 topics',                          'leaf',        300),
  ('MASTERY_50',        'Knowledge Forest',   'Master 50 topics',                          'tree',        750),
  ('SUBJECT_MASTERY',   'Subject Scholar',    'Master all topics in a single subject',     'graduation', 1500),
  ('REVISION_STREAK_7', 'Revision Machine',   'Complete revisions 7 days in a row',        'cycle',       200)
ON CONFLICT (code) DO NOTHING;
