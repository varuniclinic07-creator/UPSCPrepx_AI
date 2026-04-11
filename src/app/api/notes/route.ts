import { NextRequest, NextResponse } from 'next/server';
import { getUserNotes, searchNotes, getBookmarkedNotes } from '@/lib/services/notes-service';
import { requireUser } from '@/lib/auth/auth-config';

export const dynamic = 'force-dynamic';

/**
 * GET /api/notes
 * Get all notes for the authenticated user
 * Query params: search, bookmarked
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const user = await requireUser();

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const bookmarked = searchParams.get('bookmarked');

    let notes;

    if (search && search.trim().length > 0) {
      // Search notes
      notes = await searchNotes(user.id, search.trim());
    } else if (bookmarked === 'true') {
      // Get bookmarked notes only
      notes = await getBookmarkedNotes(user.id);
    } else {
      // Get all notes
      notes = await getUserNotes(user.id);
    }

    return NextResponse.json({
      success: true,
      notes,
      count: notes.length,
    });
  } catch (error) {
    console.error('[API] Notes list error:', error);

    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Please login to view notes' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch notes' },
      { status: 500 }
    );
  }
}