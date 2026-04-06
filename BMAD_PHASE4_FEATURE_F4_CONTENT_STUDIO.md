# BMAD Phase 4: Feature F4 - User Content Studio

## Master Prompt v8.0 Compliance
- ✅ READ Mode Feature (Section 5, F4)
- ✅ TipTap Rich Text Editor
- ✅ Bilingual Support (English + Hindi)
- ✅ Auto-save every 30 seconds
- ✅ Export Options (PDF, Word, Markdown)
- ✅ Mobile-first (360px viewport)
- ✅ AI Provider: 9Router → Groq → Ollama

---

## User Stories

### US1: Create Custom Notes
**As a** UPSC aspirant  
**I want to** create and edit rich text notes  
**So that** I can organize my study material effectively

**Acceptance Criteria:**
- [ ] Rich text editor with formatting toolbar
- [ ] Bold, italic, underline, strikethrough
- [ ] Headings (H1-H6)
- [ ] Bullet and numbered lists
- [ ] Tables for comparisons
- [ ] Image upload and embedding
- [ ] Auto-save every 30 seconds
- [ ] Word and character counter
- [ ] Bilingual support (EN/HI toggle)

### US2: Answer Writing Practice
**As a** mains aspirant  
**I want to** write answers with timer and word limit  
**So that** I can practice for UPSC mains exam

**Acceptance Criteria:**
- [ ] Timer with countdown (e.g., 7 min for 150 words)
- [ ] Word limit indicator with warnings
- [ ] Question display alongside editor
- [ ] Submit for AI evaluation (integrates with F6)
- [ ] Save drafts automatically
- [ ] Answer history with filters

### US3: Templates
**As a** student  
**I want to** use pre-built answer templates  
**So that** I can structure my answers properly

**Acceptance Criteria:**
- [ ] Introduction-Body-Conclusion template
- [ ] Pros-Cons-Conclusion template
- [ ] Case study template
- [ ] Ethics question template
- [ ] Custom template creation
- [ ] Template categories (GS1, GS2, GS3, GS4, Essay)

### US4: Export Notes
**As a** student  
**I want to** export my notes in multiple formats  
**So that** I can study offline or print them

**Acceptance Criteria:**
- [ ] PDF export with proper formatting
- [ ] Word (.docx) export
- [ ] Markdown export
- [ ] Image embedding in exports
- [ ] Export history tracking
- [ ] Batch export multiple notes

### US5: Organize Notes
**As a** student  
**I want to** organize notes with folders and tags  
**So that** I can find them easily later

**Acceptance Criteria:**
- [ ] Folder/folder structure
- [ ] Tags for categorization
- [ ] Search within notes
- [ ] Sort by date, title, subject
- [ ] Filter by subject (GS1-GS4, Essay)
- [ ] Archive old notes

---

## Database Schema

### user_notes
```sql
CREATE TABLE user_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title JSONB NOT NULL, -- {en: "", hi: ""}
  content JSONB NOT NULL, -- TipTap JSON content
  subject TEXT CHECK (subject IN ('GS1', 'GS2', 'GS3', 'GS4', 'Essay', 'Optional', 'General')),
  tags TEXT[] DEFAULT '{}',
  folder_id UUID REFERENCES note_folders(id),
  word_count INTEGER DEFAULT 0,
  is_template BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_saved_at TIMESTAMPTZ DEFAULT NOW()
);
```

### user_answers
```sql
CREATE TABLE user_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id UUID REFERENCES mains_questions(id),
  question_text JSONB NOT NULL,
  content JSONB NOT NULL,
  word_count INTEGER DEFAULT 0,
  time_taken_seconds INTEGER DEFAULT 0,
  status TEXT CHECK (status IN ('draft', 'submitted', 'evaluated')),
  evaluation_id UUID REFERENCES mains_evaluations(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### note_folders
```sql
CREATE TABLE note_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  parent_id UUID REFERENCES note_folders(id),
  color TEXT DEFAULT '#6B7280',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### answer_templates
```sql
CREATE TABLE answer_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  content JSONB NOT NULL,
  category TEXT CHECK (category IN ('GS1', 'GS2', 'GS3', 'GS4', 'Essay', 'Ethics', 'Case Study')),
  is_default BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### note_exports
```sql
CREATE TABLE note_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  note_id UUID REFERENCES user_notes(id),
  format TEXT CHECK (format IN ('pdf', 'docx', 'md')),
  file_url TEXT,
  file_size_bytes INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);
```

### RLS Policies
- Users can only CRUD their own notes, answers, folders, templates
- Public notes visible to all authenticated users
- Default templates available to all users

---

## API Endpoints

### Notes CRUD
- `POST /api/studio/notes` - Create note
- `GET /api/studio/notes` - List user's notes
- `GET /api/studio/notes/[id]` - Get single note
- `PUT /api/studio/notes/[id]` - Update note
- `DELETE /api/studio/notes/[id]` - Delete note
- `POST /api/studio/notes/[id]/autosave` - Auto-save draft

### Answers CRUD
- `POST /api/studio/answers` - Create answer
- `GET /api/studio/answers` - List user's answers
- `GET /api/studio/answers/[id]` - Get single answer
- `PUT /api/studio/answers/[id]` - Update answer
- `DELETE /api/studio/answers/[id]` - Delete answer

### Templates
- `GET /api/studio/templates` - List templates (default + user's)
- `POST /api/studio/templates` - Create custom template
- `PUT /api/studio/templates/[id]` - Update template
- `DELETE /api/studio/templates/[id]` - Delete template

### Export
- `POST /api/studio/export` - Export note to PDF/Word/Markdown
- `GET /api/studio/export/[id]` - Download exported file

---

## TipTap Editor Configuration

### Extensions
```typescript
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import Image from '@tiptap/extension-image'
import ImageResize from 'tiptap-extension-resize-image'
import Placeholder from '@tiptap/extension-placeholder'
import CharacterCount from '@tiptap/extension-character-count'
import Highlight from '@tiptap/extension-highlight'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
```

### Toolbar Items
- Undo/Redo
- Format (Bold, Italic, Underline, Strikethrough)
- Headings (H1, H2, H3)
- Lists (Bullet, Numbered, Task)
- Align (Left, Center, Right, Justify)
- Tables (Insert, Delete)
- Image Upload
- Link Insert
- Highlight
- Code Block
- Export Menu
- Word Count

---

## Auto-Save Implementation

```typescript
// Auto-save every 30 seconds
useEffect(() => {
  const interval = setInterval(() => {
    if (hasChanges) {
      saveDraft();
    }
  }, 30000);

  // Also save on blur
  window.addEventListener('blur', saveDraft);

  return () => {
    clearInterval(interval);
    window.removeEventListener('blur', saveDraft);
  };
}, [content, hasChanges]);
```

---

## Export Services

### PDF Export (pdfmake)
```typescript
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

pdfMake.vfs = pdfFonts.vfs;

const docDefinition = {
  content: [
    { text: note.title, style: 'header' },
    ...convertTipTapToPDF(note.content),
  ],
  styles: {
    header: { fontSize: 18, bold: true, margin: [0, 0, 0, 10] },
  },
};

pdfMake.createPdf(docDefinition).download(`${note.title}.pdf`);
```

### Word Export (docx)
```typescript
import { Document, Packer, Paragraph, TextRun } from 'docx';

const doc = new Document({
  sections: [{
    properties: {},
    children: convertTipTapToDocx(note.content),
  }],
});

Packer.toBlob(doc).then(blob => {
  saveAs(blob, `${note.title}.docx`);
});
```

### Markdown Export
```typescript
import { generateHTML } from '@tiptap/html';
import TurndownService from 'turndown';

const html = generateHTML(note.content, extensions);
const turndown = new TurndownService();
const markdown = turndown.turndown(html);
```

---

## UI Components

### Editor Layout
```
┌─────────────────────────────────────────────────────┐
│  Header: Title Input + Language Toggle + Export    │
├──────────────┬──────────────────────────────────────┤
│              │                                      │
│   Sidebar    │         Main Editor                  │
│              │                                      │
│  - Folders   │  - Toolbar                           │
│  - Notes     │  - Content Area                      │
│  - Templates │  - Word Counter                      │
│              │  - Timer (for answers)               │
│              │                                      │
├──────────────┴──────────────────────────────────────┤
│  Status: Auto-saved at HH:MM | 1,234 words         │
└─────────────────────────────────────────────────────┘
```

---

## Testing Checklist

- [ ] Editor loads with existing content
- [ ] All toolbar buttons work
- [ ] Auto-save triggers every 30 seconds
- [ ] Word counter updates in real-time
- [ ] Export generates correct files
- [ ] Templates insert correctly
- [ ] Images upload and display
- [ ] Tables can be created and edited
- [ ] Bilingual toggle works
- [ ] Mobile responsive (360px)
- [ ] Offline support (PWA)

---

## Integration Points

- **F6 Mains Evaluator**: Submit answers for AI evaluation
- **F3 Notes Library**: Link to generated notes
- **F13 Gamification**: Award XP for notes created, answers written
- **F14 Bookmarks**: Bookmark important notes
- **F9 Progress Dashboard**: Show notes/answers statistics

---

## Performance Targets

- Editor load time: < 1 second
- Auto-save: < 500ms
- Export generation: < 5 seconds
- Support 10,000+ word documents
- Offline editing with sync

---

## Security

- RLS enabled on all tables
- User content encrypted at rest
- Export files expire after 24 hours
- Rate limiting on export API
- Image upload size limit: 5MB
- Sanitize HTML to prevent XSS

---

**Total Estimated**: 18-22 files, ~5,000+ lines
