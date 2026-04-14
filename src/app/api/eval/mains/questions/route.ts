/**
 * GET /api/eval/mains/questions
 *
 * Fetch practice questions from the mains_questions table.
 * Supports optional subject filter via ?subject=GS1 etc.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { session }, error: authError } = await supabase.auth.getSession();

    if (authError || !session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const subject = searchParams.get('subject');

    let query = supabase
      .from('mains_questions')
      .select('id, question_text, question_text_hi, subject, topic, marks, word_limit, time_limit_min, is_pyq, year, difficulty, tags')
      .order('subject')
      .order('year', { ascending: false, nullsFirst: false })
      .limit(100);

    if (subject && ['GS1', 'GS2', 'GS3', 'GS4', 'Essay'].includes(subject)) {
      query = query.eq('subject', subject as any);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching questions:', error);
      return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      questions: data || [],
      total: data?.length || 0,
    });
  } catch (error) {
    console.error('Error in questions route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
