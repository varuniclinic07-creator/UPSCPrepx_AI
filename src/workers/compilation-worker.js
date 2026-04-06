// ═══════════════════════════════════════════════════════════════
// FFMPEG COMPILATION WORKER
// Compile chapters into final video
// ═══════════════════════════════════════════════════════════════

const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs/promises');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const execPromise = promisify(exec);

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Compile all chapters into final video
 */
async function compileVideo(lectureJobId) {
    try {
        // Get all chapters
        const { data: chapters } = await supabase
            .from('lecture_chapters')
            .select('*')
            .eq('job_id', lectureJobId)
            .order('chapter_number');

        if (!chapters || chapters.length === 0) {
            throw new Error('No chapters found');
        }

        const tempDir = path.join(process.cwd(), 'temp', 'lectures', lectureJobId);
        const outputPath = path.join(tempDir, 'final_lecture.mp4');

        // Create concat file for FFmpeg
        const concatList = chapters.map((ch, idx) => {
            return `file 'chapter_${ch.chapter_number}_segment.mp4'`;
        }).join('\n');

        const concatFile = path.join(tempDir, 'concat.txt');
        await fs.writeFile(concatFile, concatList);

        // For each chapter, create video segment from audio + images
        for (const chapter of chapters) {
            await createChapterVideo(
                chapter,
                lectureJobId,
                tempDir
            );
        }

        // Concatenate all segments
        const ffmpegCmd = `ffmpeg -f concat -safe 0 -i ${concatFile} -c copy ${outputPath}`;
        await execPromise(ffmpegCmd);

        // Upload to MinIO/Storage
        const videoUrl = await uploadVideo(outputPath, lectureJobId);

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
        await cleanup(tempDir);

        return videoUrl;

    } catch (error) {
        console.error('Video compilation error:', error);
        throw error;
    }
}

/**
 * Create video segment for one chapter
 */
async function createChapterVideo(chapter, lectureJobId, tempDir) {
    const audioPath = chapter.audio_url;
    const images = chapter.image_urls || [];

    const outputPath = path.join(tempDir, `chapter_${chapter.chapter_number}_segment.mp4`);

    if (images.length === 0) {
        // Audio only with blank screen
        const cmd = `ffmpeg -loop 1 -i blank.png -i ${audioPath} -c:v libx264 -tune stillimage -c:a aac -b:a 192k -pix_fmt yuv420p -shortest ${outputPath}`;
        await execPromise(cmd);
    } else {
        // Create slideshow from images
        // Each image shown for (duration / num_images) seconds
        const duration = chapter.duration * 60; // Convert to seconds
        const durationPerImage = duration / images.length;

        // Create input file list
        const inputList = images.map((img, idx) => {
            return `file '${img}'\nduration ${durationPerImage}`;
        }).join('\n');

        const imageList = path.join(tempDir, `chapter_${chapter.chapter_number}_images.txt`);
        await fs.writeFile(imageList, inputList);

        const cmd = `ffmpeg -f concat -safe 0 -i ${imageList} -i ${audioPath} -c:v libx264 -c:a aac -b:a 192k -pix_fmt yuv420p -shortest ${outputPath}`;
        await execPromise(cmd);
    }
}

/**
 * Upload video to storage
 */
async function uploadVideo(videoPath, lectureJobId) {
    // Read video file
    const videoBuffer = await fs.readFile(videoPath);

    // Upload to Supabase storage or MinIO
    const fileName = `lectures/${lectureJobId}/final.mp4`;

    const { data, error } = await supabase.storage
        .from('lectures')
        .upload(fileName, videoBuffer, {
            contentType: 'video/mp4',
            upsert: true
        });

    if (error) {
        throw new Error(`Upload failed: ${error.message}`);
    }

    const { data: urlData } = supabase.storage
        .from('lectures')
        .getPublicUrl(fileName);

    return urlData.publicUrl;
}

/**
 * Cleanup temporary files
 */
async function cleanup(tempDir) {
    try {
        await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
        console.error('Cleanup error:', error);
    }
}

module.exports = { compileVideo };
