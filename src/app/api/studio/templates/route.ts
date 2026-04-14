/**
 * Templates API Route - User Content Studio (Feature F4)
 * 
 * Handles template management
 * Master Prompt v8.0 - READ Mode
 * 
 * Endpoints:
 * - GET: List templates (system + custom)
 * - POST: Create custom template
 * 
 * AI Provider: 9Router → Groq → Ollama
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { z } from 'zod';
import { getAuthUser } from '@/lib/security/auth';
import { checkSubscriptionAccess } from '@/lib/trial/subscription-checker';

export const dynamic = 'force-dynamic';

// ============================================================================
// CONFIGURATION
// ============================================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const TemplateStructureSchema = z.object({
  introduction: z.object({
    guideline: z.object({
      en: z.string(),
      hi: z.string().optional(),
    }),
    keyPoints: z.array(z.string()),
    examples: z.array(z.string()).optional(),
  }),
  body: z.array(
    z.object({
      id: z.string(),
      title: z.object({
        en: z.string(),
        hi: z.string().optional(),
      }),
      order: z.number().int().positive(),
      guideline: z.object({
        en: z.string(),
        hi: z.string().optional(),
      }),
      placeholder: z.string().optional(),
      minWords: z.number().int().positive().optional(),
      maxWords: z.number().int().positive().optional(),
    })
  ),
  conclusion: z.object({
    guideline: z.object({
      en: z.string(),
      hi: z.string().optional(),
    }),
    keyPoints: z.array(z.string()),
    examples: z.array(z.string()).optional(),
  }),
});

const CreateTemplateSchema = z.object({
  title: z.object({
    en: z.string().min(1).max(200),
    hi: z.string().min(1).max(200).optional(),
  }),
  description: z.object({
    en: z.string().min(1).max(500),
    hi: z.string().min(1).max(500).optional(),
  }),
  category: z.enum(['GS1', 'GS2', 'GS3', 'GS4', 'Essay', 'Optional', 'General']),
  subcategory: z.string().optional(),
  tags: z.array(z.string()).optional(),
  wordLimit: z.number().int().positive(),
  timeLimit: z.number().int().positive(),
  structure: TemplateStructureSchema,
  isPublic: z.boolean().default(false),
});

const ListTemplatesSchema = z.object({
  category: z.enum(['GS1', 'GS2', 'GS3', 'GS4', 'Essay', 'Optional', 'General']).optional(),
  search: z.string().optional(),
  includeSystem: z.boolean().default(true),
  includeCustom: z.boolean().default(true),
  minRating: z.number().min(0).max(5).optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  sortBy: z.enum(['rating', 'usage_count', 'created_at', 'title']).default('rating'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ============================================================================
// GET - List Templates
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    // Authentication (optional for system templates)
    const authUser = await getAuthUser(request);

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryParams = {
      category: searchParams.get('category') as any || undefined,
      search: searchParams.get('search') || undefined,
      includeSystem: searchParams.get('includeSystem') !== 'false',
      includeCustom: searchParams.get('includeCustom') !== 'false',
      minRating: searchParams.get('minRating') ? parseFloat(searchParams.get('minRating')!) : undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
      sortBy: (searchParams.get('sortBy') as any) || 'rating',
      sortOrder: (searchParams.get('sortOrder') as any) || 'desc',
    };

    // Validate
    const validated = ListTemplatesSchema.parse(queryParams);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const templates: any[] = [];

    // Fetch system templates
    if (validated.includeSystem) {
      let systemQuery = supabase
        .from('note_templates')
        .select('*')
        .eq('is_system', true);

      if (validated.category) {
        systemQuery = systemQuery.eq('category', validated.category);
      }

      if (validated.minRating) {
        systemQuery = systemQuery.gte('rating', validated.minRating);
      }

      if (validated.search) {
        systemQuery = systemQuery.or(
          `title_en.ilike.%${validated.search}%,title_hi.ilike.%${validated.search}%,description_en.ilike.%${validated.search}%`
        );
      }

      const { data: systemTemplates } = await systemQuery;
      if (systemTemplates) {
        templates.push(...systemTemplates);
      }
    }

    // Fetch custom templates
    if (validated.includeCustom && authUser) {
      let customQuery = supabase
        .from('note_templates')
        .select('*')
        .eq('is_system', false)
        .eq('user_id', authUser.id);

      if (validated.category) {
        customQuery = customQuery.eq('category', validated.category);
      }

      if (validated.minRating) {
        customQuery = customQuery.gte('rating', validated.minRating);
      }

      if (validated.search) {
        customQuery = customQuery.or(
          `title_en.ilike.%${validated.search}%,title_hi.ilike.%${validated.search}%`
        );
      }

      const { data: customTemplates } = await customQuery;
      if (customTemplates) {
        templates.push(...customTemplates);
      }
    }

    // Sort templates
    const sortedTemplates = templates.sort((a, b) => {
      let comparison = 0;
      
      switch (validated.sortBy) {
        case 'rating':
          comparison = (b.rating || 0) - (a.rating || 0);
          break;
        case 'usage_count':
          comparison = (b.usage_count || 0) - (a.usage_count || 0);
          break;
        case 'created_at':
          comparison = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          break;
        case 'title':
          comparison = (b.title_en || '').localeCompare(a.title_en || '');
          break;
      }

      return validated.sortOrder === 'asc' ? -comparison : comparison;
    });

    // Pagination
    const start = (validated.page - 1) * validated.limit;
    const end = start + validated.limit;
    const paginatedTemplates = sortedTemplates.slice(start, end);

    return NextResponse.json({
      success: true,
      data: {
        templates: paginatedTemplates,
        pagination: {
          page: validated.page,
          limit: validated.limit,
          total: sortedTemplates.length,
          totalPages: Math.ceil(sortedTemplates.length / validated.limit),
        },
      },
    });
  } catch (error) {
    console.error('Templates list error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid parameters', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Create Custom Template
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Authentication
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse body
    const body = await request.json();
    const validated = CreateTemplateSchema.parse(body);

    // Subscription check - Premium feature
    const subscription = await checkSubscriptionAccess(authUser.id, 'content_studio');
    
    if (subscription.tier !== 'premium' && subscription.tier !== 'premium_plus') {
      return NextResponse.json(
        {
          success: false,
          error: 'Custom templates are a Premium feature. Please upgrade to create custom templates.',
          upgradeRequired: true,
        },
        { status: 403 }
      );
    }

    // Check custom template limit (10 for premium)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { count } = await supabase
      .from('note_templates')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', authUser.id)
      .eq('is_system', false);

    if ((count || 0) >= 10) {
      return NextResponse.json(
        {
          success: false,
          error: 'Custom template limit reached (10). Delete existing templates to create more.',
        },
        { status: 403 }
      );
    }

    // Create template
    const { data: template, error } = await supabase
      .from('note_templates')
      .insert({
        user_id: authUser.id,
        title_en: validated.title.en,
        title_hi: validated.title.hi || validated.title.en,
        description_en: validated.description.en,
        description_hi: validated.description.hi || validated.description.en,
        category: validated.category,
        subcategory: validated.subcategory || null,
        tags: validated.tags || [],
        word_limit: validated.wordLimit,
        time_limit: validated.timeLimit,
        structure: validated.structure,
        is_system: false,
        is_public: validated.isPublic,
        rating: 0,
        usage_count: 0,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create template:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to create template' },
        { status: 500 }
      );
    }

    // Award XP for creating template (Gamification F13)
    try {
      await supabase.rpc('award_xp', {
        p_user_id: authUser.id,
        p_xp_amount: 25,
        p_reason: 'template_created',
      });
    } catch (xpError) {
      console.warn('Failed to award XP:', xpError);
    }

    return NextResponse.json({
      success: true,
      data: template,
      message: 'Custom template created successfully',
    });
  } catch (error) {
    console.error('Create template error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
