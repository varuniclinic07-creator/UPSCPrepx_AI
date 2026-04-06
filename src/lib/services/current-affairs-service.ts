import { createClient } from '@/lib/supabase/server';
import { generateWithResearch, parseAIJson } from '@/lib/ai/generate';
import type { CurrentAffair, CurrentAffairContent, Json } from '@/types';

export interface GenerateCurrentAffairsInput {
  topic: string;
  category: string;
  userId: string;
  date?: string;
}

/**
 * Generate current affairs analysis using research model
 * Uses web-grounded AI for accurate, up-to-date information
 */
export async function generateCurrentAffairs(
  input: GenerateCurrentAffairsInput
): Promise<CurrentAffair> {
  const { topic, category, userId, date = new Date().toISOString().split('T')[0] } = input;

  const systemPrompt = `You are an expert UPSC current affairs analyst.
Your task is to analyze news and events for UPSC exam relevance.

IMPORTANT RULES:
1. Focus on UPSC relevance - Prelims, Mains, and Interview angles
2. Connect to static syllabus topics (Polity, Economy, Geography, etc.)
3. Provide multiple perspectives for Mains answer writing
4. Include data, facts, and figures
5. Output ONLY valid JSON - no other text`;

  const prompt = `Analyze this current affairs topic for UPSC preparation:

TOPIC: ${topic}
CATEGORY: ${category}
DATE: ${date}

Output this EXACT JSON structure:
{
  "summary": "2-3 sentence summary of the topic/event",
  "details": "4-6 paragraphs of detailed analysis with context, significance, and implications",
  "keyPoints": ["5-8 key points for quick revision"],
  "upscRelevance": "How this topic is relevant to UPSC - which papers, which topics in syllabus",
  "relatedTopics": ["List of related static topics to study"],
  "sources": ["Reliable sources for further reading"],
  "pyqConnections": ["Connections to previous year questions if any"]
}

Provide comprehensive, exam-oriented analysis.`;

  try {
    const response = await generateWithResearch(prompt, {
      systemPrompt,
      maxTokens: 3000,
      userId,
    });

    // Parse AI response
    const content = parseAIJson<CurrentAffairContent>(response);

    if (!content) {
      throw new Error('Failed to parse current affairs content');
    }

    // Validate content
    const validatedContent: CurrentAffairContent = {
      summary: content.summary || 'Summary not available',
      details: content.details || '',
      keyPoints: content.keyPoints || [],
      upscRelevance: content.upscRelevance || 'Relevance analysis not available',
      relatedTopics: content.relatedTopics || [],
      sources: content.sources || [],
      pyqConnections: content.pyqConnections || [],
    };

    // Save to database
    const supabase = await createClient();

    const { data: affair, error } = await (supabase
      .from('current_affairs') as any)
      .insert({
        topic,
        category,
        content: validatedContent as unknown as Json,
        date,
        is_published: true,
        view_count: 0,
      })
      .select()
      .single();

    if (error) {
      console.error('[Current Affairs Service] Database error:', error);
      throw new Error(`Failed to save current affair: ${error.message}`);
    }

    return {
      id: affair.id,
      topic: affair.topic,
      category: affair.category,
      content: affair.content as unknown as CurrentAffairContent,
      date: affair.date,
      isPublished: affair.is_published,
      viewCount: affair.view_count,
      createdAt: new Date(affair.created_at),
      updatedAt: new Date(affair.updated_at),
    };
  } catch (error) {
    console.error('[Current Affairs Service] Error generating content:', error);
    throw error;
  }
}

/**
 * Get all current affairs (with optional filters)
 */
export async function getCurrentAffairs(options?: {
  category?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}): Promise<CurrentAffair[]> {
  const supabase = await createClient();

  let query = (supabase
    .from('current_affairs') as any)
    .select('*')
    .eq('is_published', true)
    .order('date', { ascending: false });

  if (options?.category) {
    query = query.eq('category', options.category);
  }

  if (options?.startDate) {
    query = query.gte('date', options.startDate);
  }

  if (options?.endDate) {
    query = query.lte('date', options.endDate);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch current affairs: ${error.message}`);
  }

  return data.map((affair: any) => ({
    id: affair.id,
    topic: affair.topic,
    category: affair.category,
    content: affair.content as unknown as CurrentAffairContent,
    date: affair.date,
    isPublished: affair.is_published,
    viewCount: affair.view_count,
    createdAt: new Date(affair.created_at),
    updatedAt: new Date(affair.updated_at),
  }));
}

/**
 * Get current affair by ID
 */
export async function getCurrentAffairById(id: string): Promise<CurrentAffair | null> {
  const supabase = await createClient();

  const { data, error } = await (supabase
    .from('current_affairs') as any)
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    return null;
  }

  // Increment view count
  await (supabase
    .from('current_affairs') as any)
    .update({ view_count: data.view_count + 1 })
    .eq('id', id);

  return {
    id: data.id,
    topic: data.topic,
    category: data.category,
    content: data.content as unknown as CurrentAffairContent,
    date: data.date,
    isPublished: data.is_published,
    viewCount: data.view_count + 1,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };
}

/**
 * Get current affairs by date range (for daily/weekly/monthly view)
 */
export async function getCurrentAffairsByDateRange(
  startDate: string,
  endDate: string
): Promise<CurrentAffair[]> {
  return getCurrentAffairs({ startDate, endDate });
}

/**
 * Get today's current affairs
 */
export async function getTodaysCurrentAffairs(): Promise<CurrentAffair[]> {
  const today = new Date().toISOString().split('T')[0];
  return getCurrentAffairs({ startDate: today, endDate: today });
}

/**
 * Get current affairs categories
 */
export function getCurrentAffairsCategories(): string[] {
  return [
    'Polity & Governance',
    'Economy',
    'International Relations',
    'Environment & Ecology',
    'Science & Technology',
    'Social Issues',
    'Art & Culture',
    'Security & Defense',
    'Geography',
    'History',
    'Ethics',
    'Miscellaneous',
  ];
}

/**
 * Search current affairs
 */
export async function searchCurrentAffairs(query: string): Promise<CurrentAffair[]> {
  const supabase = await createClient();

  const { data, error } = await (supabase
    .from('current_affairs') as any)
    .select('*')
    .eq('is_published', true)
    .or(`topic.ilike.%${query}%,category.ilike.%${query}%`)
    .order('date', { ascending: false })
    .limit(20);

  if (error) {
    throw new Error(`Failed to search current affairs: ${error.message}`);
  }

  return data.map((affair: any) => ({
    id: affair.id,
    topic: affair.topic,
    category: affair.category,
    content: affair.content as unknown as CurrentAffairContent,
    date: affair.date,
    isPublished: affair.is_published,
    viewCount: affair.view_count,
    createdAt: new Date(affair.created_at),
    updatedAt: new Date(affair.updated_at),
  }));
}

/**
 * Update current affair (admin only)
 */
export async function updateCurrentAffair(
  id: string,
  updates: Partial<{
    topic: string;
    category: string;
    content: CurrentAffairContent;
    isPublished: boolean;
  }>
): Promise<CurrentAffair> {
  const supabase = await createClient();

  const updateData: Record<string, unknown> = {};
  if (updates.topic) updateData.topic = updates.topic;
  if (updates.category) updateData.category = updates.category;
  if (updates.content) updateData.content = updates.content;
  if (typeof updates.isPublished === 'boolean') updateData.is_published = updates.isPublished;

  const { data, error } = await (supabase
    .from('current_affairs') as any)
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update current affair: ${error.message}`);
  }

  return {
    id: data.id,
    topic: data.topic,
    category: data.category,
    content: data.content as unknown as CurrentAffairContent,
    date: data.date,
    isPublished: data.is_published,
    viewCount: data.view_count,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };
}

/**
 * Delete current affair (admin only)
 */
export async function deleteCurrentAffair(id: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await (supabase
    .from('current_affairs') as any)
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete current affair: ${error.message}`);
  }
}