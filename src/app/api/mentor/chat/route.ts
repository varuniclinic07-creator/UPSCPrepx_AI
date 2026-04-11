/**
 * Mentor Chat API Route
 * 
 * Master Prompt v8.0 - Feature F10 (READ Mode)
 * - POST /api/mentor/chat - Send message to mentor
 * - GET /api/mentor/chat?session_id= - Get messages
 */

import { NextRequest, NextResponse } from 'next/server';
import { mentorChat } from '@/lib/mentor/chat-service';
import { checkAccess } from '@/lib/auth/check-access';
import { checkRateLimit, RATE_LIMITS } from '@/lib/security/rate-limiter';

export const dynamic = 'force-dynamic';


export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    // Rate limit check
    const rateLimit = await checkRateLimit(userId, RATE_LIMITS.aiChat);
    if (!rateLimit.success) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded', retryAfter: rateLimit.retryAfter },
        { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfter || 60) } }
      );
    }

    // Check entitlement (free: 1 mentor chat/day)
    const access = await checkAccess(userId, 'mentor');
    if (!access.allowed) {
      return NextResponse.json({ success: false, error: access.reason, remaining: access.remaining }, { status: 403 });
    }

    const { session_id, message, topic } = await request.json();
    if (!session_id || !message) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const result = await mentorChat.sendMessage(userId, session_id, message);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Mentor chat error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session_id = request.nextUrl.searchParams.get('session_id');
    if (!session_id) {
      return NextResponse.json({ success: false, error: 'Session ID required' }, { status: 400 });
    }

    const messages = await mentorChat.getMessages(session_id);
    return NextResponse.json({ success: true, data: messages });
  } catch (error) {
    console.error('Mentor chat history error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
