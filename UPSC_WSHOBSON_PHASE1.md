# 🔒 UPSC CSE MASTER - PHASE 1: ARCHITECTURE & FOUNDATION
## Using wshobson/agents | Opus Tier | backend-architect + database-architect

---

# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║  📋 PHASE 1 ENTRY PROMPT - COPY TO CLINE                                     ║
# ╚══════════════════════════════════════════════════════════════════════════════╝

```
# UPSC CSE MASTER - PHASE 1: ARCHITECTURE & FOUNDATION

## METHODOLOGY
Using wshobson/agents multi-agent orchestration with Opus tier agents.

## ACTIVE PLUGINS
- backend-development (backend-architect agent)
- database-design (database-architect agent)
- code-review-ai (architect-review agent)

## ACTIVE AGENTS (OPUS TIER - Critical Decisions)
1. backend-architect - Design API structure, auth flow, service layer
2. database-architect - Design Supabase schema, RLS policies, indexes
3. architect-review - Review architecture decisions

## ACTIVATED SKILLS
- api-design-principles
- backend-architecture-patterns
- database-design-patterns

## ORCHESTRATION PATTERN
```
backend-architect (API design)
        ↓
database-architect (Schema design)
        ↓
architect-review (Validate decisions)
        ↓
Generate architecture docs + config files
```

## PROJECT CONTEXT
Building enterprise-grade UPSC exam preparation platform with:
- Next.js 14 + TypeScript + Tailwind
- Supabase Cloud (PostgreSQL + Auth + Storage)
- A4F AI API (10 RPM rate limit - CRITICAL!)
- Apple-style UI with dark/light theme
- English/Hindi language support

## CREDENTIALS (EXACT - DO NOT CHANGE)
```env
NEXT_PUBLIC_SUPABASE_URL=https://emotqkukvfwjycvwfvyj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU
A4F_API_KEY=ddc-a4f-58e04f695d7748c78c49d3ba1fdb9621
SERVER_IP=89.117.60.144
```

## CONTEXT LIMIT
Stay under 40K tokens. Save checkpoint after Phase 1 complete.

## IRON RULES
1. Create EVERY file completely - NO placeholders
2. Use EXACT credentials
3. Follow Supabase Cloud patterns (NOT local PostgreSQL)
4. Update .build-state after EACH file
5. Test compilation before next file

## FILES TO CREATE (33 total for Phase 1 + Foundation)
Create in EXACT order below.

START NOW with file #1.
```

---

# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║  📁 FILE 1: .build-state/orchestration.json                                  ║
# ╚══════════════════════════════════════════════════════════════════════════════╝

```json
{
  "project": "upsc-cse-master",
  "methodology": "wshobson/agents",
  "version": "1.0.0",
  "startedAt": "2025-01-14T00:00:00Z",
  "currentPhase": 1,
  "phaseName": "architecture-foundation",
  "activeAgents": ["backend-architect", "database-architect"],
  "activeSkills": ["api-design-principles", "database-design-patterns"],
  "modelTier": "opus",
  "completedPhases": [],
  "completedFiles": [],
  "totalFilesPhase1": 33,
  "credentials": {
    "supabaseUrl": "https://emotqkukvfwjycvwfvyj.supabase.co",
    "serverIp": "89.117.60.144"
  },
  "checkpoints": [],
  "errors": [],
  "buildStatus": "in_progress"
}
```

---

# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║  📁 FILE 2: package.json                                                     ║
# ╚══════════════════════════════════════════════════════════════════════════════╝

```json
{
  "name": "upsc-cse-master",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "format": "prettier --write .",
    "db:types": "supabase gen types typescript --project-id emotqkukvfwjycvwfvyj > src/types/supabase.ts"
  },
  "dependencies": {
    "next": "14.2.15",
    "react": "18.3.1",
    "react-dom": "18.3.1",
    "@supabase/supabase-js": "2.45.4",
    "@supabase/ssr": "0.5.1",
    "openai": "4.67.1",
    "framer-motion": "11.11.1",
    "lucide-react": "0.447.0",
    "tailwind-merge": "2.5.3",
    "clsx": "2.1.1",
    "class-variance-authority": "0.7.0",
    "zod": "3.23.8",
    "date-fns": "4.1.0",
    "react-hook-form": "7.53.0",
    "@hookform/resolvers": "3.9.0",
    "sonner": "1.5.0",
    "jspdf": "2.5.2",
    "html2canvas": "1.4.1"
  },
  "devDependencies": {
    "@types/node": "22.7.4",
    "@types/react": "18.3.11",
    "@types/react-dom": "18.3.0",
    "typescript": "5.6.2",
    "tailwindcss": "3.4.13",
    "postcss": "8.4.47",
    "autoprefixer": "10.4.20",
    "eslint": "8.57.1",
    "eslint-config-next": "14.2.15",
    "prettier": "3.3.3"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

---

# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║  📁 FILE 3: .env.local                                                       ║
# ╚══════════════════════════════════════════════════════════════════════════════╝

```env
# ============================================
# SUPABASE CLOUD - PRIMARY DATABASE
# ============================================
NEXT_PUBLIC_SUPABASE_URL=https://emotqkukvfwjycvwfvyj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU
SUPABASE_JWT_SECRET=your-super-secret-jwt-token-with-at-least-32-characters-long

# ============================================
# A4F AI API - 10 RPM RATE LIMIT!
# ============================================
A4F_API_KEY=ddc-a4f-58e04f695d7748c78c49d3ba1fdb9621
A4F_BASE_URL=https://api.a4f.co/v1

# ============================================
# VPS SERVICES (89.117.60.144)
# ============================================
SERVER_IP=89.117.60.144
MINIO_ENDPOINT=http://89.117.60.144:9000
MINIO_ROOT_USER=admin
MINIO_ROOT_PASSWORD=minioadmin123
MINIO_BUCKET=uploads
REDIS_URL=redis://89.117.60.144:6379
N8N_URL=http://89.117.60.144:5678

# ============================================
# NEXTAUTH / APP CONFIG
# ============================================
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=upsc-cse-master-super-secret-key-2024-production-level
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=UPSC CSE Master
```

---

# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║  📁 FILE 4: next.config.js                                                   ║
# ╚══════════════════════════════════════════════════════════════════════════════╝

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'emotqkukvfwjycvwfvyj.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'http',
        hostname: '89.117.60.144',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },

  // Optimize for production
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },

  // Redirects
  async redirects() {
    return [
      {
        source: '/app',
        destination: '/dashboard',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
```

---

# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║  📁 FILE 5: tailwind.config.ts                                               ║
# ╚══════════════════════════════════════════════════════════════════════════════╝

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        hindi: ['Noto Sans Devanagari', 'sans-serif'],
      },
      animation: {
        'shimmer': 'shimmer 2s linear infinite',
        'float': 'float 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(99, 102, 241, 0.3)' },
          '100%': { boxShadow: '0 0 40px rgba(99, 102, 241, 0.6)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
};

export default config;
```

---

# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║  📁 FILE 6: tsconfig.json                                                    ║
# ╚══════════════════════════════════════════════════════════════════════════════╝

```json
{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"]
    },
    "target": "ES2017",
    "forceConsistentCasingInFileNames": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

---

# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║  📁 FILE 7: postcss.config.js                                                ║
# ╚══════════════════════════════════════════════════════════════════════════════╝

```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

---

# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║  📁 FILE 8: src/types/supabase.ts                                            ║
# ╚══════════════════════════════════════════════════════════════════════════════╝

```typescript
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          avatar_url: string | null;
          role: 'user' | 'admin' | 'super_admin';
          subscription_tier: 'trial' | 'basic' | 'premium';
          subscription_ends_at: string | null;
          preferences: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name?: string | null;
          avatar_url?: string | null;
          role?: 'user' | 'admin' | 'super_admin';
          subscription_tier?: 'trial' | 'basic' | 'premium';
          subscription_ends_at?: string | null;
          preferences?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          avatar_url?: string | null;
          role?: 'user' | 'admin' | 'super_admin';
          subscription_tier?: 'trial' | 'basic' | 'premium';
          subscription_ends_at?: string | null;
          preferences?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      notes: {
        Row: {
          id: string;
          user_id: string;
          topic: string;
          subject: string;
          content: Json;
          is_bookmarked: boolean;
          view_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          topic: string;
          subject: string;
          content: Json;
          is_bookmarked?: boolean;
          view_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          topic?: string;
          subject?: string;
          content?: Json;
          is_bookmarked?: boolean;
          view_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      quizzes: {
        Row: {
          id: string;
          user_id: string;
          topic: string;
          subject: string;
          questions: Json;
          total_questions: number;
          score: number | null;
          time_taken: number | null;
          completed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          topic: string;
          subject: string;
          questions: Json;
          total_questions: number;
          score?: number | null;
          time_taken?: number | null;
          completed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          topic?: string;
          subject?: string;
          questions?: Json;
          total_questions?: number;
          score?: number | null;
          time_taken?: number | null;
          completed_at?: string | null;
          created_at?: string;
        };
      };
      current_affairs: {
        Row: {
          id: string;
          date: string;
          headline: string;
          summary: string;
          details: string;
          category: string;
          source: string;
          upsc_relevance: string;
          tags: string[];
          created_at: string;
        };
        Insert: {
          id?: string;
          date?: string;
          headline: string;
          summary: string;
          details: string;
          category: string;
          source: string;
          upsc_relevance: string;
          tags?: string[];
          created_at?: string;
        };
        Update: {
          id?: string;
          date?: string;
          headline?: string;
          summary?: string;
          details?: string;
          category?: string;
          source?: string;
          upsc_relevance?: string;
          tags?: string[];
          created_at?: string;
        };
      };
      ai_providers: {
        Row: {
          id: string;
          name: string;
          slug: string;
          api_base_url: string;
          api_key_encrypted: string | null;
          is_active: boolean;
          is_default: boolean;
          models: Json;
          rate_limit_rpm: number;
          health_status: string;
          last_health_check: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          api_base_url: string;
          api_key_encrypted?: string | null;
          is_active?: boolean;
          is_default?: boolean;
          models?: Json;
          rate_limit_rpm?: number;
          health_status?: string;
          last_health_check?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          api_base_url?: string;
          api_key_encrypted?: string | null;
          is_active?: boolean;
          is_default?: boolean;
          models?: Json;
          rate_limit_rpm?: number;
          health_status?: string;
          last_health_check?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      leads: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          phone: string | null;
          source: string | null;
          utm_source: string | null;
          utm_medium: string | null;
          utm_campaign: string | null;
          score: number;
          status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name?: string | null;
          phone?: string | null;
          source?: string | null;
          utm_source?: string | null;
          utm_medium?: string | null;
          utm_campaign?: string | null;
          score?: number;
          status?: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          phone?: string | null;
          source?: string | null;
          utm_source?: string | null;
          utm_medium?: string | null;
          utm_campaign?: string | null;
          score?: number;
          status?: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      feature_config: {
        Row: {
          id: string;
          feature_id: string;
          display_name: string;
          display_name_hi: string | null;
          description: string | null;
          icon: string | null;
          is_enabled: boolean;
          is_visible: boolean;
          min_tier: string;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          feature_id: string;
          display_name: string;
          display_name_hi?: string | null;
          description?: string | null;
          icon?: string | null;
          is_enabled?: boolean;
          is_visible?: boolean;
          min_tier?: string;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          feature_id?: string;
          display_name?: string;
          display_name_hi?: string | null;
          description?: string | null;
          icon?: string | null;
          is_enabled?: boolean;
          is_visible?: boolean;
          min_tier?: string;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type InsertTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];
export type UpdateTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];
```

---

# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║  📁 FILE 9: src/types/index.ts                                               ║
# ╚══════════════════════════════════════════════════════════════════════════════╝

```typescript
// Re-export database types
export type { Database, Tables, InsertTables, UpdateTables } from './supabase';

// User types
export interface User {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role: 'user' | 'admin' | 'super_admin';
  subscriptionTier: 'trial' | 'basic' | 'premium';
  subscriptionEndsAt: Date | null;
  preferences: Record<string, unknown>;
}

// Note types
export interface NoteContent {
  introduction: string;
  keyPoints: string[];
  details: string;
  valueAdditions: string[];
  quiz: QuizQuestion[];
  sources: string[];
  mnemonics?: string[];
  pyqConnections?: string[];
}

export interface Note {
  id: string;
  userId: string;
  topic: string;
  subject: string;
  content: NoteContent;
  isBookmarked: boolean;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// Quiz types
export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topic?: string;
}

export interface Quiz {
  id: string;
  userId: string;
  topic: string;
  subject: string;
  questions: QuizQuestion[];
  totalQuestions: number;
  score: number | null;
  timeTaken: number | null;
  completedAt: Date | null;
  createdAt: Date;
}

// Current Affairs types
export interface CurrentAffair {
  id: string;
  date: Date;
  headline: string;
  summary: string;
  details: string;
  category: string;
  source: string;
  upscRelevance: string;
  tags: string[];
}

// Feature Config types
export interface FeatureConfig {
  id: string;
  featureId: string;
  displayName: string;
  displayNameHi: string | null;
  description: string | null;
  icon: string | null;
  isEnabled: boolean;
  isVisible: boolean;
  minTier: 'trial' | 'basic' | 'premium';
  sortOrder: number;
}

// API Response type
export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Subjects
export const SUBJECTS = [
  'History',
  'Geography',
  'Polity',
  'Economy',
  'Science & Technology',
  'Environment',
  'Ethics',
  'Current Affairs',
  'Art & Culture',
  'International Relations',
] as const;

export type Subject = (typeof SUBJECTS)[number];

// Feature display names (EN -> User Friendly)
export const FEATURE_NAMES: Record<string, { en: string; hi: string; icon: string }> = {
  notes: { en: 'Smart Study Notes', hi: 'स्मार्ट अध्ययन नोट्स', icon: '📚' },
  quiz: { en: 'Practice Quiz', hi: 'अभ्यास प्रश्नोत्तरी', icon: '🧠' },
  'current-affairs': { en: 'Daily Current Affairs', hi: 'दैनिक करेंट अफेयर्स', icon: '📰' },
  video: { en: 'Video Lessons', hi: 'वीडियो पाठ', icon: '🎬' },
  interview: { en: 'Mock Interview', hi: 'मॉक इंटरव्यू', icon: '🎤' },
  essay: { en: 'Essay Evaluation', hi: 'निबंध मूल्यांकन', icon: '✍️' },
  schedule: { en: 'Study Planner', hi: 'अध्ययन योजनाकार', icon: '📅' },
};
```

---

# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║  📁 FILE 10: src/lib/utils.ts                                                ║
# ╚══════════════════════════════════════════════════════════════════════════════╝

```typescript
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS classes with clsx
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format date for display
 */
export function formatDate(
  date: Date | string,
  options?: Intl.DateTimeFormatOptions
): string {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  };
  return new Intl.DateTimeFormat('en-IN', options || defaultOptions).format(
    new Date(date)
  );
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const then = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

  return formatDate(date);
}

/**
 * Truncate string with ellipsis
 */
export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length).trim() + '...';
}

/**
 * Convert string to URL-friendly slug
 */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Generate UUID
 */
export function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Sleep/delay utility
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle function
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Extract error message from unknown error
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'An unexpected error occurred';
}

/**
 * Check if user can access feature based on subscription tier
 */
export function canAccessFeature(
  userTier: 'trial' | 'basic' | 'premium',
  requiredTier: 'trial' | 'basic' | 'premium'
): boolean {
  const tierOrder = { trial: 0, basic: 1, premium: 2 };
  return tierOrder[userTier] >= tierOrder[requiredTier];
}

/**
 * Format number with Indian number system
 */
export function formatIndianNumber(num: number): string {
  return new Intl.NumberFormat('en-IN').format(num);
}

/**
 * Capitalize first letter
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
```

---

# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║  📁 CONTINUE WITH FILES 11-33...                                             ║
# ╚══════════════════════════════════════════════════════════════════════════════╝

## Remaining Files for Phase 1:

```
11. src/lib/supabase/client.ts
12. src/lib/supabase/server.ts
13. src/lib/supabase/middleware.ts
14. src/middleware.ts
15. src/lib/ai/a4f-client.ts
16. src/lib/ai/rate-limiter.ts
17. src/lib/ai/generate.ts
18. src/lib/auth/auth-config.ts
19. src/app/globals.css
20. src/app/layout.tsx
21. src/app/page.tsx (Landing)
22. src/app/api/health/route.ts
23-33. UI Components (button, card, input, loading, etc.)
```

## PHASE 1 CHECKPOINT

After creating all files, create:

**`.build-state/phase1-complete.json`**
```json
{
  "phase": 1,
  "name": "architecture-foundation",
  "methodology": "wshobson/agents",
  "agents": ["backend-architect", "database-architect"],
  "skills": ["api-design-principles", "database-design-patterns"],
  "filesCreated": 33,
  "status": "complete",
  "completedAt": "2025-01-14T00:00:00Z",
  "nextPhase": 2,
  "nextAgents": ["typescript-pro", "nextjs-developer"],
  "verification": {
    "npmInstall": "pending",
    "typeCheck": "pending",
    "build": "pending"
  }
}
```

## VERIFY PHASE 1

```bash
npm install
npm run type-check
npm run build
```

If errors, fix them before proceeding to Phase 2.

---

# CONTINUE TO PHASE 2: Backend APIs with Sonnet tier agents
