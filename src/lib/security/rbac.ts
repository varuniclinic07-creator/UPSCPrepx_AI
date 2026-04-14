/**
 * Role-Based Access Control (RBAC)
 * Fine-grained permissions matrix and resource-level access control
 * OWASP-compliant authorization for UPSC PrepX-AI
 */

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// ═══════════════════════════════════════════════════════════
// ROLE DEFINITIONS
// ═══════════════════════════════════════════════════════════

export type UserRole = 'guest' | 'user' | 'premium' | 'admin' | 'super_admin';

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  guest: 0,
  user: 1,
  premium: 2,
  admin: 3,
  super_admin: 4,
};

// ═══════════════════════════════════════════════════════════
// PERMISSION DEFINITIONS
// ═══════════════════════════════════════════════════════════

export type Resource =
  | 'users'
  | 'subscriptions'
  | 'payments'
  | 'notes'
  | 'quizzes'
  | 'lectures'
  | 'ai_chat'
  | 'ai_generate'
  | 'bookmarks'
  | 'analytics'
  | 'admin_panel'
  | 'system_config'
  | 'feature_flags'
  | 'ai_providers'
  | 'materials'
  | 'current_affairs';

export type Action = 'read' | 'write' | 'delete' | 'admin';

export type Permission = `${Action}:${Resource}`;

// ═══════════════════════════════════════════════════════════
// PERMISSIONS MATRIX
// ═══════════════════════════════════════════════════════════

export const PERMISSIONS_MATRIX: Record<UserRole, Permission[]> = {
  guest: [],

  user: [
    'read:notes',
    'read:quizzes',
    'read:lectures',
    'read:current_affairs',
    'read:materials',
    'write:bookmarks',
    'read:bookmarks',
    'write:ai_chat',
    'write:ai_generate',
    'read:analytics',
    'read:subscriptions',
  ],

  premium: [
    'read:notes',
    'read:quizzes',
    'read:lectures',
    'read:current_affairs',
    'read:materials',
    'write:bookmarks',
    'read:bookmarks',
    'write:ai_chat',
    'write:ai_generate',
    'read:analytics',
    'read:subscriptions',
    'write:subscriptions',
    'read:payments',
    'write:payments',
  ],

  admin: [
    'read:users',
    'write:users',
    'read:notes',
    'write:notes',
    'delete:notes',
    'read:quizzes',
    'write:quizzes',
    'delete:quizzes',
    'read:lectures',
    'write:lectures',
    'delete:lectures',
    'read:current_affairs',
    'write:current_affairs',
    'read:materials',
    'write:materials',
    'delete:materials',
    'read:bookmarks',
    'read:ai_chat',
    'read:ai_generate',
    'read:analytics',
    'read:subscriptions',
    'write:subscriptions',
    'read:payments',
    'read:admin_panel',
    'read:feature_flags',
    'write:feature_flags',
    'read:ai_providers',
    'write:ai_providers',
  ],

  super_admin: [
    'read:users',
    'write:users',
    'delete:users',
    'read:notes',
    'write:notes',
    'delete:notes',
    'read:quizzes',
    'write:quizzes',
    'delete:quizzes',
    'read:lectures',
    'write:lectures',
    'delete:lectures',
    'read:current_affairs',
    'write:current_affairs',
    'read:materials',
    'write:materials',
    'delete:materials',
    'read:bookmarks',
    'delete:bookmarks',
    'read:ai_chat',
    'write:ai_chat',
    'admin:ai_chat',
    'read:ai_generate',
    'write:ai_generate',
    'admin:ai_generate',
    'read:analytics',
    'admin:analytics',
    'read:subscriptions',
    'write:subscriptions',
    'admin:subscriptions',
    'read:payments',
    'admin:payments',
    'read:admin_panel',
    'write:admin_panel',
    'read:feature_flags',
    'write:feature_flags',
    'admin:feature_flags',
    'read:ai_providers',
    'write:ai_providers',
    'admin:ai_providers',
    'read:system_config',
    'write:system_config',
  ],
};

// ═══════════════════════════════════════════════════════════
// RBAC HELPERS
// ═══════════════════════════════════════════════════════════

/**
 * Check if role has permission
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  return PERMISSIONS_MATRIX[role]?.includes(permission) || false;
}

/**
 * Check if role has any of the permissions
 */
export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(role, p));
}

/**
 * Check if role has all permissions
 */
export function hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
  return permissions.every((p) => hasPermission(role, p));
}

/**
 * Check if role can perform action on resource
 */
export function can(role: UserRole, action: Action, resource: Resource): boolean {
  return hasPermission(role, `${action}:${resource}`);
}

/**
 * Get user's role from database
 */
export async function getUserRole(userId: string): Promise<UserRole> {
  const supabase = await createClient();

  const { data, error } = await supabase.from('users').select('role').eq('id', userId).single();

  if (error || !data) {
    return 'guest';
  }

  return (data.role as UserRole) || 'user';
}

/**
 * Get current user's role from request session
 */
export async function getCurrentUserRole(request: NextRequest): Promise<UserRole> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return 'guest';
    }

    return await getUserRole(user.id);
  } catch {
    return 'guest';
  }
}

// ═══════════════════════════════════════════════════════════
// RBAC MIDDLEWARE
// ═══════════════════════════════════════════════════════════

export interface RBACOptions {
  requiredPermissions?: Permission[];
  requiredRole?: UserRole;
  allowHigherRoles?: boolean;
}

/**
 * RBAC middleware for API routes
 */
export async function withRBAC(
  request: NextRequest,
  handler: () => Promise<NextResponse>,
  options: RBACOptions = {}
): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const userRole = await getUserRole(user.id);

    // Check required role
    if (options.requiredRole) {
      const hasRole = options.allowHigherRoles
        ? ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[options.requiredRole]
        : userRole === options.requiredRole;

      if (!hasRole) {
        return NextResponse.json(
          {
            error: 'Insufficient permissions',
            requiredRole: options.requiredRole,
            actualRole: userRole,
            code: 'INSUFFICIENT_ROLE',
          },
          { status: 403 }
        );
      }
    }

    // Check required permissions
    if (options.requiredPermissions && options.requiredPermissions.length > 0) {
      const hasPermissions = hasAllPermissions(userRole, options.requiredPermissions);

      if (!hasPermissions) {
        const missingPermissions = options.requiredPermissions.filter(
          (p) => !hasPermission(userRole, p)
        );

        return NextResponse.json(
          {
            error: 'Missing permissions',
            missingPermissions,
            userRole,
            code: 'MISSING_PERMISSIONS',
          },
          { status: 403 }
        );
      }
    }

    return handler();
  } catch (error) {
    console.error('[RBAC] Error:', error);
    return NextResponse.json(
      { error: 'Authorization failed', code: 'AUTH_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * Resource-level ownership check
 */
export async function requireOwnership(
  userId: string,
  resource: Resource,
  resourceId: string
): Promise<boolean> {
  const supabase = await createClient();

  const tableMap: Record<Resource, string> = {
    users: 'users',
    subscriptions: 'subscriptions',
    payments: 'payments',
    notes: 'user_notes',
    quizzes: 'quiz_attempts',
    lectures: 'user_lectures',
    ai_chat: 'chat_history',
    ai_generate: 'generated_content',
    bookmarks: 'bookmarks',
    analytics: 'user_analytics',
    admin_panel: 'users',
    system_config: 'users',
    feature_flags: 'users',
    ai_providers: 'users',
    materials: 'user_materials',
    current_affairs: 'user_current_affairs',
  };

  const tableName = tableMap[resource] || 'users';

  const { data, error } = await (supabase as any)
    .from(tableName)
    .select('user_id')
    .eq('id', resourceId)
    .single();

  if (error || !data) {
    return false;
  }

  return (data as any).user_id === userId;
}

/**
 * Check resource ownership with admin bypass
 */
export async function canAccessResource(
  userId: string,
  userRole: UserRole,
  resource: Resource,
  resourceId: string,
  action: Action
): Promise<boolean> {
  // Admin+ can access any resource
  if (ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY['admin']) {
    return can(userRole, action, resource);
  }

  // For write/delete, check ownership
  if (action === 'write' || action === 'delete') {
    return requireOwnership(userId, resource, resourceId);
  }

  // For read, check permission
  return can(userRole, 'read', resource);
}

// ═══════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════

export const rbac = {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  can,
  getUserRole,
  getCurrentUserRole,
  withRBAC,
  requireOwnership,
  canAccessResource,
};
