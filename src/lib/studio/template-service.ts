/**
 * Template Service - User Content Studio (Feature F4)
 * 
 * Template management for answer writing
 * Master Prompt v8.0 - READ Mode
 * TipTap Rich Text Editor
 * 
 * AI Provider: 9Router → Groq → Ollama
 */

import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface Template {
  id: string;
  user_id: string | null; // null for system templates
  title: { en: string; hi: string };
  description: { en: string; hi: string };
  content: any; // TipTap JSON
  category: 'general' | 'gs1' | 'gs2' | 'gs3' | 'gs4' | 'essay' | 'optional';
  subcategory: string;
  tags: string[];
  structure: TemplateStructure;
  word_limit: number;
  time_limit_seconds: number;
  is_system: boolean;
  is_premium: boolean;
  usage_count: number;
  rating: number;
  created_at: string;
  updated_at: string;
}

export interface TemplateStructure {
  sections: TemplateSection[];
  introduction: SectionGuideline;
  body: SectionGuideline[];
  conclusion: SectionGuideline;
}

export interface TemplateSection {
  id: string;
  title: { en: string; hi: string };
  order: number;
  guideline: { en: string; hi: string };
  placeholder: string;
  min_words: number;
  max_words: number;
}

export interface SectionGuideline {
  guideline: { en: string; hi: string };
  key_points: string[];
  examples: string[];
}

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const TemplateSchema = z.object({
  title: z.object({
    en: z.string().min(1).max(200),
    hi: z.string().max(200).optional().default(''),
  }),
  description: z.object({
    en: z.string().min(1).max(500),
    hi: z.string().max(500).optional().default(''),
  }),
  content: z.object({
    type: z.literal('doc'),
    content: z.array(z.any()).optional(),
  }),
  category: z.enum(['general', 'gs1', 'gs2', 'gs3', 'gs4', 'essay', 'optional']),
  subcategory: z.string().optional().default(''),
  tags: z.array(z.string()).optional().default([]),
  word_limit: z.number().min(50).max(1000).optional().default(150),
  time_limit_seconds: z.number().min(60).max(3600).optional().default(420),
  is_premium: z.boolean().optional().default(false),
});

// ============================================================================
// TEMPLATE OPERATIONS
// ============================================================================

/**
 * Get all templates with filters
 */
export async function getTemplates(
  userId: string,
  options?: {
    category?: string;
    subcategory?: string;
    tags?: string[];
    is_system?: boolean;
    is_premium?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
  }
): Promise<{ templates: Template[]; total: number }> {
  try {
    const supabase = await createClient();

    let query = supabase
      .from('note_templates')
      .select('*', { count: 'exact' });

    // Filter: system templates OR user's custom templates
    if (options?.is_system !== undefined) {
      query = query.eq('is_system', options.is_system);
    } else {
      query = query.or(`is_system.eq.true,user_id.eq.${userId}`);
    }

    // Apply filters
    if (options?.category) {
      query = query.eq('category', options.category);
    }

    if (options?.subcategory) {
      query = query.eq('subcategory', options.subcategory);
    }

    if (options?.tags && options.tags.length > 0) {
      query = query.contains('tags', options.tags);
    }

    if (options?.is_premium !== undefined) {
      query = query.eq('is_premium', options.is_premium);
    }

    if (options?.search) {
      query = query.or(
        `title.en.ilike.%${options.search}%,title.hi.ilike.%${options.search}%,description.en.ilike.%${options.search}%`
      );
    }

    // Apply sorting
    query = query.order('usage_count', { ascending: false });

    // Apply pagination
    const limit = options?.limit || 50;
    const offset = options?.offset || 0;
    query = query.range(offset, offset + limit - 1);

    const { data: templates, error } = await query;

    if (error) {
      console.error('Failed to get templates:', error);
      return { templates: [], total: 0 };
    }

    return {
      templates: templates as unknown as Template[],
      total: templates?.length || 0,
    };
  } catch (error) {
    console.error('Error in getTemplates:', error);
    return { templates: [], total: 0 };
  }
}

/**
 * Get a single template by ID
 */
export async function getTemplate(
  templateId: string,
  userId: string
): Promise<Template | null> {
  try {
    const supabase = await createClient();

    const { data: template, error } = await supabase
      .from('note_templates')
      .select()
      .eq('id', templateId)
      .or(`is_system.eq.true,user_id.eq.${userId}`)
      .single();

    if (error || !template) {
      return null;
    }

    return template as unknown as Template;
  } catch (error) {
    console.error('Error in getTemplate:', error);
    return null;
  }
}

/**
 * Create a custom template
 */
export async function createTemplate(
  userId: string,
  data: z.infer<typeof TemplateSchema>
): Promise<Template | null> {
  try {
    const supabase = await createClient();

    const validated = TemplateSchema.parse(data);

    const { data: template, error } = await supabase
      .from('note_templates')
      .insert({
        user_id: userId,
        title: validated.title,
        description: validated.description,
        content: validated.content,
        category: validated.category,
        subcategory: validated.subcategory,
        tags: validated.tags,
        word_limit: validated.word_limit,
        time_limit_seconds: validated.time_limit_seconds,
        is_system: false,
        is_premium: validated.is_premium,
        usage_count: 0,
        rating: 0,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create template:', error);
      return null;
    }

    return template as unknown as Template;
  } catch (error) {
    console.error('Error in createTemplate:', error);
    return null;
  }
}

/**
 * Update a template
 */
export async function updateTemplate(
  templateId: string,
  userId: string,
  data: Partial<z.infer<typeof TemplateSchema>>
): Promise<Template | null> {
  try {
    const supabase = await createClient();

    // Check ownership
    const { data: existing } = await supabase
      .from('note_templates')
      .select('user_id, is_system')
      .eq('id', templateId)
      .single();

    if (!existing || (existing.is_system && existing.user_id !== userId)) {
      console.error('Cannot update system templates');
      return null;
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (data.title) updateData.title = data.title;
    if (data.description) updateData.description = data.description;
    if (data.content) updateData.content = data.content;
    if (data.category) updateData.category = data.category;
    if (data.subcategory) updateData.subcategory = data.subcategory;
    if (data.tags) updateData.tags = data.tags;
    if (data.word_limit) updateData.word_limit = data.word_limit;
    if (data.time_limit_seconds) updateData.time_limit_seconds = data.time_limit_seconds;
    if (data.is_premium !== undefined) updateData.is_premium = data.is_premium;

    const { data: template, error } = await supabase
      .from('note_templates')
      .update(updateData)
      .eq('id', templateId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Failed to update template:', error);
      return null;
    }

    return template as unknown as Template;
  } catch (error) {
    console.error('Error in updateTemplate:', error);
    return null;
  }
}

/**
 * Delete a template
 */
export async function deleteTemplate(
  templateId: string,
  userId: string
): Promise<boolean> {
  try {
    const supabase = await createClient();

    // Check ownership (cannot delete system templates)
    const { data: existing } = await supabase
      .from('note_templates')
      .select('is_system')
      .eq('id', templateId)
      .single();

    if (!existing || existing.is_system) {
      console.error('Cannot delete system templates');
      return false;
    }

    const { error } = await supabase
      .from('note_templates')
      .delete()
      .eq('id', templateId)
      .eq('user_id', userId);

    return !error;
  } catch (error) {
    console.error('Error in deleteTemplate:', error);
    return false;
  }
}

/**
 * Rate a template
 */
export async function rateTemplate(
  templateId: string,
  userId: string,
  rating: number
): Promise<boolean> {
  try {
    const supabase = await createClient();

    // Validate rating (1-5)
    if (rating < 1 || rating > 5) {
      return false;
    }

    // Check if user already rated
    const { data: existing } = await supabase
      .from('template_ratings')
      .select()
      .eq('template_id', templateId)
      .eq('user_id', userId)
      .single();

    if (existing) {
      // Update existing rating
      await supabase
        .from('template_ratings')
        .update({ rating, updated_at: new Date().toISOString() })
        .eq('template_id', templateId)
        .eq('user_id', userId);
    } else {
      // Create new rating
      await supabase.from('template_ratings').insert({
        template_id: templateId,
        user_id: userId,
        rating,
      });
    }

    // Recalculate average rating
    const { data: stats } = await supabase
      .from('template_ratings')
      .select('rating')
      .eq('template_id', templateId);

    if (stats && stats.length > 0) {
      const avgRating = stats.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / stats.length;

      await supabase
        .from('note_templates')
        .update({
          rating: Math.round(avgRating * 10) / 10,
          updated_at: new Date().toISOString(),
        })
        .eq('id', templateId);
    }

    return true;
  } catch (error) {
    console.error('Error in rateTemplate:', error);
    return false;
  }
}

/**
 * Increment template usage count
 */
export async function incrementTemplateUsage(templateId: string): Promise<boolean> {
  try {
    const supabase = await createClient();

    await supabase.rpc('increment_template_usage' as any, {
      p_template_id: templateId,
    });

    return true;
  } catch (error) {
    console.error('Error in incrementTemplateUsage:', error);
    return false;
  }
}

// ============================================================================
// DEFAULT TEMPLATES
// ============================================================================

/**
 * Get default system templates for UPSC answer writing
 */
export function getDefaultTemplates(): Partial<Template>[] {
  return [
    {
      title: {
        en: 'General Answer Structure',
        hi: 'सामान्य उत्तर संरचना',
      },
      description: {
        en: 'Standard 150-word answer structure for GS papers',
        hi: 'GS पेपर्स के लिए मानक 150 शब्द उत्तर संरचना',
      },
      category: 'general',
      word_limit: 150,
      time_limit_seconds: 420,
      structure: {
        sections: [
          {
            id: 'intro',
            title: { en: 'Introduction', hi: 'परिचय' },
            order: 1,
            guideline: {
              en: 'Define key terms, provide context',
              hi: 'मुख्य शब्दों को परिभाषित करें, संदर्भ प्रदान करें',
            },
            placeholder: 'Start with definition or context...',
            min_words: 20,
            max_words: 30,
          },
          {
            id: 'body1',
            title: { en: 'Body Paragraph 1', hi: 'मुख्य भाग 1' },
            order: 2,
            guideline: {
              en: 'First main point with examples',
              hi: 'उदाहरणों के साथ पहला मुख्य बिंदु',
            },
            placeholder: 'First argument with data/examples...',
            min_words: 40,
            max_words: 50,
          },
          {
            id: 'body2',
            title: { en: 'Body Paragraph 2', hi: 'मुख्य भाग 2' },
            order: 3,
            guideline: {
              en: 'Second main point with examples',
              hi: 'उदाहरणों के साथ दूसरा मुख्य बिंदु',
            },
            placeholder: 'Second argument with data/examples...',
            min_words: 40,
            max_words: 50,
          },
          {
            id: 'conclusion',
            title: { en: 'Conclusion', hi: 'निष्कर्ष' },
            order: 4,
            guideline: {
              en: 'Summarize and provide way forward',
              hi: 'सारांश और आगे की राह',
            },
            placeholder: 'Conclude with way forward...',
            min_words: 20,
            max_words: 30,
          },
        ],
        introduction: {
          guideline: {
            en: 'Start with definition, context, or current relevance',
            hi: 'परिभाषा, संदर्भ या वर्तमान प्रासंगिकता के साथ शुरू करें',
          },
          key_points: ['Define key terms', 'Provide background', 'Show relevance'],
          examples: ['As per Article 14...', 'In the context of SDG...'],
        },
        body: [
          {
            guideline: {
              en: 'Present arguments with data, examples, and case studies',
              hi: 'डेटा, उदाहरण और केस स्टडी के साथ तर्क प्रस्तुत करें',
            },
            key_points: ['Use data', 'Give examples', 'Cite reports'],
            examples: ['NITI Aayog report states...', 'Example of Kerala...'],
          },
        ],
        conclusion: {
          guideline: {
            en: 'Summarize main points and suggest way forward',
            hi: 'मुख्य बिंदुओं का सारांश और आगे की राह सुझाएं',
          },
          key_points: ['Summarize', 'Way forward', 'Optimistic note'],
          examples: ['In conclusion...', 'To achieve this...'],
        },
      },
    },
    {
      title: {
        en: 'Essay Template',
        hi: 'निबंध टेम्पलेट',
      },
      description: {
        en: 'Comprehensive essay structure for UPSC Mains',
        hi: 'UPSC मेन्स के लिए व्यापक निबंध संरचना',
      },
      category: 'essay',
      word_limit: 1000,
      time_limit_seconds: 3600,
      structure: {
        sections: [
          {
            id: 'intro',
            title: { en: 'Introduction', hi: 'परिचय' },
            order: 1,
            guideline: {
              en: 'Hook, context, thesis statement',
              hi: 'हुक, संदर्भ, थीसिस स्टेटमेंट',
            },
            placeholder: 'Start with quote, fact, or story...',
            min_words: 100,
            max_words: 150,
          },
          {
            id: 'body1',
            title: { en: 'Historical Context', hi: 'ऐतिहासिक संदर्भ' },
            order: 2,
            guideline: {
              en: 'Trace evolution and background',
              hi: 'विकास और पृष्ठभूमि का पता लगाएं',
            },
            placeholder: 'Historical perspective...',
            min_words: 150,
            max_words: 200,
          },
          {
            id: 'body2',
            title: { en: 'Current Scenario', hi: 'वर्तमान परिदृश्य' },
            order: 3,
            guideline: {
              en: 'Present situation with data',
              hi: 'डेटा के साथ वर्तमान स्थिति',
            },
            placeholder: 'Current data and trends...',
            min_words: 200,
            max_words: 250,
          },
          {
            id: 'body3',
            title: { en: 'Challenges & Opportunities', hi: 'चुनौतियां और अवसर' },
            order: 4,
            guideline: {
              en: 'Analyze both sides',
              hi: 'दोनों पक्षों का विश्लेषण',
            },
            placeholder: 'Challenges and opportunities...',
            min_words: 200,
            max_words: 250,
          },
          {
            id: 'body4',
            title: { en: 'Way Forward', hi: 'आगे की राह' },
            order: 5,
            guideline: {
              en: 'Solutions and recommendations',
              hi: 'समाधान और सिफारिशें',
            },
            placeholder: 'Solutions and recommendations...',
            min_words: 150,
            max_words: 200,
          },
          {
            id: 'conclusion',
            title: { en: 'Conclusion', hi: 'निष्कर्ष' },
            order: 6,
            guideline: {
              en: 'Summarize with vision',
              hi: 'दृष्टि के साथ सारांश',
            },
            placeholder: 'Concluding thoughts...',
            min_words: 100,
            max_words: 150,
          },
        ],
        introduction: {
          guideline: {
            en: 'Start with quote, anecdote, or striking fact',
            hi: 'उद्धरण, किस्सा या चौंकाने वाले तथ्य के साथ शुरू करें',
          },
          key_points: ['Hook the reader', 'Provide context', 'State thesis'],
          examples: ['Gandhiji once said...', 'According to World Bank...'],
        },
        body: [],
        conclusion: {
          guideline: {
            en: 'End with vision for future',
            hi: 'भविष्य की दृष्टि के साथ समाप्त करें',
          },
          key_points: ['Summarize', 'Vision', 'Call to action'],
          examples: ['As we move forward...', 'The future depends on...'],
        },
      },
    },
  ];
}

/**
 * Get template by category and subcategory
 */
export async function getTemplateByCategory(
  category: string,
  subcategory?: string
): Promise<Template | null> {
  try {
    const supabase = await createClient();

    let query = supabase
      .from('note_templates')
      .select()
      .eq('is_system', true)
      .eq('category', category)
      .order('usage_count', { ascending: false })
      .limit(1);

    if (subcategory) {
      query = query.eq('subcategory', subcategory);
    }

    const { data: template, error } = await query.single();

    if (error || !template) {
      return null;
    }

    return template as unknown as Template;
  } catch (error) {
    console.error('Error in getTemplateByCategory:', error);
    return null;
  }
}

/**
 * Get template categories with counts
 */
export async function getTemplateCategories(): Promise<
  Array<{ category: string; count: number }>
> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('note_templates')
      .select('category')
      .eq('is_system', true) as { data: any[] | null; error: any };

    if (error) {
      console.error('Failed to get categories:', error);
      return [];
    }

    // Group by category in JS since Supabase doesn't support .group()
    const categoryCounts: Record<string, number> = {};
    for (const item of data || []) {
      const cat = item.category;
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    }
    return Object.entries(categoryCounts).map(([category, count]) => ({ category, count }));
  } catch (error) {
    console.error('Error in getTemplateCategories:', error);
    return [];
  }
}
