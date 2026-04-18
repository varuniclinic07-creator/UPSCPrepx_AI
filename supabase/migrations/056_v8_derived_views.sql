-- 056_v8_derived_views.sql
-- Read-only derived views over v8_user_mastery. No writes ever.

CREATE OR REPLACE VIEW v8_weak_topics AS
  SELECT user_id, topic_id, mastery, confidence, last_seen
  FROM v8_user_mastery
  WHERE mastery < 0.5
  ORDER BY user_id, mastery ASC;

CREATE OR REPLACE VIEW v8_strong_topics AS
  SELECT user_id, topic_id, mastery, confidence, last_seen
  FROM v8_user_mastery
  WHERE mastery >= 0.75
  ORDER BY user_id, mastery DESC;

CREATE OR REPLACE VIEW v8_readiness_score AS
  SELECT
    user_id,
    AVG(mastery) AS overall_mastery,
    COUNT(*) FILTER (WHERE mastery >= 0.75) AS strong_count,
    COUNT(*) FILTER (WHERE mastery < 0.5) AS weak_count,
    COUNT(*) AS topics_touched,
    MAX(last_seen) AS most_recent_activity
  FROM v8_user_mastery
  GROUP BY user_id;

COMMENT ON VIEW v8_weak_topics IS 'Topics with mastery < 0.5';
COMMENT ON VIEW v8_strong_topics IS 'Topics with mastery >= 0.75';
COMMENT ON VIEW v8_readiness_score IS 'Per-user aggregated readiness';
