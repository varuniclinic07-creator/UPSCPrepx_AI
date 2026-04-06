export const APP_CONFIG = {
  NAME: 'UPSC CSE Master',
  VERSION: '1.0.0',
  DESCRIPTION: 'AI-powered UPSC preparation platform',
} as const;

export const RATE_LIMITS = {
  A4F_RPM: 10,
  API_PER_MINUTE: 60,
  API_PER_HOUR: 1000,
} as const;

export const TIMEOUTS = {
  API_REQUEST: 30000,
  WEBHOOK: 10000,
  DATABASE_QUERY: 15000,
} as const;

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

export const SUBSCRIPTION_TIERS = {
  TRIAL: 'trial',
  BASIC: 'basic',
  PREMIUM: 'premium',
  PREMIUM_PLUS: 'premium_plus',
} as const;

export const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin',
} as const;

export const CACHE_TTL = {
  SHORT: 60,
  MEDIUM: 300,
  LONG: 3600,
  DAY: 86400,
} as const;

export const FILE_LIMITS = {
  MAX_UPLOAD_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_WEBHOOK_SIZE: 1024 * 1024, // 1MB
} as const;
