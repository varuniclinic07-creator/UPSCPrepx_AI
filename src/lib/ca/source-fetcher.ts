/**
 * Source Fetcher Service
 * 
 * Fetches current affairs articles from whitelisted sources.
 * Supports RSS feeds, APIs, and web scraping (fallback).
 * 
 * Master Prompt v8.0 - Feature F2 (READ Mode)
 * Sources: PIB, PRS, The Hindu, Indian Express, AIR, Down To Earth
 */

import { createClient } from '@supabase/supabase-js';
import Parser from 'rss-parser';

let _sb: ReturnType<typeof createClient> | null = null;
function getSupabase() { if (!_sb) _sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!); return _sb; }

// RSS Parser instance
const rssParser = new Parser({
  customFields: {
    item: ['category', 'content:encoded'],
  },
});

// ============================================================================
// SOURCE CONFIGURATIONS
// ============================================================================

interface SourceConfig {
  id: string;
  name: string;
  baseUrl: string;
  rssFeedUrl?: string;
  apiEndpoint?: string;
  category: 'government' | 'newspaper' | 'magazine' | 'broadcast';
  priority: number; // 1-5 (1=highest)
  maxArticlesPerFetch: number;
  selectors?: {
    article: string;
    title: string;
    content: string;
    date: string;
    image?: string;
  };
}

export const WHITELISTED_SOURCES: SourceConfig[] = [
  {
    id: 'pib',
    name: 'Press Information Bureau',
    baseUrl: 'https://pib.gov.in',
    rssFeedUrl: 'https://pib.gov.in/rss.aspx',
    category: 'government',
    priority: 1,
    maxArticlesPerFetch: 20,
  },
  {
    id: 'prs',
    name: 'PRS Legislative',
    baseUrl: 'https://prsindia.org',
    category: 'government',
    priority: 1,
    maxArticlesPerFetch: 10,
  },
  {
    id: 'the-hindu',
    name: 'The Hindu',
    baseUrl: 'https://thehindu.com',
    rssFeedUrl: 'https://thehindu.com/news/national/feeder/default.rss',
    category: 'newspaper',
    priority: 2,
    maxArticlesPerFetch: 15,
  },
  {
    id: 'indian-express',
    name: 'Indian Express',
    baseUrl: 'https://indianexpress.com',
    rssFeedUrl: 'https://indianexpress.com/section/india/feed/',
    category: 'newspaper',
    priority: 2,
    maxArticlesPerFetch: 15,
  },
  {
    id: 'air',
    name: 'All India Radio',
    baseUrl: 'https://allindiaradio.gov.in',
    category: 'broadcast',
    priority: 2,
    maxArticlesPerFetch: 10,
  },
  {
    id: 'dte',
    name: 'Down To Earth',
    baseUrl: 'https://downtoearth.org.in',
    rssFeedUrl: 'https://downtoearth.org.in/rss',
    category: 'magazine',
    priority: 3,
    maxArticlesPerFetch: 10,
  },
];

// ============================================================================
// ARTICLE INTERFACES
// ============================================================================

export interface RawArticle {
  sourceId: string;
  title: string;
  url: string;
  publishedAt: Date;
  content?: string;
  imageUrl?: string;
  category?: string;
  author?: string;
}

export interface FetchedArticle extends RawArticle {
  id?: string;
  isDuplicate?: boolean;
  existingId?: string;
}

// ============================================================================
// FETCH FUNCTIONS
// ============================================================================

/**
 * Fetch articles from a source by RSS feed
 */
async function fetchFromRSS(source: SourceConfig): Promise<RawArticle[]> {
  if (!source.rssFeedUrl) {
    throw new Error(`No RSS feed URL for source: ${source.name}`);
  }

  try {
    console.debug(`Fetching from RSS: ${source.name} (${source.rssFeedUrl})`);
    
    const feed = await rssParser.parseURL(source.rssFeedUrl);
    
    const articles: RawArticle[] = feed.items.slice(0, source.maxArticlesPerFetch).map(item => ({
      sourceId: source.id,
      title: item.title || 'Untitled',
      url: item.link || `${source.baseUrl}/article`,
      publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
      content: item.content || item.contentSnippet || '',
      imageUrl: item.enclosure?.url || undefined,
      category: item.categories?.[0] || source.category,
      author: item.creator || undefined,
    }));

    console.debug(`Fetched ${articles.length} articles from ${source.name} RSS`);
    return articles;
  } catch (error) {
    console.error(`RSS fetch failed for ${source.name}:`, error);
    throw error;
  }
}

/**
 * Fetch articles from a source by API (if available)
 */
async function fetchFromAPI(source: SourceConfig): Promise<RawArticle[]> {
  if (!source.apiEndpoint) {
    throw new Error(`No API endpoint for source: ${source.name}`);
  }

  try {
    console.debug(`Fetching from API: ${source.name}`);
    
    const response = await fetch(source.apiEndpoint, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'UPSC-PrepX-AI/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const data = await response.json();
    
    // Adapt based on API response structure
    const articles: RawArticle[] = (data.articles || data.items || []).slice(0, source.maxArticlesPerFetch).map((item: any) => ({
      sourceId: source.id,
      title: item.title || 'Untitled',
      url: item.url || item.link || `${source.baseUrl}/article`,
      publishedAt: item.publishedAt || item.date ? new Date(item.publishedAt || item.date) : new Date(),
      content: item.content || item.body || item.description || '',
      imageUrl: item.image || item.thumbnail || undefined,
      category: item.category || source.category,
      author: item.author || undefined,
    }));

    console.debug(`Fetched ${articles.length} articles from ${source.name} API`);
    return articles;
  } catch (error) {
    console.error(`API fetch failed for ${source.name}:`, error);
    throw error;
  }
}

/**
 * Fetch articles from all active sources
 */
export async function fetchFromAllSources(): Promise<FetchedArticle[]> {
  console.debug('Fetching from all sources...');
  
  const allArticles: FetchedArticle[] = [];
  const errors: { source: string; error: string }[] = [];

  // Fetch from sources in priority order
  for (const source of WHITELISTED_SOURCES.sort((a, b) => a.priority - b.priority)) {
    try {
      let articles: RawArticle[] = [];

      // Try RSS first, then API
      if (source.rssFeedUrl) {
        articles = await fetchFromRSS(source);
      } else if (source.apiEndpoint) {
        articles = await fetchFromAPI(source);
      }

      // Convert to FetchedArticle
      const fetchedArticles: FetchedArticle[] = articles.map(a => ({
        ...a,
        isDuplicate: false,
      }));

      allArticles.push(...fetchedArticles);
      console.debug(`✓ ${source.name}: ${fetchedArticles.length} articles`);

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      errors.push({ source: source.name, error: errorMsg });
      console.error(`✗ ${source.name}: ${errorMsg}`);
    }
  }

  console.debug(`Total fetched: ${allArticles.length} articles from ${WHITELISTED_SOURCES.length - errors.length} sources`);
  
  if (errors.length > 0) {
    console.warn('Fetch errors:', errors);
  }

  return allArticles;
}

// ============================================================================
// DEDUPLICATION
// ============================================================================

/**
 * Check if article already exists in database by URL or title similarity
 */
export async function checkDuplicates(
  articles: FetchedArticle[]
): Promise<FetchedArticle[]> {
  console.debug('Checking for duplicates...');

  // Get existing article URLs from database (last 7 days)
  const { data: existingArticles } = await getSupabase()
    .from('ca_articles')
    .select('url, title, id')
    .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

  if (!existingArticles) {
    console.debug('No existing articles found, skipping deduplication');
    return articles;
  }

  const existingUrls = new Set(existingArticles.map(a => a.url));
  const existingTitles = new Set(existingArticles.map(a => a.title.toLowerCase()));

  const deduplicatedArticles = articles.map(article => {
    // Check URL match
    if (existingUrls.has(article.url)) {
      const existing = existingArticles.find(a => a.url === article.url);
      return {
        ...article,
        isDuplicate: true,
        existingId: existing?.id,
      };
    }

    // Check title similarity (simple lowercase match)
    const titleLower = article.title.toLowerCase();
    if (existingTitles.has(titleLower)) {
      return {
        ...article,
        isDuplicate: true,
      };
    }

    return { ...article, isDuplicate: false };
  });

  const duplicates = deduplicatedArticles.filter(a => a.isDuplicate);
  const unique = deduplicatedArticles.filter(a => !a.isDuplicate);

  console.debug(`Duplicates found: ${duplicates.length}, Unique: ${unique.length}`);

  return deduplicatedArticles;
}

/**
 * Remove duplicates, keeping highest priority source version
 */
export function removeDuplicates(articles: FetchedArticle[]): FetchedArticle[] {
  const seen = new Map<string, FetchedArticle>();

  // Sort by priority (lower is better)
  const sorted = [...articles].sort((a, b) => {
    const sourceA = WHITELISTED_SOURCES.find(s => s.id === a.sourceId);
    const sourceB = WHITELISTED_SOURCES.find(s => s.id === b.sourceId);
    return (sourceA?.priority || 999) - (sourceB?.priority || 999);
  });

  for (const article of sorted) {
    if (article.isDuplicate) continue;

    // Use title as key for deduplication
    const key = article.title.toLowerCase().trim();
    
    if (!seen.has(key)) {
      seen.set(key, article);
    }
  }

  return Array.from(seen.values());
}

// ============================================================================
// DATABASE OPERATIONS
// ============================================================================

/**
 * Get or create digest for a specific date
 */
export async function getOrCreateDigest(date: string) {
  const dateObj = new Date(date);
  
  // Try to get existing digest
  const { data: existing } = await getSupabase()
    .from('daily_ca_digest')
    .select('*')
    .eq('date', dateObj.toISOString().split('T')[0])
    .single();

  if (existing) {
    return existing;
  }

  // Create new digest
  const { data: newDigest, error } = await getSupabase()
    .from('daily_ca_digest')
    .insert({
      date: dateObj.toISOString().split('T')[0],
      title: `Daily Current Affairs - ${dateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`,
      generated_at: new Date().toISOString(),
      is_published: false,
    })
    .select()
    .single();

  if (error) throw error;
  return newDigest;
}

/**
 * Save articles to database
 */
export async function saveArticles(
  digestId: string,
  articles: FetchedArticle[]
): Promise<string[]> {
  const savedIds: string[] = [];

  for (const article of articles) {
    if (article.isDuplicate) continue;

    const { data, error } = await getSupabase()
      .from('ca_articles')
      .insert({
        digest_id: digestId,
        source_id: (await getSupabase().from('ca_sources').select('id').eq('name', article.sourceId === 'pib' ? 'Press Information Bureau' : article.sourceId).single()).data?.id,
        title: article.title,
        url: article.url,
        full_content: article.content || '',
        image_url: article.imageUrl,
        category: article.category,
        published_at: article.publishedAt.toISOString(),
        is_published: false,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Failed to save article:', error);
      continue;
    }

    if (data) {
      savedIds.push(data.id);
    }
  }

  console.debug(`Saved ${savedIds.length} articles to database`);
  return savedIds;
}

// ============================================================================
// MAIN FETCH PIPELINE
// ============================================================================

/**
 * Complete fetch pipeline: Fetch → Deduplicate → Save
 */
export async function fetchDailyArticles(date: string): Promise<{
  digestId: string;
  articleCount: number;
  savedArticleIds: string[];
}> {
  console.debug(`\n=== Starting Daily CA Fetch for ${date} ===`);

  // Step 1: Get or create digest
  const digest = await getOrCreateDigest(date);
  console.debug(`Digest ID: ${digest.id}`);

  // Step 2: Fetch from all sources
  const allArticles = await fetchFromAllSources();
  console.debug(`Total articles fetched: ${allArticles.length}`);

  // Step 3: Check duplicates against database
  const articlesWithDupCheck = await checkDuplicates(allArticles);

  // Step 4: Remove duplicates (keep highest priority)
  const uniqueArticles = removeDuplicates(articlesWithDupCheck);
  console.debug(`Unique articles after deduplication: ${uniqueArticles.length}`);

  // Step 5: Save to database
  const savedIds = await saveArticles(digest.id, uniqueArticles);

  // Step 6: Update digest article count
  await getSupabase()
    .from('daily_ca_digest')
    .update({
      article_count: savedIds.length,
      updated_at: new Date().toISOString(),
    })
    .eq('id', digest.id);

  console.debug(`\n=== Fetch Complete: ${savedIds.length} articles saved ===\n`);

  return {
    digestId: digest.id,
    articleCount: savedIds.length,
    savedArticleIds: savedIds,
  };
}

// ============================================================================
// CLI USAGE (for cron jobs)
// ============================================================================

if (typeof require !== 'undefined' && require.main === module) {
  const date = process.argv[2] || new Date().toISOString().split('T')[0];
  
  fetchDailyArticles(date)
    .then(result => {
      console.debug('\n✅ Daily CA Fetch Completed Successfully');
      console.debug(`Digest ID: ${result.digestId}`);
      console.debug(`Articles: ${result.articleCount}`);
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Daily CA Fetch Failed:', error);
      process.exit(1);
    });
}
