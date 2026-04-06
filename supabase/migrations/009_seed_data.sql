-- ═══════════════════════════════════════════════════════════════
-- UPSC CSE MASTER - SEED DATA
-- Migration: 009_seed_data.sql
-- Description: Initial data for subjects, features, AI providers
-- ═══════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════
-- SUBJECTS
-- ═══════════════════════════════════════════════════════════════

INSERT INTO subjects (name, slug, icon, color, description, sort_order) VALUES
('History', 'history', '📚', '#FF6B6B', 'Ancient, Medieval & Modern Indian History', 1),
('Political Science & IR', 'polity', '⚖️', '#4ECDC4', 'Indian Polity, Governance & International Relations', 2),
('Geography', 'geography', '🌍', '#45B7D1', 'Indian & World Geography', 3),
('Economics', 'economics', '💰', '#96CEB4', 'Indian Economy & Economic Development', 4),
('Science & Technology', 'science_tech', '🔬', '#FFEAA7', 'General Science & Technology', 5),
('Environment & Ecology', 'environment', '🌱', '#55EFC4', 'Environment, Ecology & Climate Change', 6),
('Internal Security', 'security', '🛡️', '#FD79A8', 'Security & Disaster Management', 7),
('Ethics', 'ethics', '⚖️', '#A29BFE', 'Ethics, Integrity & Aptitude', 8),
('Current Affairs', 'current_affairs', '📰', '#FB7AB7', 'Daily & Monthly Current Affairs', 9),
('Optional Subjects', 'optional', '📖', '#FAB1A0', 'Optional Subjects for Mains', 10)
ON CONFLICT (slug) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════
-- AI PROVIDERS (Major ones)
-- ═══════════════════════════════════════════════════════════════

INSERT INTO ai_providers (name, slug, provider_type, api_base_url, is_active, is_default, available_models) VALUES
-- A4F (Current)
(
    'A4F', 'a4f', 'openai',
    'https://api.a4f.co/v1',
    TRUE, TRUE,
    '[
        {"id":"provider-3/grok-4.1-fast","name":"Grok 4.1 Fast","context_length":131072},
        {"id":"provider-2/kimi-k2-thinking-tee","name":"Kimi K2 Thinking","context_length":200000},
        {"id":"provider-2/tongyi-deepresearch-30b-a3b","name":"Tongyi DeepResearch","context_length":32000},
        {"id":"provider-8/imagen-4","name":"Imagen 4 (Image)","context_length":null},
        {"id":"provider-3/FLUX.1-schnell","name":"FLUX Schnell (Image)","context_length":null},
        {"id":"provider-3/gemini-2.5-flash-preview-tts","name":"Gemini TTS","context_length":null}
    ]'::jsonb
),

-- OpenAI
(
    'OpenAI', 'openai', 'openai',
    'https://api.openai.com/v1',
    FALSE, FALSE,
    '[
        {"id":"gpt-4o","name":"GPT-4o","context_length":128000},
        {"id":"gpt-4-turbo","name":"GPT-4 Turbo","context_length":128000},
        {"id":"gpt-3.5-turbo","name":"GPT-3.5 Turbo","context_length":16385}
    ]'::jsonb
),

-- Anthropic
(
    'Anthropic', 'anthropic', 'anthropic',
    'https://api.anthropic.com/v1',
    FALSE, FALSE,
    '[
        {"id":"claude-3-opus-20240229","name":"Claude 3 Opus","context_length":200000},
        {"id":"claude-3-sonnet-20240229","name":"Claude 3 Sonnet","context_length":200000},
        {"id":"claude-3-haiku-20240307","name":"Claude 3 Haiku","context_length":200000}
    ]'::jsonb
),

-- Google
(
    'Google AI', 'google', 'google',
    'https://generativelanguage.googleapis.com/v1',
    FALSE, FALSE,
    '[
        {"id":"gemini-1.5-pro","name":"Gemini 1.5 Pro","context_length":1000000},
        {"id":"gemini-1.5-flash","name":"Gemini 1.5 Flash","context_length":1000000}
    ]'::jsonb
),

-- Groq (Fast)
(
    'Groq', 'groq', 'openai',
    'https://api.groq.com/openai/v1',
    FALSE, FALSE,
    '[
        {"id":"llama-3.1-70b-versatile","name":"Llama 3.1 70B","context_length":131072},
        {"id":"mixtral-8x7b-32768","name":"Mixtral 8x7B","context_length":32768}
    ]'::jsonb
)
ON CONFLICT (slug) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════
-- 34 FEATURES
-- ═══════════════════════════════════════════════════════════════

INSERT INTO all_features (feature_slug, feature_name, category, icon, description, min_tier, trial_limit, basic_limit, premium_limit, sort_order, is_implemented, show_on_dashboard) VALUES
-- Student Features
('smart-notes', 'Smart Study Notes', 'content', '📚', 'AI-powered comprehensive notes on any topic', 'trial', 10, 20, NULL, 1, TRUE, TRUE),
('practice-quiz', 'Practice Quiz', 'practice', '🧠', 'Adaptive quizzes with instant feedback', 'trial', 5, 10, NULL, 2, TRUE, TRUE),
('current-affairs', 'Daily Current Affairs', 'content', '📰', 'UPSC-relevant news analysis', 'trial', NULL, NULL, NULL, 3, TRUE, TRUE),
('video-lectures', '3-Hour Video Lectures', 'content', '🎬', 'Comprehensive video lectures on any topic', 'trial', 2, 5, 10, 4, FALSE, TRUE),
('10th-class-notes', '10th Standard Notes', 'content', '📖', 'Chapter-wise simplified notes', 'basic', NULL, NULL, NULL, 5, FALSE, TRUE),
('newspapers', 'Daily Newspapers', 'content', '📰', 'The Hindu & Indian Express', 'trial', NULL, NULL, NULL, 6, FALSE, TRUE),
('magazines', 'Monthly Magazines', 'content', '📕', 'Yojana & Kurukshetra', 'basic', NULL, NULL, NULL, 7, FALSE, TRUE),
('pyq-analysis', 'Previous Year Questions', 'practice', '📊', 'Analyze past exam patterns', 'basic', NULL, 20, NULL, 8, FALSE, TRUE),
('mock-interview', 'Mock Interview', 'practice', '🎤', 'AI interviewer for personality test', 'premium', NULL, NULL, 2, 9, FALSE, TRUE),
('essay-evaluation', 'Essay Review', 'practice', '✍️', 'Get feedback on your essays', 'premium', NULL, NULL, 5, 10, FALSE, TRUE),
('answer-writing', 'Answer Writing Practice', 'practice', '📝', 'Mains answer writing practice', 'premium', NULL, NULL, 20, 11, FALSE, TRUE),
('mind-maps', 'Topic Mind Maps', 'tools', '🗺️', 'Visual connections between topics', 'basic', 5, 20, NULL, 12, FALSE, FALSE),
('study-planner', 'Personalized Study Planner', 'tools', '📅', 'AI-generated daily study schedule', 'basic', NULL, NULL, NULL, 13, FALSE, TRUE),
('revision-tracker', 'Revision Helper', 'tools', '🔄', 'Spaced repetition system', 'basic', NULL, NULL, NULL, 14, FALSE, FALSE),
('government-schemes', 'Government Schemes', 'content', '🏛️', 'Comprehensive scheme database', 'trial', NULL, NULL, NULL, 15, FALSE, TRUE),
('document-chat', 'Chat with Documents', 'tools', '💬', 'Ask questions from your PDFs', 'basic', 5, 20, NULL, 16, FALSE, FALSE),
('web-search', 'Live Web Research', 'tools', '🔍', 'Real-time web search for topics', 'trial', 10, NULL, NULL, 17, FALSE, FALSE),
('file-navigator', 'Smart File Navigator', 'tools', '📂', 'Navigate study materials intelligently', 'basic', NULL, NULL, NULL, 18, FALSE, FALSE)
ON CONFLICT (feature_slug) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════
-- FEATURE CONFIG (for existing features from Phase 1-5)
-- ═══════════════════════════════════════════════════════════════

INSERT INTO feature_config (name, display_name, description, icon, min_tier, is_enabled, is_visible, sort_order) VALUES
('notes', 'Smart Notes', 'Generate comprehensive study notes', '📚', 'trial', TRUE, TRUE, 1),
('quiz', 'Practice Quiz', 'Test your knowledge with adaptive quizzes', '🧠', 'trial', TRUE, TRUE, 2),
('current-affairs', 'Current Affairs', 'Daily UPSC-relevant news', '📰', 'trial', TRUE, TRUE, 3),
('profile', 'My Profile', 'View your progress and statistics', '👤', 'trial', TRUE, TRUE, 10),
('settings', 'Settings', 'Customize your experience', '⚙️', 'trial', TRUE, TRUE, 11)
ON CONFLICT (name) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════
-- POST-TRIAL ACCESS RULES (Already defined in 003, but ensuring)
-- ═══════════════════════════════════════════════════════════════

INSERT INTO post_trial_access_rules (feature_name, content_type, is_allowed, limit_per_day, description) VALUES
('current-affairs', 'pdf', TRUE, NULL, 'CA PDFs remain free after trial'),
('current-affairs', 'text', TRUE, NULL, 'CA reading on screen remains free'),
('newspapers', 'pdf', TRUE, NULL, 'Newspaper PDFs always free'),
('newspapers', 'text', TRUE, NULL, 'Newspaper reading always free'),
('magazines', 'pdf', TRUE, NULL, 'Magazine PDFs always free')
ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════════════════════════
-- SAMPLE CURRENT AFFAIRS (for demo)
-- ═══════════════════════════════════════════════════════════════

INSERT INTO current_affairs (
    title, summary, category, 
    upsc_relevance, prelims_relevance, mains_relevance,
    source_name, published_date
) VALUES
(
    'Digital India: Progress and Challenges',
    'India''s digital transformation has seen significant progress with initiatives like UPI, Aadhaar, and DigiLocker. However, challenges remain in bridging the digital divide.',
    'Governance',
    'Relevant for GS-2 (Government Policies), GS-3 (Science & Technology). Important for both Prelims and Mains.',
    TRUE, TRUE,
    'The Hindu', CURRENT_DATE
),
(
    'India-Middle East-Europe Economic Corridor (IMEC)',
    'IMEC is a proposed economic corridor announced at the 2023 G20 Summit, aimed at enhancing connectivity between India, Middle East, and Europe.',
    'International Relations',
    'GS-2 (International Relations), GS-3 (Infrastructure). Critical for understanding India''s global positioning.',
    TRUE, TRUE,
    'Indian Express', CURRENT_DATE
),
(
    'Climate Change and Monsoon Patterns',
    'Recent studies show altered monsoon patterns due to climate change, affecting agriculture and water resources across India.',
    'Environment',
    'GS-3 (Environment & Climate Change, Agriculture). Highly relevant for both papers.',
    TRUE, TRUE,
    'The Hindu', CURRENT_DATE
)
ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════════════════════════
-- SAMPLE GOVERNMENT SCHEMES
-- ═══════════════════════════════════════════════════════════════

INSERT INTO government_schemes (
    scheme_name, ministry, launched_year,
    objective, category, subject_slug,
    upsc_relevance, prelims_importance, mains_importance
) VALUES
(
    'PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)',
    'Ministry of Agriculture and Farmers Welfare',
    2019,
    'Provide income support to all farmer families across the country with ₹6000 per year in three equal instalments.',
    'Agriculture',
    'economics',
    'GS-2 (Government Policies), GS-3 (Agriculture). Very important for both Prelims and Mains.',
    TRUE, TRUE
),
(
    'Ayushman Bharat - Pradhan Mantri Jan Arogya Yojana (PM-JAY)',
    'Ministry of Health and Family Welfare',
    2018,
    'World''s largest health insurance scheme providing coverage of ₹5 lakh per family per year for secondary and tertiary care hospitalization.',
    'Health',
    'polity',
    'GS-2 (Government Policies, Social Justice). Critical scheme for UPSC.',
    TRUE, TRUE
),
(
    'Digital India',
    'Ministry of Electronics and Information Technology',
    2015,
    'Umbrella program to transform India into a digitally empowered society and knowledge economy.',
    'Governance',
    'polity',
    'GS-2 (Governance), GS-3 (Science & Technology). Very relevant.',
    TRUE, TRUE
)
ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════════════════════════
-- UPSC SYLLABUS TOPICS (Sample for each paper)
-- ═══════════════════════════════════════════════════════════════

INSERT INTO upsc_syllabus_topics (subject_slug, topic_name, paper, section, keywords) VALUES
-- Prelims
('history', 'Ancient India - Indus Valley Civilization', 'prelims', 'History', ARRAY['Harappa', 'Mohenjo-daro', 'Bronze Age', 'Urban Planning']),
('polity', 'Indian Constitution - Fundamental Rights', 'prelims', 'Polity', ARRAY['Articles 12-35', 'Right to Equality', 'Right to Freedom']),
('geography', 'Physical Geography - Monsoon', 'prelims', 'Geography', ARRAY['Southwest Monsoon', 'ITCZ', 'Rainfall Distribution']),

-- Mains GS-1
('history', 'Indian National Movement', 'mains_gs1', 'Modern History', ARRAY['Nationalism', 'Freedom Struggle', 'Gandhi', 'Non-Cooperation']),
('geography', 'Salient features of world''s physical geography', 'mains_gs1', 'Geography', ARRAY['Plate Tectonics', 'Landforms', 'Climate Zones']),

-- Mains GS-2
('polity', 'Indian Polity and Governance', 'mains_gs2', 'Governance', ARRAY['Constitution', 'Parliament', 'Judiciary', 'Federalism']),
('polity', 'Social Justice', 'mains_gs2', 'Social Issues', ARRAY['Poverty', 'Inequality', 'Health', 'Education']),

-- Mains GS-3
('economics', 'Indian Economy and Development', 'mains_gs3', 'Economy', ARRAY['Growth Models', 'Fiscal Policy', 'Monetary Policy', 'Inflation']),
('science_tech', 'Science and Technology', 'mains_gs3', 'S&T', ARRAY['Space Technology', 'Defence Technology', 'Innovation']),
('environment', 'Environment and Biodiversity', 'mains_gs3', 'Environment', ARRAY['Climate Change', 'Conservation', 'Pollution', 'Renewable Energy']),
('security', 'Internal Security', 'mains_gs3', 'Security', ARRAY['Terrorism', 'Naxalism', 'Cyber Security', 'Border Management']),

-- Mains GS-4
('ethics', 'Ethics and Human Interface', 'mains_gs4', 'Ethics', ARRAY['Moral Philosophy', 'Values', 'Attitude', 'Aptitude'])
ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════════════════════════
-- UPDATE SUBSCRIPTION PLANS WITH LECTURE LIMITS
-- ═══════════════════════════════════════════════════════════════

UPDATE subscription_plans
SET limits = limits || jsonb_build_object(
    'lectures', jsonb_build_object(
        'monthly', CASE tier
            WHEN 'basic' THEN 2
            WHEN 'premium' THEN 10
            WHEN 'premium_plus' THEN NULL -- Unlimited
            ELSE NULL
        END,
        'daily', CASE tier
            WHEN 'basic' THEN 1
            WHEN 'premium' THEN 2
            WHEN 'premium_plus' THEN NULL -- Unlimited
            ELSE NULL
        END
    )
)
WHERE tier IN ('basic', 'premium', 'premium_plus');

-- ═══════════════════════════════════════════════════════════════
-- END OF MIGRATION 009
-- ═══════════════════════════════════════════════════════════════

-- Final Message
DO $$
BEGIN
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
    RAISE NOTICE 'UPSC CSE MASTER - Database Initialization Complete!';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
    RAISE NOTICE 'Total migrations applied: 9';
    RAISE NOTICE 'Subjects: %', (SELECT COUNT(*) FROM subjects);
    RAISE NOTICE 'AI Providers: %', (SELECT COUNT(*) FROM ai_providers);
    RAISE NOTICE 'Features: %', (SELECT COUNT(*) FROM all_features);
    RAISE NOTICE 'Sample Current Affairs: %', (SELECT COUNT(*) FROM current_affairs);
    RAISE NOTICE 'Sample Schemes: %', (SELECT COUNT(*) FROM government_schemes);
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
    RAISE NOTICE 'Ready for development!';
END $$;
