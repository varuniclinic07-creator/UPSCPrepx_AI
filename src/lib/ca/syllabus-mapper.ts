/**
 * Syllabus Mapper Service
 * 
 * Maps current affairs articles to UPSC CSE syllabus topics.
 * Uses AI to analyze content and find relevant syllabus connections.
 * 
 * Master Prompt v8.0 - Feature F2 (READ Mode)
 * Rule 3: SIMPLIFIED_LANGUAGE_PROMPT enforced
 */

import { createClient } from '@supabase/supabase-js';
import { callAI } from '@/lib/ai/ai-provider-client';
import { SIMPLIFIED_LANGUAGE_PROMPT } from '@/lib/onboarding/simplified-language-prompt';

let _sb: ReturnType<typeof createClient> | null = null;
function getSupabase() { if (!_sb) _sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!); return _sb; }

// ============================================================================
// INTERFACES
// ============================================================================

export interface SyllabusMatch {
  syllabusNodeId: string;
  subject: 'GS1' | 'GS2' | 'GS3' | 'GS4' | 'Essay';
  topic: string;
  relevanceScore: number; // 0-100
  keywords: string[];
}

export interface MappedArticle {
  articleId: string;
  title: string;
  summary: string;
  syllabusMappings: SyllabusMatch[];
}

// ============================================================================
// UPSC SYLLABUS REFERENCE
// ============================================================================

const UPSC_SYLLABUS_REFERENCE = `
UPSC CSE Syllabus Areas:

GS1 (History, Geography, Indian Society):
- Modern Indian History (1750-1947): Freedom struggle, personalities, events
- Post-Independence India: Consolidation, reorganization, wars
- World History: Industrial revolution, world wars, colonization, decolonization
- Indian Society: Diversity, women, population, poverty, globalization
- Geography: Resources, industries, agriculture, urbanization, climate

GS2 (Polity, Governance, Constitution, Social Justice, IR):
- Constitution: Features, amendments, basic structure, comparisons
- Governance: Parliament, judiciary, executive, pressure groups
- Social Justice: Education, health, welfare schemes, vulnerable sections
- International Relations: India's neighborhood, bilateral relations, diaspora

GS3 (Economy, Environment, Security, Disaster Management):
- Economy: Planning, growth, employment, budget, taxation, banking
- Agriculture: Crops, irrigation, e-technology, subsidies, PDS
- Environment: Conservation, pollution, EIA, climate change
- Security: Internal security, terrorism, cyber security, border management
- Disaster Management: Natural and man-made disasters

GS4 (Ethics, Integrity, Aptitude):
- Ethics: Human values, moral thinkers, attitude, emotional intelligence
- Integrity: Probity in public life, corruption, governance
- Aptitude: Case studies, ethical dilemmas

Essay:
- General topics on philosophy, society, economy, polity, environment
`;

// ============================================================================
// AI PROMPT FOR SYLLABUS MAPPING
// ============================================================================

function buildSyllabusMappingPrompt(
  articleTitle: string,
  articleSummary: string,
  fullContent: string
): string {
  return `
${SIMPLIFIED_LANGUAGE_PROMPT}

You are an expert UPSC CSE syllabus analyzer. Your task is to map current affairs articles to the UPSC syllabus.

ARTICLE INFORMATION:
===================
Title: ${articleTitle}

Summary:
${articleSummary}

Full Content:
${fullContent.substring(0, 3000)}${fullContent.length > 3000 ? '...' : ''}

${UPSC_SYLLABUS_REFERENCE}

INSTRUCTIONS:
=============
1. Analyze the article content carefully
2. Identify which GS subject(s) it relates to (GS1, GS2, GS3, GS4, or Essay)
3. Find specific syllabus topics that connect to this article
4. Assign a relevance score (0-100) based on how directly it relates
5. Extract key keywords that link the article to the syllabus

RULES:
======
- Only include mappings with relevance_score >= 60
- An article can map to multiple subjects (e.g., environment article can be GS3 + Essay)
- Be specific with topic names (not just "Polity" but "Parliament and State Legislatures")
- Use simple 10th-class level language in topic descriptions
- Include keywords that would help students find this article during revision

OUTPUT FORMAT:
==============
Return a JSON array of syllabus mappings:

[
  {
    "syllabus_node_id": "uuid-from-database-or-null",
    "subject": "GS1|GS2|GS3|GS4|Essay",
    "topic": "Specific topic name (e.g., 'Parliament and State Legislatures')",
    "relevance_score": 85,
    "keywords": ["keyword1", "keyword2", "keyword3"]
  }
]

If you cannot find the exact syllabus_node_id, use null and we will match later.
Include 2-5 mappings per article depending on content breadth.
`;
}

// ============================================================================
// SYLLABUS MAPPING FUNCTIONS
// ============================================================================

/**
 * Map a single article to UPSC syllabus using AI
 */
export async function mapArticleToSyllabus(
  articleId: string,
  title: string,
  summary: string,
  fullContent: string
): Promise<SyllabusMatch[]> {
  console.log(`Mapping article to syllabus: ${title.substring(0, 50)}...`);

  try {
    // Build AI prompt
    const prompt = buildSyllabusMappingPrompt(title, summary, fullContent);

    // Call AI with fallback chain (9Router → Groq → Ollama)
    const aiResponse = await callAI(prompt, {
      temperature: 0.3, // Lower temperature for more consistent mapping
      maxTokens: 1000,
    });

    // Parse JSON response
    let mappings: SyllabusMatch[];
    try {
      mappings = JSON.parse(aiResponse);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      // Fallback: return empty mappings
      return [];
    }

    // Validate mappings
    const validMappings = mappings.filter(m => {
      const validSubjects = ['GS1', 'GS2', 'GS3', 'GS4', 'Essay'];
      return (
        validSubjects.includes(m.subject) &&
        m.relevance_score >= 60 &&
        m.relevance_score <= 100 &&
        m.topic &&
        m.topic.length > 0 &&
        Array.isArray(m.keywords)
      );
    });

    console.log(`Found ${validMappings.length} valid syllabus mappings`);

    // Try to match syllabus_node_id from database
    for (const mapping of validMappings) {
      if (!mapping.syllabusNodeId) {
        const matchedNode = await findSyllabusNode(mapping.subject, mapping.topic);
        if (matchedNode) {
          mapping.syllabusNodeId = matchedNode;
        }
      }
    }

    return validMappings;
  } catch (error) {
    console.error('Syllabus mapping failed:', error);
    return [];
  }
}

/**
 * Find matching syllabus node in database
 */
async function findSyllabusNode(
  subject: string,
  topic: string
): Promise<string | null> {
  try {
    // Search for matching syllabus node
    const { data, error } = await getSupabase()
      .from('syllabus_nodes')
      .select('id, name, parent_id')
      .ilike('name', `%${topic}%`)
      .eq('subject', subject)
      .limit(1)
      .single();

    if (error || !data) {
      // Try fuzzy search with keywords
      const keywords = topic.split(' ').filter(w => w.length > 3);
      for (const keyword of keywords.slice(0, 2)) {
        const { data: fuzzyData } = await getSupabase()
          .from('syllabus_nodes')
          .select('id')
          .ilike('name', `%${keyword}%`)
          .eq('subject', subject)
          .limit(1)
          .single();

        if (fuzzyData) {
          return fuzzyData.id;
        }
      }
      return null;
    }

    return data.id;
  } catch (error) {
    console.error('Failed to find syllabus node:', error);
    return null;
  }
}

/**
 * Save syllabus mappings to database
 */
export async function saveSyllabusMappings(
  articleId: string,
  mappings: SyllabusMatch[]
): Promise<void> {
  if (mappings.length === 0) {
    console.log('No mappings to save');
    return;
  }

  try {
    const mappingsToInsert = mappings.map(m => ({
      article_id: articleId,
      syllabus_node_id: m.syllabusNodeId,
      subject: m.subject,
      topic: m.topic,
      relevance_score: m.relevance_score,
    }));

    const { error } = await getSupabase()
      .from('ca_syllabus_mapping')
      .insert(mappingsToInsert);

    if (error) throw error;

    console.log(`Saved ${mappings.length} syllabus mappings for article ${articleId}`);
  } catch (error) {
    console.error('Failed to save syllabus mappings:', error);
    throw error;
  }
}

/**
 * Process multiple articles for syllabus mapping
 */
export async function processArticlesForSyllabus(
  articles: Array<{
    id: string;
    title: string;
    summary: string;
    full_content: string;
  }>
): Promise<number> {
  console.log(`Processing ${articles.length} articles for syllabus mapping...`);

  let totalMappings = 0;
  let successCount = 0;
  let errorCount = 0;

  for (const article of articles) {
    try {
      // Map article to syllabus
      const mappings = await mapArticleToSyllabus(
        article.id,
        article.title,
        article.summary,
        article.full_content
      );

      if (mappings.length > 0) {
        // Save to database
        await saveSyllabusMappings(article.id, mappings);
        totalMappings += mappings.length;
        successCount++;

        console.log(`✓ Article ${article.id}: ${mappings.length} mappings`);
      } else {
        console.log(`⚠ Article ${article.id}: No valid mappings found`);
      }
    } catch (error) {
      console.error(`✗ Article ${article.id} failed:`, error);
      errorCount++;
    }

    // Rate limiting: Wait 500ms between articles to avoid API rate limits
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log(
    `\n=== Syllabus Mapping Complete ===
Success: ${successCount}/${articles.length}
Errors: ${errorCount}
Total Mappings: ${totalMappings}
Average: ${(totalMappings / Math.max(successCount, 1)).toFixed(1)} per article
`
  );

  return totalMappings;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get syllabus distribution for articles
 */
export async function getSyllabusDistribution(articleIds: string[]): Promise<{
  GS1: number;
  GS2: number;
  GS3: number;
  GS4: number;
  Essay: number;
}> {
  const { data, error } = await getSupabase()
    .from('ca_syllabus_mapping')
    .select('subject')
    .in('article_id', articleIds);

  if (error) {
    console.error('Failed to get syllabus distribution:', error);
    return { GS1: 0, GS2: 0, GS3: 0, GS4: 0, Essay: 0 };
  }

  const distribution = {
    GS1: data.filter(m => m.subject === 'GS1').length,
    GS2: data.filter(m => m.subject === 'GS2').length,
    GS3: data.filter(m => m.subject === 'GS3').length,
    GS4: data.filter(m => m.subject === 'GS4').length,
    Essay: data.filter(m => m.subject === 'Essay').length,
  };

  return distribution;
}

/**
 * Find related notes for an article based on syllabus mapping
 */
export async function findRelatedNotes(
  articleId: string
): Promise<Array<{ noteId: string; title: string; relevanceScore: number }>> {
  // Get article's syllabus mappings
  const { data: mappings } = await getSupabase()
    .from('ca_syllabus_mapping')
    .select('syllabus_node_id, subject, topic')
    .eq('article_id', articleId)
    .order('relevance_score', { ascending: false })
    .limit(5);

  if (!mappings || mappings.length === 0) {
    return [];
  }

  // Find notes linked to same syllabus nodes
  const syllabusNodeIds = mappings
    .map(m => m.syllabus_node_id)
    .filter((id): id is string => id !== null);

  if (syllabusNodeIds.length === 0) {
    return [];
  }

  const { data: relatedNotes } = await getSupabase()
    .from('content_library')
    .select('id, title, syllabus_mapping')
    .in('syllabus_node_id', syllabusNodeIds)
    .eq('status', 'published')
    .limit(5);

  if (!relatedNotes) {
    return [];
  }

  return relatedNotes.map(note => ({
    noteId: note.id,
    title: note.title,
    relevanceScore: 80, // Default high relevance since syllabus matches
  }));
}

// ============================================================================
// CLI USAGE (for batch processing)
// ============================================================================

if (typeof require !== 'undefined' && require.main === module) {
  console.error('Syllabus Mapper Service - Use processArticlesForSyllabus() function');
  process.exit(1);
}
