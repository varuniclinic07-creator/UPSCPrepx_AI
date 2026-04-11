import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/auth-config';
import { getAIProviders, updateAIProvider } from '@/lib/admin/admin-service';

export const dynamic = 'force-dynamic';

/**
 * Admin AI Providers API route
 */

async function requireAdmin() {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
        return null;
    }
    return user;
}

/**
 * GET /api/admin/ai-providers - List AI providers
 */
export async function GET() {
    try {
        const admin = await requireAdmin();
        if (!admin) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const providers = await getAIProviders();

        return NextResponse.json({ providers });
    } catch (error) {
        console.error('[Admin AI Providers API] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/admin/ai-providers - Update provider
 */
export async function PATCH(request: NextRequest) {
    try {
        const admin = await requireAdmin();
        if (!admin) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { providerId, isActive, isDefault, rateLimitRpm } = body;

        if (!providerId) {
            return NextResponse.json(
                { error: 'Provider ID is required' },
                { status: 400 }
            );
        }

        const provider = await updateAIProvider(providerId, {
            isActive,
            isDefault,
            rateLimitRpm,
        });

        return NextResponse.json({ provider });
    } catch (error) {
        console.error('[Admin AI Providers API] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
