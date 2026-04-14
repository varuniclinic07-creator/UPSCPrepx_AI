// ═══════════════════════════════════════════════════════════════
// FFMPEG COMPILATION WORKER (TypeScript)
// Compile chapters into final lecture video
// ═══════════════════════════════════════════════════════════════

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';

const execPromise = promisify(exec);

function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

/**
 * Compile all chapters into final video
 */
export async function compileVideo(lectureJobId: string): Promise<string> {
    const supabase = getSupabase();

    try {
        const { data: chapters } = await supabase
            .from('lecture_chapters')
            .select('*')
            .eq('job_id', lectureJobId)
            .order('chapter_number');

        if (!chapters || chapters.length === 0) {
            throw new Error('No chapters found');
        }

        const tempDir = path.join(process.cwd(), 'temp', 'lectures', lectureJobId);
        await fs.mkdir(tempDir, { recursive: true });

        const outputPath = path.join(tempDir, 'final_lecture.mp4');

        // Create concat file for FFmpeg
        const concatList = chapters.map((ch: any) =>
            `file 'chapter_${ch.chapter_number}_segment.mp4'`
        ).join('\n');

        const concatFile = path.join(tempDir, 'concat.txt');
        await fs.writeFile(concatFile, concatList);

        // Create video segment for each chapter
        for (const chapter of chapters) {
            await createChapterVideo(chapter, tempDir);
        }

        // Concatenate all segments
        await execPromise(`ffmpeg -f concat -safe 0 -i "${concatFile}" -c copy "${outputPath}"`);

        // Upload to storage
        const videoUrl = await uploadVideo(outputPath, lectureJobId, supabase);

        // Update database
        await supabase
            .from('lecture_jobs')
            .update({
                status: 'ready',
                video_url: videoUrl,
                progress_percent: 100,
                completed_at: new Date().toISOString()
            })
            .eq('id', lectureJobId);

        // Cleanup temp files
        await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});

        return videoUrl;
    } catch (error) {
        console.error('Video compilation error:', error);

        await supabase
            .from('lecture_jobs')
            .update({ status: 'failed', current_phase: `Compilation error: ${(error as Error).message}` })
            .eq('id', lectureJobId);

        throw error;
    }
}

async function createChapterVideo(chapter: any, tempDir: string) {
    const audioPath = chapter.audio_url;
    const images: string[] = chapter.image_urls || [];
    const outputPath = path.join(tempDir, `chapter_${chapter.chapter_number}_segment.mp4`);

    if (!audioPath) {
        // No audio — create a 10s silent placeholder
        await execPromise(
            `ffmpeg -f lavfi -i color=c=black:s=1920x1080:d=10 -c:v libx264 -pix_fmt yuv420p "${outputPath}"`
        );
        return;
    }

    if (images.length === 0) {
        // Audio only with black screen
        await execPromise(
            `ffmpeg -f lavfi -i color=c=black:s=1920x1080 -i "${audioPath}" -c:v libx264 -tune stillimage -c:a aac -b:a 192k -pix_fmt yuv420p -shortest "${outputPath}"`
        );
    } else {
        // Create slideshow from images with audio
        const duration = (chapter.duration || 10) * 60;
        const durationPerImage = Math.max(duration / images.length, 2);

        const inputList = images.map((img: string) =>
            `file '${img}'\nduration ${durationPerImage}`
        ).join('\n');

        const imageList = path.join(tempDir, `chapter_${chapter.chapter_number}_images.txt`);
        await fs.writeFile(imageList, inputList);

        await execPromise(
            `ffmpeg -f concat -safe 0 -i "${imageList}" -i "${audioPath}" -c:v libx264 -c:a aac -b:a 192k -pix_fmt yuv420p -shortest "${outputPath}"`
        );
    }
}

async function uploadVideo(videoPath: string, lectureJobId: string, supabase: ReturnType<typeof createClient>): Promise<string> {
    const videoBuffer = await fs.readFile(videoPath);
    const fileName = `lectures/${lectureJobId}/final.mp4`;

    const { error } = await supabase.storage
        .from('lectures')
        .upload(fileName, videoBuffer, {
            contentType: 'video/mp4',
            upsert: true,
        });

    if (error) throw new Error(`Upload failed: ${error.message}`);

    const { data: urlData } = supabase.storage
        .from('lectures')
        .getPublicUrl(fileName);

    return urlData.publicUrl;
}
