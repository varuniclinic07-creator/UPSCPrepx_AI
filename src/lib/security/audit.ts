/**
 * Phase 17: Zero-Trust — Structured Audit Log for Privileged Operations
 *
 * Every admin or privileged action (role change, subscription override,
 * plan modification, user deletion, feature flag toggle, queue retry, etc.)
 * MUST emit an audit entry. Audit entries are immutable, append-only records
 * stored in the `audit_logs` table and also written to structured server logs.
 *
 * Design principles:
 * - Deny by default: if an operation cannot be audited, it should not proceed
 * - Server-side only: this module must never be imported from client components
 * - Correlation IDs: every entry links back to the request or job that caused it
 */

import { createClient } from '@/lib/supabase/server';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type AuditAction =
  // User management
  | 'user.role_changed'
  | 'user.deleted'
  | 'user.suspended'
  | 'user.unsuspended'
  | 'user.data_exported'
  // Subscription / billing
  | 'subscription.created'
  | 'subscription.cancelled'
  | 'subscription.plan_changed'
  | 'subscription.override_applied'
  | 'subscription.refund_issued'
  // AI provider management
  | 'ai_provider.enabled'
  | 'ai_provider.disabled'
  | 'ai_provider.key_rotated'
  | 'ai_provider.priority_changed'
  // Feature flags
  | 'feature_flag.enabled'
  | 'feature_flag.disabled'
  | 'feature_flag.rollout_changed'
  // Queue / jobs
  | 'queue.job_retried'
  | 'queue.job_cancelled'
  | 'queue.flushed'
  // Content
  | 'content.approved'
  | 'content.rejected'
  | 'content.deleted'
  // Security
  | 'security.rate_limit_overridden'
  | 'security.ip_blocked'
  | 'security.ip_unblocked'
  // System
  | 'system.config_changed'
  | 'system.maintenance_mode_toggled';

export interface AuditEntry {
  id?: string;
  action: AuditAction;
  actorId: string;          // User ID of the admin performing the action
  actorEmail?: string;      // Email for readability in logs
  targetId?: string;        // Entity being acted upon (user, job, flag, etc.)
  targetType?: string;      // 'user' | 'subscription' | 'feature_flag' | etc.
  before?: Record<string, unknown>; // State before change
  after?: Record<string, unknown>;  // State after change
  reason?: string;          // Human-readable justification
  requestId?: string;       // Correlation ID from the HTTP request
  ipAddress?: string;
  userAgent?: string;
  timestamp?: string;       // ISO — set automatically if omitted
}

// ═══════════════════════════════════════════════════════════════════════════
// AUDIT LOG WRITER
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Write an audit entry. Never throws — logs the error if the DB write fails
 * so that the calling operation is not blocked by an audit failure.
 */
export async function writeAuditLog(entry: AuditEntry): Promise<void> {
  const ts = entry.timestamp ?? new Date().toISOString();

  // Always write to structured server logs first (durable regardless of DB)
  const logLine = JSON.stringify({
    level: 'audit',
    action: entry.action,
    actorId: entry.actorId,
    actorEmail: entry.actorEmail,
    targetId: entry.targetId,
    targetType: entry.targetType,
    before: entry.before,
    after: entry.after,
    reason: entry.reason,
    requestId: entry.requestId,
    ipAddress: entry.ipAddress,
    timestamp: ts,
  });
  console.log(logLine);

  // Attempt DB write (best-effort)
  try {
    const supabase = await createClient();
    await (supabase as any).from('audit_logs').insert({
      action: entry.action,
      actor_id: entry.actorId,
      actor_email: entry.actorEmail ?? null,
      target_id: entry.targetId ?? null,
      target_type: entry.targetType ?? null,
      before_state: entry.before ?? null,
      after_state: entry.after ?? null,
      reason: entry.reason ?? null,
      request_id: entry.requestId ?? null,
      ip_address: entry.ipAddress ?? null,
      user_agent: entry.userAgent ?? null,
      created_at: ts,
    });
  } catch (err) {
    // Never block the operation — just log
    console.error('Audit log DB write failed:', err);
  }
}

/**
 * Convenience wrapper: extract actor + request metadata from a Next.js request
 * and write the audit entry.
 *
 * @example
 * await auditRequest(request, {
 *   action: 'user.role_changed',
 *   actorId: admin.id,
 *   actorEmail: admin.email,
 *   targetId: userId,
 *   targetType: 'user',
 *   before: { role: 'user' },
 *   after: { role: 'admin' },
 *   reason: 'Promoted by super_admin',
 * });
 */
export async function auditRequest(
  request: { headers: Headers; nextUrl?: { pathname?: string } },
  entry: Omit<AuditEntry, 'ipAddress' | 'userAgent' | 'requestId'>
): Promise<void> {
  await writeAuditLog({
    ...entry,
    ipAddress: request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? undefined,
    userAgent: request.headers.get('user-agent') ?? undefined,
    requestId: request.headers.get('x-request-id') ?? undefined,
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// AUDIT LOG MIGRATION SQL (reference — apply via Supabase dashboard or CLI)
// ═══════════════════════════════════════════════════════════════════════════
//
// CREATE TABLE IF NOT EXISTS audit_logs (
//   id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
//   action      TEXT NOT NULL,
//   actor_id    UUID NOT NULL,
//   actor_email TEXT,
//   target_id   TEXT,
//   target_type TEXT,
//   before_state JSONB,
//   after_state  JSONB,
//   reason      TEXT,
//   request_id  TEXT,
//   ip_address  TEXT,
//   user_agent  TEXT,
//   created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
// );
//
// -- Audit logs are append-only. Revoke DELETE/UPDATE from service_role if desired:
// -- REVOKE DELETE, UPDATE ON audit_logs FROM service_role;
//
// -- Index for common queries
// CREATE INDEX idx_audit_logs_actor  ON audit_logs(actor_id, created_at DESC);
// CREATE INDEX idx_audit_logs_action ON audit_logs(action, created_at DESC);
// CREATE INDEX idx_audit_logs_target ON audit_logs(target_id, target_type, created_at DESC);
