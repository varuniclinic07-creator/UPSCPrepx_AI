/**
 * Current Affairs Service (Orchestrator)
 * 
 * Main orchestration service for Daily Current Affairs generation.
 * Coordinates: Source Fetcher → AI Processing → Syllabus Mapping → MCQ Generation
 * 
 * Master Prompt v8.0 - Feature F2 (READ Mode)
 * Hermes Job 3: 4:30 AM IST daily generation
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { fetchDailyArticles } from './source-fetcher';
import { processArticlesForSyllabus } from './syllabus-mapper';
import { processArticlesForMCQs } from './mcq-generator';
import { callAI } from '@/lib/ai/ai-provider-client';
import { SIMPLIFIED_LANGUAGE_PROMPT } from '@/lib/onboarding/simplified-language-prompt';

let _sb: ReturnType<typeof createClient<Database>> | null = null;
function getSupabase() { if (!_sb) _sb = createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!); return _sb; }

// ============================================================================
// INTERFACES
// ============================================================================

export interface ProcessedArticle {
  id: string;
  title: string;
  titleHindi: string;
  summary: string;
  summaryHindi: string;
  fullContent: string;
  url: string;
  imageUrl?: string;
  category: string;
  importance: number; // 1-5 stars
  wordCount: number;
  readTimeMin: number;
  syllabusMappings: any[];
  mcqCount: number;
}

export interface DailyDigest {
  digestId: string;
  date: string;
  title: string;
  articles: ProcessedArticle[];
  totalArticles: number;
  subjectDistribution: {
    GS1: number;
    GS2: number;
    GS3: number;
    GS4: number;
    Essay: number;
  };
  pdfUrl?: string;
  isPublished: boolean;
  publishedAt?: string;
}

// ============================================================================
// AI PROCESSING FUNCTIONS
// ============================================================================

/**
 * Summarize article with SIMPLIFIED_LANGUAGE_PROMPT
 */
async function summarizeArticle(
  title: string,
  fullContent: string
): Promise<string> {
  const prompt = `
${SIMPLIFIED_LANGUAGE_PROMPT}

Summarize this current affairs article for UPSC CSE aspirants:

Title: ${title}

Content:
${fullContent.substring(0, 3000)}${fullContent.length > 3000 ? '...' : ''}

Create a concise summary (150-200 words) that:
1. Explains the main point in simple language
2. Highlights why this is important for UPSC
3. Mentions key facts, dates, names
4. Uses 10th-class level vocabulary
5. Avoids jargon or explains it simply

Return ONLY the summary text, no extra formatting.
`;

  const response = await callAI(prompt, {
    temperature: 0.3,
    maxTokens: 300,
  });

  return response.trim();
}

/**
 * Translate text to Hindi
 */
async function translateToHindi(text: string): Promise<string> {
  const prompt = `
Translate this text to simple Hindi (Hinglish acceptable for clarity):

${text.substring(0, 1000)}${text.length > 1000 ? '...' : ''}

Rules:
- Use simple Hindi that a 10th-class student can understand
- Keep technical terms in English if no common Hindi equivalent exists
- Maintain the same meaning and tone
- Return ONLY the translation, no extra text
`;

  const response = await callAI(prompt, {
    temperature: 0.3,
    maxTokens: 500,
  });

  return response.trim();
}

/**
 * Determine article importance (1-5 stars)
 */
async function determineImportance(
  title: string,
  summary: string,
  category: string
): Promise<number> {
  const prompt = `
Rate the importance of this current affairs article for UPSC CSE preparation:

Title: ${title}
Category: ${category}
Summary: ${summary}

Rate from 1-5 stars:
5 = Critical (must-read for prelims/mains, directly related to syllabus)
4 = Very Important (highly relevant, likely to be asked)
3 = Important (good to know, moderate relevance)
2 = Moderate (some relevance, skip if time-constrained)
1 = Low (general interest, low priority)

Return ONLY a number from 1 to 5.
`;

  const response = await callAI(prompt, {
    temperature: 0.2,
    maxTokens: 10,
  });

  const rating = parseInt(response.trim());
  return Math.max(1, Math.min(5, rating)); // Clamp to 1-5
}

/**
 * Categorize article
 */
async function categorizeArticle(
  title: string,
  summary: string
): Promise<string> {
  const categories = [
    'Polity',
    'Economy',
    'Environment',
    'Science & Tech',
    'History',
    'Geography',
    'International Relations',
    'Social Issues',
    'Governance',
    'Security',
    'Agriculture',
    'Health',
    'Education',
    'Miscellaneous',
  ];

  const prompt = `
Categorize this current affairs article into ONE of these categories:
${categories.join(', ')}

Title: ${title}
Summary: ${summary}

Return ONLY the category name, nothing else.
`;

  const response = await callAI(prompt, {
    temperature: 0.2,
    maxTokens: 20,
  });

  const category = response.trim();
  return categories.includes(category) ? category : 'Miscellaneous';
}

// ============================================================================
// ARTICLE PROCESSING
// ============================================================================

/**
 * Process a single article: Summarize → Translate → Categorize → Rate Importance
 */
async function processArticle(article: {
  id: string;
  title: string;
  full_content: string;
  url: string;
  image_url?: string;
  category?: string;
}): Promise<ProcessedArticle> {
  console.debug(`Processing article: ${article.title.substring(0, 50)}...`);

  try {
    // Parallel AI processing for speed
    const [summary, summaryHindi, titleHindi, importance, category] = await Promise.all([
      summarizeArticle(article.title, article.full_content),
      summarizeArticle(article.title, article.full_content).then(s => translateToHindi(s)),
      translateToHindi(article.title),
      determineImportance(article.title, '', article.category || ''),
      categorizeArticle(article.title, ''),
    ]);

    // Calculate word count and read time
    const wordCount = article.full_content.split(/\s+/).length;
    const readTimeMin = Math.ceil(wordCount / 200); // Average reading speed

    return {
      id: article.id,
      title: article.title,
      titleHindi,
      summary,
      summaryHindi,
      fullContent: article.full_content,
      url: article.url,
      imageUrl: article.image_url,
      category,
      importance,
      wordCount,
      readTimeMin,
      syllabusMappings: [], // Will be added later
      mcqCount: 0, // Will be added later
    };
  } catch (error) {
    console.error('Article processing failed:', error);
    throw error;
  }
}

/**
 * Update article in database with processed content
 */
async function updateArticle(article: ProcessedArticle): Promise<void> {
  const { error } = await getSupabase()
    .from('ca_articles')
    .update({
      title_hindi: article.titleHindi,
      summary: article.summary,
      summary_hindi: article.summaryHindi,
      category: article.category,
      importance: article.importance,
      word_count: article.wordCount,
      read_time_min: article.readTimeMin,
      updated_at: new Date().toISOString(),
    })
    .eq('id', article.id);

  if (error) throw error;
}

// ============================================================================
// DIGEST GENERATION
// ============================================================================

/**
 * Generate complete daily digest
 */
export async function generateDailyDigest(date: string): Promise<DailyDigest> {
  console.debug(`\n=== Starting Daily CA Generation for ${date} ===\n`);
  const startTime = Date.now();

  try {
    // Step 1: Fetch articles from sources
    console.debug('Step 1: Fetching articles from sources...');
    const fetchResult = await fetchDailyArticles(date);
    console.debug(`✓ Fetched ${fetchResult.articleCount} articles\n`);

    if (fetchResult.articleCount === 0) {
      console.debug('No articles found, skipping processing');
      return {
        digestId: fetchResult.digestId,
        date,
        title: `Daily Current Affairs - ${date}`,
        articles: [],
        totalArticles: 0,
        subjectDistribution: { GS1: 0, GS2: 0, GS3: 0, GS4: 0, Essay: 0 },
        isPublished: false,
      };
    }

    // Step 2: Get articles from database for processing
    console.debug('Step 2: Loading articles for processing...');
    const { data: articles, error: fetchError } = await getSupabase()
      .from('ca_articles')
      .select('id, title, full_content, url, image_url, category')
      .eq('digest_id', fetchResult.digestId)
      .eq('is_published', false);

    if (fetchError || !articles) {
      throw new Error('Failed to load articles for processing');
    }

    console.debug(`✓ Loaded ${articles.length} articles\n`);

    // Step 3: Process articles (AI summarization, translation, categorization)
    console.debug('Step 3: Processing articles with AI...');
    const processedArticles: ProcessedArticle[] = [];
    
    for (const article of articles.slice(0, 15)) { // Max 15 articles per day
      try {
        const processed = await processArticle({
          ...article,
          title: article.title || '',
          full_content: article.full_content || '',
          url: article.url || '',
          image_url: article.image_url ?? undefined,
          category: article.category ?? undefined,
        });
        await updateArticle(processed);
        processedArticles.push(processed);
        console.debug(`✓ Processed: ${processed.title.substring(0, 40)}...`);
      } catch (error) {
        console.error(`✗ Failed to process article ${article.id}:`, error);
      }

      // Rate limiting: 500ms between articles
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    console.debug(`✓ Processed ${processedArticles.length} articles\n`);

    // Step 4: Syllabus mapping
    console.debug('Step 4: Mapping articles to syllabus...');
    const totalMappings = await processArticlesForSyllabus(
      processedArticles.map(a => ({
        id: a.id,
        title: a.title,
        summary: a.summary,
        full_content: a.fullContent,
      }))
    );
    console.debug(`✓ Created ${totalMappings} syllabus mappings\n`);

    // Step 5: MCQ generation
    console.debug('Step 5: Generating MCQs...');
    const totalMcqs = await processArticlesForMCQs(
      processedArticles.map(a => ({
        id: a.id,
        title: a.title,
        summary: a.summary,
        full_content: a.fullContent,
      })),
      3 // 3 MCQs per article
    );
    console.debug(`✓ Generated ${totalMcqs} MCQs\n`);

    // Step 6: Get syllabus distribution
    console.debug('Step 6: Calculating subject distribution...');
    const articleIds = processedArticles.map(a => a.id);
    const { data: mappings } = await getSupabase()
      .from('ca_syllabus_mapping')
      .select('subject')
      .in('article_id', articleIds);

    const subjectDistribution = {
      GS1: mappings?.filter(m => m.subject === 'GS1').length || 0,
      GS2: mappings?.filter(m => m.subject === 'GS2').length || 0,
      GS3: mappings?.filter(m => m.subject === 'GS3').length || 0,
      GS4: mappings?.filter(m => m.subject === 'GS4').length || 0,
      Essay: mappings?.filter(m => m.subject === 'Essay').length || 0,
    };
    console.debug('✓ Distribution:', subjectDistribution, '\n');

    // Step 7: Update digest metadata
    console.debug('Step 7: Updating digest metadata...');
    const processingTimeSec = (Date.now() - startTime) / 1000;
    await getSupabase()
      .from('daily_ca_digest')
      .update({
        article_count: processedArticles.length,
        summary: `Today's digest includes ${processedArticles.length} articles covering ${Object.entries(subjectDistribution)
          .filter(([_, count]) => count > 0)
          .map(([subject, count]) => `${count} ${subject}`)
          .join(', ')}. Generated in ${processingTimeSec.toFixed(0)} seconds.`,
        generated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', fetchResult.digestId);

    const processingTime = Date.now() - startTime;
    console.debug(`\n=== Daily CA Generation Complete ===`);
    console.debug(`Total Time: ${(processingTime / 1000 / 60).toFixed(1)} minutes`);
    console.debug(`Articles: ${processedArticles.length}`);
    console.debug(`Syllabus Mappings: ${totalMappings}`);
    console.debug(`MCQs: ${totalMcqs}`);
    console.debug(`=====================================\n`);

    return {
      digestId: fetchResult.digestId,
      date,
      title: `Daily Current Affairs - ${new Date(date).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })}`,
      articles: processedArticles,
      totalArticles: processedArticles.length,
      subjectDistribution,
      isPublished: false,
    };
  } catch (error) {
    console.error('Daily CA generation failed:', error);
    throw error;
  }
}

// ============================================================================
// PUBLISH FUNCTIONS
// ============================================================================

/**
 * Publish digest (make visible to users)
 */
export async function publishDigest(digestId: string): Promise<void> {
  const now = new Date().toISOString();

  // Update digest
  await getSupabase()
    .from('daily_ca_digest')
    .update({
      is_published: true,
      published_at: now,
    })
    .eq('id', digestId);

  // Update all articles in digest
  await getSupabase()
    .from('ca_articles')
    .update({
      is_published: true,
    })
    .eq('digest_id', digestId);

  console.debug(`✓ Digest ${digestId} published at ${now}`);
}

/**
 * Generate PDF compilation of digest
 */
export async function generateDigestPDF(digestId: string): Promise<string> {
  // This would integrate with a PDF generation service
  // For now, return placeholder URL
  const pdfUrl = `https://storage.getSupabase().co/ca-digests/digest-${digestId}.pdf`;
  
  await getSupabase()
    .from('daily_ca_digest')
    .update({ pdf_url: pdfUrl })
    .eq('id', digestId);

  return pdfUrl;
}

// ============================================================================
// CLI USAGE (for Hermes cron job)
// ============================================================================

if (typeof require !== 'undefined' && require.main === module) {
  const date = process.argv[2] || new Date().toISOString().split('T')[0];
  
  generateDailyDigest(date)
    .then(async digest => {
      console.debug('\n✅ Daily CA Digest Generated Successfully');
      console.debug(`Digest ID: ${digest.digestId}`);
      console.debug(`Articles: ${digest.totalArticles}`);
      console.debug(`Distribution:`, digest.subjectDistribution);
      
      // Auto-publish
      await publishDigest(digest.digestId);
      console.debug('✓ Published');
      
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Daily CA Generation Failed:', error);
      process.exit(1);
    });
}
