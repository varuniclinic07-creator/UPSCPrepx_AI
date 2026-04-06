import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireSession } from '@/lib/auth/session';

// GET /api/planner - Get user's study plans and today's tasks
export async function GET() {
    try {
        const session = await requireSession();
        const supabase = await createClient();

        // Fetch user's study plans
        const { data: plans, error: plansError } = await (supabase.from('study_plans') as any)
            .select('*')
            .eq('user_id', (session as any).user.id)
            .order('created_at', { ascending: false });

        if (plansError) throw plansError;

        // Fetch today's study sessions
        const today = new Date().toISOString().split('T')[0];
        const { data: sessions, error: sessionsError } = await (supabase.from('study_sessions') as any)
            .select('*')
            .eq('user_id', (session as any).user.id)
            .gte('scheduled_date', today)
            .lt('scheduled_date', today + 'T23:59:59')
            .order('scheduled_time', { ascending: true });

        if (sessionsError) throw sessionsError;

        // Calculate stats
        const completedSessions = sessions?.filter((s: any) => s.is_completed) || [];
        const totalMinutes = sessions?.reduce((acc: number, s: any) => acc + (s.duration_minutes || 0), 0) || 0;
        const completedMinutes = completedSessions.reduce((acc: number, s: any) => acc + (s.duration_minutes || 0), 0);

        const stats = {
            totalHoursToday: Math.round(totalMinutes / 60 * 10) / 10,
            completedHours: Math.round(completedMinutes / 60 * 10) / 10,
            streak: 0, // Would need more complex logic to calculate
            weeklyProgress: sessions?.length ? Math.round((completedSessions.length / sessions.length) * 100) : 0,
        };

        // Transform sessions to tasks format
        const todayTasks = sessions?.map((sess: any) => ({
            id: sess.id,
            subject: sess.subject || 'General',
            topic: sess.topic || 'Study Session',
            duration_minutes: sess.duration_minutes || 60,
            is_completed: sess.is_completed || false,
            scheduled_time: sess.scheduled_time || '09:00',
        })) || [];

        return NextResponse.json({
            plans: plans || [],
            todayTasks,
            stats,
        });
    } catch (error: any) {
        console.error('Error fetching planner data:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch planner data' },
            { status: error.message === 'Unauthorized' ? 401 : 500 }
        );
    }
}

// POST /api/planner - Create a new study plan
export async function POST(request: NextRequest) {
    try {
        const session = await requireSession();
        const supabase = await createClient();
        const body = await request.json();

        const { name, exam_date, daily_hours, subjects } = body;

        if (!name?.trim()) {
            return NextResponse.json({ error: 'Plan name is required' }, { status: 400 });
        }

        if (!subjects?.length) {
            return NextResponse.json({ error: 'At least one subject is required' }, { status: 400 });
        }

        // Create the study plan
        const { data: plan, error: planError } = await (supabase.from('study_plans') as any)
            .insert({
                user_id: (session as any).user.id,
                plan_name: name.trim(),
                exam_date: exam_date || null,
                daily_hours: daily_hours || 6,
                subjects: subjects,
                is_active: true,
                completion_percent: 0,
            })
            .select()
            .single();

        if (planError) throw planError;

        // Generate initial study sessions for the next 7 days
        const sessions = [];
        const hoursPerSubject = daily_hours / subjects.length;

        for (let day = 0; day < 7; day++) {
            const date = new Date();
            date.setDate(date.getDate() + day);
            const dateStr = date.toISOString().split('T')[0];

            let hour = 9; // Start at 9 AM

            for (const subject of subjects) {
                sessions.push({
                    user_id: (session as any).user.id,
                    plan_id: plan.id,
                    subject: subject,
                    topic: `${subject.charAt(0).toUpperCase() + subject.slice(1)} - Day ${day + 1}`,
                    scheduled_date: dateStr,
                    scheduled_time: `${hour.toString().padStart(2, '0')}:00`,
                    duration_minutes: Math.round(hoursPerSubject * 60),
                    is_completed: false,
                });
                hour += Math.ceil(hoursPerSubject);
            }
        }

        if (sessions.length > 0) {
            await (supabase.from('study_sessions') as any).insert(sessions);
        }

        return NextResponse.json(plan);
    } catch (error: any) {
        console.error('Error creating study plan:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to create study plan' },
            { status: error.message === 'Unauthorized' ? 401 : 500 }
        );
    }
}
