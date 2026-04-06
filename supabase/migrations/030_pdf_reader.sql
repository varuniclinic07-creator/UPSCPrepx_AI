-- ============================================================================
-- Migration 030: PDF Reader & Annotations
-- Master Prompt v8.0 - Feature F12 (READ Mode)
-- ============================================================================

-- Enable UUID extension (usually already enabled but safe to include)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PDF Documents Table
CREATE TABLE IF NOT EXISTS pdf_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  source_url TEXT,
  storage_path TEXT NOT NULL, -- Path in Supabase Storage 'pdfs' bucket
  total_pages INTEGER DEFAULT 0,
  file_size_bytes BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Annotations Table
-- Stores highlights, underlines, notes, and drawings
CREATE TABLE IF NOT EXISTS pdf_annotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES pdf_documents(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Location
  page_index INTEGER NOT NULL,
  position JSONB, -- {x, y, width, height} relative to page view

  -- Styling
  type TEXT CHECK (type IN ('highlight', 'underline', 'note', 'drawing', 'strikeout')), 
  color TEXT DEFAULT '#FFDD00', -- Hex color for highlights

  -- Content
  text_content TEXT, -- Selected text snippet
  note_content TEXT, -- For sticky notes

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Reading Progress Table
CREATE TABLE IF NOT EXISTS pdf_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  document_id UUID REFERENCES pdf_documents(id) ON DELETE CASCADE NOT NULL,
  
  last_page INTEGER DEFAULT 0,
  percentage_completed NUMERIC(5,2) DEFAULT 0,
  total_time_spent_minutes INTEGER DEFAULT 0,
  last_read_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, document_id)
);

-- ==========================
-- INDEXES
-- ==========================

CREATE INDEX idx_pdf_docs_user ON pdf_documents(user_id);
CREATE INDEX idx_pdf_annotations_doc ON pdf_annotations(document_id);
CREATE INDEX idx_pdf_annotations_user ON pdf_annotations(user_id);
CREATE INDEX idx_pdf_annotations_page ON pdf_annotations(page_index);
CREATE INDEX idx_pdf_progress_user ON pdf_progress(user_id);

-- ==========================
-- ROW LEVEL SECURITY (RLS)
-- ==========================

ALTER TABLE pdf_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdf_annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdf_progress ENABLE ROW LEVEL SECURITY;

-- Document Policies
CREATE POLICY "Users can upload own documents"
  ON pdf_documents FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own documents"
  ON pdf_documents FOR SELECT USING (auth.uid() = user_id);

-- Annotation Policies
CREATE POLICY "Users can view own annotations"
  ON pdf_annotations FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own annotations"
  ON pdf_annotations FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own annotations"
  ON pdf_annotations FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own annotations"
  ON pdf_annotations FOR DELETE USING (auth.uid() = user_id);

-- Progress Policies
CREATE POLICY "Users can manage own progress"
  ON pdf_progress FOR ALL USING (auth.uid() = user_id);

-- ==========================
-- TRIGGER FOR UPDATED_AT
-- ==========================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_pdf_documents_updated_at
    BEFORE UPDATE ON pdf_documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pdf_annotations_updated_at
    BEFORE UPDATE ON pdf_annotations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
