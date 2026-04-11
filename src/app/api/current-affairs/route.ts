import { NextRequest, NextResponse } from 'next/server';
import {
  getCurrentAffairs,
  searchCurrentAffairs,
  getCurrentAffairsCategories,
  generateCurrentAffairs
} from '@/lib/services/current-affairs-service';
import { requireAdmin } from '@/lib/auth/auth-config';
import { getRateLimitHeaders, checkRateLimit } from '@/lib/ai/rate-limiter';

export const dynamic = 'force-dynamic';

/**
 * GET /api/current-affairs
 * Get current affairs with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const category = searchParams.get('category') || undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const search = searchParams.get('search');
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');

    let affairs;

    if (search && search.trim().length > 0) {
      // Search current affairs
      affairs = await searchCurrentAffairs(search.trim());
    } else {
      // Get current affairs with filters
      affairs = await getCurrentAffairs({
        category,
        startDate,
        endDate,
        limit: limit ? parseInt(limit, 10) : 20,
        offset: offset ? parseInt(offset, 10) : 0,
      });
    }

    return NextResponse.json({
      success: true,
      affairs,
      count: affairs.length,
      categories: getCurrentAffairsCategories(),
    });
  } catch (error) {
    console.error('[API] Current affairs list error:', error);

    return NextResponse.json(
      { error: 'Failed to fetch current affairs' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/current-affairs
 * Generate new current affairs content (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    // Require admin access for generating content
    const user = await requireAdmin();

    // Check rate limit (use 'a4f' as provider)
    const rateLimitResult = await checkRateLimit('a4f', user.id);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded. Please wait before generating more content.',
          retryAfter: rateLimitResult.retryAfter
        },
        {
          status: 429,
          headers: getRateLimitHeaders(rateLimitResult)
        }
      );
    }

    // Parse request body
    const body = await request.json();
    const { topic, category, date } = body;

    // Validate input
    if (!topic || typeof topic !== 'string' || topic.trim().length < 3) {
      return NextResponse.json(
        { error: 'Topic is required and must be at least 3 characters' },
        { status: 400 }
      );
    }

    const validCategories = getCurrentAffairsCategories();
    if (!category || !validCategories.includes(category)) {
      return NextResponse.json(
        { error: 'Valid category is required', validCategories },
        { status: 400 }
      );
    }

    // Generate current affairs content
    const affair = await generateCurrentAffairs({
      topic: topic.trim(),
      category,
      userId: user.id,
      date,
    });

    return NextResponse.json(
      {
        success: true,
        affair,
        message: 'Current affairs content generated successfully'
      },
      {
        status: 201,
        headers: getRateLimitHeaders(rateLimitResult)
      }
    );
  } catch (error) {
    console.error('[API] Current affairs generate error:', error);

    if (error instanceof Error) {
      if (error.message === 'Authentication required') {
        return NextResponse.json(
          { error: 'Please login to generate content' },
          { status: 401 }
        );
      }

      if (error.message === 'Admin access required') {
        return NextResponse.json(
          { error: 'Admin access required to generate content' },
          { status: 403 }
        );
      }

      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          { error: error.message },
          { status: 429 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to generate current affairs content' },
      { status: 500 }
    );
  }
}