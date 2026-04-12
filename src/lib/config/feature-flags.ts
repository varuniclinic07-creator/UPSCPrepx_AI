// ═══════════════════════════════════════════════════════════════
// FEATURE FLAGS
// Central config wired to ENABLE_* env vars from env.production
// ═══════════════════════════════════════════════════════════════

function envBool(key: string, fallback: boolean): boolean {
  const val = process.env[key];
  if (val === undefined) return fallback;
  return val === 'true' || val === '1';
}

export const featureFlags = {
  // Caching & Performance
  requestCaching: envBool('ENABLE_REQUEST_CACHING', true),
  compression: envBool('ENABLE_COMPRESSION', true),

  // AI & Content
  userGroqKey: envBool('ENABLE_USER_GROQ_KEY', true),
  syllabusCheck: envBool('ENABLE_SYLLABUS_CHECK', true),
  factChecking: envBool('ENABLE_FACT_CHECKING', true),
  agenticSearch: envBool('ENABLE_AGENTIC_SEARCH', true),
  videoGeneration: envBool('ENABLE_VIDEO_GENERATION', true),

  // Features
  pdfExport: envBool('ENABLE_PDF_EXPORT', true),
  livePreviews: envBool('ENABLE_LIVE_PREVIEWS', true),
  mockInterviews: envBool('ENABLE_MOCK_INTERVIEWS', true),

  // Accounts & Access
  maintenanceMode: envBool('ENABLE_MAINTENANCE_MODE', false),
  newStudentRegistration: envBool('ENABLE_NEW_STUDENT_REGISTRATION', true),
  trialAccounts: envBool('ENABLE_TRIAL_ACCOUNTS', true),

  // Compliance
  cookieConsent: envBool('ENABLE_COOKIE_CONSENT', true),
  dataExport: envBool('ENABLE_DATA_EXPORT', true),
  dataDeletion: envBool('ENABLE_DATA_DELETION', true),

  // Debug / Dev
  debugMode: envBool('ENABLE_DEBUG_MODE', false),
  apiDocs: envBool('ENABLE_API_DOCS', false),
  queryLogging: envBool('ENABLE_QUERY_LOGGING', false),
} as const;

export type FeatureFlags = typeof featureFlags;
