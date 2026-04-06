# 🔒 UPSC CSE MASTER - PHASE 2: BACKEND APIS
## Using wshobson/agents | Sonnet Tier | typescript-pro + nextjs-developer

---

# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║  📋 PHASE 2 ENTRY PROMPT - COPY TO CLINE                                     ║
# ╚══════════════════════════════════════════════════════════════════════════════╝

```
# UPSC CSE MASTER - PHASE 2: BACKEND APIS

## PREREQUISITE
Verify .build-state/phase1-complete.json exists with status="complete"
If NOT complete, STOP and finish Phase 1 first.

## METHODOLOGY
Using wshobson/agents multi-agent orchestration with Sonnet tier agents.

## ACTIVE PLUGINS
- javascript-typescript (typescript-pro, javascript-pro)
- backend-development (backend-architect - for review only)
- unit-testing (test-automator)

## ACTIVE AGENTS (SONNET TIER - Development)
1. typescript-pro - TypeScript development with strict types
2. nextjs-developer - Next.js API routes and server components
3. test-automator - Generate unit tests (support)

## ACTIVATED SKILLS
- advanced-typescript-patterns
- nodejs-patterns
- api-design-principles
- testing-javascript

## ORCHESTRATION PATTERN
```
typescript-pro (implement services)
        ↓
nextjs-developer (create API routes)
        ↓
test-automator (generate tests)
        ↓
Update .build-state/orchestration.json
```

## CREDENTIALS (EXACT - DO NOT CHANGE)
```env
NEXT_PUBLIC_SUPABASE_URL=https://emotqkukvfwjycvwfvyj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU
A4F_API_KEY=ddc-a4f-58e04f695d7748c78c49d3ba1fdb9621
A4F_BASE_URL=https://api.a4f.co/v1
```

## CONTEXT LIMIT
Stay under 40K tokens. Save checkpoint after Phase 2 complete.

## IRON RULES
1. Create EVERY file completely - NO placeholders
2. Implement proper error handling (try-catch on ALL async)
3. Add TypeScript types for ALL functions
4. Implement rate limiting for A4F API (10 RPM!)
5. Use Supabase Cloud patterns
6. Update .build-state after EACH file

## FILES TO CREATE (25 files)
Create in EXACT order below.

START NOW. Activate typescript-pro agent.

/backend-development:feature-development "UPSC notes, quiz, current affairs APIs"
```

---

# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║  📁 FILE 1: src/lib/supabase/client.ts                                       ║
# ╚══════════════════════════════════════════════════════════════════════════════╝

```typescript
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/supabase';

/**
 * Create Supabase client for browser/client components
 * Uses environment variables for configuration
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Singleton instance for client-side
let clientInstance: ReturnType<typeof createClient> | null = null;

/**
 * Get singleton Supabase client for client-side use
 * Prevents multiple client instances
 */
export function getSupabaseClient() {
  if (typeof window === 'undefined') {
    throw new Error('getSupabaseClient should only be called on the client side');
  }
  
  if (!clientInstance) {
    clientInstance = createClient();
  }
  
  return clientInstance;
}
```

---

# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║  📁 FILE 2: src/lib/supabase/server.ts                                       ║
# ╚══════════════════════════════════════════════════════════════════════════════╝

```typescript
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/supabase';

/**
 * Create Supabase client for server components and API routes
 * Handles cookie management for auth session
 */
export async function createServerSupabaseClient() {
  const cookieStore = cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // Handle cookie errors in Server Components
            // This can happen when streaming responses
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // Handle cookie errors in Server Components
          }
        },
      },
    }
  );
}

/**
 * Create admin Supabase client with service role key
 * ONLY use for admin operations - bypasses RLS
 */
export async function createAdminSupabaseClient() {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        get() { return undefined; },
        set() {},
        remove() {},
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
```

---

# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║  📁 FILE 3: src/lib/supabase/middleware.ts                                   ║
# ╚══════════════════════════════════════════════════════════════════════════════╝

```typescript
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Update Supabase auth session in middleware
 * Must be called on every request to refresh tokens
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  // Refresh session if exists - IMPORTANT for auth to work
  const { data: { user } } = await supabase.auth.getUser();

  return { response, user };
}
```

---

# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║  📁 FILE 4: src/middleware.ts                                                ║
# ╚══════════════════════════════════════════════════════════════════════════════╝

```typescript
import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

// Routes that require authentication
const protectedRoutes = ['/dashboard', '/notes', '/quiz', '/video', '/profile', '/current-affairs'];
const adminRoutes = ['/admin'];
const authRoutes = ['/login', '/register', '/forgot-password'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Update Supabase session
  const { response, user } = await updateSession(request);

  // Check route type
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));
  const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // Redirect unauthenticated users from protected routes
  if ((isProtectedRoute || isAdminRoute) && !user) {
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Redirect authenticated users from auth routes to dashboard
  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // TODO: Add admin role check for admin routes
  // This would require fetching user role from database

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api/health (health check endpoint)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api/health).*)',
  ],
};
```

---

# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║  📁 FILE 5: src/lib/ai/a4f-client.ts                                         ║
# ╚══════════════════════════════════════════════════════════════════════════════╝

```typescript
import OpenAI from 'openai';

// A4F API Configuration
const A4F_API_KEY = process.env.A4F_API_KEY!;
const A4F_BASE_URL = process.env.A4F_BASE_URL || 'https://api.a4f.co/v1';

/**
 * Create OpenAI-compatible client for A4F API
 */
export const a4fClient = new OpenAI({
  apiKey: A4F_API_KEY,
  baseURL: A4F_BASE_URL,
});

/**
 * Available models on A4F platform
 * IMPORTANT: Respect 10 RPM rate limit!
 */
export const A4F_MODELS = {
  // Fast models - for quick responses
  GROK_FAST: 'provider-3/grok-4.1-fast',
  GEMINI_FLASH: 'provider-1/gemini-2.5-flash-preview-05-20',

  // Thinking/reasoning models - for complex tasks
  KIMI_THINKING: 'provider-2/kimi-k2-thinking-tee',
  GEMINI_THINKING: 'provider-1/gemini-2.5-flash-preview-04-17-thinking',

  // Research models - for comprehensive research
  SONAR_REASONING: 'provider-3/sonar-reasoning-pro',
  SONAR_PRO: 'provider-3/sonar-pro',

  // Embedding models
  QWEN_EMBEDDING: 'provider-5/qwen3-embedding-8b',

  // Image generation
  FLUX_SCHNELL: 'provider-3/FLUX.1-schnell',
  FLUX_DEV: 'provider-3/FLUX.1-dev',

  // Text-to-speech
  GEMINI_TTS: 'provider-3/gemini-2.5-flash-preview-tts',

  // Video generation
  WAN_VIDEO: 'provider-6/wan-2.1',
} as const;

export type A4FModel = (typeof A4F_MODELS)[keyof typeof A4F_MODELS];

/**
 * Model selection based on task type
 */
export function selectModel(
  task: 'fast' | 'thinking' | 'research' | 'embedding' | 'image'
): A4FModel {
  switch (task) {
    case 'fast':
      return A4F_MODELS.GROK_FAST;
    case 'thinking':
      return A4F_MODELS.KIMI_THINKING;
    case 'research':
      return A4F_MODELS.SONAR_REASONING;
    case 'embedding':
      return A4F_MODELS.QWEN_EMBEDDING;
    case 'image':
      return A4F_MODELS.FLUX_SCHNELL;
    default:
      return A4F_MODELS.GROK_FAST;
  }
}

/**
 * Model info for display
 */
export const MODEL_INFO: Record<string, { name: string; description: string }> = {
  [A4F_MODELS.GROK_FAST]: {
    name: 'Grok Fast',
    description: 'Quick responses for simple tasks',
  },
  [A4F_MODELS.KIMI_THINKING]: {
    name: 'Kimi Thinking',
    description: 'Deep reasoning for complex problems',
  },
  [A4F_MODELS.SONAR_REASONING]: {
    name: 'Sonar Research',
    description: 'Web-grounded research and analysis',
  },
  [A4F_MODELS.FLUX_SCHNELL]: {
    name: 'FLUX Image',
    description: 'Fast image generation',
  },
};
```

---

# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║  📁 FILE 6: src/lib/ai/rate-limiter.ts                                       ║
# ╚══════════════════════════════════════════════════════════════════════════════╝

```typescript
/**
 * Rate limiter for A4F API
 * CRITICAL: A4F has 10 RPM (requests per minute) limit
 * Exceeding this will cause API errors
 */

// Configuration
const RATE_LIMIT = 10; // 10 requests per minute
const WINDOW_MS = 60 * 1000; // 1 minute window

// In-memory store for rate limiting
// In production, use Redis for multi-instance support
interface RateLimitState {
  requests: number[];
  lastCleanup: number;
}

const rateLimitStore = new Map<string, RateLimitState>();

/**
 * Clean old requests from the window
 */
function cleanOldRequests(state: RateLimitState, now: number): void {
  state.requests = state.requests.filter((time) => now - time < WINDOW_MS);
  state.lastCleanup = now;
}

/**
 * Check if request is allowed under rate limit
 * @param userId - User ID or 'global' for system-wide limit
 * @returns Object with allowed status and remaining info
 */
export async function checkRateLimit(userId: string = 'global'): Promise<{
  allowed: boolean;
  remaining: number;
  resetIn: number;
  retryAfter?: number;
}> {
  const now = Date.now();
  let state = rateLimitStore.get(userId);

  // Initialize state if not exists
  if (!state) {
    state = { requests: [], lastCleanup: now };
    rateLimitStore.set(userId, state);
  }

  // Clean old requests
  cleanOldRequests(state, now);

  const currentCount = state.requests.length;
  const remaining = Math.max(0, RATE_LIMIT - currentCount);
  const oldestRequest = state.requests[0] || now;
  const resetIn = Math.max(0, WINDOW_MS - (now - oldestRequest));

  // Check if over limit
  if (currentCount >= RATE_LIMIT) {
    return {
      allowed: false,
      remaining: 0,
      resetIn,
      retryAfter: resetIn,
    };
  }

  // Record this request
  state.requests.push(now);

  return {
    allowed: true,
    remaining: remaining - 1,
    resetIn,
  };
}

/**
 * Wait for rate limit to reset if needed
 * Use this before making API calls
 */
export async function waitForRateLimit(userId: string = 'global'): Promise<void> {
  const result = await checkRateLimit(userId);

  if (!result.allowed && result.retryAfter) {
    console.log(`[Rate Limiter] Waiting ${result.retryAfter}ms for rate limit reset...`);
    await new Promise((resolve) => setTimeout(resolve, result.retryAfter! + 100));
    // Retry after waiting
    return waitForRateLimit(userId);
  }
}

/**
 * Get rate limit headers for API responses
 */
export function getRateLimitHeaders(userId: string = 'global'): Record<string, string> {
  const state = rateLimitStore.get(userId);
  const remaining = state ? Math.max(0, RATE_LIMIT - state.requests.length) : RATE_LIMIT;
  const reset = Date.now() + WINDOW_MS;

  return {
    'X-RateLimit-Limit': String(RATE_LIMIT),
    'X-RateLimit-Remaining': String(remaining),
    'X-RateLimit-Reset': String(reset),
  };
}

/**
 * Get current rate limit status (for debugging/monitoring)
 */
export function getRateLimitStatus(userId: string = 'global'): {
  limit: number;
  used: number;
  remaining: number;
} {
  const state = rateLimitStore.get(userId);
  const now = Date.now();

  if (state) {
    cleanOldRequests(state, now);
  }

  const used = state?.requests.length || 0;

  return {
    limit: RATE_LIMIT,
    used,
    remaining: Math.max(0, RATE_LIMIT - used),
  };
}
```

---

# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║  📁 FILE 7: src/lib/ai/generate.ts                                           ║
# ╚══════════════════════════════════════════════════════════════════════════════╝

```typescript
import { a4fClient, A4F_MODELS, type A4FModel } from './a4f-client';
import { waitForRateLimit, checkRateLimit } from './rate-limiter';

export interface GenerateOptions {
  model?: A4FModel;
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
  userId?: string;
}

/**
 * Generate text using A4F API
 * Automatically handles rate limiting
 */
export async function generateText(
  prompt: string,
  options: GenerateOptions = {}
): Promise<string> {
  const {
    model = A4F_MODELS.GROK_FAST,
    maxTokens = 2000,
    temperature = 0.7,
    systemPrompt = 'You are a helpful UPSC exam preparation assistant. Write in simple, clear language that is easy to understand.',
    userId = 'global',
  } = options;

  // Wait for rate limit
  await waitForRateLimit(userId);

  try {
    const response = await a4fClient.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      max_tokens: maxTokens,
      temperature,
    });

    return response.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('[AI Generate] Error:', error);
    
    // Check if rate limit error
    if (error instanceof Error && error.message.includes('rate')) {
      throw new Error('AI service rate limit exceeded. Please try again in a minute.');
    }
    
    throw new Error('Failed to generate content. Please try again.');
  }
}

/**
 * Generate text with thinking/reasoning model
 * Use for complex tasks that require deep analysis
 */
export async function generateWithThinking(
  prompt: string,
  options: Omit<GenerateOptions, 'model'> = {}
): Promise<string> {
  return generateText(prompt, {
    ...options,
    model: A4F_MODELS.KIMI_THINKING,
    maxTokens: options.maxTokens || 4000,
    temperature: options.temperature || 0.3,
  });
}

/**
 * Generate text with research model
 * Use for tasks requiring web-grounded information
 */
export async function generateWithResearch(
  prompt: string,
  options: Omit<GenerateOptions, 'model'> = {}
): Promise<string> {
  return generateText(prompt, {
    ...options,
    model: A4F_MODELS.SONAR_REASONING,
    maxTokens: options.maxTokens || 3000,
  });
}

/**
 * Generate image using A4F API
 */
export async function generateImage(
  prompt: string,
  userId: string = 'global'
): Promise<string> {
  await waitForRateLimit(userId);

  try {
    const response = await a4fClient.images.generate({
      model: A4F_MODELS.FLUX_SCHNELL,
      prompt,
      n: 1,
      size: '1024x1024',
    });

    return response.data[0]?.url || '';
  } catch (error) {
    console.error('[AI Image] Error:', error);
    throw new Error('Failed to generate image. Please try again.');
  }
}

/**
 * Stream text generation
 * Use for real-time display of AI responses
 */
export async function streamText(
  prompt: string,
  onChunk: (chunk: string) => void,
  options: GenerateOptions = {}
): Promise<void> {
  const {
    model = A4F_MODELS.GROK_FAST,
    maxTokens = 2000,
    systemPrompt = 'You are a helpful UPSC exam preparation assistant.',
    userId = 'global',
  } = options;

  await waitForRateLimit(userId);

  try {
    const stream = await a4fClient.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      max_tokens: maxTokens,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        onChunk(content);
      }
    }
  } catch (error) {
    console.error('[AI Stream] Error:', error);
    throw new Error('Failed to stream content. Please try again.');
  }
}

/**
 * Parse JSON from AI response
 * Handles common formatting issues
 */
export function parseAIJson<T>(response: string): T | null {
  try {
    // Try to extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error('[AI Parse] No JSON found in response');
      return null;
    }

    // Clean up common issues
    let jsonStr = jsonMatch[0]
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .trim();

    return JSON.parse(jsonStr) as T;
  } catch (error) {
    console.error('[AI Parse] Failed to parse JSON:', error);
    return null;
  }
}
```

---

# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║  📁 FILE 8: src/lib/auth/auth-config.ts                                      ║
# ╚══════════════════════════════════════════════════════════════════════════════╝

```typescript
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { User } from '@/types';

/**
 * Get current authenticated user
 * Returns null if not authenticated
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const supabase = await createServerSupabaseClient();

    // Get auth user
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return null;
    }

    // Get user profile from database
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (profileError || !profile) {
      // Profile might not exist yet (new user)
      // The database trigger should create it, but if not:
      console.warn('[Auth] User profile not found, may need to create');
      return {
        id: authUser.id,
        email: authUser.email!,
        name: authUser.user_metadata?.name || null,
        avatarUrl: null,
        role: 'user',
        subscriptionTier: 'trial',
        subscriptionEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        preferences: {},
      };
    }

    return {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      avatarUrl: profile.avatar_url,
      role: profile.role as User['role'],
      subscriptionTier: profile.subscription_tier as User['subscriptionTier'],
      subscriptionEndsAt: profile.subscription_ends_at
        ? new Date(profile.subscription_ends_at)
        : null,
      preferences: (profile.preferences as Record<string, unknown>) || {},
    };
  } catch (error) {
    console.error('[Auth] Error getting current user:', error);
    return null;
  }
}

/**
 * Require authenticated user
 * Throws error if not authenticated
 */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Authentication required');
  }
  return user;
}

/**
 * Require admin user
 * Throws error if not admin
 */
export async function requireAdmin(): Promise<User> {
  const user = await requireUser();
  if (user.role !== 'admin' && user.role !== 'super_admin') {
    throw new Error('Admin access required');
  }
  return user;
}

/**
 * Check if user's subscription is active
 */
export function isSubscriptionActive(user: User): boolean {
  if (!user.subscriptionEndsAt) return false;
  return new Date(user.subscriptionEndsAt) > new Date();
}

/**
 * Check if user can access a feature based on subscription tier
 */
export function canAccessFeature(
  user: User,
  requiredTier: 'trial' | 'basic' | 'premium'
): boolean {
  const tierOrder = { trial: 0, basic: 1, premium: 2 };
  
  // Check if subscription is active first
  if (!isSubscriptionActive(user)) {
    return false;
  }
  
  return tierOrder[user.subscriptionTier] >= tierOrder[requiredTier];
}

/**
 * Get subscription days remaining
 */
export function getSubscriptionDaysRemaining(user: User): number {
  if (!user.subscriptionEndsAt) return 0;
  const diff = new Date(user.subscriptionEndsAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}
```

---

# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║  📁 FILE 9: src/lib/services/notes-service.ts                                ║
# ╚══════════════════════════════════════════════════════════════════════════════╝

```typescript
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { generateWithThinking, parseAIJson } from '@/lib/ai/generate';
import type { Note, NoteContent } from '@/types';

export interface GenerateNotesInput {
  topic: string;
  subject: string;
  userId: string;
  level?: 'basic' | 'intermediate' | 'advanced';
}

/**
 * Generate comprehensive UPSC notes on a topic
 * Uses AI with thinking model for deep analysis
 */
export async function generateNotes(input: GenerateNotesInput): Promise<Note> {
  const { topic, subject, userId, level = 'intermediate' } = input;

  const systemPrompt = `You are an expert UPSC Civil Services Examination preparation assistant.
Your task is to generate comprehensive, accurate study notes.

IMPORTANT RULES:
1. Write in simple, clear language (10th standard comprehension level)
2. Include all important facts, dates, names, and figures
3. Add UPSC exam relevance and connections to previous year questions
4. Include memory tricks (mnemonics) where helpful
5. Cite standard sources (NCERT, Laxmikanth, Spectrum, etc.)
6. Output ONLY valid JSON - no other text`;

  const prompt = `Generate comprehensive UPSC study notes on:

TOPIC: ${topic}
SUBJECT: ${subject}
DIFFICULTY: ${level}

Output this EXACT JSON structure:
{
  "introduction": "2-3 paragraphs introducing the topic with context, significance, and UPSC relevance",
  "keyPoints": ["Array of 6-10 key points covering main concepts"],
  "details": "4-6 paragraphs of detailed explanation with examples, data, and analysis",
  "valueAdditions": ["3-5 additional facts, exam tips, or interesting connections"],
  "quiz": [
    {
      "id": "q1",
      "question": "MCQ question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Why this answer is correct",
      "difficulty": "medium"
    }
  ],
  "sources": ["List of standard UPSC reference books"],
  "mnemonics": ["Memory tricks to remember key facts"],
  "pyqConnections": ["Connections to UPSC previous year questions if any"]
}

Generate 3-5 quiz questions. Make content comprehensive and exam-oriented.
Focus on conceptual clarity, not just facts.`;

  try {
    const response = await generateWithThinking(prompt, {
      systemPrompt,
      maxTokens: 4000,
      userId,
    });

    // Parse AI response
    const content = parseAIJson<NoteContent>(response);

    if (!content) {
      // Fallback content if parsing fails
      throw new Error('Failed to parse AI response');
    }

    // Ensure all required fields exist
    const validatedContent: NoteContent = {
      introduction: content.introduction || 'Introduction not available',
      keyPoints: content.keyPoints || [],
      details: content.details || '',
      valueAdditions: content.valueAdditions || [],
      quiz: content.quiz || [],
      sources: content.sources || ['Please verify with standard UPSC sources'],
      mnemonics: content.mnemonics || [],
      pyqConnections: content.pyqConnections || [],
    };

    // Save to database
    const supabase = await createServerSupabaseClient();

    const { data: note, error } = await supabase
      .from('notes')
      .insert({
        user_id: userId,
        topic,
        subject,
        content: validatedContent as unknown as Record<string, unknown>,
        is_bookmarked: false,
        view_count: 0,
      })
      .select()
      .single();

    if (error) {
      console.error('[Notes Service] Database error:', error);
      throw new Error(`Failed to save note: ${error.message}`);
    }

    return {
      id: note.id,
      userId: note.user_id,
      topic: note.topic,
      subject: note.subject,
      content: note.content as unknown as NoteContent,
      isBookmarked: note.is_bookmarked,
      viewCount: note.view_count,
      createdAt: new Date(note.created_at),
      updatedAt: new Date(note.updated_at),
    };
  } catch (error) {
    console.error('[Notes Service] Error generating notes:', error);
    throw error;
  }
}

/**
 * Get all notes for a user
 */
export async function getUserNotes(userId: string): Promise<Note[]> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch notes: ${error.message}`);
  }

  return data.map((note) => ({
    id: note.id,
    userId: note.user_id,
    topic: note.topic,
    subject: note.subject,
    content: note.content as unknown as NoteContent,
    isBookmarked: note.is_bookmarked,
    viewCount: note.view_count,
    createdAt: new Date(note.created_at),
    updatedAt: new Date(note.updated_at),
  }));
}

/**
 * Get a single note by ID
 */
export async function getNoteById(noteId: string, userId: string): Promise<Note | null> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('id', noteId)
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    return null;
  }

  // Increment view count
  await supabase
    .from('notes')
    .update({ view_count: data.view_count + 1 })
    .eq('id', noteId);

  return {
    id: data.id,
    userId: data.user_id,
    topic: data.topic,
    subject: data.subject,
    content: data.content as unknown as NoteContent,
    isBookmarked: data.is_bookmarked,
    viewCount: data.view_count + 1,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };
}

/**
 * Toggle bookmark status
 */
export async function toggleBookmark(noteId: string, userId: string): Promise<boolean> {
  const supabase = await createServerSupabaseClient();

  // Get current state
  const { data: note } = await supabase
    .from('notes')
    .select('is_bookmarked')
    .eq('id', noteId)
    .eq('user_id', userId)
    .single();

  if (!note) {
    throw new Error('Note not found');
  }

  // Toggle
  const newState = !note.is_bookmarked;
  const { error } = await supabase
    .from('notes')
    .update({ is_bookmarked: newState })
    .eq('id', noteId)
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to toggle bookmark: ${error.message}`);
  }

  return newState;
}

/**
 * Delete a note
 */
export async function deleteNote(noteId: string, userId: string): Promise<void> {
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', noteId)
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to delete note: ${error.message}`);
  }
}
```

---

# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║  📁 FILES 10-25: API ROUTES & MORE SERVICES                                  ║
# ╚══════════════════════════════════════════════════════════════════════════════╝

## Continue creating these files:

```
10. src/lib/services/quiz-service.ts
11. src/lib/services/current-affairs-service.ts
12. src/app/api/notes/generate/route.ts
13. src/app/api/notes/route.ts
14. src/app/api/notes/[id]/route.ts
15. src/app/api/quiz/generate/route.ts
16. src/app/api/quiz/route.ts
17. src/app/api/quiz/[id]/route.ts
18. src/app/api/quiz/[id]/submit/route.ts
19. src/app/api/current-affairs/route.ts
20. src/app/api/current-affairs/[id]/route.ts
21. src/app/api/health/route.ts
22. src/app/api/user/route.ts
23. src/app/api/user/preferences/route.ts
24. src/app/auth/callback/route.ts
25. .build-state/phase2-complete.json (checkpoint)
```

---

# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║  📋 PHASE 2 CHECKPOINT                                                       ║
# ╚══════════════════════════════════════════════════════════════════════════════╝

After creating all files:

**`.build-state/phase2-complete.json`**
```json
{
  "phase": 2,
  "name": "backend-apis",
  "methodology": "wshobson/agents",
  "agents": ["typescript-pro", "nextjs-developer", "test-automator"],
  "skills": ["advanced-typescript-patterns", "api-design-principles", "testing-javascript"],
  "modelTier": "sonnet",
  "filesCreated": 25,
  "status": "complete",
  "completedAt": "2025-01-14T00:00:00Z",
  "nextPhase": 3,
  "nextAgents": ["react-specialist", "frontend-developer"],
  "apiEndpoints": [
    "POST /api/notes/generate",
    "GET /api/notes",
    "GET /api/notes/[id]",
    "DELETE /api/notes/[id]",
    "POST /api/quiz/generate",
    "GET /api/quiz",
    "POST /api/quiz/[id]/submit",
    "GET /api/current-affairs",
    "GET /api/health"
  ],
  "verification": {
    "typeCheck": "pending",
    "build": "pending",
    "apiTest": "pending"
  }
}
```

## VERIFY PHASE 2

```bash
npm run type-check
npm run build
npm run dev
# Test: curl http://localhost:3000/api/health
```

---

# CONTINUE TO PHASE 3: Frontend Pages with react-specialist agent
