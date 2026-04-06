import { Client } from 'minio';
import { withCircuitBreaker } from '@/lib/resilience/circuit-breaker';

// Validate required environment variables
if (!process.env.MINIO_ENDPOINT) {
  throw new Error('MINIO_ENDPOINT environment variable is required');
}
if (!process.env.MINIO_ACCESS_KEY) {
  throw new Error('MINIO_ACCESS_KEY environment variable is required');
}
if (!process.env.MINIO_SECRET_KEY) {
  throw new Error('MINIO_SECRET_KEY environment variable is required');
}

const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT!,
  port: parseInt(process.env.MINIO_PORT || '9000'),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY!,
  secretKey: process.env.MINIO_SECRET_KEY!,
});

const BUCKETS = {
  MATERIALS: 'materials',
  VIDEOS: 'videos',
  PDFS: 'pdfs',
  IMAGES: 'images',
} as const;

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

    return `http://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}/${bucketName}/${fileName}`;
  });
}

export async function getFileUrl(bucket: keyof typeof BUCKETS, fileName: string): Promise<string> {
  return withCircuitBreaker(async () => {
    const bucketName = BUCKETS[bucket];
    return await minioClient.presignedGetObject(bucketName, fileName, 24 * 60 * 60);
  });
}

export async function deleteFile(bucket: keyof typeof BUCKETS, fileName: string): Promise<void> {
  return withCircuitBreaker(async () => {
    const bucketName = BUCKETS[bucket];
    await minioClient.removeObject(bucketName, fileName);
  });
}

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
