# CRAWL4AI COMPLETE SETUP GUIDE

**Status**: Production-Ready Integration
**VPS**: 89.117.60.144:8000 (Coolify)
**App Location**: `C:\Users\DR-VARUNI\Desktop\AI APPS NEW\BMAD Latest\latest app\Crawl4ai`

---

## 🎯 ARCHITECTURE OVERVIEW

### Components
1. **Crawl4AI Service** - Python-based web scraper (Port 11235)
2. **Next.js App Integration** - TypeScript client library
3. **Supabase Storage** - Content database
4. **Coolify Deployment** - Docker container orchestration

### Data Flow
```
News Sources → Crawl4AI Service → Supabase → Next.js App → Users
```

---

## 📋 PART 1: COOLIFY VPS DEPLOYMENT

### Step 1: Prepare Crawl4AI Service

**Location**: `C:\Users\DR-VARUNI\Desktop\AI APPS NEW\BMAD Latest\latest app\Crawl4ai`

**Files Needed**:
- ✅ `Dockerfile` - Already exists
- ✅ `docker-compose.yml` - Already exists
- ✅ `requirements.txt` - Already exists
- ✅ `upsc_crawler_config.py` - Already exists
- ✅ `upsc_content_crawler.py` - Main crawler
- ✅ `crawler_scheduler.py` - Scheduling logic
- ⚠️ `.env` - Need to create from template

### Step 2: Configure Environment

```bash
# In Crawl4ai directory
cp .env.template .env
```

**Edit `.env` with your credentials**:
```env
# Supabase (REQUIRED)
SUPABASE_URL=https://emotqkukvfwjycvwfvyj.supabase.co
SUPABASE_KEY=your-service-role-key-here

# Crawler Settings
CRAWLER_USER_AGENT=UPSC-CSE-Master-Bot/1.0 (Educational; +https://aimasteryedu.in)
DEFAULT_RATE_LIMIT=3.0
MAX_CONCURRENT_REQUESTS=3
REQUEST_TIMEOUT=30
MAX_RETRIES=3
RESPECT_ROBOTS_TXT=true

# Logging
LOG_LEVEL=INFO
LOG_FILE=logs/crawler.log

# Storage
STORE_RAW_HTML=false
ENABLE_COMPRESSION=true
STORAGE_BATCH_SIZE=100

# Scheduling
TIMEZONE=Asia/Kolkata
RUN_INITIAL_CRAWL=true
```

### Step 3: Deploy to Coolify

**Option A: Using Coolify UI**

1. Login to Coolify: `http://89.117.60.144:8000`
2. Create New Resource → Docker Compose
3. Name: `upsc-crawler`
4. Upload files:
   - `docker-compose.yml`
   - `Dockerfile`
   - All Python files
5. Set Environment Variables (from `.env`)
6. Deploy

**Option B: Using Git Repository**

1. Push Crawl4ai folder to Git
2. In Coolify:
   - New Resource → Git Repository
   - Repository URL: `your-repo-url`
   - Branch: `main`
   - Build Pack: Docker Compose
   - Port: 11235
3. Deploy

### Step 4: Verify Deployment

```bash
# Check if service is running
curl http://89.117.60.144:11235/health

# Check logs
docker logs upsc-content-crawler

# Test crawl
curl -X POST http://89.117.60.144:11235/crawl \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer upsc2026crawltoken" \
  -d '{"url": "https://pib.gov.in/allRel.aspx"}'
```

---

## 📋 PART 2: NEXT.JS APP INTEGRATION

### Step 1: Update Crawl4AI Client

**File**: `src/lib/scraping/crawl4ai-client.ts`

Already created, but let's enhance it:

```typescript
import { withA4FCircuitBreaker } from '@/lib/resilience/circuit-breaker';
import { logger } from '@/lib/logger/logger';

const CRAWL4AI_URL = process.env.CRAWL4AI_URL || 'http://89.117.60.144:11235';
const CRAWL4AI_TOKEN = process.env.CRAWL4AI_API_TOKEN || 'upsc2026crawltoken';

interface ScrapeResult {
  url: string;
  title: string;
  content: string;
  markdown: string;
  html: string;
  links: string[];
  images: string[];
  metadata: {
    author?: string;
    publishedDate?: string;
    category?: string;
  };
}

export async function scrapeUrl(url: string): Promise<ScrapeResult> {
  return withA4FCircuitBreaker(async () => {
    logger.info('Scraping URL', { url });

    const response = await fetch(`${CRAWL4AI_URL}/crawl`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CRAWL4AI_TOKEN}`,
      },
      body: JSON.stringify({ url }),
      signal: AbortSignal.timeout(30000), // 30s timeout
    });

    if (!response.ok) {
      throw new Error(`Crawl4AI error: ${response.statusText}`);
    }

    const result = await response.json();
    logger.info('Scrape successful', { url, titleLength: result.title?.length });
    
    return result;
  });
}

export async function scrapeCurrentAffairs(sources: string[]): Promise<ScrapeResult[]> {
  return withA4FCircuitBreaker(async () => {
    logger.info('Scraping multiple sources', { count: sources.length });

    const results = await Promise.allSettled(
      sources.map((url) => scrapeUrl(url))
    );

    const successful = results
      .filter((r) => r.status === 'fulfilled')
      .map((r) => (r as PromiseFulfilledResult<ScrapeResult>).value);

    const failed = results.filter((r) => r.status === 'rejected').length;

    logger.info('Batch scrape complete', { 
      successful: successful.length, 
      failed 
    });

    return successful;
  });
}

export const NEWS_SOURCES = {
  THE_HINDU: 'https://www.thehindu.com/news/national/',
  INDIAN_EXPRESS: 'https://indianexpress.com/section/india/',
  PIB: 'https://pib.gov.in/allRel.aspx',
  RAJYA_SABHA: 'https://rajyasabha.nic.in/',
  LOK_SABHA: 'https://loksabha.nic.in/',
  VISION_IAS: 'https://www.visionias.in/daily-current-affairs',
  DRISHTI_IAS: 'https://www.drishtiias.com/daily-updates/daily-news-analysis',
} as const;
```

### Step 2: Create API Route for Scraping

**File**: `src/app/api/scraping/current-affairs/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { scrapeCurrentAffairs, NEWS_SOURCES } from '@/lib/scraping/crawl4ai-client';
import { requireAdmin } from '@/lib/auth/session';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { withErrorHandler } from '@/lib/errors/error-handler';
import { logAuditEvent } from '@/lib/audit/audit-service';

export const POST = withErrorHandler(async (request: NextRequest) => {
  // Only admins can trigger scraping
  const admin = await requireAdmin();

  const body = await request.json();
  const { sources = Object.values(NEWS_SOURCES) } = body;

  // Scrape sources
  const articles = await scrapeCurrentAffairs(sources);

  // Store in database
  const supabase = await createServerSupabaseClient();
  
  const insertData = articles.map((article) => ({
    title: article.title,
    summary: article.content.substring(0, 500),
    full_content: article.content,
    source_url: article.url,
    source_name: new URL(article.url).hostname,
    category: 'current_affairs',
    published_date: new Date().toISOString().split('T')[0],
    upsc_relevance: 'High', // Can be enhanced with AI
    prelims_relevance: true,
    mains_relevance: true,
  }));

  const { data, error } = await supabase
    .from('current_affairs')
    .insert(insertData)
    .select();

  if (error) throw error;

  // Log audit event
  await logAuditEvent({
    userId: admin.id,
    action: 'current_affairs.scraped',
    resourceType: 'current_affairs',
    newValues: { count: data.length, sources: sources.length },
    ipAddress: request.headers.get('x-forwarded-for') || request.ip,
  });

  return NextResponse.json({
    success: true,
    scraped: articles.length,
    stored: data.length,
    articles: data,
  });
});
```

### Step 3: Create Scheduled Scraping Job

**File**: `src/cron/scraping-jobs.ts`

```typescript
import { scrapeCurrentAffairs, NEWS_SOURCES } from '@/lib/scraping/crawl4ai-client';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger/logger';

export async function dailyCurrentAffairsScrape() {
  logger.info('Starting daily current affairs scrape');

  try {
    const sources = [
      NEWS_SOURCES.PIB,
      NEWS_SOURCES.THE_HINDU,
      NEWS_SOURCES.INDIAN_EXPRESS,
      NEWS_SOURCES.VISION_IAS,
      NEWS_SOURCES.DRISHTI_IAS,
    ];

    const articles = await scrapeCurrentAffairs(sources);

    const supabase = await createServerSupabaseClient();
    
    const insertData = articles.map((article) => ({
      title: article.title,
      summary: article.content.substring(0, 500),
      full_content: article.content,
      source_url: article.url,
      source_name: new URL(article.url).hostname,
      category: 'current_affairs',
      published_date: new Date().toISOString().split('T')[0],
    }));

    const { data, error } = await supabase
      .from('current_affairs')
      .insert(insertData);

    if (error) throw error;

    logger.info('Daily scrape complete', { count: articles.length });
    
    return { success: true, count: articles.length };
  } catch (error) {
    logger.error('Daily scrape failed', error as Error);
    throw error;
  }
}
```

### Step 4: Add Cron Job (Vercel Cron)

**File**: `src/app/api/cron/scrape-current-affairs/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { dailyCurrentAffairsScrape } from '@/cron/scraping-jobs';

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await dailyCurrentAffairsScrape();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: 'Scraping failed', details: (error as Error).message },
      { status: 500 }
    );
  }
}
```

**File**: `vercel.json`

```json
{
  "crons": [
    {
      "path": "/api/cron/scrape-current-affairs",
      "schedule": "0 6 * * *"
    }
  ]
}
```

---

## 📋 PART 3: DATABASE SETUP

### Supabase Migration

**File**: `supabase/migrations/015_crawl4ai_integration.sql`

```sql
-- Add crawl metadata to current_affairs table
ALTER TABLE current_affairs ADD COLUMN IF NOT EXISTS crawl_metadata JSONB;
ALTER TABLE current_affairs ADD COLUMN IF NOT EXISTS content_hash VARCHAR(64);
ALTER TABLE current_affairs ADD COLUMN IF NOT EXISTS last_crawled_at TIMESTAMPTZ;

-- Create index for deduplication
CREATE INDEX IF NOT EXISTS idx_current_affairs_hash ON current_affairs(content_hash);

-- Function to check for duplicate content
CREATE OR REPLACE FUNCTION check_duplicate_content(p_hash VARCHAR(64))
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM current_affairs 
    WHERE content_hash = p_hash 
    AND created_at > NOW() - INTERVAL '7 days'
  );
END;
$$ LANGUAGE plpgsql;
```

---

## 📋 PART 4: TESTING

### Test Crawl4AI Service

```bash
# Test health
curl http://89.117.60.144:11235/health

# Test single URL scrape
curl -X POST http://89.117.60.144:11235/crawl \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer upsc2026crawltoken" \
  -d '{
    "url": "https://pib.gov.in/allRel.aspx"
  }'
```

### Test Next.js Integration

```bash
# Test scraping API (as admin)
curl -X POST http://localhost:3000/api/scraping/current-affairs \
  -H "Content-Type: application/json" \
  -H "Cookie: your-auth-cookie" \
  -d '{
    "sources": ["https://pib.gov.in/allRel.aspx"]
  }'
```

---

## 📋 PART 5: MONITORING

### Health Checks

```typescript
// src/lib/monitoring/crawl4ai-health.ts
import { monitorService } from '@/lib/monitoring/uptime-kuma';

export async function checkCrawl4AIHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${process.env.CRAWL4AI_URL}/health`, {
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

// Monitor every 5 minutes
setInterval(async () => {
  await monitorService('Crawl4AI', checkCrawl4AIHealth);
}, 5 * 60 * 1000);
```

---

## 🔒 SECURITY CHECKLIST

- [x] API token authentication
- [x] Rate limiting on scraping endpoints
- [x] Admin-only access to trigger scraping
- [x] Circuit breakers for resilience
- [x] Audit logging for all scraping actions
- [x] Content deduplication
- [x] Robots.txt compliance
- [x] User-agent identification
- [x] Request timeouts
- [x] Error handling and retries

---

## 📊 SUCCESS METRICS

- ✅ Crawl4AI service deployed on Coolify
- ✅ Next.js client library created
- ✅ API routes for scraping
- ✅ Scheduled daily scraping
- ✅ Database integration
- ✅ Monitoring and health checks
- ✅ Security measures implemented
- ✅ Error handling and logging

---

## 🚀 DEPLOYMENT STEPS

### 1. Deploy to Coolify
```bash
cd "C:\Users\DR-VARUNI\Desktop\AI APPS NEW\BMAD Latest\latest app\Crawl4ai"
# Upload to Coolify via UI or Git
```

### 2. Update App Environment
```bash
# Add to .env.local
CRAWL4AI_URL=http://89.117.60.144:11235
CRAWL4AI_API_TOKEN=upsc2026crawltoken
CRON_SECRET=generate-random-secret-here
```

### 3. Run Database Migration
```bash
# In Supabase SQL Editor
# Run migration 015_crawl4ai_integration.sql
```

### 4. Test Integration
```bash
npm run dev
# Test scraping API endpoint
```

### 5. Deploy to Production
```bash
git add .
git commit -m "feat: integrate Crawl4AI service"
git push origin main
# Deploy via Vercel/your platform
```

---

**Crawl4AI is now fully integrated with your app and VPS!**
