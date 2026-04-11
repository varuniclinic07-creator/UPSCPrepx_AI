import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/auth-config';
import { getLeads, updateLead } from '@/lib/admin/admin-service';

export const dynamic = 'force-dynamic';

/**
 * Admin Leads API route
 */

async function requireAdmin() {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
        return null;
    }
    return user;
}

/**
 * GET /api/admin/leads - List leads
 */
export async function GET(request: NextRequest) {
    try {
        const admin = await requireAdmin();
        if (!admin) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const status = searchParams.get('status') || undefined;

        const result = await getLeads({ page, limit, status });

        return NextResponse.json(result);
    } catch (error) {
        console.error('[Admin Leads API] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/admin/leads - Update lead
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
        const { leadId, status, notes } = body;

        if (!leadId) {
            return NextResponse.json(
                { error: 'Lead ID is required' },
                { status: 400 }
            );
        }

        const lead = await updateLead(leadId, { status, notes });

        return NextResponse.json({ lead });
    } catch (error) {
        console.error('[Admin Leads API] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
