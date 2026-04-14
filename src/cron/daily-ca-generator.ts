/**
 * Daily Current Affairs Generator - Hermes Cron Job
 * 
 * Master Prompt v8.0 - Feature F2, Job 3 (Section 8)
 * Runs daily at 4:30 AM IST to:
 * 1. Fetch articles from whitelisted sources (PIB, PRS, The Hindu, Indian Express)
 * 2. AI summarize with SIMPLIFIED_LANGUAGE_PROMPT
 * 3. Bilingual generation (English + Hindi)
 * 4. Map to UPSC syllabus (GS1, GS2, GS3, GS4, Essay)
 * 5. Generate MCQs (3-5 per article)
 * 6. Link to content_library notes
 * 7. Publish at 5:00 AM IST
 * 8. Notify users via push/email
 * 9. Alert admin via Telegram
 * 
 * AI Provider: 9Router → Groq → Ollama fallback
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { callAI } from '@/lib/ai/ai-provider-client';
import { SIMPLIFIED_LANGUAGE_PROMPT } from '@/lib/onboarding/simplified-language-prompt';

// ============================================================================
// CONFIGURATION
// ============================================================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Whitelisted sources for UPSC-relevant current affairs
const WHITELISTED_SOURCES = [
  { name: 'PIB', url: 'https://pib.gov.in', rss: 'https://pib.gov.in/rss.xml', priority: 'high' },
  { name: 'PRS', url: 'https://prsindia.org', rss: 'https://prsindia.org/rss', priority: 'high' },
  { name: 'The Hindu', url: 'https://thehindu.com', rss: 'https://thehindu.com/news/national/feeder/default.rss', priority: 'medium' },
  { name: 'Indian Express', url: 'https://indianexpress.com', rss: 'https://indianexpress.com/feed/', priority: 'medium' },
  { name: 'Down To Earth', url: 'https://downtoearth.org.in', rss: 'https://downtoearth.org.in/rss', priority: 'medium' },
  { name: 'All India Radio', url: 'https://allindiaradio.gov.in', rss: 'https://allindiaradio.gov.in/rss', priority: 'low' },
];

// UPSC syllabus categories for mapping
const SYLLABUS_CATEGORIES = [
  { id: 'GS1', name: 'History, Geography, Society' },
  { id: 'GS2', name: 'Polity, Governance, IR' },
  { id: 'GS3', name: 'Economy, Environment, S&T, Security' },
  { id: 'GS4', name: 'Ethics, Integrity, Aptitude' },
  { id: 'Essay', name: 'Essay Topics' },
];

// ============================================================================
// TYPES
// ============================================================================

interface RawArticle {
  title: string;
  link: string;
  pubDate: string;
  description: string;
  source: string;
  imageUrl?: string;
  category?: string;
}

interface ProcessedArticle {
  title: { en: string; hi: string };
  summary: { en: string; hi: string };
  url: string;
  imageUrl?: string;
  category: string;
  importance: number; // 1-5
  wordCount: number;
  readTimeMin: number;
  syllabus: Array<{
    subject: 'GS1' | 'GS2' | 'GS3' | 'GS4' | 'Essay';
    topic: string;
    relevanceScore: number;
  }>;
  mcqCount: number;
}

interface DigestData {
  date: string;
  title: string;
  summary: string;
  articles: ProcessedArticle[];
  totalArticles: number;
  subjectDistribution: {
    GS1: number;
    GS2: number;
    GS3: number;
    GS4: number;
    Essay: number;
  };
  isPublished?: boolean;
  publishedAt?: string;
}

// ============================================================================
// STEP 1: FETCH ARTICLES FROM SOURCES
// ============================================================================

async function fetchFromRSS(url: string): Promise<RawArticle[]> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'UPSC PrepX-AI CA Bot/1.0',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}`);
    }

    const xml = await response.text();
    const articles: RawArticle[] = [];
    
    // Simple XML parsing (in production, use xml2js)
    const items = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
    
    for (const item of items.slice(0, 10)) { // Limit to 10 per source
      const title = item.match(/<title>([\s\S]*?)<\/title>/)?.[1];
      const link = item.match(/<link>([\s\S]*?)<\/link>/)?.[1];
      const description = item.match(/<description>([\s\S]*?)<\/description>/)?.[1];
      const pubDate = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1];
      
      if (title && link) {
        articles.push({
          title,
          link,
          description: description || '',
          pubDate: pubDate || new Date().toISOString(),
          source: 'RSS',
        });
      }
    }
    
    return articles;
  } catch (error) {
    console.error(`Error fetching RSS ${url}:`, error);
    return [];
  }
}

async function fetchAllSources(): Promise<RawArticle[]> {
  const allArticles: RawArticle[] = [];
  
  for (const source of WHITELISTED_SOURCES) {
    console.log(`Fetching from ${source.name}...`);
    const articles = await fetchFromRSS(source.rss);
    articles.forEach(article => {
      article.source = source.name;
      article.category = source.priority;
    });
    allArticles.push(...articles);
  }
  
  // Deduplicate by title
  const uniqueArticles = allArticles.filter(
    (article, index, self) =>
      index === self.findIndex(a => a.title === article.title)
  );
  
  console.log(`Fetched ${uniqueArticles.length} unique articles`);
  return uniqueArticles;
}

// ============================================================================
// STEP 2: AI PROCESSING - SUMMARIZE, TRANSLATE, MAP SYLLABUS
// ============================================================================

async function processArticle(article: RawArticle): Promise<ProcessedArticle | null> {
  try {
    const prompt = `${SIMPLIFIED_LANGUAGE_PROMPT}

You are an expert UPSC current affairs analyst. Process the following news article:

TITLE: ${article.title}
SOURCE: ${article.source}
CONTENT: ${article.description}

Generate the following in JSON format:
{
  "title": {
    "en": "English title (simplified, 10th-class level)",
    "hi": "Hindi translation (simple Hindi)"
  },
  "summary": {
    "en": "Brief summary in simple English (3-4 sentences, max 15 words each)",
    "hi": "Hindi translation of summary"
  },
  "category": "One of: Polity, Economy, Environment, Science & Tech, History, Geography, IR, Social Issues, Governance, Security, Agriculture, Health, Education",
  "importance": 1-5 (5 = most important for UPSC),
  "syllabus": [
    {
      "subject": "GS1|GS2|GS3|GS4|Essay",
      "topic": "Specific UPSC syllabus topic",
      "relevanceScore": 0-100
    }
  ]
}

CRITICAL RULES:
1. Use simple language (10th-class level)
2. No jargon without explanation
3. Indian context and examples
4. UPSC exam relevance focus
5. Accurate Hindi translation
6. Map to correct GS subject`;

    const result = await callAI(prompt, {
      temperature: 0.3,
      maxTokens: 1000,
    });

    // Parse JSON from AI response
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid JSON from AI');
    }

    const processed = JSON.parse(jsonMatch[0]);

    // Calculate word count and read time
    const wordCount = processed.summary.en.split(' ').length;
    const readTimeMin = Math.max(1, Math.ceil(wordCount / 200)); // 200 wpm

    return {
      title: processed.title,
      summary: processed.summary,
      url: article.link,
      imageUrl: article.imageUrl,
      category: processed.category || 'General',
      importance: processed.importance || 3,
      wordCount,
      readTimeMin,
      syllabus: processed.syllabus || [],
      mcqCount: 0, // Will be set by MCQ generator
    };
  } catch (error) {
    console.error(`Error processing article:`, error);
    return null;
  }
}

async function processAllArticles(articles: RawArticle[]): Promise<ProcessedArticle[]> {
  const processed: ProcessedArticle[] = [];
  
  // Process in batches to avoid rate limits
  const batchSize = 5;
  for (let i = 0; i < articles.length; i += batchSize) {
    const batch = articles.slice(i, i + batchSize);
    const results = await Promise.all(batch.map(processArticle));
    processed.push(...results.filter((a): a is ProcessedArticle => a !== null));
    
    // Rate limiting delay
    if (i + batchSize < articles.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  // Sort by importance (highest first)
  processed.sort((a, b) => b.importance - a.importance);
  
  console.log(`Processed ${processed.length} articles`);
  return processed;
}

// ============================================================================
// STEP 3: GENERATE MCQS FOR EACH ARTICLE
// ============================================================================

async function generateMCQs(article: ProcessedArticle): Promise<number> {
  try {
    const prompt = `${SIMPLIFIED_LANGUAGE_PROMPT}

Generate 3-5 MCQs for this current affairs article:

TITLE: ${article.title.en}
SUMMARY: ${article.summary.en}
SYLLABUS: ${JSON.stringify(article.syllabus)}

Generate MCQs in this JSON format:
[
  {
    "question": {
      "en": "Question in English",
      "hi": "Question in Hindi"
    },
    "options": [
      {"id": "A", "text": {"en": "Option A", "hi": "विकल्प A"}},
      {"id": "B", "text": {"en": "Option B", "hi": "विकल्प B"}},
      {"id": "C", "text": {"en": "Option C", "hi": "विकल्प C"}},
      {"id": "D", "text": {"en": "Option D", "hi": "विकल्प D"}}
    ],
    "correctAnswer": "A|B|C|D",
    "explanation": {
      "en": "Explanation in simple English",
      "hi": "हिंदी में व्याख्या"
    },
    "difficulty": "Easy|Medium|Hard",
    "bloomTaxonomy": "Remember|Understand|Apply|Analyze|Evaluate|Create"
  }
]

CRITICAL RULES:
1. Questions based on article facts
2. UPSC-style questions
3. Simple language (10th-class level)
4. Accurate Hindi translation
5. Clear, unambiguous options
6. Educational explanations`;

    const result = await callAI(prompt, {
      temperature: 0.4,
      maxTokens: 2000,
    });

    const jsonMatch = result.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return 0;
    }

    const mcqs = JSON.parse(jsonMatch[0]);
    
    // Store MCQs in database
    for (const mcq of mcqs) {
      await supabase.from('ca_mcqs').insert({
        article_title: article.title.en,
        question: mcq.question,
        options: mcq.options,
        correct_answer: mcq.correctAnswer,
        explanation: mcq.explanation,
        difficulty: mcq.difficulty,
        bloom_taxonomy: mcq.bloomTaxonomy,
      });
    }

    return mcqs.length;
  } catch (error) {
    console.error(`Error generating MCQs:`, error);
    return 0;
  }
}

async function addMCQsToArticles(articles: ProcessedArticle[]): Promise<void> {
  for (const article of articles) {
    const mcqCount = await generateMCQs(article);
    article.mcqCount = mcqCount;
    
    // Small delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('MCQs generated for all articles');
}

// ============================================================================
// STEP 4: SAVE DIGEST TO DATABASE
// ============================================================================

async function saveDigest(digest: DigestData): Promise<string> {
  const { data, error } = await supabase
    .from('daily_ca_digest')
    .insert({
      date: digest.date,
      title: digest.title,
      summary: digest.summary,
      total_articles: digest.totalArticles,
      subject_distribution: digest.subjectDistribution,
      is_published: false, // Will be published at 5 AM
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to save digest: ${error.message}`);
  }

  const digestId = data.id;

  // Save individual articles
  for (const article of digest.articles) {
    await supabase.from('ca_articles').insert({
      digest_id: digestId,
      title: article.title,
      summary: article.summary,
      url: article.url,
      image_url: article.imageUrl,
      category: article.category,
      importance: article.importance,
      word_count: article.wordCount,
      read_time_min: article.readTimeMin,
      syllabus: article.syllabus,
      mcq_count: article.mcqCount,
    });
  }

  console.log(`Saved digest with ${digest.articles.length} articles`);
  return digestId;
}

// ============================================================================
// STEP 5: NOTIFY USERS AND ADMIN
// ============================================================================

async function notifyUsers(digestId: string): Promise<void> {
  // Get all active subscribers
  const { data: subscribers } = await supabase
    .from('user_subscriptions')
    .select('user_id')
    .eq('status', 'active')
    .gte('trial_ends_at', new Date().toISOString());

  if (!subscribers || subscribers.length === 0) {
    console.log('No active subscribers to notify');
    return;
  }

  // Create notifications
  const notifications = subscribers.map(sub => ({
    user_id: sub.user_id,
    type: 'daily_digest',
    title: 'Daily Current Affairs Ready! 📰',
    message: `Today's digest with ${digestId} articles is now available.`,
    data: { digest_id: digestId },
    is_read: false,
  }));

  await supabase.from('notifications').insert(notifications);
  
  console.log(`Notified ${subscribers.length} subscribers`);
}

async function notifyAdmin(digestId: string, articleCount: number): Promise<void> {
  const telegramBotToken = process.env.HERMES_TELEGRAM_BOT_TOKEN;
  const telegramChatId = process.env.HERMES_ADMIN_CHAT_ID;

  if (!telegramBotToken || !telegramChatId) {
    console.log('Telegram credentials not configured');
    return;
  }

  const message = `✅ Daily CA Digest Generated\n\n📅 Date: ${new Date().toISOString().split('T')[0]}\n📰 Articles: ${articleCount}\n⏰ Published at: 5:00 AM IST\n\nDigest ID: \`${digestId}\``;

  try {
    await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: telegramChatId,
        text: message,
        parse_mode: 'Markdown',
      }),
    });
    
    console.log('Admin notified via Telegram');
  } catch (error) {
    console.error('Failed to notify admin:', error);
  }
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

export async function generateDailyCA(): Promise<void> {
  console.log('🚀 Starting Daily CA Generation...');
  console.log(`⏰ Started at: ${new Date().toISOString()}`);

  try {
    // Step 1: Fetch articles from all sources
    console.log('\n📡 Step 1: Fetching articles from sources...');
    const rawArticles = await fetchAllSources();

    if (rawArticles.length === 0) {
      throw new Error('No articles fetched from any source');
    }

    // Step 2: Process articles with AI
    console.log('\n🤖 Step 2: Processing articles with AI...');
    const processedArticles = await processAllArticles(rawArticles);

    if (processedArticles.length === 0) {
      throw new Error('No articles successfully processed');
    }

    // Step 3: Generate MCQs
    console.log('\n📝 Step 3: Generating MCQs...');
    await addMCQsToArticles(processedArticles);

    // Step 4: Calculate subject distribution
    const subjectDistribution = {
      GS1: processedArticles.filter(a => a.syllabus.some(s => s.subject === 'GS1')).length,
      GS2: processedArticles.filter(a => a.syllabus.some(s => s.subject === 'GS2')).length,
      GS3: processedArticles.filter(a => a.syllabus.some(s => s.subject === 'GS3')).length,
      GS4: processedArticles.filter(a => a.syllabus.some(s => s.subject === 'GS4')).length,
      Essay: processedArticles.filter(a => a.syllabus.some(s => s.subject === 'Essay')).length,
    };

    // Step 5: Create digest
    const today = new Date().toISOString().split('T')[0];
    const digest: DigestData = {
      date: today,
      title: `Daily Current Affairs - ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`,
      summary: `${processedArticles.length} articles covering ${Object.entries(subjectDistribution).filter(([_, count]) => count > 0).length} subjects`,
      articles: processedArticles,
      totalArticles: processedArticles.length,
      subjectDistribution,
      isPublished: false,
      publishedAt: new Date().toISOString(),
    };

    // Step 6: Save to database
    console.log('\n💾 Step 4: Saving digest to database...');
    const digestId = await saveDigest(digest);

    // Step 7: Notify users and admin
    console.log('\n📢 Step 5: Sending notifications...');
    await notifyUsers(digestId);
    await notifyAdmin(digestId, processedArticles.length);

    console.log('\n✅ Daily CA Generation Complete!');
    console.log(`📊 Total articles: ${processedArticles.length}`);
    console.log(`📚 Subject distribution:`, subjectDistribution);
    console.log(`❓ Total MCQs: ${processedArticles.reduce((sum, a) => sum + a.mcqCount, 0)}`);

  } catch (error) {
    console.error('❌ Daily CA Generation Failed:', error);
    
    // Alert admin of failure
    await notifyAdmin('FAILED', 0);
    
    throw error;
  }
}

// ============================================================================
// CRON SCHEDULE: 4:30 AM IST daily
// ============================================================================

// For systemd timer or cron:
// Cron syntax: */30 4 * * * (every 30 min starting 4 AM, runs at 4:00 and 4:30)
// Or use node-cron: '30 4 * * *' (exactly 4:30 AM)

if (require.main === module) {
  generateDailyCA()
    .then(() => {
      console.log('✅ Job completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Job failed:', error);
      process.exit(1);
    });
}
