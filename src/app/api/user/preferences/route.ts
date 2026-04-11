import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/auth-config';
import { createClient } from '@/lib/supabase/server';
import type { Json } from '@/types';

export const dynamic = 'force-dynamic';

export interface UserPreferences {
  theme?: 'light' | 'dark' | 'system';
  language?: 'en' | 'hi';
  notifications?: {
    email?: boolean;
    push?: boolean;
    dailyDigest?: boolean;
  };
  studyReminders?: {
    enabled?: boolean;
    time?: string;
    days?: string[];
  };
  displaySettings?: {
    fontSize?: 'small' | 'medium' | 'large';
    compactMode?: boolean;
  };
}

/**
 * GET /api/user/preferences
 * Get user preferences
 */
export async function GET() {
  try {
    const user = await requireUser();

    return NextResponse.json({
      success: true,
      preferences: user.preferences || getDefaultPreferences(),
    });
  } catch (error) {
    console.error('[API] Preferences get error:', error);

    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Please login to view preferences' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch preferences' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/user/preferences
 * Update user preferences
 */
export async function PATCH(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();

    // Merge with existing preferences
    const currentPreferences = (user.preferences || {}) as UserPreferences;
    const newPreferences: UserPreferences = {
      ...currentPreferences,
      ...body,
    };

    // Validate theme
    if (newPreferences.theme && !['light', 'dark', 'system'].includes(newPreferences.theme)) {
      return NextResponse.json(
        { error: 'Invalid theme value' },
        { status: 400 }
      );
    }

    // Validate language
    if (newPreferences.language && !['en', 'hi'].includes(newPreferences.language)) {
      return NextResponse.json(
        { error: 'Invalid language value' },
        { status: 400 }
      );
    }

    // Merge nested objects properly
    if (body.notifications) {
      newPreferences.notifications = {
        ...currentPreferences.notifications,
        ...body.notifications,
      };
    }

    if (body.studyReminders) {
      newPreferences.studyReminders = {
        ...currentPreferences.studyReminders,
        ...body.studyReminders,
      };
    }

    if (body.displaySettings) {
      newPreferences.displaySettings = {
        ...currentPreferences.displaySettings,
        ...body.displaySettings,
      };
    }

    // Update in database
    const supabase = await createClient();

    const { error } = await (supabase.from('users') as any)
      .update({
        preferences: newPreferences as unknown as Json,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (error) {
      throw new Error(`Failed to update preferences: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      preferences: newPreferences,
      message: 'Preferences updated successfully',
    });
  } catch (error) {
    console.error('[API] Preferences update error:', error);

    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Please login to update preferences' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update preferences' },
      { status: 500 }
    );
  }
}

/**
 * Get default preferences for new users
 */
function getDefaultPreferences(): UserPreferences {
  return {
    theme: 'system',
    language: 'en',
    notifications: {
      email: true,
      push: false,
      dailyDigest: true,
    },
    studyReminders: {
      enabled: false,
      time: '09:00',
      days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    },
    displaySettings: {
      fontSize: 'medium',
      compactMode: false,
    },
  };
}