// ═══════════════════════════════════════════════════════════════════════════
// ADMIN AUTHORIZATION - Role-based access control for admin endpoints
// ═══════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logSecurityEvent } from '@/middleware/security';

export type UserRole = 'user' | 'premium' | 'admin' | 'super_admin';

export interface AuthorizedUser {
    id: string;
    email: string;
    role: UserRole;
    name?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// ROLE HIERARCHY
// ═══════════════════════════════════════════════════════════════════════════

const ROLE_HIERARCHY: Record<UserRole, number> = {
    user: 1,
    premium: 2,
    admin: 3,
    super_admin: 4,
};

// ═══════════════════════════════════════════════════════════════════════════
// ADMIN AUTHORIZATION MIDDLEWARE
// ═══════════════════════════════════════════════════════════════════════════

export async function requireAdmin(
    req: NextRequest
): Promise<{ user: AuthorizedUser } | NextResponse> {
    try {
        const supabase = await createClient();

        // Get authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            logSecurityEvent({
                type: 'auth_failure',
                ip: req.headers.get('x-forwarded-for') || 'unknown',
                userAgent: req.headers.get('user-agent') || 'unknown',
                details: { reason: 'No session', endpoint: req.nextUrl.pathname },
            });

            return NextResponse.json(
                { error: 'Unauthorized', message: 'Authentication required' },
                { status: 401 }
            );
        }

        // Get user role from database
        const { data: userData, error: userError } = await (supabase
            .from('users') as any)
            .select('id, email, name, role')
            .eq('id', user.id)
            .single();

        if (userError || !userData) {
            return NextResponse.json(
                { error: 'Unauthorized', message: 'User not found' },
                { status: 401 }
            );
        }

        const userRole = (userData.role as UserRole) || 'user';

        // Check if user has admin role
        if (ROLE_HIERARCHY[userRole] < ROLE_HIERARCHY['admin']) {
            logSecurityEvent({
                type: 'auth_failure',
                userId: user.id,
                ip: req.headers.get('x-forwarded-for') || 'unknown',
                userAgent: req.headers.get('user-agent') || 'unknown',
                details: {
                    reason: 'Insufficient permissions',
                    requiredRole: 'admin',
                    actualRole: userRole,
                    endpoint: req.nextUrl.pathname,
                },
            });

            return NextResponse.json(
                { error: 'Forbidden', message: 'Admin access required' },
                { status: 403 }
            );
        }

        // Log admin action
        logSecurityEvent({
            type: 'admin_action',
            userId: user.id,
            ip: req.headers.get('x-forwarded-for') || 'unknown',
            userAgent: req.headers.get('user-agent') || 'unknown',
            details: {
                endpoint: req.nextUrl.pathname,
                method: req.method,
            },
        });

        return {
            user: {
                id: userData.id,
                email: userData.email,
                role: userRole,
                name: userData.name,
            },
        };
    } catch (error) {
        console.error('[AdminAuth] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// ROLE CHECK UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

export function hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
    return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

export function isSuperAdmin(role: UserRole): boolean {
    return role === 'super_admin';
}

export function isAdmin(role: UserRole): boolean {
    return hasRole(role, 'admin');
}

export function isPremium(role: UserRole): boolean {
    return hasRole(role, 'premium');
}

// ═══════════════════════════════════════════════════════════════════════════
// RESOURCE OWNERSHIP AUTHORIZATION
// ═══════════════════════════════════════════════════════════════════════════

export async function requireOwnership(
    userId: string,
    resourceTable: string,
    resourceId: string
): Promise<boolean> {
    const supabase = await createClient();

    const { data, error } = await (supabase
        .from(resourceTable) as any)
        .select('user_id')
        .eq('id', resourceId)
        .single();

    if (error || !data) {
        return false;
    }

    return data.user_id === userId;
}

// ═══════════════════════════════════════════════════════════════════════════
// PERMISSION-BASED AUTHORIZATION
// ═══════════════════════════════════════════════════════════════════════════

export type Permission =
    | 'users:read' | 'users:write' | 'users:delete'
    | 'materials:read' | 'materials:write' | 'materials:delete'
    | 'ai_providers:read' | 'ai_providers:write' | 'ai_providers:delete'
    | 'features:read' | 'features:write'
    | 'leads:read' | 'leads:export'
    | 'analytics:read'
    | 'system:configure';

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
    user: [],
    premium: [],
    admin: [
        'users:read',
        'materials:read', 'materials:write', 'materials:delete',
        'ai_providers:read',
        'features:read',
        'leads:read',
        'analytics:read',
    ],
    super_admin: [
        'users:read', 'users:write', 'users:delete',
        'materials:read', 'materials:write', 'materials:delete',
        'ai_providers:read', 'ai_providers:write', 'ai_providers:delete',
        'features:read', 'features:write',
        'leads:read', 'leads:export',
        'analytics:read',
        'system:configure',
    ],
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
    return ROLE_PERMISSIONS[role]?.includes(permission) || false;
}

export function requirePermission(
    role: UserRole,
    permission: Permission
): NextResponse | null {
    if (!hasPermission(role, permission)) {
        return NextResponse.json(
            {
                error: 'Forbidden',
                message: `Missing permission: ${permission}`
            },
            { status: 403 }
        );
    }
    return null;
}
