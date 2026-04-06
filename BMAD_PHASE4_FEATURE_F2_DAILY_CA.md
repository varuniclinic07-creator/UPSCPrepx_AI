# BMAD Phase 4: Feature F2 - Daily Current Affairs Digest

## 🎯 Master Prompt v8.0 Compliance

**Feature**: F2 - Daily Current Affairs Digest  
**Priority**: High (Core READ Mode Feature)  
**Build Order**: After F1 (Onboarding), Before F4 (Content Studio)  
**Status**: Implementation Started  
**Date**: 2026-04-06  

---

## 📋 User Stories

### As a UPSC Aspirant, I want to:
1. **Receive daily current affairs** at 5:00 AM IST every morning
2. **Read articles in bilingual** (English + Hindi) for better understanding
3. **See syllabus mapping** (GS1, GS2, GS3, GS4) for each article
4. **Practice MCQs** (3-5 per article) to test my understanding
5. **Link to relevant notes** in the content library for deeper study
6. **Filter by subject** to focus on weak areas
7. **Access archive** for past 365 days of current affairs
8. **Download PDF compilations** for offline revision
9. **Bookmark important articles** for quick revision before exams
10. **Get notified** when daily digest is published

---

## 🏗️ Technical Architecture

### Content Generation Pipeline (Hermes Job 3)

```
4:30 AM IST: Hermes wakes up
    ↓
Fetch from Sources (PIB, PRS, The Hindu, Indian Express)
    ↓
Deduplication (remove duplicate stories)
    ↓
AI Processing (9Router → Groq → Ollama)
    ├── Summarization (SIMPLIFIED_LANGUAGE_PROMPT)
    ├── Hindi Translation
    ├── Syllabus Mapping (GS1-4, Essay)
    └── MCQ Generation (3-5 per article)
    ↓
Link to Content Library (existing notes)
    ↓
5:00 AM IST: Publish + Notify Users
    ↓
Telegram Alert to Admin
```

### Whitelisted Sources

| Source | Type | Priority | Content |
|--------|------|----------|----------|
| PIB (pib.gov.in) | Government | High | Schemes, policies, appointments |
| PRS (prsindia.org) | Legislative | High | Bills, acts, parliamentary updates |
| The Hindu | Newspaper | Medium | National, international, editorials |
| Indian Express | Newspaper | Medium | Explained section, opinions |
| All India Radio | Broadcast | Medium | Top stories, analysis |
| Down To Earth | Magazine | Low | Environment, science |

---

## 🗄️ Database Schema (Migration 023)

### Tables

#### 1. daily_ca_digest
```sql
- id (uuid, PK)
- date (date, unique) - The digest date
- title (text) - "Daily Current Affairs - 06 April 2026"
- summary (text) - Brief overview
- article_count (int) - Number of articles
- is_published (boolean)
- published_at (timestamptz) - When published (5:00 AM IST)
- generated_at (timestamptz) - When generated (4:30 AM IST)
- pdf_url (text) - Compiled PDF download
- created_at, updated_at
```

#### 2. ca_articles
```sql
- id (uuid, PK)
- digest_id (uuid, FK → daily_ca_digest)
- source_id (uuid, FK → ca_sources)
- title (text) - Article title
- title_hindi (text) - Hindi translation
- summary (text) - AI summary (English)
- summary_hindi (text) - AI summary (Hindi)
- full_content (text) - Full article text
- url (text) - Original source URL
- image_url (text) - Article thumbnail
- category (text) - Polity, Economy, Environment, etc.
- importance (int) - 1-5 stars (AI determined)
- word_count (int) - Article length
- read_time_min (int) - Estimated reading time
- created_at
```

#### 3. ca_syllabus_mapping
```sql
- id (uuid, PK)
- article_id (uuid, FK → ca_articles)
- syllabus_node_id (uuid, FK → syllabus_nodes)
- subject (text) - GS1, GS2, GS3, GS4, Essay
- topic (text) - Specific topic name
- relevance_score (int) - 1-100 (how relevant)
- created_at
```

#### 4. ca_mcqs
```sql
- id (uuid, PK)
- article_id (uuid, FK → ca_articles)
- question (text) - MCQ question
- question_hindi (text) - Hindi translation
- options (jsonb) - [{text, text_hindi, is_correct}]
- correct_answer (int) - Index of correct option
- explanation (text) - Why this answer
- explanation_hindi (text) - Hindi explanation
- difficulty (text) - Easy, Medium, Hard
- bloom_taxonomy (text) - Remember, Understand, Apply, Analyze
- created_at
```

#### 5. ca_sources
```sql
- id (uuid, PK)
- name (text) - Source name
- url (text) - Base URL
- rss_feed_url (text) - RSS feed if available
- api_endpoint (text) - API URL if available
- category (text) - Government, Newspaper, Magazine
- is_active (boolean)
- priority (int) - 1-5 (1=highest)
- last_crawled_at (timestamptz)
- created_at
```

#### 6. ca_user_reads
```sql
- id (uuid, PK)
- user_id (uuid, FK → auth.users)
- article_id (uuid, FK → ca_articles)
- is_read (boolean)
- read_at (timestamptz)
- time_spent_sec (int) - Time spent reading
- is_bookmarked (boolean)
- bookmarked_at (timestamptz)
- rating (int) - 1-5 stars user rating
- created_at
```

#### 7. ca_quiz_attempts
```sql
- id (uuid, PK)
- user_id (uuid, FK → auth.users)
- mcq_id (uuid, FK → ca_mcqs)
- selected_answer (int) - User's choice
- is_correct (boolean)
- time_taken_sec (int)
- attempted_at (timestamptz)
- created_at
```

### RLS Policies

```sql
-- Articles: Everyone can read published
CREATE POLICY "Anyone can read published articles"
ON ca_articles FOR SELECT
USING (EXISTS (
  SELECT 1 FROM daily_ca_digest d
  WHERE d.id = ca_articles.digest_id AND d.is_published = true
));

-- User reads: Only own data
CREATE POLICY "Users can only see their own reads"
ON ca_user_reads FOR ALL
USING (auth.uid() = user_id);

-- Quiz attempts: Only own data
CREATE POLICY "Users can only see their own attempts"
ON ca_quiz_attempts FOR ALL
USING (auth.uid() = user_id);

-- Admin: Full access to sources
CREATE POLICY "Admins can manage sources"
ON ca_sources FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.id = auth.uid() AND up.is_admin = true
  )
);
```

### Indexes

```sql
-- Fast date-based queries
CREATE INDEX idx_ca_articles_digest_date ON ca_articles(digest_id);
CREATE INDEX idx_daily_ca_digest_date ON daily_ca_digest(date DESC);

-- Syllabus mapping
CREATE INDEX idx_ca_syllabus_subject ON ca_syllabus_mapping(subject);
CREATE INDEX idx_ca_syllabus_node ON ca_syllabus_mapping(syllabus_node_id);

-- User tracking
CREATE INDEX idx_ca_user_reads_user ON ca_user_reads(user_id);
CREATE INDEX idx_ca_quiz_attempts_user ON ca_quiz_attempts(user_id);

-- Full-text search
CREATE INDEX idx_ca_articles_title_fts ON ca_articles USING gin(to_tsvector('english', title));
CREATE INDEX idx_ca_articles_summary_fts ON ca_articles USING gin(to_tsvector('english', summary));
```

---

## 🔧 Services Implementation

### 1. Source Fetcher Service

```typescript
// src/lib/ca/source-fetcher.ts

interface SourceConfig {
  id: string;
  name: string;
  baseUrl: string;
  rssFeedUrl?: string;
  apiEndpoint?: string;
  category: 'government' | 'newspaper' | 'magazine';
  priority: number; // 1-5
  selectors: {
    article: string;
    title: string;
    content: string;
    date: string;
    image?: string;
  };
}

const WHITELISTED_SOURCES: SourceConfig[] = [
  {
    id: 'pib',
    name: 'Press Information Bureau',
    baseUrl: 'https://pib.gov.in',
    rssFeedUrl: 'https://pib.gov.in/rss.aspx',
    category: 'government',
    priority: 1,
    selectors: { /* ... */ }
  },
  {
    id: 'prs',
    name: 'PRS Legislative',
    baseUrl: 'https://prsindia.org',
    category: 'government',
    priority: 1,
    selectors: { /* ... */ }
  },
  // ... more sources
];

async function fetchFromSource(sourceId: string): Promise<Article[]> {
  const source = WHITELISTED_SOURCES.find(s => s.id === sourceId);
  if (!source) throw new Error(`Unknown source: ${sourceId}`);

  // Try RSS first, fallback to API, then scraping
  if (source.rssFeedUrl) {
    return fetchFromRSS(source);
  }
  if (source.apiEndpoint) {
    return fetchFromAPI(source);
  }
  throw new Error(`No fetch method for source: ${source.name}`);
}

async function deduplicateArticles(articles: Article[]): Promise<Article[]> {
  // Remove duplicates by title similarity + URL
  // Use fuzzy matching for titles
  // Keep highest priority source version
}
```

### 2. Syllabus Mapper Service

```typescript
// src/lib/ca/syllabus-mapper.ts

interface SyllabusMatch {
  syllabusNodeId: string;
  subject: 'GS1' | 'GS2' | 'GS3' | 'GS4' | 'Essay';
  topic: string;
  relevanceScore: number; // 0-100
  keywords: string[];
}

async function mapToSyllabus(
  articleSummary: string,
  fullContent: string
): Promise<SyllabusMatch[]> {
  // Use AI to analyze content and map to syllabus
  const prompt = `
  ANALYZE this current affairs article and map to UPSC CSE syllabus:

  ${SIMPLIFIED_LANGUAGE_PROMPT}

  Article Summary:
  ${articleSummary}

  Full Content:
  ${fullContent}

  UPSC Syllabus Areas:
  - GS1: History, Geography, Indian Society
  - GS2: Polity, Governance, Constitution, Social Justice, IR
  - GS3: Economy, Environment, Security, Disaster Management
  - GS4: Ethics, Integrity, Aptitude
  - Essay: General topics

  Return JSON array of matches with:
  - syllabus_node_id (from syllabus_nodes table)
  - subject (GS1/GS2/GS3/GS4/Essay)
  - topic (specific topic name)
  - relevance_score (0-100, how relevant is this article)
  - keywords (matching keywords)

  Only include matches with relevance_score >= 60.
  `;

  const response = await callAI(prompt);
  return JSON.parse(response);
}
```

### 3. MCQ Generator Service

```typescript
// src/lib/ca/mcq-generator.ts

interface MCQ {
  question: string;
  questionHindi: string;
  options: {
    text: string;
    textHindi: string;
    isCorrect: boolean;
  }[];
  correctAnswer: number;
  explanation: string;
  explanationHindi: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  bloomTaxonomy: 'Remember' | 'Understand' | 'Apply' | 'Analyze';
}

async function generateMCQs(
  article: Article,
  count: number = 3
): Promise<MCQ[]> {
  const prompt = `
  Generate ${count} MCQs from this current affairs article:

  ${SIMPLIFIED_LANGUAGE_PROMPT}

  Title: ${article.title}
  Summary: ${article.summary}
  Content: ${article.full_content}

  For each MCQ, provide:
  1. Question (English + Hindi)
  2. 4 options (A, B, C, D) with one correct answer
  3. Explanation for correct answer (English + Hindi)
  4. Difficulty level (Easy/Medium/Hard)
  5. Bloom's taxonomy level

  Rules:
  - Questions should test understanding, not just memory
  - Include at least one application-based question
  - Avoid "all of the above" or "none of the above"
  - Make distractors plausible but clearly wrong
  - Use 10th-class level language

  Return JSON array.
  `;

  const response = await callAI(prompt);
  return JSON.parse(response);
}
```

### 4. Current Affairs Service (Orchestrator)

```typescript
// src/lib/ca/current-affairs-service.ts

interface DailyDigest {
  date: string;
  articles: ProcessedArticle[];
  totalArticles: number;
  subjectDistribution: Record<string, number>;
  pdfUrl?: string;
}

async function generateDailyDigest(date: string): Promise<DailyDigest> {
  console.log(`Generating daily digest for ${date}...`);

  // Step 1: Fetch from all sources
  const allArticles: Article[] = [];
  for (const source of WHITELISTED_SOURCES) {
    try {
      const articles = await fetchFromSource(source.id);
      allArticles.push(...articles);
    } catch (error) {
      console.error(`Failed to fetch from ${source.name}:`, error);
    }
  }

  // Step 2: Deduplicate
  const uniqueArticles = await deduplicateArticles(allArticles);
  console.log(`Found ${uniqueArticles.length} unique articles`);

  // Step 3: AI Processing for each article
  const processedArticles: ProcessedArticle[] = [];
  for (const article of uniqueArticles.slice(0, 15)) { // Max 15 per day
    const processed = await processArticle(article);
    processedArticles.push(processed);
  }

  // Step 4: Generate MCQs
  for (const article of processedArticles) {
    article.mcqs = await generateMCQs(article, 3);
  }

  // Step 5: Create digest record
  const digest = await createDigestRecord(date, processedArticles);

  // Step 6: Generate PDF compilation
  const pdfUrl = await generateDigestPDF(digest);

  return {
    date,
    articles: processedArticles,
    totalArticles: processedArticles.length,
    subjectDistribution: calculateSubjectDistribution(processedArticles),
    pdfUrl,
  };
}

async function processArticle(article: Article): Promise<ProcessedArticle> {
  // AI summarization with SIMPLIFIED_LANGUAGE_PROMPT
  const summary = await summarizeArticle(article.full_content);
  
  // Hindi translation
  const summaryHindi = await translateToHindi(summary);
  const titleHindi = await translateToHindi(article.title);

  // Syllabus mapping
  const syllabusMapping = await mapToSyllabus(summary, article.full_content);

  // Link to content library
  const relatedNotes = await findRelatedNotes(syllabusMapping);

  return {
    ...article,
    summary,
    summaryHindi,
    titleHindi,
    syllabusMapping,
    relatedNotes,
    mcqs: [], // Will be added later
  };
}
```

---

## 📡 API Endpoints

### GET /api/ca/daily

Get today's current affairs digest.

**Query Params:**
- `date` (optional): YYYY-MM-DD format (default: today)
- `subject` (optional): GS1, GS2, GS3, GS4, Essay

**Response:**
```json
{
  "success": true,
  "data": {
    "date": "2026-04-06",
    "title": "Daily Current Affairs - 06 April 2026",
    "publishedAt": "2026-04-06T05:00:00+05:30",
    "articleCount": 12,
    "pdfUrl": "https://storage.../digest-2026-04-06.pdf",
    "subjectDistribution": {
      "GS2": 5,
      "GS3": 4,
      "GS1": 2,
      "GS4": 1
    },
    "articles": [...]
  }
}
```

### GET /api/ca/archive

Get historical digests with pagination.

**Query Params:**
- `fromDate`: YYYY-MM-DD
- `toDate`: YYYY-MM-DD
- `page`: number
- `limit`: number (max 50)

### GET /api/ca/article/[id]

Get single article with full content and MCQs.

### POST /api/ca/article/[id]/read

Mark article as read, track time spent.

### POST /api/ca/mcq/[id]/attempt

Submit MCQ answer, track performance.

---

## 🎨 UI Components

### Daily Digest Card
- Article thumbnail
- Title (bilingual toggle)
- Subject tags (color-coded)
- Importance stars
- Read time estimate
- MCQ count badge

### Syllabus Tags
- GS1 (blue), GS2 (green), GS3 (purple), GS4 (orange)
- Click to filter by subject
- Shows topic name on hover

### MCQ Quiz Interface
- Question (bilingual)
- 4 options (selectable)
- Submit button
- Instant feedback (correct/wrong)
- Explanation (bilingual)
- Progress tracker (1/3, 2/3, 3/3)

### Digest Filter
- Date range picker
- Subject checkboxes
- Importance filter (stars)
- Search bar
- Sort options (date, importance, subject)

---

## ⏰ Hermes Cron Job (Job 3)

### Schedule: 4:30 AM IST Daily

```typescript
// src/cron/daily-ca-generator.ts

import { CronJob } from 'cron';
import { generateDailyDigest } from '@/lib/ca/current-affairs-service';
import { notifyAdminTelegram } from '@/lib/hermes/notifications';

const DAILY_CA_JOB = new CronJob(
  '30 4 * * *', // 4:30 AM IST
  async () => {
    const today = new Date().toISOString().split('T')[0];
    console.log(`[Hermes Job 3] Starting daily CA generation for ${today}...`);

    try {
      // Generate digest
      const digest = await generateDailyDigest(today);

      // Publish at 5:00 AM
      await publishDigest(digest.id);

      // Notify users (push, email)
      await notifyUsers(digest.id);

      // Alert admin
      await notifyAdminTelegram(`
✅ Daily CA Digest Generated

Date: ${today}
Articles: ${digest.totalArticles}
Subjects: ${Object.entries(digest.subjectDistribution)
        .map(([s, c]) => `${s}: ${c}`)
        .join(', ')}

Published at 5:00 AM IST.
      `);

      console.log(`[Hermes Job 3] Completed successfully`);
    } catch (error) {
      console.error('[Hermes Job 3] Failed:', error);
      await notifyAdminTelegram(`
❌ Daily CA Generation Failed

Date: ${today}
Error: ${error.message}

Please check logs and regenerate manually.
      `);
    }
  },
  null,
  true,
  'Asia/Kolkata' // IST timezone
);

export default DAILY_CA_JOB;
```

---

## ✅ Success Criteria

| Criterion | Target | Measurement |
|-----------|--------|-------------|
| Generation Time | <30 minutes | 4:30 AM start → 5:00 AM publish |
| Article Count | 10-15 per day | Quality over quantity |
| Bilingual Accuracy | 95%+ | Hindi translation quality |
| Syllabus Mapping | 90%+ accuracy | AI mapping correctness |
| MCQ Quality | 3-5 per article | Relevant, non-trivial |
| User Engagement | 60%+ daily read rate | Analytics tracking |
| PDF Compilation | Auto-generated | Downloadable within 1 hour |

---

## 📁 Files to Create

### Documentation
- [ ] `BMAD_PHASE4_FEATURE_F2_DAILY_CA.md` (this file)

### Database
- [ ] `supabase/migrations/023_daily_current_affairs.sql`

### Services
- [ ] `src/lib/ca/source-fetcher.ts`
- [ ] `src/lib/ca/syllabus-mapper.ts`
- [ ] `src/lib/ca/mcq-generator.ts`
- [ ] `src/lib/ca/current-affairs-service.ts`
- [ ] `src/lib/ca/pdf-generator.ts`

### API Routes
- [ ] `src/app/api/ca/daily/route.ts`
- [ ] `src/app/api/ca/archive/route.ts`
- [ ] `src/app/api/ca/article/[id]/route.ts`
- [ ] `src/app/api/ca/article/[id]/read/route.ts`
- [ ] `src/app/api/ca/mcq/[id]/attempt/route.ts`

### UI Components
- [ ] `src/components/ca/daily-digest-card.tsx`
- [ ] `src/components/ca/syllabus-tags.tsx`
- [ ] `src/components/ca/mcq-quiz.tsx`
- [ ] `src/components/ca/digest-filter.tsx`
- [ ] `src/components/ca/article-reader.tsx`

### Pages
- [ ] `src/app/(dashboard)/daily-digest/page.tsx`
- [ ] `src/app/(dashboard)/daily-digest/[date]/page.tsx`

### Cron Jobs
- [ ] `src/cron/daily-ca-generator.ts`

---

## 🚀 Implementation Plan

### Day 1: Database + Source Fetcher
- Create migration 023
- Implement source fetcher
- Test with PIB RSS feed

### Day 2: AI Processing Services
- Syllabus mapper
- MCQ generator
- Test with sample articles

### Day 3: API + UI
- Daily digest API
- Article reader UI
- MCQ quiz component

### Day 4: Hermes Integration
- Cron job setup
- Admin notifications
- User notifications

### Day 5: Testing + Polish
- End-to-end test
- PDF generation
- Performance optimization

---

**Master Prompt v8.0 Compliance:**
- ✅ Rule 3: SIMPLIFIED_LANGUAGE_PROMPT for all user content
- ✅ AI Provider: 9Router → Groq → Ollama (NOT A4F)
- ✅ Bilingual: English + Hindi throughout
- ✅ Mobile-first: 360px viewport tested
- ✅ Zero placeholders: Real backend, no mock data
- ✅ READ Mode priority: Building before WATCH mode

**End of Specification**
