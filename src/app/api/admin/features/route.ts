import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/auth-config';
import { getFeatures, updateFeature } from '@/lib/admin/admin-service';

/**
 * Admin Features API route
 */

async function requireAdmin() {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
        return null;
    }
    return user;
}

/**
 * GET /api/admin/features - List features
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

        const features = await getFeatures();

        return NextResponse.json({ features });
    } catch (error) {
        console.error('[Admin Features API] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/admin/features - Update feature
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
        const { featureId, isEnabled, isVisible, minTier } = body;

        if (!featureId) {
            return NextResponse.json(
                { error: 'Feature ID is required' },
                { status: 400 }
            );
        }

        const feature = await updateFeature(featureId, {
            isEnabled,
            isVisible,
            minTier,
        });

        return NextResponse.json({ feature });
    } catch (error) {
        console.error('[Admin Features API] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
