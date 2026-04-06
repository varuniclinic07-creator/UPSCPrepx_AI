/**
 * Audit Logging Service
 * Tracks admin actions, security events, and compliance
 */

import { createServerSupabaseClient } from '@/lib/supabase/server';

export interface AuditLogEntry {
  userId: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export interface SecurityEvent {
  eventType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  ipAddress: string;
  userAgent?: string;
  details?: Record<string, any>;
  blocked?: boolean;
}

/**
 * Log admin action to audit trail
 */
export async function logAuditEvent(entry: AuditLogEntry): Promise<void> {
  try {
    const supabase = await createServerSupabaseClient();

    const { error } = await (supabase.rpc as any)('log_audit_event', {
      p_user_id: entry.userId,
      p_action: entry.action,
      p_resource_type: entry.resourceType,
      p_resource_id: entry.resourceId || null,
      p_old_values: entry.oldValues || null,
      p_new_values: entry.newValues || null,
      p_ip_address: entry.ipAddress || null,
      p_user_agent: entry.userAgent || null,
    });

    if (error) {
      console.error('[Audit Log] Failed to log event:', error);
    }
  } catch (error) {
    console.error('[Audit Log] Error:', error);
  }
}

/**
 * Log security event
 */
export async function logSecurityEvent(event: SecurityEvent): Promise<void> {
  try {
    const supabase = await createServerSupabaseClient();

    const { error } = await (supabase.rpc as any)('log_security_event', {
      p_event_type: event.eventType,
      p_severity: event.severity,
      p_user_id: event.userId || null,
      p_ip_address: event.ipAddress,
      p_details: event.details || null,
      p_blocked: event.blocked || false,
    });

    if (error) {
      console.error('[Security Event] Failed to log event:', error);
    }
  } catch (error) {
    console.error('[Security Event] Error:', error);
  }
}

/**
 * Get audit logs for a user (admin only)
 */
export async function getAuditLogs(filters: {
  userId?: string;
  action?: string;
  resourceType?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}) {
  const supabase = await createServerSupabaseClient();

  let query = (supabase
    .from('audit_logs') as any)
    .select('*')
    .order('created_at', { ascending: false });

  if (filters.userId) {
    query = query.eq('user_id', filters.userId);
  }

  if (filters.action) {
    query = query.eq('action', filters.action);
  }

  if (filters.resourceType) {
    query = query.eq('resource_type', filters.resourceType);
  }

  if (filters.startDate) {
    query = query.gte('created_at', filters.startDate.toISOString());
  }

  if (filters.endDate) {
    query = query.lte('created_at', filters.endDate.toISOString());
  }

  if (filters.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch audit logs: ${error.message}`);
  }

  return data;
}

/**
 * Get security events (admin only)
 */
export async function getSecurityEvents(filters: {
  eventType?: string;
  severity?: string;
  userId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}) {
  const supabase = await createServerSupabaseClient();

  let query = (supabase
    .from('security_events') as any)
    .select('*')
    .order('created_at', { ascending: false });

  if (filters.eventType) {
    query = query.eq('event_type', filters.eventType);
  }

  if (filters.severity) {
    query = query.eq('severity', filters.severity);
  }

  if (filters.userId) {
    query = query.eq('user_id', filters.userId);
  }

  if (filters.startDate) {
    query = query.gte('created_at', filters.startDate.toISOString());
  }

  if (filters.endDate) {
    query = query.lte('created_at', filters.endDate.toISOString());
  }

  if (filters.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch security events: ${error.message}`);
  }

  return data;
}
