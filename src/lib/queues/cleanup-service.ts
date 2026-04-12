// ═══════════════════════════════════════════════════════════════
// QUEUE CLEANUP SERVICE
// Scheduled cleanup of old jobs and temp files
// ═══════════════════════════════════════════════════════════════

import { cleanOldJobs } from './job-monitor';
import { createClient } from '@/lib/supabase/server';
import fs from 'fs/promises';
import path from 'path';

/**
 * Clean old completed jobs (run daily)
 */
export async function cleanupOldJobs() {
    try {
        // Clean jobs older than 7 days
        await cleanOldJobs(7 * 24 * 60 * 60 * 1000);

        console.debug('✅ Old jobs cleaned');
    } catch (error) {
        console.error('Job cleanup error:', error);
    }
}

/**
 * Clean temp files (run daily)
 */
export async function cleanupTempFiles() {
    try {
        const tempDir = path.join(process.cwd(), 'temp', 'lectures');

        const folders = await fs.readdir(tempDir);

        for (const folder of folders) {
            const folderPath = path.join(tempDir, folder);
            const stats = await fs.stat(folderPath);

            // Delete folders older than 2 days
            const twoDaysAgo = Date.now() - (2 * 24 * 60 * 60 * 1000);

            if (stats.mtimeMs < twoDaysAgo) {
                await fs.rm(folderPath, { recursive: true, force: true });
                console.debug(`Deleted temp folder: ${folder}`);
            }
        }

        console.debug('✅ Temp files cleaned');
    } catch (error) {
        console.error('Temp cleanup error:', error);
    }
}

/**
 * Expire old trials (run hourly)
 */
export async function expireTrials() {
    try {
        const supabase = await createClient();
        const { data } = await (supabase as any).rpc('expire_trials');

        console.debug(`✅ Expired ${data?.[0]?.expired_count || 0} trials`);
    } catch (error) {
        console.error('Trial expiry error:', error);
    }
}

/**
 * Run all cleanup tasks
 */
export async function runAllCleanupTasks() {
    console.debug('🧹 Running cleanup tasks...');

    await Promise.all([
        cleanupOldJobs(),
        cleanupTempFiles(),
        expireTrials()
    ]);

    console.debug('✅ All cleanup tasks complete');
}

// Export for cron job
if (require.main === module) {
    runAllCleanupTasks()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error('Cleanup failed:', error);
            process.exit(1);
        });
}
