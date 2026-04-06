/**
 * POST /api/onboarding/profile
 * 
 * Save user profile data from onboarding wizard (Steps 1-4).
 * 
 * Master Prompt v8.0 - F1 Smart Onboarding
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * UPSC Optional Subjects List (48 subjects)
 */
const OPTIONAL_SUBJECTS = [
  'Agriculture',
  'Animal Husbandry and Veterinary Science',
  'Anthropology',
  'Botany',
  'Chemistry',
  'Civil Engineering',
  'Commerce and Accountancy',
  'Economics',
  'Electrical Engineering',
  'Geography',
  'Geology',
  'History',
  'Law',
  'Management',
  'Mathematics',
  'Mechanical Engineering',
  'Medical Science',
  'Philosophy',
  'Physics',
  'Political Science and International Relations',
  'Psychology',
  'Public Administration',
  'Sociology',
  'Statistics',
  'Zoology',
  'Assamese',
  'Bodo',
  'Dogri',
  'Gujarati',
  'Hindi',
  'Kannada',
  'Kashmiri',
  'Konkani',
  'Maithili',
  'Malayalam',
  'Manipuri',
  'Marathi',
  'Nepali',
  'Odia',
  'Punjabi',
  'Sanskrit',
  'Santhali',
  'Sindhi',
  'Tamil',
  'Telugu',
  'Urdu',
  'English',
  'Literature of any one of the above languages',
];

/**
 * Request validation schema
 */
const profileSchema = z.object({
  user_id: z.string().uuid(),
  target_year: z.number().int().min(2026).max(2035),
  attempt_number: z.number().int().min(1).max(10),
  is_working_professional: z.boolean(),
  study_hours_per_day: z.number().int().min(2).max(16),
  optional_subject: z.string().optional(),
  preparation_stage: z.enum(['beginner', 'intermediate', 'advanced', 'revision']).default('beginner'),
});

/**
 * Save user profile
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request
    const body = await request.json();
    const { user_id, target_year, attempt_number, is_working_professional, study_hours_per_day, optional_subject, preparation_stage } = profileSchema.parse(body);

    // Validate optional subject if provided
    if (optional_subject && !OPTIONAL_SUBJECTS.some(s => s.toLowerCase().includes(optional_subject.toLowerCase()))) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid optional subject',
          available_subjects: OPTIONAL_SUBJECTS,
        },
        { status: 400 }
      );
    }

    // Upsert user profile
    const { error: profileError } = await supabase
      .from('user_profiles')
      .upsert({
        user_id,
        target_year,
        attempt_number,
        is_working_professional,
        study_hours_per_day,
        optional_subject: optional_subject || null,
        preparation_stage,
        onboarding_completed: false,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user_id);

    if (profileError) {
      console.error('Error saving user profile:', profileError);
      throw profileError;
    }

    // Log audit event
    await supabase.from('audit_logs').insert({
      user_id,
      action: 'onboarding_profile_saved',
      resource_type: 'user_profile',
      details: {
        target_year,
        attempt_number,
        is_working_professional,
        study_hours_per_day,
        optional_subject,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Profile saved successfully',
      profile: {
        user_id,
        target_year,
        attempt_number,
        is_working_professional,
        study_hours_per_day,
        optional_subject,
        preparation_stage,
      },
    });
  } catch (error) {
    console.error('Error saving profile:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to save profile',
      },
      { status: 500 }
    );
  }
}
