import { z } from 'zod';

const envSchema = z.object({
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  
  // Redis
  REDIS_URL: z.string().url(),
  
  // AI
  A4F_API_KEY: z.string().min(1),
  A4F_BASE_URL: z.string().url().optional(),
  
  // Payments
  RAZORPAY_KEY_ID: z.string().min(1),
  RAZORPAY_KEY_SECRET: z.string().min(1),
  RAZORPAY_WEBHOOK_SECRET: z.string().min(1),
  
  // Server
  SERVER_IP: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  
  // Optional
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | null = null;

export function validateEnv(): Env {
  if (cachedEnv) return cachedEnv;

  const result = envSchema.safeParse(process.env);
  
  if (!result.success) {
    console.error('❌ Invalid environment variables:');
    console.error(JSON.stringify(result.error.format(), null, 2));
    throw new Error('Invalid environment variables - check console for details');
  }
  
  cachedEnv = result.data;
  return result.data;
}

// Validate on module load in production
if (process.env.NODE_ENV === 'production') {
  validateEnv();
}
