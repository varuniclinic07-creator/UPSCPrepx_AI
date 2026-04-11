import { NextRequest, NextResponse } from 'next/server';
import { 
  getCurrentAffairById, 
  updateCurrentAffair, 
  deleteCurrentAffair 
} from '@/lib/services/current-affairs-service';
import { requireAdmin } from '@/lib/auth/auth-config';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: { id: string };
}

/**
 * GET /api/current-affairs/[id]
 * Get a single current affair by ID
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'Current affair ID is required' },
        { status: 400 }
      );
    }

    const affair = await getCurrentAffairById(id);

    if (!affair) {
      return NextResponse.json(
        { error: 'Current affair not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      affair,
    });
  } catch (error) {
    console.error('[API] Current affair get error:', error);

    return NextResponse.json(
      { error: 'Failed to fetch current affair' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/current-affairs/[id]
 * Update a current affair (admin only)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAdmin();
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'Current affair ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { topic, category, content, isPublished } = body;

    const affair = await updateCurrentAffair(id, {
      topic,
      category,
      content,
      isPublished,
    });

    return NextResponse.json({
      success: true,
      affair,
      message: 'Current affair updated successfully',
    });
  } catch (error) {
    console.error('[API] Current affair update error:', error);

    if (error instanceof Error) {
      if (error.message === 'Authentication required') {
        return NextResponse.json(
          { error: 'Please login to update content' },
          { status: 401 }
        );
      }

      if (error.message === 'Admin access required') {
        return NextResponse.json(
          { error: 'Admin access required' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to update current affair' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/current-affairs/[id]
 * Delete a current affair (admin only)
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    await requireAdmin();
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'Current affair ID is required' },
        { status: 400 }
      );
    }

    await deleteCurrentAffair(id);

    return NextResponse.json({
      success: true,
      message: 'Current affair deleted successfully',
    });
  } catch (error) {
    console.error('[API] Current affair delete error:', error);

    if (error instanceof Error) {
      if (error.message === 'Authentication required') {
        return NextResponse.json(
          { error: 'Please login to delete content' },
          { status: 401 }
        );
      }

      if (error.message === 'Admin access required') {
        return NextResponse.json(
          { error: 'Admin access required' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to delete current affair' },
      { status: 500 }
    );
  }
}