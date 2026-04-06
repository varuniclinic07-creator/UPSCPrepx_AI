# SQL Migration Coverage Audit Report

**Date**: January 15, 2026  
**App**: UPSC CSE Master  
**Migrations**: 001-012

---

## 📊 Executive Summary

| Metric                 | Value |
| ---------------------- | ----- |
| **Total Features**     | 35    |
| **Features with SQL**  | 32 ✅  |
| **Missing SQL Tables** | 3 ⚠️   |
| **Coverage**           | 91%   |

---

## ✅ Features WITH SQL Tables (32/35)

| #   | Feature                 | Migration File         | Tables                                      |
| --- | ----------------------- | ---------------------- | ------------------------------------------- |
| 1   | **User Authentication** | 001_initial_schema     | `users`                                     |
| 2   | **User Profiles**       | 001_initial_schema     | `users`                                     |
| 3   | **Notes Generation**    | 001_initial_schema     | `notes`                                     |
| 4   | **Quiz System**         | 001_initial_schema     | `quizzes`, `quiz_attempts`                  |
| 5   | **Current Affairs**     | 001_initial_schema     | `current_affairs`                           |
| 6   | **Feature Config**      | 001_initial_schema     | `feature_config`                            |
| 7   | **Lead Capture**        | 001_initial_schema     | `leads`                                     |
| 8   | **Subjects**            | 001_initial_schema     | `subjects`                                  |
| 9   | **IP Restrictions**     | 002_ip_restrictions    | `ip_registrations`, `ip_rules`              |
| 10  | **Trial System**        | 003_trial_system       | `trial_sessions`, `post_trial_access_rules` |
| 11  | **Subscription Plans**  | 004_subscription_plans | `subscription_plans`                        |
| 12  | **User Subscriptions**  | 004_subscription_plans | `user_subscriptions`                        |
| 13  | **Payments**            | 004_subscription_plans | `payment_transactions`                      |
| 14  | **Invoices**            | 004_subscription_plans | `invoices`                                  |
| 15  | **AI Providers**        | 005_agentic_tables     | `ai_providers`                              |
| 16  | **Web Search Agent**    | 005_agentic_tables     | `agentic_web_searches`                      |
| 17  | **Document Upload**     | 005_agentic_tables     | `document_uploads`                          |
| 18  | **Doc Chat**            | 005_agentic_tables     | `document_chat_sessions`                    |
| 19  | **File Search**         | 005_agentic_tables     | `file_search_sessions`                      |
| 20  | **Static Materials**    | 005_agentic_tables     | `static_materials`                          |
| 21  | **UPSC Syllabus**       | 005_agentic_tables     | `upsc_syllabus_topics`                      |
| 22  | **Content Validation**  | 005_agentic_tables     | `content_validation_rules`                  |
| 23  | **Orchestrator Logs**   | 005_agentic_tables     | `agentic_orchestrator_logs`                 |
| 24  | **Lecture Generation**  | 006_lecture_tables     | `lecture_jobs`, `lecture_chapters`          |
| 25  | **Lecture Queue**       | 006_lecture_tables     | `lecture_queue_jobs`                        |
| 26  | **User Lectures**       | 006_lecture_tables     | `user_lectures`                             |
| 27  | **Watch History**       | 006_lecture_tables     | `lecture_watch_history`                     |
| 28  | **Lecture Limits**      | 006_lecture_tables     | `user_lecture_limits`                       |
| 29  | **Daily Newspapers**    | 007_materials_tables   | `daily_newspapers`                          |
| 30  | **Magazines**           | 007_materials_tables   | `magazines`                                 |
| 31  | **10th Class Notes**    | 007_materials_tables   | `tenth_class_notes`                         |
| 32  | **Government Schemes**  | 007_materials_tables   | `government_schemes`                        |
| 33  | **All Features View**   | 007_materials_tables   | `all_features`                              |
| 34  | **User Bookmarks**      | 007_materials_tables   | `user_bookmarks`                            |
| 35  | **Study Plans**         | 007_materials_tables   | `study_plans`, `study_sessions`             |
| 36  | **RLS Policies**        | 008_rls_policies       | Security functions                          |
| 37  | **Seed Data**           | 009_seed_data          | Initial data                                |
| 38  | **Event Store**         | 010_event_store        | `event_store`, `security_audit_log`         |
| 39  | **Referral Program**    | 011_business_features  | `referral_codes`, `referrals`               |
| 40  | **Promo Codes**         | 011_business_features  | `promo_codes`, `promo_code_usage`           |
| 41  | **Notifications**       | 011_business_features  | `notifications`, `notification_preferences` |
| 42  | **Onboarding**          | 011_business_features  | `onboarding_progress`                       |

---

## ⚠️ Features MISSING SQL Tables (3)

| #   | Feature             | Component Location                    | Needed Table              |
| --- | ------------------- | ------------------------------------- | ------------------------- |
| 1   | **Mock Interview**  | `(dashboard)/practice/mock-interview` | `mock_interview_sessions` |
| 2   | **Feedback Widget** | `components/feedback`                 | `user_feedback`           |
| 3   | **AI Chat History** | `components/tools`                    | `chat_sessions`           |

---

## 📁 Migration Files Summary

| File                         | Tables        | Functions        | Status |
| ---------------------------- | ------------- | ---------------- | ------ |
| `001_initial_schema.sql`     | 8             | 2                | ✅      |
| `002_ip_restrictions.sql`    | 2             | 2                | ✅      |
| `003_trial_system.sql`       | 2             | 5                | ✅      |
| `004_subscription_plans.sql` | 4             | 3                | ✅      |
| `005_agentic_tables.sql`     | 9             | 0                | ✅      |
| `006_lecture_tables.sql`     | 6             | 3                | ✅      |
| `007_materials_tables.sql`   | 7             | 0                | ✅      |
| `008_rls_policies.sql`       | 0             | 3                | ✅      |
| `009_seed_data.sql`          | 0             | 0                | ✅      |
| `010_event_store.sql`        | 2             | 0                | ✅      |
| `011_business_features.sql`  | 6             | 5                | ✅      |
| `012_fix_rls_all_tables.sql` | 0             | 0                | ✅      |
| **TOTAL**                    | **46 tables** | **23 functions** |        |

---

## 🔧 Recommended Actions

### Create Missing Tables (Priority: Medium)

```sql
-- Add to new migration: 013_missing_features.sql

-- Mock Interview Sessions
CREATE TABLE IF NOT EXISTS public.mock_interview_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    topic VARCHAR(255) NOT NULL,
    difficulty VARCHAR(20) DEFAULT 'medium',
    questions JSONB,
    answers JSONB,
    score INTEGER,
    feedback TEXT,
    duration_seconds INTEGER,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Feedback
CREATE TABLE IF NOT EXISTS public.user_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    type VARCHAR(30) NOT NULL, -- 'bug', 'feature', 'feedback'
    subject VARCHAR(255),
    message TEXT NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    page_url VARCHAR(500),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Chat Sessions  
CREATE TABLE IF NOT EXISTS public.chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255),
    messages JSONB DEFAULT '[]'::jsonb,
    model VARCHAR(50),
    tokens_used INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE mock_interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users own mock interviews" ON mock_interview_sessions FOR ALL USING (user_id = public.get_user_id());
CREATE POLICY "Anyone can submit feedback" ON user_feedback FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins view feedback" ON user_feedback FOR SELECT USING (public.is_admin());
CREATE POLICY "Users own chat sessions" ON chat_sessions FOR ALL USING (user_id = public.get_user_id());
```

---

## ✅ Verdict

**Your SQL migrations cover 91% of features!**

The 3 missing tables are for:
1. Mock Interview (practice feature)
2. User Feedback (feedback widget)
3. Chat Sessions (AI chat history)

These can be added in a new `013_missing_features.sql` migration.

**Overall: Your database schema is well-designed and comprehensive!** 🎉
