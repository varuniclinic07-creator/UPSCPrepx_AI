// src/lib/agents/core/types.ts
// Shared types for the three v8 production agents (spec §1.2).

export type KnowledgeAgentVersion = 'v1';
export type EvaluationAgentVersion = 'v1';
export type OrchestratorAgentVersion = 'v1';
export type ScoringVersion = 'v1';

// ---------- Knowledge ----------
export type SourceType = 'note' | 'pyq' | 'ca' | 'user_pdf';
export interface SourceMeta {
  topicId?: string;
  title?: string;
  url?: string;
  author?: string;
  publishedAt?: string;
}
export interface SourceInput {
  type: SourceType;
  content: string;
  meta: SourceMeta;
}
export interface IngestResult {
  sourceId: string;
  chunkCount: number;
  tokensProcessed: number;
}

export interface Filter {
  topicId?: string;
  sourceType?: SourceType;
  userId?: string;
}

export interface RetrievedChunk {
  id: string;
  text: string;
  score: number;
  meta: SourceMeta & { sourceId: string };
}

export interface Citation {
  sourceId: string;
  chunkId: string;
  snippet: string;
  url?: string;
}

export interface GroundedAnswer {
  text: string;
  citations: Citation[];
  tokensIn: number;
  tokensOut: number;
}

// ---------- Evaluation ----------
export interface QuizAttempt {
  userId: string;
  quizId: string;
  topicId: string;
  questions: Array<{
    id: string;
    correct: string;
    userAnswer: string;
    timeMs: number;
  }>;
}

export interface ScoreResult {
  correctCount: number;
  totalCount: number;
  accuracyPct: number;
  timeTotalMs: number;
  perQuestion: Array<{ id: string; isCorrect: boolean; timeMs: number }>;
}

export interface Answer { text: string }
export interface Question { id: string; prompt: string; options: string[]; correct: string; topicId: string }

export interface Explanation {
  answerText: string;
  citations: Citation[];
  whyWrong: string;
  relatedTopics: string[];
}

export interface MasteryDelta {
  topicId: string;
  masteryBefore: number;
  masteryAfter: number;
  confidenceBefore: number;
  confidenceAfter: number;
}

export interface WeakTopic {
  topicId: string;
  mastery: number;
  confidence: number;
  lastSeen: string;
}

export interface UserPerformanceSummary {
  overallMastery: number;
  strongCount: number;
  weakCount: number;
  topicsTouched: number;
  recentActivity: string | null;
  weakTopics: WeakTopic[];
}

// ---------- Orchestrator ----------
export type MentorMode = 'explain' | 'strategy' | 'revision' | 'diagnostic';

export type ExplainReply = {
  mode: 'explain';
  answer: string;
  citations: Citation[];
  relatedTopics: string[];
};
export type StrategyReply = {
  mode: 'strategy';
  recommendation: string;
  rationale: string;
  nextSteps: string[];
  weakTopicsAddressed: string[];
};
export type RevisionReply = {
  mode: 'revision';
  topic: string;
  keyPoints: string[];
  commonMistakes: string[];
  quickQuiz?: Array<{ q: string; a: string }>;
};
export type DiagnosticReply = {
  mode: 'diagnostic';
  assessment: string;
  strengths: Array<{ topicId: string; mastery: number }>;
  gaps: Array<{ topicId: string; mastery: number }>;
  priorityFix: string;
};
export type MentorReply = ExplainReply | StrategyReply | RevisionReply | DiagnosticReply;

export interface Recommendation {
  action: 'revise' | 'practice' | 'read' | 'rest';
  topicId?: string;
  reason: string;
  estimatedMinutes: number;
}

export interface StudyPlan {
  days: Array<{
    dayIndex: number;
    date: string;
    focus: Array<{ topicId: string; minutes: number; mode: 'read' | 'quiz' | 'revise' }>;
  }>;
}

// ---------- Agent interfaces ----------
export interface KnowledgeAgent {
  readonly version: KnowledgeAgentVersion;
  ingest(source: SourceInput): Promise<IngestResult>;
  retrieve(query: string, opts?: {
    topK?: number;
    filter?: Filter;
    rerank?: boolean;
  }): Promise<RetrievedChunk[]>;
  ground(query: string, chunks: RetrievedChunk[], opts?: {
    style?: 'concise' | 'detailed';
    cite?: boolean;
    maxTokens?: number;
  }): Promise<GroundedAnswer>;
}

export interface EvaluationAgent {
  readonly version: EvaluationAgentVersion;
  readonly scoringVersion: ScoringVersion;
  evaluateAttempt(attempt: QuizAttempt): Promise<ScoreResult>;
  explainWrong(q: Question, userAnswer: Answer, correct: Answer): Promise<Explanation>;
  updateMastery(userId: string, attempt: QuizAttempt): Promise<MasteryDelta[]>;
  weakTopics(userId: string, opts?: { limit?: number }): Promise<WeakTopic[]>;
  analytics(userId: string): Promise<UserPerformanceSummary>;
  recomputeMastery(userId: string): Promise<void>;
}

export interface OrchestratorAgent {
  readonly version: OrchestratorAgentVersion;
  answer(userId: string, message: string, context?: { mode?: MentorMode }): Promise<MentorReply>;
  nextBestAction(userId: string): Promise<Recommendation>;
  studyPlan(userId: string, horizonDays: number): Promise<StudyPlan>;
}

// ---------- Trace context (passed internally between agent calls) ----------
export interface TraceContext {
  traceId: string;
  parentTraceId?: string;
  feature: 'notes' | 'quiz' | 'mentor' | 'ca' | 'test' | 'admin' | 'smoke';
}
