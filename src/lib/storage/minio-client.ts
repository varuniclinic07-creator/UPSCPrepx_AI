import { Client } from 'minio';
import { withCircuitBreaker } from '@/lib/resilience/circuit-breaker';

// Lazy-initialized MinIO client — never throw at module level
let minioClient: Client | null = null;

function getMinioClient(): Client {
  if (minioClient) return minioClient;

  const endpoint = process.env.MINIO_ENDPOINT;
  const accessKey = process.env.MINIO_ACCESS_KEY;
  const secretKey = process.env.MINIO_SECRET_KEY;

  if (!endpoint || !accessKey || !secretKey) {
    throw new Error(
      'MinIO not configured. Set MINIO_ENDPOINT, MINIO_ACCESS_KEY, and MINIO_SECRET_KEY.'
    );
  }

  minioClient = new Client({
    endPoint: endpoint,
    port: parseInt(process.env.MINIO_PORT || '9000'),
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey,
    secretKey,
  });

  return minioClient;
}

export function isMinioConfigured(): boolean {
  return !!(process.env.MINIO_ENDPOINT && process.env.MINIO_ACCESS_KEY && process.env.MINIO_SECRET_KEY);
}

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

    const client = getMinioClient();
    const exists = await client.bucketExists(bucketName);
    if (!exists) {
      await client.makeBucket(bucketName, 'us-east-1');
    }

    await client.putObject(bucketName, fileName, fileBuffer, fileBuffer.length, {
      'Content-Type': contentType,
    });

    return `http://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}/${bucketName}/${fileName}`;
  });
}

export async function getFileUrl(bucket: keyof typeof BUCKETS, fileName: string): Promise<string> {
  return withCircuitBreaker(async () => {
    const bucketName = BUCKETS[bucket];
    const client = getMinioClient();
    return await client.presignedGetObject(bucketName, fileName, 24 * 60 * 60);
  });
}

export async function deleteFile(bucket: keyof typeof BUCKETS, fileName: string): Promise<void> {
  return withCircuitBreaker(async () => {
    const bucketName = BUCKETS[bucket];
    const client = getMinioClient();
    await client.removeObject(bucketName, fileName);
  });
}

export async function listFiles(bucket: keyof typeof BUCKETS, prefix?: string): Promise<string[]> {
  return withCircuitBreaker(async () => {
    const bucketName = BUCKETS[bucket];
    const client = getMinioClient();
    const stream = client.listObjects(bucketName, prefix, true);
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
