-- ============================================================================
-- Migration 024: User Content Studio (Feature F4)
-- Master Prompt v8.0 - READ Mode
-- TipTap Rich Text Editor, Auto-save, Export (PDF/Word/Markdown)
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLE: note_folders
-- Nested folder structure for organizing notes
-- ============================================================================

CREATE TABLE IF NOT EXISTS note_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL CHECK (length(name) > 0 AND length(name) <= 100),
  parent_id UUID REFERENCES note_folders(id) ON DELETE CASCADE,
  color TEXT DEFAULT '#6B7280' CHECK (color ~ '^#[0-9A-Fa-f]{6}$'),
  icon TEXT DEFAULT 'folder',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent circular references
  CONSTRAINT no_circular_reference CHECK (id != parent_id)
);

-- Index for fast folder lookups
CREATE INDEX IF NOT EXISTS idx_note_folders_user_id ON note_folders(user_id);
CREATE INDEX IF NOT EXISTS idx_note_folders_parent_id ON note_folders(parent_id);

-- ============================================================================
-- TABLE: user_notes
-- Main table for user-created notes with TipTap JSON content
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title JSONB NOT NULL DEFAULT '{"en": "", "hi": ""}', -- Bilingual title
  content JSONB NOT NULL DEFAULT '{"type": "doc", "content": []}', -- TipTap JSON
  subject TEXT DEFAULT 'General' CHECK (subject IN (
    'GS1', 'GS2', 'GS3', 'GS4', 'Essay', 'Optional', 'General'
  )),
  tags TEXT[] DEFAULT '{}',
  folder_id UUID REFERENCES note_folders(id) ON DELETE SET NULL,
  word_count INTEGER DEFAULT 0,
  character_count INTEGER DEFAULT 0,
  is_template BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_saved_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_title CHECK (
    jsonb_typeof(title) = 'object' AND
    title ? 'en' AND title ? 'hi'
  ),
  CONSTRAINT valid_content CHECK (jsonb_typeof(content) = 'object')
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_user_notes_user_id ON user_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notes_subject ON user_notes(subject);
CREATE INDEX IF NOT EXISTS idx_user_notes_folder_id ON user_notes(folder_id);
CREATE INDEX IF NOT EXISTS idx_user_notes_tags ON user_notes USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_user_notes_updated_at ON user_notes(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_notes_is_pinned ON user_notes(is_pinned) WHERE is_pinned = true;
CREATE INDEX IF NOT EXISTS idx_user_notes_is_archived ON user_notes(is_archived) WHERE is_archived = true;

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_user_notes_title_search ON user_notes USING GIN(
  to_tsvector('english', title->>'en' || ' ' || COALESCE(title->>'hi', ''))
);

-- ============================================================================
-- TABLE: user_answers
-- Practice answers for mains evaluation
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  question_id UUID, -- References mains_questions (optional, can be custom)
  question_text JSONB NOT NULL DEFAULT '{"en": "", "hi": ""}',
  content JSONB NOT NULL DEFAULT '{"type": "doc", "content": []}',
  word_count INTEGER DEFAULT 0,
  time_taken_seconds INTEGER DEFAULT 0,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'evaluated')),
  evaluation_id UUID, -- References mains_evaluations (optional)
  word_limit INTEGER DEFAULT 150, -- Standard mains word limit
  time_limit_seconds INTEGER DEFAULT 420, -- 7 minutes for 150 words
  created_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_question_text CHECK (
    jsonb_typeof(question_text) = 'object' AND
    question_text ? 'en' AND question_text ? 'hi'
  ),
  CONSTRAINT valid_content CHECK (jsonb_typeof(content) = 'object'),
  CONSTRAINT valid_status CHECK (
    (status = 'draft' AND submitted_at IS NULL) OR
    (status IN ('submitted', 'evaluated') AND submitted_at IS NOT NULL)
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_answers_user_id ON user_answers(user_id);
CREATE INDEX IF NOT EXISTS idx_user_answers_status ON user_answers(status);
CREATE INDEX IF NOT EXISTS idx_user_answers_question_id ON user_answers(question_id);
CREATE INDEX IF NOT EXISTS idx_user_answers_submitted_at ON user_answers(submitted_at DESC);

-- ============================================================================
-- TABLE: answer_templates
-- Pre-built templates for answer structuring
-- ============================================================================

CREATE TABLE IF NOT EXISTS answer_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (length(name) > 0 AND length(name) <= 100),
  description TEXT,
  content JSONB NOT NULL DEFAULT '{"type": "doc", "content": []}',
  category TEXT CHECK (category IN (
    'GS1', 'GS2', 'GS3', 'GS4', 'Essay', 'Ethics', 'Case Study', 'General'
  )),
  is_default BOOLEAN DEFAULT false, -- System-provided templates
  is_public BOOLEAN DEFAULT false, -- Shared with community
  usage_count INTEGER DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_content CHECK (jsonb_typeof(content) = 'object')
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_answer_templates_user_id ON answer_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_answer_templates_category ON answer_templates(category);
CREATE INDEX IF NOT EXISTS idx_answer_templates_is_default ON answer_templates(is_default) WHERE is_default = true;
CREATE INDEX IF NOT EXISTS idx_answer_templates_tags ON answer_templates USING GIN(tags);

-- ============================================================================
-- TABLE: note_exports
-- Export history and file tracking
-- ============================================================================

CREATE TABLE IF NOT EXISTS note_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  note_id UUID REFERENCES user_notes(id) ON DELETE CASCADE,
  format TEXT NOT NULL CHECK (format IN ('pdf', 'docx', 'md')),
  file_name TEXT NOT NULL,
  file_url TEXT,
  file_size_bytes INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),
  downloaded_at TIMESTAMPTZ,
  download_count INTEGER DEFAULT 0,
  
  CONSTRAINT valid_expires CHECK (expires_at > created_at)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_note_exports_user_id ON note_exports(user_id);
CREATE INDEX IF NOT EXISTS idx_note_exports_note_id ON note_exports(note_id);
CREATE INDEX IF NOT EXISTS idx_note_exports_status ON note_exports(status);
CREATE INDEX IF NOT EXISTS idx_note_exports_expires_at ON note_exports(expires_at);

-- ============================================================================
-- TABLE: note_collaborations (Future feature - shared notes)
-- ============================================================================

CREATE TABLE IF NOT EXISTS note_collaborations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID REFERENCES user_notes(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  permission TEXT NOT NULL CHECK (permission IN ('view', 'comment', 'edit')),
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  
  UNIQUE(note_id, user_id)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_note_collaborations_note_id ON note_collaborations(note_id);
CREATE INDEX IF NOT EXISTS idx_note_collaborations_user_id ON note_collaborations(user_id);

-- ============================================================================
-- TABLE: note_versions (Auto-save versioning)
-- ============================================================================

CREATE TABLE IF NOT EXISTS note_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID REFERENCES user_notes(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content JSONB NOT NULL,
  word_count INTEGER DEFAULT 0,
  version_number INTEGER NOT NULL,
  save_type TEXT DEFAULT 'auto' CHECK (save_type IN ('auto', 'manual', 'snapshot')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(note_id, version_number)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_note_versions_note_id ON note_versions(note_id);
CREATE INDEX IF NOT EXISTS idx_note_versions_created_at ON note_versions(created_at DESC);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE note_folders        ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notes          ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_answers        ENABLE ROW LEVEL SECURITY;
ALTER TABLE answer_templates    ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_exports        ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_collaborations ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_versions       ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (idempotent re-runs)
DROP POLICY IF EXISTS "Users can view own folders"                    ON note_folders;
DROP POLICY IF EXISTS "Users can insert own folders"                  ON note_folders;
DROP POLICY IF EXISTS "Users can update own folders"                  ON note_folders;
DROP POLICY IF EXISTS "Users can delete own folders"                  ON note_folders;
DROP POLICY IF EXISTS "Users can view own notes"                      ON user_notes;
DROP POLICY IF EXISTS "Users can view public notes"                   ON user_notes;
DROP POLICY IF EXISTS "Users can insert own notes"                    ON user_notes;
DROP POLICY IF EXISTS "Users can update own notes"                    ON user_notes;
DROP POLICY IF EXISTS "Users can delete own notes"                    ON user_notes;
DROP POLICY IF EXISTS "Users can view own answers"                    ON user_answers;
DROP POLICY IF EXISTS "Users can insert own answers"                  ON user_answers;
DROP POLICY IF EXISTS "Users can update own answers"                  ON user_answers;
DROP POLICY IF EXISTS "Users can delete own answers"                  ON user_answers;
DROP POLICY IF EXISTS "Users can view all templates"                  ON answer_templates;
DROP POLICY IF EXISTS "Users can insert own templates"                ON answer_templates;
DROP POLICY IF EXISTS "Users can update own templates"                ON answer_templates;
DROP POLICY IF EXISTS "Users can delete own templates"                ON answer_templates;
DROP POLICY IF EXISTS "Users can view own exports"                    ON note_exports;
DROP POLICY IF EXISTS "Users can insert own exports"                  ON note_exports;
DROP POLICY IF EXISTS "Users can update own exports"                  ON note_exports;
DROP POLICY IF EXISTS "Users can view collaborations on their notes"  ON note_collaborations;
DROP POLICY IF EXISTS "Users can grant collaboration on own notes"    ON note_collaborations;
DROP POLICY IF EXISTS "Users can revoke collaboration on own notes"   ON note_collaborations;
DROP POLICY IF EXISTS "Users can view versions of own notes"          ON note_versions;
DROP POLICY IF EXISTS "Users can insert versions of own notes"        ON note_versions;

-- ============================================================================
-- note_folders Policies
-- ============================================================================

CREATE POLICY "Users can view own folders"
  ON note_folders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own folders"
  ON note_folders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own folders"
  ON note_folders FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own folders"
  ON note_folders FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- user_notes Policies
-- ============================================================================

CREATE POLICY "Users can view own notes"
  ON user_notes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view public notes"
  ON user_notes FOR SELECT
  USING (is_public = true);

CREATE POLICY "Users can insert own notes"
  ON user_notes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notes"
  ON user_notes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notes"
  ON user_notes FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- user_answers Policies
-- ============================================================================

CREATE POLICY "Users can view own answers"
  ON user_answers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own answers"
  ON user_answers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own answers"
  ON user_answers FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own answers"
  ON user_answers FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- answer_templates Policies
-- ============================================================================

CREATE POLICY "Users can view all templates"
  ON answer_templates FOR SELECT
  USING (true); -- All templates visible

CREATE POLICY "Users can insert own templates"
  ON answer_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id OR is_default = true);

CREATE POLICY "Users can update own templates"
  ON answer_templates FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own templates"
  ON answer_templates FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- note_exports Policies
-- ============================================================================

CREATE POLICY "Users can view own exports"
  ON note_exports FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own exports"
  ON note_exports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own exports"
  ON note_exports FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================================
-- note_collaborations Policies
-- ============================================================================

CREATE POLICY "Users can view collaborations on their notes"
  ON note_collaborations FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM user_notes
      WHERE user_notes.id = note_collaborations.note_id
      AND user_notes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can grant collaboration on own notes"
  ON note_collaborations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_notes
      WHERE user_notes.id = note_collaborations.note_id
      AND user_notes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can revoke collaboration on own notes"
  ON note_collaborations FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_notes
      WHERE user_notes.id = note_collaborations.note_id
      AND user_notes.user_id = auth.uid()
    )
  );

-- ============================================================================
-- note_versions Policies
-- ============================================================================

CREATE POLICY "Users can view versions of own notes"
  ON note_versions FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM user_notes
      WHERE user_notes.id = note_versions.note_id
      AND user_notes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert versions of own notes"
  ON note_versions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- SEED DATA: Default Answer Templates
-- ============================================================================

-- Template 1: Introduction-Body-Conclusion (IBC)
INSERT INTO answer_templates (name, description, content, category, is_default, tags)
VALUES (
  'Introduction-Body-Conclusion',
  'Standard template for structured answer writing with clear introduction, body paragraphs, and conclusion',
  '{
    "type": "doc",
    "content": [
      {
        "type": "heading",
        "attrs": {"level": 2},
        "content": [{"type": "text", "text": "Introduction"}]
      },
      {
        "type": "paragraph",
        "content": [{"type": "text", "text": "[Start with a contextual statement, define key terms, or quote a relevant fact/data]"}]
      },
      {
        "type": "heading",
        "attrs": {"level": 2},
        "content": [{"type": "text", "text": "Body"}]
      },
      {
        "type": "heading",
        "attrs": {"level": 3},
        "content": [{"type": "text", "text": "Key Point 1"}]
      },
      {
        "type": "paragraph",
        "content": [{"type": "text", "text": "[Explain your first argument with examples and data]"}]
      },
      {
        "type": "heading",
        "attrs": {"level": 3},
        "content": [{"type": "text", "text": "Key Point 2"}]
      },
      {
        "type": "paragraph",
        "content": [{"type": "text", "text": "[Explain your second argument with examples and data]"}]
      },
      {
        "type": "heading",
        "attrs": {"level": 3},
        "content": [{"type": "text", "text": "Key Point 3"}]
      },
      {
        "type": "paragraph",
        "content": [{"type": "text", "text": "[Explain your third argument with examples and data]"}]
      },
      {
        "type": "heading",
        "attrs": {"level": 2},
        "content": [{"type": "text", "text": "Conclusion"}]
      },
      {
        "type": "paragraph",
        "content": [{"type": "text", "text": "[Summarize key points, provide a way forward, or end with an optimistic note]"}]
      }
    ]
  }'::jsonb,
  'General',
  true,
  ARRAY['structure', 'basic', 'all-papers']
);

-- Template 2: Pros-Cons-Conclusion
INSERT INTO answer_templates (name, description, content, category, is_default, tags)
VALUES (
  'Pros-Cons-Conclusion',
  'Balanced template for analyzing issues with advantages, disadvantages, and way forward',
  '{
    "type": "doc",
    "content": [
      {
        "type": "heading",
        "attrs": {"level": 2},
        "content": [{"type": "text", "text": "Introduction"}]
      },
      {
        "type": "paragraph",
        "content": [{"type": "text", "text": "[Define the issue/topic and its relevance]"}]
      },
      {
        "type": "heading",
        "attrs": {"level": 2},
        "content": [{"type": "text", "text": "Advantages/Pros"}]
      },
      {
        "type": "bulletList",
        "content": [
          {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "[Point 1 with explanation]"}]}]},
          {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "[Point 2 with explanation]"}]}]},
          {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "[Point 3 with explanation]"}]}]}
        ]
      },
      {
        "type": "heading",
        "attrs": {"level": 2},
        "content": [{"type": "text", "text": "Disadvantages/Cons"}]
      },
      {
        "type": "bulletList",
        "content": [
          {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "[Point 1 with explanation]"}]}]},
          {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "[Point 2 with explanation]"}]}]},
          {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "[Point 3 with explanation]"}]}]}
        ]
      },
      {
        "type": "heading",
        "attrs": {"level": 2},
        "content": [{"type": "text", "text": "Way Forward/Conclusion"}]
      },
      {
        "type": "paragraph",
        "content": [{"type": "text", "text": "[Provide balanced recommendations and conclude positively]"}]
      }
    ]
  }'::jsonb,
  'GS2',
  true,
  ARRAY['analysis', 'balanced', 'policy']
);

-- Template 3: Ethics Case Study (IRAC)
INSERT INTO answer_templates (name, description, content, category, is_default, tags)
VALUES (
  'Ethics Case Study (IRAC)',
  'Issue-Rule-Analysis-Conclusion template for GS4 Ethics case studies',
  '{
    "type": "doc",
    "content": [
      {
        "type": "heading",
        "attrs": {"level": 2},
        "content": [{"type": "text", "text": "1. Identify the Ethical Issues"}]
      },
      {
        "type": "bulletList",
        "content": [
          {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "[List all ethical dilemmas in the case]"}]}]},
          {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "[Identify stakeholders affected]"}]}]}
        ]
      },
      {
        "type": "heading",
        "attrs": {"level": 2},
        "content": [{"type": "text", "text": "2. Relevant Rules/Principles"}]
      },
      {
        "type": "bulletList",
        "content": [
          {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "[Constitutional provisions]"}]}]},
          {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "[Laws and regulations]"}]}]},
          {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "[Ethical theories applicable]"}]}]}
        ]
      },
      {
        "type": "heading",
        "attrs": {"level": 2},
        "content": [{"type": "text", "text": "3. Analysis of Options"}]
      },
      {
        "type": "paragraph",
        "content": [{"type": "text", "text": "[Evaluate each possible course of action with pros and cons]"}]
      },
      {
        "type": "heading",
        "attrs": {"level": 2},
        "content": [{"type": "text", "text": "4. Conclusion & Course of Action"}]
      },
      {
        "type": "paragraph",
        "content": [{"type": "text", "text": "[State your final decision with justification]"}]
      }
    ]
  }'::jsonb,
  'Ethics',
  true,
  ARRAY['case-study', 'gs4', 'ethics']
);

-- Template 4: Data-Driven Answer
INSERT INTO answer_templates (name, description, content, category, is_default, tags)
VALUES (
  'Data-Driven Answer',
  'Template for answers requiring statistics, data, and factual evidence',
  '{
    "type": "doc",
    "content": [
      {
        "type": "heading",
        "attrs": {"level": 2},
        "content": [{"type": "text", "text": "Introduction"}]
      },
      {
        "type": "paragraph",
        "content": [
          {"type": "text", "text": "[Start with a key statistic or data point]"},
          {"type": "text", "text": " Example: \"According to NITI Aayog...\"", "marks": {"italic": true}}
        ]
      },
      {
        "type": "heading",
        "attrs": {"level": 2},
        "content": [{"type": "text", "text": "Current Status (Data)"}]
      },
      {
        "type": "table",
        "content": [
          {"type": "tableRow", "content": [
            {"type": "tableHeader", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Indicator"}]}]},
            {"type": "tableHeader", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Value"}]}]},
            {"type": "tableHeader", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Source"}]}]}
          ]},
          {"type": "tableRow", "content": [
            {"type": "tableCell", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "[Data point 1]"}]}]},
            {"type": "tableCell", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "[Value]"}]}]},
            {"type": "tableCell", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "[Source]}"}]}]}
          ]}
        ]
      },
      {
        "type": "heading",
        "attrs": {"level": 2},
        "content": [{"type": "text", "text": "Analysis"}]
      },
      {
        "type": "paragraph",
        "content": [{"type": "text", "text": "[Interpret the data and draw insights]"}]
      },
      {
        "type": "heading",
        "attrs": {"level": 2},
        "content": [{"type": "text", "text": "Recommendations"}]
      },
      {
        "type": "bulletList",
        "content": [
          {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "[Evidence-based recommendation 1]"}]}]},
          {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "[Evidence-based recommendation 2]"}]}]}
        ]
      }
    ]
  }'::jsonb,
  'GS3',
  true,
  ARRAY['data', 'statistics', 'economy']
);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
DROP TRIGGER IF EXISTS update_note_folders_updated_at    ON note_folders;
CREATE TRIGGER update_note_folders_updated_at
  BEFORE UPDATE ON note_folders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_notes_updated_at       ON user_notes;
CREATE TRIGGER update_user_notes_updated_at
  BEFORE UPDATE ON user_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_answers_updated_at     ON user_answers;
CREATE TRIGGER update_user_answers_updated_at
  BEFORE UPDATE ON user_answers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_answer_templates_updated_at ON answer_templates;
CREATE TRIGGER update_answer_templates_updated_at
  BEFORE UPDATE ON answer_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to auto-increment version number
CREATE OR REPLACE FUNCTION increment_version_number()
RETURNS TRIGGER AS $$
BEGIN
  SELECT COALESCE(MAX(version_number), 0) + 1 INTO NEW.version_number
  FROM note_versions WHERE note_id = NEW.note_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS before_insert_note_version ON note_versions;
CREATE TRIGGER before_insert_note_version
  BEFORE INSERT ON note_versions
  FOR EACH ROW EXECUTE FUNCTION increment_version_number();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE user_notes IS 'User-created notes with TipTap rich text content (Feature F4)';
COMMENT ON TABLE user_answers IS 'Practice answers for mains evaluation with timer tracking';
COMMENT ON TABLE note_folders IS 'Nested folder structure for organizing notes';
COMMENT ON TABLE answer_templates IS 'Pre-built templates for answer structuring (IBC, Pros-Cons, etc.)';
COMMENT ON TABLE note_exports IS 'Export history for PDF/Word/Markdown downloads';
COMMENT ON TABLE note_collaborations IS 'Shared note permissions (future feature)';
COMMENT ON TABLE note_versions IS 'Auto-save version history for notes';

COMMENT ON COLUMN user_notes.title IS 'Bilingual title: {"en": "English", "hi": "हिंदी"}';
COMMENT ON COLUMN user_notes.content IS 'TipTap JSON content structure';
COMMENT ON COLUMN user_answers.time_taken_seconds IS 'Time spent writing the answer (for practice tracking)';
COMMENT ON COLUMN answer_templates.is_default IS 'System-provided templates available to all users';
COMMENT ON COLUMN note_exports.expires_at IS 'Export files expire after 24 hours for storage management';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
