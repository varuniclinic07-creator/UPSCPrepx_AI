// ═══════════════════════════════════════════════════════════════
// MATERIALS UPLOAD API
// /api/materials/upload
// ═══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        // Require admin access
        const admin = await requireAdmin();

        const formData = await request.formData();
        const file = formData.get('file') as File;
        const type = formData.get('type') as string; // 'newspaper' | 'magazine' | 'note' | 'scheme'
        const title = formData.get('title') as string;
        const category = formData.get('category') as string;

        if (!file || !type || !title) {
            return NextResponse.json(
                { error: 'File, type, and title are required' },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        // Upload file to storage
        const fileName = `${type}s/${Date.now()}_${file.name}`;
        const fileBuffer = Buffer.from(await file.arrayBuffer());

        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('materials')
            .upload(fileName, fileBuffer, {
                contentType: file.type,
                upsert: false
            });

        if (uploadError) {
            throw new Error('File upload failed');
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from('materials')
            .getPublicUrl(fileName);

        // Create database record
        const { data: material, error: dbError } = await (supabase.from('materials') as any)
            .insert({
                type,
                title,
                category,
                file_url: urlData.publicUrl,
                file_size: file.size,
                file_type: file.type,
                uploaded_by: admin.id
            })
            .select()
            .single();

        if (dbError) {
            // Cleanup uploaded file
            await supabase.storage.from('materials').remove([fileName]);
            throw new Error(`Database insert failed: ${dbError.message}`);
        }

        return NextResponse.json({
            success: true,
            material: {
                id: (material as any).id,
                title: (material as any).title,
                url: (material as any).file_url,
                type: (material as any).type
            }
        });

    } catch (error: any) {
        console.error('Materials upload error:', error);

        if (error.message === 'Admin access required') {
            return NextResponse.json(
                { error: 'Admin access required' },
                { status: 403 }
            );
        }

        return NextResponse.json(
            { error: error.message || 'Upload failed' },
            { status: 500 }
        );
    }
}

/**
 * GET /api/materials/upload (List materials)
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type');
        const category = searchParams.get('category');

        const supabase = await createClient();

        let query = (supabase.from('materials') as any)
            .select('*')
            .order('created_at', { ascending: false });

        if (type) {
            query = query.eq('type', type);
        }

        if (category) {
            query = query.eq('category', category);
        }

        const { data: materials, error } = await (query as any);

        if (error) {
            throw error;
        }

        return NextResponse.json({ materials });

    } catch (error: any) {
        console.error('Materials list error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch materials' },
            { status: 500 }
        );
    }
}
