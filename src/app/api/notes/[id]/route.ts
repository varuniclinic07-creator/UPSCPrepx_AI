import { NextRequest, NextResponse } from 'next/server';
import { getNoteById, toggleBookmark, deleteNote } from '@/lib/services/notes-service';
import { requireUser } from '@/lib/auth/auth-config';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/notes/[id]
 * Get a single note by ID
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    await requireUser(); // Verify user is authenticated
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Note ID is required' },
        { status: 400 }
      );
    }

    const note = await getNoteById(id);

    if (!note) {
      return NextResponse.json(
        { error: 'Note not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      note,
    });
  } catch (error) {
    console.error('[API] Note get error:', error);

    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Please login to view this note' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch note' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/notes/[id]
 * Update note (currently only bookmark toggle)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireUser();
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Note ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { action } = body;

    if (action === 'toggle_bookmark') {
      const isBookmarked = await toggleBookmark(id, user.id);
      return NextResponse.json({
        success: true,
        isBookmarked,
        message: isBookmarked ? 'Note bookmarked' : 'Bookmark removed',
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('[API] Note update error:', error);

    if (error instanceof Error) {
      if (error.message === 'Authentication required') {
        return NextResponse.json(
          { error: 'Please login to update this note' },
          { status: 401 }
        );
      }

      if (error.message === 'Note not found') {
        return NextResponse.json(
          { error: 'Note not found' },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to update note' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/notes/[id]
 * Delete a note
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireUser();
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Note ID is required' },
        { status: 400 }
      );
    }

    await deleteNote(id, user.id);

    return NextResponse.json({
      success: true,
      message: 'Note deleted successfully',
    });
  } catch (error) {
    console.error('[API] Note delete error:', error);

    if (error instanceof Error) {
      if (error.message === 'Authentication required') {
        return NextResponse.json(
          { error: 'Please login to delete this note' },
          { status: 401 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to delete note' },
      { status: 500 }
    );
  }
}