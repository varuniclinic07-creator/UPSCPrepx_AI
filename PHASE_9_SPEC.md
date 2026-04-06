# Phase 9: API Integration - Detailed Specification

**Files**: 12  
**Estimated Time**: 6-8 hours  
**Priority**: High  
**Purpose**: Connect frontend to agentic services and add content utilities

---

## File-by-File Breakdown

### 1. Agentic Orchestrator (2h)

**File**: `src/app/api/agentic/orchestrator/route.ts`

**Purpose**: Smart routing to appropriate agentic service based on query

**Features**:
- Analyze user query intent
- Route to web-search, doc-chat, or file-search
- Combine results if needed
- Track usage per user

**Implementation Outline**:
```typescript
// POST /api/agentic/orchestrator
// Body: { query: string, context?: object }

// 1. Check user subscription & limits
// 2. Analyze query intent (keyword matching or LLM classification)
// 3. Route to appropriate service:
//    - "latest news" → web-search
//    - "explain this PDF" → doc-chat
//    - "find notes on X" → file-search
// 4. Return formatted response
// 5. Log usage to database
```

**Dependencies**: 
- User session
- Rate limiter
- Service health checks

---

### 2. Web Search Proxy (1h)

**File**: `src/app/api/agentic/web-search/route.ts`

**Purpose**: Proxy to agentic-web-search service (port 8030)

**Implementation**:
```typescript
// POST /api/agentic/web-search
// Body: { query: string, maxResults?: number }

// 1. Validate user access
// 2. Forward to http://localhost:8030/search
// 3. Transform response for frontend
// 4. Track usage
```

**Response Format**:
```json
{
  "query": "UPSC prelims syllabus 2024",
  "results": [
    {
      "title": "...",
      "url": "...",
      "snippet": "...",
      "relevance": 0.95
    }
  ],
  "cached": false,
  "sources": 5
}
```

---

### 3. Document Chat Proxy (1h)

**File**: `src/app/api/agentic/doc-chat/route.ts`

**Purpose**: Proxy to autodoc-thinker service (port 8031)

**Endpoints**:
1. `POST /upload` - Upload document
2. `POST /chat` - Ask questions

**Implementation**:
```typescript
// Upload
// 1. Accept PDF/DOCX file
// 2. Forward to http://localhost:8031/upload
// 3. Return document ID

// Chat
// 1. Get document ID + question
// 2. Forward to http://localhost:8031/chat
// 3. Return answer with source references
```

---

### 4. File Search Proxy (1h)

**File**: `src/app/api/agentic/file-search/route.ts`

**Purpose**: Proxy to agentic-file-search service (port 8032)

**Implementation**:
```typescript
// POST /api/agentic/file-search
// Body: { query: string, path?: string }

// 1. Validate access
// 2. Forward to http://localhost:8032/search
// 3. Return file paths + metadata
```

**Response**:
```json
{
  "query": "Indian polity notes",
  "results": [
    {
      "path": "/materials/notes/polity/chapter1.pdf",
      "title": "Indian Constitution Basics",
      "size": "2.4 MB",
      "type": "pdf",
      "relevance": 0.92
    }
  ]
}
```

---

### 5. Content Refiner (1h)

**File**: `src/lib/content/refiner.ts`

**Purpose**: Improve AI-generated content quality

**Functions**:
```typescript
// Enhance content with:
export async function refineContent(content: string): Promise<string>
export async function addExamContext(content: string, topic: string): Promise<string>
export async function formatForUPSC(content: string): Promise<string>
export async function addMnemonics(content: string): Promise<string>
```

**Usage**: Post-processing for lecture scripts, notes

---

### 6. Syllabus Validator (1h)

**File**: `src/lib/content/syllabus-validator.ts`

**Purpose**: Ensure content aligns with UPSC syllabus

**Functions**:
```typescript
export async function validateContent(
  content: string, 
  subject: string
): Promise<{
  isValid: boolean;
  syllabusTopics: string[];
  coverage: number; // 0-100%
  suggestions: string[];
}>

export async function getSyllabusTopics(subject: string): Promise<string[]>
export async function checkRelevance(content: string, topic: string): Promise<number>
```

**Data Source**: `syllabus_topics` table from seed data

---

### 7. Language Simplifier (1h)

**File**: `src/lib/content/simplifier.ts`

**Purpose**: Convert complex text to 10th standard level

**Functions**:
```typescript
export async function simplifyText(
  text: string,
  targetLevel: '10th' | '12th' = '10th'
): Promise<string>

export async function simplifyBatch(texts: string[]): Promise<string[]>
export async function getReadabilityScore(text: string): Promise<number>
```

**Implementation**: Uses A4F API with specific prompt

---

### 8. Citation Generator (30min)

**File**: `src/lib/content/citation-generator.ts`

**Purpose**: Add proper source citations

**Functions**:
```typescript
export function generateCitation(source: {
  type: 'book' | 'article' | 'website' | 'video';
  title: string;
  author?: string;
  url?: string;
  date?: string;
}): string

export function formatReferences(sources: Source[]): string
export function validateSources(content: string): boolean
```

**Output Format**: APA style for academic credibility

---

### 9. PDF Generator Service (1h)

**File**: `src/lib/pdf/pdf-generator.ts`

**Purpose**: Generate PDFs for notes, lectures, materials

**Functions**:
```typescript
export async function generateNotesPDF(
  title: string,
  content: string,
  metadata?: object
): Promise<string> // Returns PDF URL

export async function generateLectureNotesPDF(
  lectureId: string,
  chapters: Chapter[]
): Promise<string>

export async function generateCertificate(
  userName: string,
  courseName: string
): Promise<string>
```

**Tech**: Uses `pdfkit` library (already in package.json)

---

### 10. Cache Manager (1h)

**File**: `src/lib/cache/cache-manager.ts`

**Purpose**: Response caching for API calls

**Functions**:
```typescript
export async function cacheResponse(
  key: string,
  data: any,
  ttl: number = 3600
): Promise<void>

export async function getCachedResponse<T>(key: string): Promise<T | null>
export async function invalidateCache(pattern: string): Promise<number>
export async function getCacheStats(): Promise<CacheStats>
```

**Usage**:
- Cache web search results (1 hour)
- Cache syllabus data (24 hours)
- Cache content transformations (30 min)

---

### 11. Materials Upload API (30min)

**File**: `src/app/api/materials/upload/route.ts`

**Purpose**: Upload newspapers, magazines, study materials

**Implementation**:
```typescript
// POST /api/materials/upload
// Body: FormData with file + metadata

// 1. Validate admin access
// 2. Upload to MinIO
// 3. Extract text (for PDFs)
// 4. Create database record
// 5. Return material ID
```

**Supported Formats**: PDF, DOCX, images

---

### 12. Scraping Cron Jobs (1h)

**File**: `src/cron/scraping-jobs.ts`

**Purpose**: Automated content fetching

**Jobs**:
```typescript
// Daily at 6 AM: Fetch current affairs
export async function scrapeCurrentAffairs(): Promise<void>

// Daily at 7 AM: Fetch news headlines
export async function scrapeNews(): Promise<void>

// Weekly: Update government schemes
export async function scrapeGovernmentSchemes(): Promise<void>

// Monthly: Check for syllabus updates
export async function checkSyllabusUpdates(): Promise<void>
```

**Sources**:
- PIB (Press Information Bureau)
- Drishti IAS
- UPSC official website
- The Hindu editorials

**Tech**: Uses `crawl4ai` Docker service

---

## Implementation Sequence

### Day 1 (4h)
1. ✅ Agentic orchestrator (2h)
2. ✅ Web search proxy (1h)
3. ✅ Doc chat proxy (1h)

### Day 2 (4h)
4. ✅ File search proxy (1h)
5. ✅ Content refiner (1h)
6. ✅ Syllabus validator (1h)
7. ✅ Language simplifier (1h)
8. ✅ Citation generator (30min)
9. ✅ PDF generator (1h)
10. ✅ Cache manager (1h)
11. ✅ Materials upload (30min)
12. ✅ Scraping jobs (1h)

---

## Testing Checklist

After implementation:

### Orchestrator
- [ ] Routes web queries correctly
- [ ] Routes document queries correctly
- [ ] Routes file queries correctly
- [ ] Respects user limits
- [ ] Logs usage

### Proxies
- [ ] Web search returns results
- [ ] Document upload works
- [ ] File search finds files
- [ ] Error handling works

### Utilities
- [ ] Content refiner improves quality
- [ ] Syllabus validator checks topics
- [ ] Simplifier reduces complexity
- [ ] Citations format correctly

### Services
- [ ] PDF generation works
- [ ] Cache stores/retrieves data
- [ ] Materials upload saves files
- [ ] Scraping fetches content

---

## Dependencies Required

**Already installed**:
- `openai` (A4F API)
- `pdfkit` (PDF generation)
- `ioredis` (caching)

**May need**:
```bash
npm install cheerio  # HTML parsing for scraping
npm install axios    # HTTP requests
```

---

## Database Changes

No new migrations needed! Tables already exist:
- `agentic_sessions` - Track usage
- `materials` - Store uploaded content
- `current_affairs` - Store scraped news
- `syllabus_topics` - Validation data

---

## Environment Variables

Add to `.env.production`:
```env
# Agentic Services
AGENTIC_WEB_SEARCH_URL=http://localhost:8030
AGENTIC_DOC_CHAT_URL=http://localhost:8031
AGENTIC_FILE_SEARCH_URL=http://localhost:8032

# Content Sources
PIB_RSS_URL=https://pib.gov.in/rss/...
DRISHTI_IAS_URL=https://www.drishtiias.com/...
```

---

## Success Criteria

Phase 9 complete when:
1. ✅ All 12 files created
2. ✅ Frontend can call agentic services
3. ✅ Orchestrator routes intelligently
4. ✅ Content utilities work
5. ✅ Caching reduces API calls
6. ✅ Materials can be uploaded
7. ✅ Scraping jobs run successfully

**Deliverable**: Fully integrated agentic AI system with content management

---

**Ready to implement? Start with file #1 (Orchestrator) and work sequentially.**
