/**
 * Due Bookmarks API Route
 * 
 * Master Prompt v8.0 - Feature F14 (READ Mode)
 * - GET /api/bookmarks/due
 * - Fetches bookmarks scheduled for today's review
 */

import { NextRequest, NextResponse } from 'next/server';
import { srsService } from '@/lib/bookmarks/srs-service';

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const bookmarks = await srsService.getDueBookmarks(userId);
    return NextResponse.json({ data: bookmarks });
  } catch (error) {    console.error('Due Bookmarks API Error:', error);    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });  }}