// ═══════════════════════════════════════════════════════════════════════════
// MATERIALS LIBRARY API - Upload and manage static study materials
// ═══════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { uploadToMinIO } from '@/lib/storage/minio';
import {
    requireAdmin,
    withRateLimit,
    validateRequest,
    schemas,
    RATE_LIMITS,
} from '@/lib/security';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/admin/materials - List all materials (Admin Only)
// ═══════════════════════════════════════════════════════════════════════════

export async function GET(req: NextRequest) {
    // Rate limit check
    return withRateLimit(req, RATE_LIMITS.admin, async () => {
        // Admin authorization check
        const authResult = await requireAdmin(req);
        if (authResult instanceof NextResponse) {
            return authResult;
        }

        try {
            const supabase = await createClient();

            // Validate query params
            const { searchParams } = new URL(req.url);
            const validation = validateRequest(schemas.filter, {
                subject: searchParams.get('subject'),
                category: searchParams.get('category'),
                status: searchParams.get('processed'),
            });

            if (!validation.success) {
                return validation.error;
            }

            // Build query
            let query = (supabase as any)
                .from('static_materials')
                .select('*')
                .order('created_at', { ascending: false });

            if (validation.data.subject) query = query.eq('subject', validation.data.subject);
            if (validation.data.category) query = query.eq('category', validation.data.category);
            if (validation.data.status !== undefined) query = query.eq('is_processed', validation.data.status === 'true');

            const { data, error } = await query;

            if (error) throw error;

            return NextResponse.json({
                materials: data || [],
                total: data?.length || 0,
            });
        } catch (error) {
            console.error('[Materials] List error:', error);
            return NextResponse.json(
                { error: 'Failed to fetch materials' },
                { status: 500 }
            );
        }
    });
}


// ═══════════════════════════════════════════════════════════════════════════
// POST /api/admin/materials - Upload new material
// ═══════════════════════════════════════════════════════════════════════════

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();

        // Check admin permission
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get('file') as File;
        const name = formData.get('name') as string;
        const subject = formData.get('subject') as string;
        const category = formData.get('category') as string;
        const tags = JSON.parse((formData.get('tags') as string) || '[]');
        const isStandard = formData.get('isStandard') === 'true';

        if (!file || !name || !subject) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Upload to MinIO
        const fileBuffer = await file.arrayBuffer();
        const fileUrl = await uploadToMinIO(
            Buffer.from(fileBuffer),
            file.name,
            'upsc-materials'
        );

        // Save to database
        const insertData = {
            name,
            file_name: file.name,
            file_type: file.type.split('/')[1] || 'pdf',
            file_size: file.size,
            file_url: fileUrl,
            subject,
            category,
            tags,
            is_standard: isStandard,
            uploaded_by: user.id,
        };
        
        const { data, error } = await (supabase as any)
            .from('static_materials')
            .insert(insertData)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({
            material: data,
            message: 'Material uploaded successfully',
        }, { status: 201 });
    } catch (error) {
        console.error('Material upload error:', error);
        return NextResponse.json(
            { error: 'Failed to upload material' },
            { status: 500 }
        );
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// DELETE /api/admin/materials/:id - Delete material
// ═══════════════════════════════════════════════════════════════════════════

export async function DELETE(req: NextRequest) {
    try {
        const supabase = await createClient();

        // Check admin permission
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get material ID from query params
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        if (!id) {
            return NextResponse.json({ error: 'Missing material ID' }, { status: 400 });
        }

        // Delete from database (cascades to chunks)
        const { error } = await (supabase as any)
            .from('static_materials')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({
            message: 'Material deleted successfully',
        });
    } catch (error) {
        console.error('Material delete error:', error);
        return NextResponse.json(
            { error: 'Failed to delete material' },
            { status: 500 }
        );
    }
}