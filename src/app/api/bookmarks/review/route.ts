/**
 * Bookmarks Review API Route
 * 
 * Master Prompt v8.0 - Feature F14 (READ Mode)
 * - POST /api/bookmarks/review
 * - Updates Spaced Repetition (SRS) state
 */

import { NextRequest, NextResponse } from 'next/server';
import { srsService } from '@/lib/bookmarks/srs-service';

export async function POST(request: NextRequest) {
  try {
    const { bookmarkId, quality } = await request.json(); // quality: 0-5

    if (!bookmarkId || quality === undefined) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    await srsService.submitReview(bookmarkId, quality);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Review API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}