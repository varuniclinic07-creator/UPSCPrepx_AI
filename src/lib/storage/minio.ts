// MinIO Storage Module - Re-exports from minio-client
// This file provides the expected import path: @/lib/storage/minio

import { Client } from 'minio';
import { withCircuitBreaker } from '@/lib/resilience/circuit-breaker';

const minioClient = new Client({
    endPoint: process.env.MINIO_ENDPOINT || 'localhost',
    port: parseInt(process.env.MINIO_PORT || '9000'),
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
    secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
});

const BUCKETS = {
    MATERIALS: 'materials',
    VIDEOS: 'videos',
    PDFS: 'pdfs',
    IMAGES: 'images',
} as const;

/**
 * Upload a file to MinIO storage
 */
export async function uploadToMinIO(
    fileBuffer: Buffer,
    fileName: string,
    bucket: string = 'materials'
): Promise<string> {
    return withCircuitBreaker(async () => {
        const exists = await minioClient.bucketExists(bucket);
        if (!exists) {
            await minioClient.makeBucket(bucket, 'us-east-1');
        }

        await minioClient.putObject(bucket, fileName, fileBuffer, fileBuffer.length);

        const endpoint = process.env.MINIO_ENDPOINT || 'localhost';
        const port = process.env.MINIO_PORT || '9000';
        const protocol = process.env.MINIO_USE_SSL === 'true' ? 'https' : 'http';

        return `${protocol}://${endpoint}:${port}/${bucket}/${fileName}`;
    });
}

/**
 * Upload a file with content type
 */
export async function uploadFile(
    bucket: keyof typeof BUCKETS,
    fileName: string,
    fileBuffer: Buffer,
    contentType: string
): Promise<string> {
    return withCircuitBreaker(async () => {
        const bucketName = BUCKETS[bucket];

        const exists = await minioClient.bucketExists(bucketName);
        if (!exists) {
            await minioClient.makeBucket(bucketName, 'us-east-1');
        }

        await minioClient.putObject(bucketName, fileName, fileBuffer, fileBuffer.length, {
            'Content-Type': contentType,
        });

        const endpoint = process.env.MINIO_ENDPOINT || 'localhost';
        const port = process.env.MINIO_PORT || '9000';
        const protocol = process.env.MINIO_USE_SSL === 'true' ? 'https' : 'http';

        return `${protocol}://${endpoint}:${port}/${bucketName}/${fileName}`;
    });
}

/**
 * Get a presigned URL for file download
 */
export async function getFileUrl(bucket: keyof typeof BUCKETS, fileName: string): Promise<string> {
    return withCircuitBreaker(async () => {
        const bucketName = BUCKETS[bucket];
        return await minioClient.presignedGetObject(bucketName, fileName, 24 * 60 * 60);
    });
}

/**
 * Delete a file from storage
 */
export async function deleteFile(bucket: keyof typeof BUCKETS, fileName: string): Promise<void> {
    return withCircuitBreaker(async () => {
        const bucketName = BUCKETS[bucket];
        await minioClient.removeObject(bucketName, fileName);
    });
}

/**
 * List files in a bucket
 */
export async function listFiles(bucket: keyof typeof BUCKETS, prefix?: string): Promise<string[]> {
    return withCircuitBreaker(async () => {
        const bucketName = BUCKETS[bucket];
        const stream = minioClient.listObjects(bucketName, prefix, true);
        const files: string[] = [];

        return new Promise((resolve, reject) => {
            stream.on('data', (obj) => {
                if (obj.name) files.push(obj.name);
            });
            stream.on('end', () => resolve(files));
            stream.on('error', reject);
        });
    });
}

export { minioClient, BUCKETS };
