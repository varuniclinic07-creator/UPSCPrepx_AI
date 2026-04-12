import { z } from 'zod';

const envSchema = z.object({
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  // Redis
  REDIS_URL: z.string().optional(),

  // AI Providers — 9Router (primary), accepts multiple env var naming conventions
  NINE_ROUTER_API_KEY: z.string().optional(),
  NINE_ROUTER_BASE_URL: z.string().optional(),
  GROQ_API_KEY: z.string().optional(),
  GROQ_BASE_URL: z.string().optional(),
  OLLAMA_API_KEY: z.string().optional(),
  OLLAMA_BASE_URL: z.string().optional(),

  // Payments
  RAZORPAY_KEY_ID: z.string().min(1),
  RAZORPAY_KEY_SECRET: z.string().min(1),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),

  // Server
  SERVER_IP: z.string().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url(),

  // Email (SMTP from env.production)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM: z.string().optional(),

  // Optional services
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  CRON_SECRET: z.string().optional(),
  ENCRYPTION_KEY: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | null = null;

export function validateEnv(): Env {
  if (cachedEnv) return cachedEnv;

  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('❌ Invalid environment variables:');
    console.error(JSON.stringify(result.error.format(), null, 2));
    // In production, log but don't crash — allow graceful degradation
    if (process.env.NODE_ENV === 'production') {
      console.error('⚠️ App starting with missing env vars — some features may be unavailable');
      cachedEnv = result.data as Env;
      return cachedEnv;
    }
    throw new Error('Invalid environment variables - check console for details');
  }

  cachedEnv = result.data;
  return result.data;
}

// Helper: get 9Router key with fallback naming
export function getNineRouterKey(): string {
  return process.env.NINE_ROUTER_API_KEY || process.env['9ROUTER_API_KEY'] || process.env.ROUTER9_API_KEY || '';
}

export function getNineRouterUrl(): string {
  return process.env.NINE_ROUTER_BASE_URL || process.env['9ROUTER_BASE_URL'] || process.env.ROUTER9_BASE_URL || 'https://r94p885.9router.com/v1';
}

// Helper: get Supabase Edge Function URL (derived from Supabase URL)
export function getEdgeFunctionUrl(): string {
  return process.env.SUPABASE_EDGE_FUNCTION_URL || `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1`;
}
