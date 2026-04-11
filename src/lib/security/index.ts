// ═══════════════════════════════════════════════════════════════════════════
// SECURITY MODULE INDEX - Centralized security utilities
// ═══════════════════════════════════════════════════════════════════════════

// Rate Limiting
export {
    checkRateLimit,
    withRateLimit,
    checkCostRateLimit,
    RATE_LIMITS,
    type RateLimitConfig,
    type RateLimitResult,
} from './rate-limiter';

// Admin Authorization
export {
    requireAdmin,
    hasRole,
    isSuperAdmin,
    isAdmin,
    isPremium,
    requireOwnership,
    hasPermission,
    requirePermission,
    type UserRole,
    type AuthorizedUser,
    type Permission,
} from './admin-auth';

// File Upload Validation
export {
    validateFileUpload,
    validateImageUpload,
    withFileValidation,
    ALLOWED_FILE_TYPES,
    type FileTypeConfig,
    type FileValidationResult,
} from './file-validation';

// SSRF Protection
export {
    validateExternalUrl,
    safeFetch,
    ALLOWED_DOMAINS,
    type SSRFValidationResult,
} from './ssrf-protection';

// CSRF Protection
export {
    generateCSRFToken,
    validateCSRFToken,
    withCSRFProtection,
    withFullCSRFProtection,
    setCSRFCookie,
    validateRequestOrigin,
} from './csrf';

// Input Validation Schemas
export {
    schemas,
    validateRequest,
    aiChatSchema,
    agenticQuerySchema,
    registerSchema,
    otpSchema,
    paymentInitiateSchema,
    paymentVerifySchema,
    notesGenerateSchema,
    quizGenerateSchema,
    lectureGenerateSchema,
    materialUploadSchema,
    aiProviderSchema,
    paginationSchema,
    filterSchema,
} from './validation-schemas';

// Re-export from middleware
export {
    applySecurityHeaders,
    sanitizeInput,
    isValidEmail,
    isValidIndianPhone,
    logSecurityEvent,
    secureCompare,
    generateSecureToken,
} from '../../middleware/security';

// Phase 17: Service-to-Service Token Signing (Zero-Trust)
export {
    issueServiceToken,
    verifyServiceToken,
    extractServiceToken,
    type ServiceName,
    type ServiceTokenPayload,
} from './service-tokens';

// Phase 17: Structured Privileged Action Audit Log (Zero-Trust)
export {
    writeAuditLog,
    auditRequest,
    type AuditAction,
    type AuditEntry,
} from './audit';
