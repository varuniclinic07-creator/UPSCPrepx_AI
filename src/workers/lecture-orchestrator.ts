// ═══════════════════════════════════════════════════════════════
// LECTURE ORCHESTRATOR
// Coordinates all phases of lecture generation
// ═══════════════════════════════════════════════════════════════

import { createClient } from '@/lib/supabase/server';
import { Database } from '@/types/supabase';
import { generateOutline } from '@/lib/lecture-generator/outline-service';
import { generateChapterScript } from '@/lib/lecture-generator/script-service';
import { generateVisuals } from '@/lib/lecture-generator/visual-service';
import { generateLongTTS } from '@/lib/lecture-generator/tts-service';
import { compilationQueue } from '@/lib/queues/lecture-queue';

export async function orchestrateLecture(lectureJobId: string) {
    const supabase = await createClient();

    try {
        // Update status
        await updateJobStatus(lectureJobId, 'outline', 0, 'Generating outline...');

        // Phase 1: Generate outline
        const { data: job } = await supabase
            .from('lecture_jobs')
            .select('*')
            .eq('id', lectureJobId)
            .returns<Database['public']['Tables']['lecture_jobs']['Row']>()
            .single() as any;

        if (!job) throw new Error('Job not found');

        const outline = await generateOutline(job.topic, job.subject_slug, job.target_duration);

        // Save outline
        await (supabase
            .from('lecture_jobs') as any)
            .update({ outline, total_chapters: outline.totalChapters })
            .eq('id', lectureJobId);

        await updateJobProgress(lectureJobId, 10);

        // Phase 2: Generate scripts for all chapters
        await updateJobStatus(lectureJobId, 'scripting', 10, 'Generating scripts...');

        for (let i = 0; i < outline.chapters.length; i++) {
            const chapter = outline.chapters[i];

            const script = await generateChapterScript(
                chapter.number,
                chapter.title,
                chapter.subtopics,
                chapter.keyPoints,
                {
                    topic: job.topic,
                    subject: job.subject_slug
                }
            );

            // Save chapter
            await (supabase.from('lecture_chapters') as any).insert({
                job_id: lectureJobId,
                chapter_number: chapter.number,
                title: chapter.title,
                duration: chapter.duration || 0,
                // Store script and visual prompts in content JSON
                content: {
                    script: script.script,
                    visual_prompts: script.visualCues
                },
                status: 'script_ready'
            });

            const progress = 10 + ((i + 1) / outline.chapters.length) * 30;
            await updateJobProgress(lectureJobId, progress);
        }

        // Phase 3: Generate visuals
        await updateJobStatus(lectureJobId, 'visuals', 40, 'Generating visuals...');

        const { data: chapters } = await supabase
            .from('lecture_chapters') // Ensure strict table name
            .select('*')
            .eq('job_id', lectureJobId)
            .order('chapter_number')
            .returns<Database['public']['Tables']['lecture_chapters']['Row'][]>();

        if (!chapters) throw new Error('No chapters found');

        for (let i = 0; i < chapters.length; i++) {
            const chapter = chapters[i];
            const content = chapter.content as any;
            const visualCues = content?.visual_prompts || [];

            if (visualCues.length > 0) {
                const visuals = await generateVisuals(visualCues);
                const imageUrls = visuals.map((v: any) => v.url);

                await (supabase
                    .from('lecture_chapters') as any)
                    .update({
                        image_urls: imageUrls,
                        status: 'visuals_ready'
                    } as any)
                    .eq('id', chapter.id);
            }

            const progress = 40 + ((i + 1) / chapters.length) * 20;
            await updateJobProgress(lectureJobId, progress);
        }

        // Phase 4: Generate TTS
        await updateJobStatus(lectureJobId, 'audio', 60, 'Generating audio...');

        for (let i = 0; i < chapters.length; i++) {
            const chapter = chapters[i];

            const content = chapter.content as any;
            const script = content?.script || '';

            const audioPaths = await generateLongTTS(
                script,
                chapter.chapter_number,
                lectureJobId
            );

            await (supabase
                .from('lecture_chapters') as any)
                .update({
                    audio_url: audioPaths[0], // First audio file
                    status: 'audio_ready'
                } as any)
                .eq('id', chapter.id);

            const progress = 60 + ((i + 1) / chapters.length) * 20;
            await updateJobProgress(lectureJobId, progress);
        }

        // Phase 5: Queue compilation
        await updateJobStatus(lectureJobId, 'compiling', 80, 'Compiling video...');

        const queue = compilationQueue.get();
        if (queue) {
            await queue.add('compile-lecture', { lectureJobId });
        } else {
            console.warn('[Orchestrator] Compilation queue unavailable — skipping video assembly');
        }

        await updateJobProgress(lectureJobId, 90);

    } catch (error: any) {
        console.error('Orchestration error:', error);
        await updateJobStatus(lectureJobId, 'failed', 0, error.message);
        throw error;
    }
}

async function updateJobStatus(jobId: string, status: string, progress: number, phase: string) {
    const supabase = await createClient();
    await (supabase
        .from('lecture_jobs') as any)
        .update({
            status,
            current_phase: phase,
            progress_percent: progress,
            updated_at: new Date().toISOString()
        } as any)
        .eq('id', jobId);
}

async function updateJobProgress(jobId: string, progress: number) {
    const supabase = await createClient();
    await (supabase
        .from('lecture_jobs') as any)
        .update({
            progress_percent: progress,
            updated_at: new Date().toISOString()
        } as any)
        .eq('id', jobId);
}