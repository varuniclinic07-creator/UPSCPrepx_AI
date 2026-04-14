/**
 * Readiness Score Service
 * 
 * Master Prompt v8.0 - Feature F9 (READ Mode)
 * - Calculates exam readiness score (0-100)
 * - Uses v_readiness_factors view
 * - Bilingual suggestions
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

function getSupabase() {
  return createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export interface ReadinessResult {
  score: number;
  factors: {
    coverage: number;
    accuracy: number;
    consistency: number;
    mocks: number;
  };
  readinessDate: string;
  suggestion: { en: string; hi: string };
}

export class ReadinessScoreService {
  async calculate(userId: string): Promise<ReadinessResult> {
    // Fetch readiness factors from view
    const { data: factors } = await getSupabase()
      .from('v_readiness_factors')
      .select('*')
      .single();

    if (!factors) {
      return {
        score: 0,
        factors: { coverage: 0, accuracy: 0, consistency: 0, mocks: 0 },
        readinessDate: '',
        suggestion: { en: 'Start studying to see your readiness.', hi: 'अपनी तैयारी देखने के लिए पढ़ाई शुरू करें।' },
      };
    }

    const coverage = Math.min(factors.coverage_factor || 0, 100);
    const accuracy = Math.min(factors.accuracy_factor || 0, 100);
    const consistency = Math.min(factors.consistency_factor || 0, 100);
    const mocks = Math.min(factors.mock_factor || 0, 100);

    // Weighted calculation
    const score = Math.round(
      coverage * 0.35 +
      accuracy * 0.30 +
      consistency * 0.20 +
      mocks * 0.15
    );

    // Estimate readiness date based on trend
    const daysNeeded = score > 0 ? Math.max(0, Math.round((100 - score) * 3)) : 365;
    const readinessDate = new Date(Date.now() + daysNeeded * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Generate suggestion
    let suggestion: { en: string; hi: string };
    if (coverage < 25) {
      suggestion = {
        en: 'Increase syllabus coverage.',
        hi: 'पाठ्यक्रम कवरेज बढ़ाएं।',
      };
    } else if (accuracy < 60) {
      suggestion = {
        en: 'Improve MCQ accuracy.',
        hi: 'MCQ सटीकता सुधारें।',
      };
    } else if (mocks < 30) {
      suggestion = {
        en: 'Take more mock tests.',
        hi: 'और मॉक टेस्ट लें।',
      };
    } else if (consistency < 70) {
      suggestion = {
        en: 'Maintain daily consistency.',
        hi: 'दैनिक निरंतरता बनाए रखें।',
      };
    } else {
      suggestion = {
        en: 'Keep going, you\'re on track!',
        hi: 'जारी रखें, आप सही रास्ते पर हैं!',
      };
    }

    return {
      score,
      factors: { coverage, accuracy, consistency, mocks },
      readinessDate,
      suggestion,
    };
  }
}

export const readinessScore = new ReadinessScoreService();
