// ═══════════════════════════════════════════════════════════════════════════
// CENTRALIZED API CLIENT - Frontend → API Gateway
// ═══════════════════════════════════════════════════════════════════════════
//
// Single source of truth for all frontend API calls.
// Handles: Auth tokens, error handling, retries, timeouts, request/response interception
//
// Usage:
//   import { apiClient } from '@/lib/api/api-client';
//   const result = await apiClient.doubt.ask({ question: "..." });
// ═══════════════════════════════════════════════════════════════════════════

import type { User } from '@supabase/supabase-js';
import { createClient as createSupabaseClient } from '@/lib/supabase/client';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export class ApiError extends Error {
  code: string;
  status: number;
  details?: Record<string, unknown>;
  retryable: boolean;

  constructor(code: string, message: string, status: number, details?: Record<string, unknown>, retryable: boolean = false) {
    super(message);
    this.code = code;
    this.status = status;
    this.details = details;
    this.retryable = retryable;
    this.name = 'ApiError';
  }
}

export interface ApiConfig {
  baseUrl: string;
  timeoutMs: number;
  maxRetries: number;
  retryDelayMs: number;
}

export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: Record<string, unknown>;
  headers?: Record<string, string>;
  timeoutMs?: number;
  skipAuth?: boolean;
  retry?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// DEFAULT CONFIG
// ═══════════════════════════════════════════════════════════════════════════

const DEFAULT_CONFIG: ApiConfig = {
  baseUrl: '/api',
  timeoutMs: 30000,
  maxRetries: 2,
  retryDelayMs: 1000,
};

// ═══════════════════════════════════════════════════════════════════════════
// API CLIENT CLASS
// ═══════════════════════════════════════════════════════════════════════════

class ApiClient {
  private config: ApiConfig;
  private authToken: string | null = null;
  private _currentUser: User | null = null;

  constructor(config?: Partial<ApiConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // ═══════════════════════════════════════════════════════════════════════
  // AUTH MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════

  setAuth(user: User | null, token: string | null) {
    this._currentUser = user;
    this.authToken = token;
  }

  clearAuth() {
    this._currentUser = null;
    this.authToken = null;
  }

  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    return headers;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // CORE REQUEST HANDLING
  // ═══════════════════════════════════════════════════════════════════════

  private async request<T>(
    endpoint: string,
    options: ApiRequestOptions = {}
  ): Promise<T> {
    const {
      method = 'GET',
      body,
      headers = {},
      timeoutMs = this.config.timeoutMs,
      skipAuth = false,
      retry = true,
    } = options;

    const url = `${this.config.baseUrl}${endpoint}`;

    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers,
      ...(skipAuth ? {} : this.getAuthHeaders()),
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method,
        headers: requestHeaders,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw await this.parseError(response);
      }

      const data = await response.json();
      return data as T;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof ApiError && error.retryable && retry) {
        return this.retryRequest<T>(endpoint, options);
      }

      throw error;
    }
  }

  private async retryRequest<T>(
    endpoint: string,
    options: ApiRequestOptions
  ): Promise<T> {
    for (let i = 0; i < this.config.maxRetries; i++) {
      try {
        await this.sleep(this.config.retryDelayMs * (i + 1));
        return await this.request<T>(endpoint, { ...options, retry: false });
      } catch (error) {
        if (i === this.config.maxRetries - 1) {
          throw error;
        }
      }
    }
    throw new ApiError('MAX_RETRIES', 'Max retries exceeded', 500, {}, false);
  }

  private async parseError(response: Response): Promise<ApiError> {
    try {
      const errorData = await response.json();
      return new ApiError(
        errorData.code || 'UNKNOWN_ERROR',
        errorData.error || errorData.message || 'An error occurred',
        response.status,
        errorData.details,
        this.isRetryableError(response.status),
      );
    } catch {
      return new ApiError(
        'NETWORK_ERROR',
        'Network error occurred',
        response.status,
        undefined,
        this.isRetryableError(response.status),
      );
    }
  }

  private isRetryableError(status: number): boolean {
    return status === 429 || status === 500 || status === 502 || status === 503;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ═══════════════════════════════════════════════════════════════════════
  // API ENDPOINT METHODS - Organized by feature
  // ═══════════════════════════════════════════════════════════════════════

  doubt = {
    ask: (data: {
      title: { en: string; hi?: string };
      subject: string;
      topic?: string;
      question: string;
      attachments?: Array<{ type: string; url: string }>;
      language?: 'en' | 'hi' | 'bilingual';
    }) => this.request<ApiResponse<DoubtResponse>>('/doubt/ask', {
      method: 'POST',
      body: data,
    }),

    followUp: (threadId: string, question: string) => this.request<ApiResponse<DoubtResponse>>('/doubt/followup', {
      method: 'POST',
      body: { threadId, question },
    }),

    rate: (answerId: string, rating: number, feedback?: string) => this.request<ApiResponse<{ success: boolean }>>('/doubt/rate', {
      method: 'POST',
      body: { answerId, rating, feedback },
    }),

    history: (page = 1, limit = 20, filters?: { subject?: string; status?: string; search?: string }) => this.request<ApiResponse<DoubtHistoryResponse>>(`/doubt/history?page=${page}&limit=${limit}`, {
      method: 'POST',
      body: filters,
    }),

    getThread: (threadId: string) => this.request<ApiResponse<DoubtThreadResponse>>(`/doubt/thread/${threadId}`),
  };

  quiz = {
    generate: (data: { topic: string; subject: string; count: number; difficulty?: string }) => this.request<ApiResponse<QuizResponse>>('/quiz/generate', {
      method: 'POST',
      body: data,
    }),

    submit: (quizId: string, answers: Array<{ questionId: string; selectedOption: number }>) => this.request<ApiResponse<QuizResultResponse>>('/quiz/submit', {
      method: 'POST',
      body: { quizId, answers },
    }),

    get: (quizId: string) => this.request<ApiResponse<QuizResponse>>(`/quiz/${quizId}`),
  };

  notes = {
    generate: (data: { videoId?: string; topic: string; subject: string }) => this.request<ApiResponse<NotesResponse>>('/notes/generate', {
      method: 'POST',
      body: data,
    }),

    get: (noteId: string) => this.request<ApiResponse<NotesResponse>>(`/notes/${noteId}`),

    list: (page = 1, limit = 20) => this.request<ApiResponse<NotesListResponse>>(`/notes/library?page=${page}&limit=${limit}`),

    syncFromVideo: (videoId: string) => this.request<ApiResponse<NotesResponse>>('/notes/sync-from-video', {
      method: 'POST',
      body: { videoId },
    }),
  };

  planner = {
    create: (data: { targetDate: string; goals: string[] }) => this.request<ApiResponse<PlannerResponse>>('/planner', {
      method: 'POST',
      body: data,
    }),

    get: () => this.request<ApiResponse<PlannerResponse>>('/planner'),

    adjust: (data: { reason: string; newGoals?: string[] }) => this.request<ApiResponse<PlannerResponse>>('/planner/adjust', {
      method: 'POST',
      body: data,
    }),

    complete: (milestoneId: string) => this.request<ApiResponse<PlannerResponse>>('/planner/complete', {
      method: 'POST',
      body: { milestoneId },
    }),

    schedule: (data: { date: string; tasks: string[] }) => this.request<ApiResponse<PlannerResponse>>('/planner/schedule', {
      method: 'POST',
      body: data,
    }),
  };

  mcq = {
    practice: {
      start: (data: { subject: string; topic?: string; count?: number; difficulty?: string }) => this.request<ApiResponse<McqSessionResponse>>('/mcq/practice/start', {
        method: 'POST',
        body: data,
      }),

      submit: (sessionId: string, answers: Array<{ questionId: string; selectedOption: number }>) => this.request<ApiResponse<McqResultResponse>>('/mcq/practice/submit', {
        method: 'POST',
        body: { sessionId, answers },
      }),
    },

    mock: {
      list: () => this.request<ApiResponse<MockTestListResponse>>('/mcq/mock'),

      start: (mockId: string) => this.request<ApiResponse<MockStartResponse>>('/mcq/mock/start', {
        method: 'POST',
        body: { mockId },
      }),

      submit: (attemptId: string, answers: Array<{ questionId: string; selectedOption: number }>) => this.request<ApiResponse<MockResultResponse>>('/mcq/mock/submit', {
        method: 'POST',
        body: { attemptId, answers },
      }),
    },

    bookmark: (questionId: string) => this.request<ApiResponse<{ success: boolean }>>('/mcq/bookmark', {
      method: 'POST',
      body: { questionId },
    }),
  };

  currentAffairs = {
    list: (date?: string) => this.request<ApiResponse<CurrentAffairsListResponse>>(`/ca/daily${date ? `?date=${date}` : ''}`),

    get: (id: string) => this.request<ApiResponse<CurrentAffairsResponse>>(`/ca/article/${id}`),

    mcq: (articleId: string) => this.request<ApiResponse<QuizResponse>>(`/ca/mcq/${articleId}`),

    archive: (month: string) => this.request<ApiResponse<CurrentAffairsListResponse>>(`/ca/archive?month=${month}`),
  };

  digest = {
    generate: (date?: string) => this.request<ApiResponse<DigestResponse>>('/digest/generate', {
      method: 'POST',
      body: { date },
    }),
  };

  mentor = {
    chat: (message: string, threadId?: string) => this.request<ApiResponse<MentorChatResponse>>('/mentor/chat', {
      method: 'POST',
      body: { message, threadId },
    }),
  };

  mains = {
    submit: (data: { questionId: string; answerText: string; attachments?: string[] }) => this.request<ApiResponse<MainsEvalResponse>>('/eval/mains/submit', {
      method: 'POST',
      body: data,
    }),

    get: (evaluationId: string) => this.request<ApiResponse<MainsEvalResponse>>(`/eval/mains/${evaluationId}`),

    history: () => this.request<ApiResponse<MainsHistoryResponse>>('/eval/mains/history'),
  };

  math = {
    solve: (problem: string, steps?: boolean) => this.request<ApiResponse<MathResponse>>('/math/solve', {
      method: 'POST',
      body: { problem, steps },
    }),
  };

  legal = {
    explain: (article: string, context?: string) => this.request<ApiResponse<LegalResponse>>('/legal/explain', {
      method: 'POST',
      body: { article, context },
    }),

    articles: (query?: string) => this.request<ApiResponse<LegalArticlesResponse>>(`/legal/articles${query ? `?q=${query}` : ''}`),
  };

  ethics = {
    explain: (caseStudy: string) => this.request<ApiResponse<EthicsResponse>>('/ethics/explain', {
      method: 'POST',
      body: { caseStudy },
    }),
  };

  payments = {
    initiate: (planId: string) => this.request<ApiResponse<PaymentResponse>>('/payments/initiate', {
      method: 'POST',
      body: { planId },
    }),

    verify: (orderId: string, paymentId: string, signature: string) => this.request<ApiResponse<PaymentVerifyResponse>>('/payments/verify', {
      method: 'POST',
      body: { orderId, paymentId, signature },
    }),
  };

  user = {
    get: () => this.request<ApiResponse<UserProfileResponse>>('/user'),

    update: (data: Partial<UserProfile>) => this.request<ApiResponse<UserProfileResponse>>('/user', {
      method: 'PUT',
      body: data,
    }),

    preferences: {
      get: () => this.request<ApiResponse<UserPreferencesResponse>>('/user/preferences'),
      update: (data: Partial<UserPreferences>) => this.request<ApiResponse<UserPreferencesResponse>>('/user/preferences', {
        method: 'PUT',
        body: data,
      }),
    },
  };

  analytics = {
    readinessScore: () => this.request<ApiResponse<ReadinessScoreResponse>>('/analytics/readiness-score'),
    subjectPerformance: () => this.request<ApiResponse<SubjectPerformanceResponse>>('/analytics/subject-performance'),
    studyTrends: (days?: number) => this.request<ApiResponse<StudyTrendsResponse>>('/analytics/study-trends', {
      method: 'POST',
      body: { days },
    }),
    timeDistribution: () => this.request<ApiResponse<TimeDistributionResponse>>('/analytics/time-distribution'),
    weeklyComparison: () => this.request<ApiResponse<WeeklyComparisonResponse>>('/analytics/weekly-comparison'),
  };

  bookmarks = {
    list: () => this.request<ApiResponse<BookmarksResponse>>('/bookmarks'),
    review: () => this.request<ApiResponse<BookmarksReviewResponse>>('/bookmarks/review'),
    due: () => this.request<ApiResponse<BookmarksDueResponse>>('/bookmarks/due'),
  };

  admin = {
    users: {
      list: () => this.request<ApiResponse<AdminUsersResponse>>('/admin/users'),
      action: (userId: string, action: 'suspend' | 'ban' | 'activate' | 'grant_xp', amount?: number) => this.request<ApiResponse<{ success: boolean; message: string }>>('/admin/users', {
        method: 'POST',
        body: { userId, action, amount },
      }),
    },
  };

  health = {
    check: () => this.request<ApiResponse<HealthResponse>>('/health'),
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// RESPONSE TYPES (match API responses)
// ═══════════════════════════════════════════════════════════════════════════

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  timestamp?: string;
}

// Doubt types
interface DoubtResponse {
  threadId: string;
  questionId: string;
  answerId?: string;
  answer: {
    text: string;
    textHi?: string;
    sources: Array<{ title: string; url?: string; type: string }>;
    followUpQuestions: string[];
    keyPoints: string[];
    wordCount: number;
  };
  usage: { remainingDoubts: number; totalDoubtsThisMonth: number };
}

interface DoubtThreadResponse {
  thread: any;
  questions: any[];
  answers: any[];
}

interface DoubtHistoryResponse {
  threads: any[];
  total: number;
}

// Quiz types
interface QuizResponse {
  id: string;
  questions: any[];
  durationSec: number;
  totalMarks: number;
}

interface QuizResultResponse {
  score: number;
  accuracy: number;
  correctAnswers: number;
  incorrectAnswers: number;
  explanations: any[];
}

// Notes types
interface NotesResponse {
  id: string;
  content: string;
  contentHtml: string;
  title: string;
  subject: string;
  topic: string;
  sources: any[];
}

interface NotesListResponse {
  notes: any[];
  total: number;
}

// Planner types
interface PlannerResponse {
  id: string;
  milestones: any[];
  dailyTasks: any[];
  progress: number;
}

// MCQ types
interface McqSessionResponse {
  sessionId: string;
  questions: any[];
  settings: { timed: boolean; durationSec: number };
}

interface McqResultResponse {
  score: number;
  accuracy: number;
  explanations: any[];
}

interface MockTestListResponse {
  mocks: any[];
}

interface MockStartResponse {
  attemptId: string;
  mock: any;
  questions: any[];
  settings: { timed: boolean; durationSec: number };
}

interface MockResultResponse {
  netMarks: number;
  accuracy: number;
  percentile: number;
  rank: number;
  xpEarned: number;
}

// Current Affairs types
interface CurrentAffairsResponse {
  article: any;
  mcqs: any[];
}

interface CurrentAffairsListResponse {
  articles: any[];
  date: string;
}

// Digest types
interface DigestResponse {
  id: string;
  date: string;
  articles: any[];
  summary: string;
}

// Mentor types
interface MentorChatResponse {
  message: string;
  threadId: string;
  suggestions: string[];
}

// Mains Evaluation types
interface MainsEvalResponse {
  evaluationId: string;
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
}

interface MainsHistoryResponse {
  evaluations: any[];
}

// Math types
interface MathResponse {
  solution: string;
  steps: string[];
  answer: string;
}

// Legal types
interface LegalResponse {
  explanation: string;
  articles: any[];
  cases: any[];
}

interface LegalArticlesResponse {
  articles: any[];
}

// Ethics types
interface EthicsResponse {
  explanation: string;
  frameworks: string[];
  caseStudies: any[];
}

// Payment types
interface PaymentResponse {
  orderId: string;
  amount: number;
  currency: string;
  checkoutUrl: string;
}

interface PaymentVerifyResponse {
  success: boolean;
  subscription: any;
}

// User types
interface UserProfileResponse {
  user: any;
  profile: any;
  subscription: any;
}

interface UserPreferencesResponse {
  preferences: any;
}

interface UserProfile {
  name?: string;
  phone?: string;
  avatar_url?: string;
}

interface UserPreferences {
  language?: string;
  theme?: string;
  notifications?: any;
}

// Analytics types
interface ReadinessScoreResponse {
  score: number;
  breakdown: any;
}

interface SubjectPerformanceResponse {
  subjects: any[];
}

interface StudyTrendsResponse {
  trends: any[];
}

interface TimeDistributionResponse {
  distribution: any[];
}

interface WeeklyComparisonResponse {
  comparison: any;
}

// Bookmarks types
interface BookmarksResponse {
  bookmarks: any[];
}

interface BookmarksReviewResponse {
  cards: any[];
}

interface BookmarksDueResponse {
  due: any[];
}

// Admin types
interface AdminUsersResponse {
  users: any[];
  total: number;
}

// Health types
interface HealthResponse {
  status: string;
  version: string;
  uptime: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORT SINGLETON
// ═══════════════════════════════════════════════════════════════════════════

export const apiClient = new ApiClient();

// Helper to initialize with auth
export async function initializeApiClient() {
  const supabase = createSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const { data: { session } } = await supabase.auth.getSession();
    apiClient.setAuth(user, session?.access_token || null);
  }

  return apiClient;
}
