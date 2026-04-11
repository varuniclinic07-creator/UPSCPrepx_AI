import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { hash } from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const { email, password, name, phone } = await request.json();

        if (!email || !password || !name) {
            return NextResponse.json(
                { error: 'Email, password, and name are required' },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        // 1. Check if user already exists
        const { data: existingUser } = await (supabase.from('users') as any)
            .select('id')
            .eq('email', email)
            .single();

        if (existingUser) {
            return NextResponse.json(
                { error: 'User with this email already exists' },
                { status: 400 }
            );
        }

        // 2. Hash password
        const hashedPassword = await hash(password, 12);

        // 3. Create user in database
        const userId = uuidv4();
        const trialDays = 7;
        const trialEndsAt = new Date();
        trialEndsAt.setDate(trialEndsAt.getDate() + trialDays);

        const { error: userError } = await (supabase.from('users') as any).insert({
            id: userId,
            email,
            password_hash: hashedPassword,
            name,
            phone,
            role: 'user',
            is_verified: false,
            trial_ends_at: trialEndsAt.toISOString(),
            points: 0,
            rank: 0,
            created_at: new Date().toISOString()
        });

        if (userError) {
            throw new Error(`Failed to create user: ${userError.message}`);
        }

        // 4. Create initial subscription (free/trial)
        const { error: subError } = await (supabase.from('user_subscriptions') as any).insert({
            user_id: userId,
            plan_id: 'd9e078ba-ec4f-40c4-a634-116035956793', // Free Plan ID
            status: 'trialing',
            current_period_end: trialEndsAt.toISOString()
        });

        if (subError) {
            console.error('Failed to create initial subscription:', subError);
        }

        // 5. Create default preferences
        const { error: prefError } = await (supabase.from('users') as any)
            .update({
                preferences: {
                    notifications: true,
                    darkMode: false,
                    language: 'english'
                }
            })
            .eq('id', userId);

        if (prefError) {
            console.error('Failed to create default preferences:', prefError);
        }

        return NextResponse.json({
            success: true,
            user: {
                id: userId,
                email,
                name,
                phone,
                trialEndsAt: trialEndsAt.toISOString()
            }
        });

    } catch (error: any) {
        console.error('Registration error:', error);
        return NextResponse.json(
            { error: error.message || 'Registration failed' },
            { status: 500 }
        );
    }
}
