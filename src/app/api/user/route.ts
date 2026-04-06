import { NextResponse } from 'next/server';
import { getCurrentUser, requireUser, getSubscriptionDaysRemaining } from '@/lib/auth/auth-config';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/user
 * Get current user profile
 */
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Add subscription info
    const daysRemaining = getSubscriptionDaysRemaining(user);

    return NextResponse.json({
      success: true,
      user: {
        ...user,
        subscriptionDaysRemaining: daysRemaining,
        isSubscriptionActive: daysRemaining > 0,
      },
    });
  } catch (error) {
    console.error('[API] User get error:', error);

    return NextResponse.json(
      { error: 'Failed to fetch user profile' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/user
 * Update current user profile
 */
export async function PATCH(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();

    const { name, avatarUrl } = body;

    // Validate name if provided
    if (name !== undefined && (typeof name !== 'string' || name.trim().length < 2)) {
      return NextResponse.json(
        { error: 'Name must be at least 2 characters' },
        { status: 400 }
      );
    }

    // Update user profile
    const supabase = await createClient();

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name.trim();
    if (avatarUrl !== undefined) updateData.avatar_url = avatarUrl;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await (supabase.from('users') as any)
      .update(updateData)
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      console.error('[API] User update error:', error);
      throw new Error(`Failed to update profile: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      user: {
        id: data.id,
        email: data.email,
        name: data.name,
        avatarUrl: data.avatar_url,
        role: data.role,
        subscriptionTier: data.subscription_tier,
        subscriptionEndsAt: data.subscription_ends_at,
        preferences: (data as any).preferences,
      },
      message: 'Profile updated successfully',
    });
  } catch (error) {
    console.error('[API] User update error:', error);

    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Please login to update profile' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/user
 * Delete current user account
 */
export async function DELETE() {
  try {
    const user = await requireUser();
    const supabase = await createClient();

    // Delete user data (cascade should handle related records)
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', user.id);

    if (error) {
      throw new Error(`Failed to delete account: ${error.message}`);
    }

    // Sign out user
    await supabase.auth.signOut();

    return NextResponse.json({
      success: true,
      message: 'Account deleted successfully',
    });
  } catch (error) {
    console.error('[API] User delete error:', error);

    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Please login to delete account' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to delete account' },
      { status: 500 }
    );
  }
}