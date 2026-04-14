// Re-export database types
export type { Database, Tables, TablesInsert, TablesUpdate, Json } from './supabase';

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
export interface NoteSection {
  title: string;
  content: string;
}

export interface NoteContent {
  summary?: string;
  introduction?: string;
  sections?: NoteSection[];
  keyPoints: string[];
  details?: string;
  valueAdditions?: string[];
  quiz?: QuizQuestion[];
  sources?: string[];
  mnemonics?: string[];
  pyqConnections?: string[];
  upscRelevance?: string;
  relatedTopics?: string[];
}

export interface Note {
  id: string;
  userId: string;
  topic: string;
  title: string; // Alias for topic
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
  tags?: string[];
}

export interface Quiz {
  id: string;
  userId: string;
  topic: string;
  subject: string;
  questions: QuizQuestion[];
  totalQuestions: number;
  timeLimit: number;
  passingScore: number;
  createdAt: Date;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  userId: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  timeTaken: number;
  passed: boolean;
  answers: Record<string, number>;
  questionResults: { questionId: string; correct: boolean; userAnswer: number }[];
  completedAt: Date;
}

// Current Affairs types
export interface CurrentAffairContent {
  summary: string;
  details: string;
  keyPoints: string[];
  upscRelevance: string;
  relatedTopics: string[];
  sources: string[];
  pyqConnections: string[];
}

export interface CurrentAffair {
  id: string;
  topic: string;
  category: string;
  content: CurrentAffairContent;
  date: string;
  isPublished: boolean;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
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