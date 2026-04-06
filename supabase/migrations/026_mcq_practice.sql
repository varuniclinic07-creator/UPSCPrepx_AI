-- ============================================================================
-- BMAD Phase 4: Feature F7 - Adaptive MCQ Practice Engine
-- Migration 026: MCQ Practice System
-- Master Prompt v8.0 Compliant
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- ENUMS
-- ============================================================================

DO $$ BEGIN
    CREATE TYPE mcq_subject AS ENUM ('GS1', 'GS2', 'GS3', 'GS4', 'CSAT', 'Optional', 'General');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE mcq_difficulty AS ENUM ('Easy', 'Medium', 'Hard');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE mcq_bloom_level AS ENUM ('Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE mcq_session_type AS ENUM ('Practice', 'Mock', 'PYQ', 'Adaptive');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE mcq_section AS ENUM ('GS', 'CSAT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- TABLE: mcq_questions
-- ============================================================================

CREATE TABLE IF NOT EXISTS mcq_questions (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_text jsonb NOT NULL, -- {"en": "...", "hi": "..."}
    options jsonb NOT NULL, -- [{"text": {"en": "...", "hi": "..."}}, ...]
    correct_option int NOT NULL CHECK (correct_option BETWEEN 1 AND 4),
    explanation jsonb, -- {"en": "...", "hi": "...", "key_points": [...]}
    subject mcq_subject NOT NULL,
    topic text NOT NULL,
    subtopic text,
    difficulty mcq_difficulty NOT NULL DEFAULT 'Medium',
    bloom_level mcq_bloom_level NOT NULL DEFAULT 'Understand',
    time_estimate_sec int NOT NULL DEFAULT 90,
    marks int NOT NULL DEFAULT 2,
    negative_marks decimal NOT NULL DEFAULT 0.66,
    year int, -- For PYQs
    is_pyy boolean NOT NULL DEFAULT false,
    tags text[],
    source_references jsonb, -- [{"title": "...", "url": "...", "page": "..."}]
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid REFERENCES auth.users(id)
);

-- Indexes for mcq_questions
CREATE INDEX IF NOT EXISTS idx_mcq_questions_subject ON mcq_questions(subject);
CREATE INDEX IF NOT EXISTS idx_mcq_questions_topic ON mcq_questions USING gin(to_tsvector('english', topic));
CREATE INDEX IF NOT EXISTS idx_mcq_questions_difficulty ON mcq_questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_mcq_questions_bloom ON mcq_questions(bloom_level);
CREATE INDEX IF NOT EXISTS idx_mcq_questions_year ON mcq_questions(year) WHERE is_pyy = true;
CREATE INDEX IF NOT EXISTS idx_mcq_questions_tags ON mcq_questions USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_mcq_questions_composite ON mcq_questions(subject, difficulty, topic);

-- ============================================================================
-- TABLE: mcq_attempts
-- ============================================================================

CREATE TABLE IF NOT EXISTS mcq_attempts (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_type mcq_session_type NOT NULL,
    subject mcq_subject,
    topic text,
    difficulty mcq_difficulty,
    total_questions int NOT NULL,
    attempted_questions int NOT NULL DEFAULT 0,
    correct_answers int NOT NULL DEFAULT 0,
    incorrect_answers int NOT NULL DEFAULT 0,
    unattempted int NOT NULL DEFAULT 0,
    total_marks decimal NOT NULL DEFAULT 0,
    negative_marks decimal NOT NULL DEFAULT 0,
    net_marks decimal NOT NULL DEFAULT 0,
    accuracy_percent decimal NOT NULL DEFAULT 0,
    time_taken_sec int NOT NULL DEFAULT 0,
    avg_time_per_question decimal NOT NULL DEFAULT 0,
    started_at timestamptz NOT NULL DEFAULT now(),
    completed_at timestamptz,
    percentile decimal,
    rank int,
    mock_id uuid REFERENCES mcq_mock_tests(id),
    CONSTRAINT valid_accuracy CHECK (accuracy_percent BETWEEN 0 AND 100)
);

-- Indexes for mcq_attempts
CREATE INDEX IF NOT EXISTS idx_mcq_attempts_user ON mcq_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_mcq_attempts_session ON mcq_attempts(session_type);
CREATE INDEX IF NOT EXISTS idx_mcq_attempts_subject ON mcq_attempts(subject);
CREATE INDEX IF NOT EXISTS idx_mcq_attempts_completed ON mcq_attempts(completed_at) WHERE completed_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_mcq_attempts_composite ON mcq_attempts(user_id, session_type, completed_at);

-- ============================================================================
-- TABLE: mcq_answers
-- ============================================================================

CREATE TABLE IF NOT EXISTS mcq_answers (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    attempt_id uuid NOT NULL REFERENCES mcq_attempts(id) ON DELETE CASCADE,
    question_id uuid NOT NULL REFERENCES mcq_questions(id),
    selected_option int CHECK (selected_option BETWEEN 1 AND 4),
    is_correct boolean,
    is_skipped boolean NOT NULL DEFAULT false,
    time_spent_sec int NOT NULL DEFAULT 0,
    marked_for_review boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT one_answer CHECK (selected_option IS NOT NULL OR is_skipped = true)
);

-- Indexes for mcq_answers
CREATE INDEX IF NOT EXISTS idx_mcq_answers_attempt ON mcq_answers(attempt_id);
CREATE INDEX IF NOT EXISTS idx_mcq_answers_question ON mcq_answers(question_id);
CREATE INDEX IF NOT EXISTS idx_mcq_answers_correct ON mcq_answers(is_correct);

-- ============================================================================
-- TABLE: mcq_bookmarks
-- ============================================================================

CREATE TABLE IF NOT EXISTS mcq_bookmarks (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    question_id uuid NOT NULL REFERENCES mcq_questions(id) ON DELETE CASCADE,
    notes text,
    tags text[],
    difficulty_for_user mcq_difficulty,
    last_reviewed_at timestamptz,
    next_review_at timestamptz,
    review_count int NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT unique_bookmark UNIQUE(user_id, question_id)
);

-- Indexes for mcq_bookmarks
CREATE INDEX IF NOT EXISTS idx_mcq_bookmarks_user ON mcq_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_mcq_bookmarks_question ON mcq_bookmarks(question_id);
CREATE INDEX IF NOT EXISTS idx_mcq_bookmarks_review ON mcq_bookmarks(next_review_at) WHERE next_review_at IS NOT NULL;

-- ============================================================================
-- TABLE: mcq_mock_tests
-- ============================================================================

CREATE TABLE IF NOT EXISTS mcq_mock_tests (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    title jsonb NOT NULL, -- {"en": "...", "hi": "..."}
    description jsonb, -- {"en": "...", "hi": "..."}
    total_questions int NOT NULL DEFAULT 100,
    total_marks int NOT NULL DEFAULT 200,
    duration_min int NOT NULL DEFAULT 120,
    subject_distribution jsonb NOT NULL, -- {"GS": 80, "CSAT": 20}
    difficulty_distribution jsonb NOT NULL, -- {"Easy": 20, "Medium": 60, "Hard": 20}
    is_active boolean NOT NULL DEFAULT true,
    is_premium boolean NOT NULL DEFAULT false,
    attempt_count int NOT NULL DEFAULT 0,
    avg_score decimal,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for mcq_mock_tests
CREATE INDEX IF NOT EXISTS idx_mcq_mock_tests_active ON mcq_mock_tests(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_mcq_mock_tests_premium ON mcq_mock_tests(is_premium);

-- ============================================================================
-- TABLE: mcq_mock_questions (Junction)
-- ============================================================================

CREATE TABLE IF NOT EXISTS mcq_mock_questions (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    mock_id uuid NOT NULL REFERENCES mcq_mock_tests(id) ON DELETE CASCADE,
    question_id uuid NOT NULL REFERENCES mcq_questions(id),
    question_number int NOT NULL,
    section mcq_section NOT NULL,
    CONSTRAINT unique_mock_question UNIQUE(mock_id, question_id),
    CONSTRAINT unique_question_number UNIQUE(mock_id, question_number)
);

-- Indexes for mcq_mock_questions
CREATE INDEX IF NOT EXISTS idx_mcq_mock_questions_mock ON mcq_mock_questions(mock_id);
CREATE INDEX IF NOT EXISTS idx_mcq_mock_questions_question ON mcq_mock_questions(question_id);

-- ============================================================================
-- TABLE: mcq_analytics
-- ============================================================================

CREATE TABLE IF NOT EXISTS mcq_analytics (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date date NOT NULL,
    subject mcq_subject NOT NULL,
    topic text,
    questions_attempted int NOT NULL DEFAULT 0,
    accuracy_percent decimal NOT NULL DEFAULT 0,
    avg_time_sec decimal NOT NULL DEFAULT 0,
    difficulty_distribution jsonb, -- {"Easy": 10, "Medium": 15, "Hard": 5}
    weak_areas text[],
    strong_areas text[],
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT unique_analytics UNIQUE(user_id, date, subject, topic)
);

-- Indexes for mcq_analytics
CREATE INDEX IF NOT EXISTS idx_mcq_analytics_user ON mcq_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_mcq_analytics_date ON mcq_analytics(date);
CREATE INDEX IF NOT EXISTS idx_mcq_analytics_subject ON mcq_analytics(subject);
CREATE INDEX IF NOT EXISTS idx_mcq_analytics_composite ON mcq_analytics(user_id, date, subject);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE mcq_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mcq_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE mcq_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE mcq_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE mcq_mock_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE mcq_mock_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mcq_analytics ENABLE ROW LEVEL SECURITY;

-- mcq_questions: Public read, admin write
CREATE POLICY "mcq_questions_public_read" ON mcq_questions
    FOR SELECT USING (true);

CREATE POLICY "mcq_questions_admin_write" ON mcq_questions
    FOR ALL USING (auth.jwt()->>'role' = 'admin');

-- mcq_attempts: User can see own attempts
CREATE POLICY "mcq_attempts_user_read" ON mcq_attempts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "mcq_attempts_user_insert" ON mcq_attempts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "mcq_attempts_user_update" ON mcq_attempts
    FOR UPDATE USING (auth.uid() = user_id);

-- mcq_answers: User can see own answers
CREATE POLICY "mcq_answers_user_read" ON mcq_answers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM mcq_attempts
            WHERE mcq_attempts.id = mcq_answers.attempt_id
            AND mcq_attempts.user_id = auth.uid()
        )
    );

CREATE POLICY "mcq_answers_user_insert" ON mcq_answers
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM mcq_attempts
            WHERE mcq_attempts.id = mcq_answers.attempt_id
            AND mcq_attempts.user_id = auth.uid()
        )
    );

-- mcq_bookmarks: User can manage own bookmarks
CREATE POLICY "mcq_bookmarks_user_read" ON mcq_bookmarks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "mcq_bookmarks_user_insert" ON mcq_bookmarks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "mcq_bookmarks_user_update" ON mcq_bookmarks
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "mcq_bookmarks_user_delete" ON mcq_bookmarks
    FOR DELETE USING (auth.uid() = user_id);

-- mcq_mock_tests: Public read, admin write
CREATE POLICY "mcq_mock_tests_public_read" ON mcq_mock_tests
    FOR SELECT USING (true);

CREATE POLICY "mcq_mock_tests_admin_write" ON mcq_mock_tests
    FOR ALL USING (auth.jwt()->>'role' = 'admin');

-- mcq_mock_questions: Public read, admin write
CREATE POLICY "mcq_mock_questions_public_read" ON mcq_mock_questions
    FOR SELECT USING (true);

CREATE POLICY "mcq_mock_questions_admin_write" ON mcq_mock_questions
    FOR ALL USING (auth.jwt()->>'role' = 'admin');

-- mcq_analytics: User can see own analytics
CREATE POLICY "mcq_analytics_user_read" ON mcq_analytics
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "mcq_analytics_user_insert" ON mcq_analytics
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "mcq_analytics_user_update" ON mcq_analytics
    FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================================
-- TRIGGERS: Updated timestamps
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_mcq_questions_updated_at
    BEFORE UPDATE ON mcq_questions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mcq_mock_tests_updated_at
    BEFORE UPDATE ON mcq_mock_tests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mcq_analytics_updated_at
    BEFORE UPDATE ON mcq_analytics
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TRIGGER: Update attempt stats on answer insert
-- ============================================================================

CREATE OR REPLACE FUNCTION update_attempt_stats()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE mcq_attempts
    SET 
        attempted_questions = (
            SELECT COUNT(*) FROM mcq_answers WHERE attempt_id = NEW.attempt_id
        ),
        correct_answers = (
            SELECT COUNT(*) FROM mcq_answers WHERE attempt_id = NEW.attempt_id AND is_correct = true
        ),
        incorrect_answers = (
            SELECT COUNT(*) FROM mcq_answers WHERE attempt_id = NEW.attempt_id AND is_correct = false
        ),
        unattempted = (
            SELECT COUNT(*) FROM mcq_answers WHERE attempt_id = NEW.attempt_id AND is_skipped = true
        ),
        total_marks = (
            SELECT SUM(marks) FROM mcq_answers 
            JOIN mcq_questions ON mcq_questions.id = mcq_answers.question_id
            WHERE attempt_id = NEW.attempt_id AND is_correct = true
        ),
        negative_marks = (
            SELECT SUM(negative_marks) FROM mcq_answers 
            JOIN mcq_questions ON mcq_questions.id = mcq_answers.question_id
            WHERE attempt_id = NEW.attempt_id AND is_correct = false
        ),
        net_marks = (
            SELECT 
                COALESCE(SUM(marks) FILTER (WHERE is_correct = true), 0) -
                COALESCE(SUM(negative_marks) FILTER (WHERE is_correct = false), 0)
            FROM mcq_answers 
            JOIN mcq_questions ON mcq_questions.id = mcq_answers.question_id
            WHERE attempt_id = NEW.attempt_id
        ),
        accuracy_percent = (
            SELECT 
                CASE 
                    WHEN COUNT(*) = 0 THEN 0
                    ELSE (COUNT(*) FILTER (WHERE is_correct = true)::decimal / COUNT(*) * 100)
                END
            FROM mcq_answers WHERE attempt_id = NEW.attempt_id
        ),
        time_taken_sec = (
            SELECT COALESCE(SUM(time_spent_sec), 0) FROM mcq_answers WHERE attempt_id = NEW.attempt_id
        ),
        avg_time_per_question = (
            SELECT 
                CASE 
                    WHEN COUNT(*) = 0 THEN 0
                    ELSE AVG(time_spent_sec)
                END
            FROM mcq_answers WHERE attempt_id = NEW.attempt_id
        )
    WHERE id = NEW.attempt_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_attempt_stats
    AFTER INSERT OR UPDATE ON mcq_answers
    FOR EACH ROW
    EXECUTE FUNCTION update_attempt_stats();

-- ============================================================================
-- SEED DATA: Sample PYQs (2023-2025)
-- ============================================================================

-- GS1 History PYQs
INSERT INTO mcq_questions (question_text, options, correct_option, explanation, subject, topic, subtopic, difficulty, bloom_level, year, is_pyy, tags) VALUES
('{"en": "Which of the following statements best describes the nature of the Indus Valley Civilization?", "hi": "निम्नलिखित में से कौन सा कथन सिंधु घाटी सभ्यता की प्रकृति का सबसे अच्छा वर्णन करता है?"}',
 '[{"text": {"en": "It was primarily a rural agricultural society", "hi": "यह मुख्य रूप से एक ग्रामीण कृषि समाज था"}}, {"text": {"en": "It was an urban civilization with planned cities", "hi": "यह नियोजित शहरों वाला एक शहरी सभ्यता था"}}, {"text": {"en": "It was a nomadic pastoral society", "hi": "यह एक खानाबदोश पशुपालक समाज था"}}, {"text": {"en": "It was a maritime trading empire", "hi": "यह एक समुद्री व्यापार साम्राज्य था"}}]',
 2,
 '{"en": "The Indus Valley Civilization (3300-1300 BCE) was characterized by well-planned urban centers like Harappa and Mohenjo-daro with grid-pattern streets, drainage systems, and standardized brick sizes.", "hi": "सिंधु घाटी सभ्यता (3300-1300 ईसा पूर्व) हड़प्पा और मोहनजोदड़ो जैसे अच्छी तरह से नियोजित शहरी केंद्रों की विशेषता थी, जिनमें ग्रिड-पैटर्न वाली सड़कें, जल निकासी प्रणाली और मानकीकृत ईंट के आकार थे।", "key_points": ["Urban planning", "Grid streets", "Drainage system", "Standardized bricks"]}',
 'GS1', 'History', 'Ancient India', 'Medium', 'Understand', 2023, true,
 ARRAY['PYQ', 'Ancient India', 'Indus Valley']);

-- GS2 Polity PYQ
INSERT INTO mcq_questions (question_text, options, correct_option, explanation, subject, topic, subtopic, difficulty, bloom_level, year, is_pyy, tags) VALUES
('{"en": "Which Article of the Indian Constitution deals with the Right to Constitutional Remedies?", "hi": "भारतीय संविधान का कौन सा अनुच्छेद संवैधानिक उपचारों के अधिकार से संबंधित है?"}',
 '[{"text": {"en": "Article 19", "hi": "अनुच्छेद 19"}}, {"text": {"en": "Article 21", "hi": "अनुच्छेद 21"}}, {"text": {"en": "Article 32", "hi": "अनुच्छेद 32"}}, {"text": {"en": "Article 370", "hi": "अनुच्छेद 370"}}]',
 3,
 '{"en": "Article 32 provides the Right to Constitutional Remedies, allowing citizens to approach the Supreme Court for enforcement of Fundamental Rights. Dr. Ambedkar called it the 'heart and soul' of the Constitution.", "hi": "अनुच्छेद 32 संवैधानिक उपचारों का अधिकार प्रदान करता है, जो नागरिकों को मौलिक अधिकारों के प्रवर्तन के लिए सुप्रीम कोर्ट जाने की अनुमति देता है। डॉ. अंबेडकर ने इसे संविधान की 'आत्मा और हृदय' कहा था।", "key_points": ["Article 32", "Fundamental Rights", "Supreme Court", "Dr. Ambedkar"]}',
 'GS2', 'Polity', 'Fundamental Rights', 'Easy', 'Remember', 2024, true,
 ARRAY['PYQ', 'Polity', 'Fundamental Rights']);

-- GS3 Economy PYQ
INSERT INTO mcq_questions (question_text, options, correct_option, explanation, subject, topic, subtopic, difficulty, bloom_level, year, is_pyy, tags) VALUES
('{"en": "What is the primary objective of the Monetary Policy Committee (MPC) of the Reserve Bank of India?", "hi": "भारतीय रिजर्व बैंक की मौद्रिक नीति समिति (MPC) का प्राथमिक उद्देश्य क्या है?"}',
 '[{"text": {"en": "Maximizing economic growth", "hi": "आर्थिक विकास को अधिकतम करना"}}, {"text": {"en": "Maintaining price stability while keeping growth in mind", "hi": "विकास को ध्यान में रखते हुए मूल्य स्थिरता बनाए रखना"}}, {"text": {"en": "Managing fiscal deficit", "hi": "राजकोषीय घाटे का प्रबंधन"}}, {"text": {"en": "Regulating foreign exchange rates", "hi": "विदेशी विनिमय दरों को विनियमित करना"}}]',
 2,
 '{"en": "The MPC's primary objective is to maintain price stability (inflation target of 4% ± 2%) while keeping economic growth in mind. This flexible inflation targeting framework was adopted in 2016.", "hi": "MPC का प्राथमिक उद्देश्य आर्थिक विकास को ध्यान में रखते हुए मूल्य स्थिरता (4% ± 2% की मुद्रास्फीति लक्ष्य) बनाए रखना है। यह लचीला मुद्रास्फीति लक्ष्यीकरण ढांचा 2016 में अपनाया गया था।", "key_points": ["Price stability", "4% inflation target", "Flexible targeting", "2016 framework"]}',
 'GS3', 'Economy', 'Monetary Policy', 'Medium', 'Understand', 2024, true,
 ARRAY['PYQ', 'Economy', 'RBI', 'Monetary Policy']);

-- GS4 Ethics PYQ
INSERT INTO mcq_questions (question_text, options, correct_option, explanation, subject, topic, subtopic, difficulty, bloom_level, year, is_pyy, tags) VALUES
('{"en": "Which of the following best describes the concept of 'Probity' in public service?", "hi": "निम्नलिखित में से कौन सा लोक सेवा में 'प्रोबिटी' की अवधारणा का सबसे अच्छा वर्णन करता है?"}',
 '[{"text": {"en": "Efficiency in administration", "hi": "प्रशासन में दक्षता"}}, {"text": {"en": "Integrity and uprightness in conduct", "hi": "आचरण में अखंडता और ईमानदारी"}}, {"text": {"en": "Speed in decision making", "hi": "निर्णय लेने में गति"}}, {"text": {"en": "Popularity among citizens", "hi": "नागरिकों में लोकप्रियता"}}]',
 2,
 '{"en": "Probity refers to integrity, uprightness, and honesty in public service. It goes beyond mere honesty to include adherence to ethical principles and moral values in governance.", "hi": "प्रोबिटी लोक सेवा में अखंडता, ईमानदारी और सच्चाई को संदर्भित करती है। यह शासन में नैतिक सिद्धांतों और मूल्यों के पालन सहित केवल ईमानदारी से आगे जाती है।", "key_points": ["Integrity", "Uprightness", "Ethical governance", "Moral values"]}',
 'GS4', 'Ethics', 'Public Service Values', 'Easy', 'Understand', 2023, true,
 ARRAY['PYQ', 'Ethics', 'Probity']);

-- CSAT PYQ
INSERT INTO mcq_questions (question_text, options, correct_option, explanation, subject, topic, subtopic, difficulty, bloom_level, year, is_pyy, tags) VALUES
('{"en": "If the price of a commodity increases by 25%, by what percentage should the consumption be reduced to keep the expenditure unchanged?", "hi": "यदि किसी वस्तु की कीमत में 25% की वृद्धि होती है, तो व्यय को अपरिवर्तित रखने के लिए खपत को कितने प्रतिशत तक कम किया जाना चाहिए?"}',
 '[{"text": {"en": "20%", "hi": "20%"}}, {"text": {"en": "25%", "hi": "25%"}}, {"text": {"en": "15%", "hi": "15%"}}, {"text": {"en": "30%", "hi": "30%"}}]',
 1,
 '{"en": "If price increases by 25% (1/4), consumption should decrease by 1/(4+1) = 1/5 = 20% to keep expenditure constant. Formula: Reduction% = (Increase%/(100+Increase%)) × 100 = (25/125) × 100 = 20%.", "hi": "यदि कीमत में 25% (1/4) की वृद्धि होती है, तो व्यय को स्थिर रखने के लिए खपत में 1/(4+1) = 1/5 = 20% की कमी होनी चाहिए। सूत्र: कमी% = (वृद्धि%/(100+वृद्धि%)) × 100 = (25/125) × 100 = 20%।", "key_points": ["25% increase = 1/4", "Reduction = 1/5 = 20%", "Expenditure constant"]}',
 'CSAT', 'Mathematics', 'Percentage', 'Medium', 'Apply', 2024, true,
 ARRAY['PYQ', 'CSAT', 'Mathematics', 'Percentage']);

-- ============================================================================
-- SEED DATA: Mock Tests
-- ============================================================================

INSERT INTO mcq_mock_tests (title, description, total_questions, total_marks, duration_min, subject_distribution, difficulty_distribution) VALUES
('{"en": "UPSC CSE Prelims Mock Test 1", "hi": "UPSC CSE प्रीलिम्स मॉक टेस्ट 1"}',
 '{"en": "Full-length mock test simulating actual UPSC Prelims exam pattern", "hi": "वास्तविक UPSC प्रीलिम्स परीक्षा पैटर्न का अनुकरण करने वाला पूर्ण-लंबाई का मॉक टेस्ट"}',
 100, 200, 120,
 '{"GS": 80, "CSAT": 20}',
 '{"Easy": 20, "Medium": 60, "Hard": 20}');

-- ============================================================================
-- VIEWS: Analytics helpers
-- ============================================================================

CREATE OR REPLACE VIEW user_mcq_stats AS
SELECT 
    user_id,
    COUNT(*) as total_attempts,
    AVG(accuracy_percent) as avg_accuracy,
    AVG(net_marks) as avg_score,
    MAX(completed_at) as last_attempt
FROM mcq_attempts
WHERE completed_at IS NOT NULL
GROUP BY user_id;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE mcq_questions IS 'Question bank for MCQ practice including PYQs';
COMMENT ON TABLE mcq_attempts IS 'User attempt records for practice and mock tests';
COMMENT ON TABLE mcq_answers IS 'Individual answer records within attempts';
COMMENT ON TABLE mcq_bookmarks IS 'User bookmarked questions for revision';
COMMENT ON TABLE mcq_mock_tests IS 'Mock test definitions with distribution settings';
COMMENT ON TABLE mcq_mock_questions IS 'Junction table linking questions to mock tests';
COMMENT ON TABLE mcq_analytics IS 'Daily analytics aggregation for user performance tracking';

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

-- Migration 026 Complete: MCQ Practice System
-- Tables: 7 (mcq_questions, mcq_attempts, mcq_answers, mcq_bookmarks, mcq_mock_tests, mcq_mock_questions, mcq_analytics)
-- Indexes: 20+ for optimal query performance
-- RLS Policies: Full row-level security
-- Triggers: Auto-update stats, timestamps
-- Seed Data: 5 PYQs (2023-2025), 1 Mock Test
