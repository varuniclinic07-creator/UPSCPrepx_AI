/**
 * Scoring Rubric for UPSC Mains Answer Evaluation
 * 
 * 4-Criteria scoring system (0-10 each):
 * - Structure: Introduction, Body, Conclusion flow
 * - Content: Factual accuracy, relevance, coverage
 * - Analysis: Critical thinking, multiple perspectives
 * - Presentation: Clarity, examples, diagrams
 * 
 * Master Prompt v8.0 - Rule 3: SIMPLIFIED_LANGUAGE_PROMPT
 */

export interface ScoringCriteria {
  structure: number; // 0-10
  content: number; // 0-10
  analysis: number; // 0-10
  presentation: number; // 0-10
}

export interface ScoreBreakdown {
  criteria: ScoringCriteria;
  overall: number; // 0-40
  percentage: number; // 0-100
  grade: 'Excellent' | 'Good' | 'Average' | 'Below Average' | 'Poor';
  feedback: {
    structure: string[];
    content: string[];
    analysis: string[];
    presentation: string[];
  };
}

/**
 * Scoring rubric descriptors for each level
 */
export const RUBRIC_DESCRIPTORS = {
  structure: {
    excellent: {
      range: [9, 10],
      description: 'Clear introduction with context, well-organized body with headings, balanced conclusion with way forward',
      description_hi: 'स्पष्ट परिचय, शीर्षकों के साथ अच्छी तरह से व्यवस्थित बॉडी, आगे की राह के साथ संतुलित निष्कर्ष',
    },
    good: {
      range: [7, 8],
      description: 'Good introduction and conclusion, logical flow in body',
      description_hi: 'अच्छा परिचय और निष्कर्ष, बॉडी में तार्किक प्रवाह',
    },
    average: {
      range: [5, 6],
      description: 'Basic structure present, but lacks clear organization',
      description_hi: 'मूल संरचना मौजूद, लेकिन स्पष्ट संगठन की कमी',
    },
    poor: {
      range: [0, 4],
      description: 'No clear structure, missing introduction or conclusion',
      description_hi: 'कोई स्पष्ट संरचना नहीं, परिचय या निष्कर्ष गायब',
    },
  },
  content: {
    excellent: {
      range: [9, 10],
      description: 'Highly accurate, comprehensive coverage, all dimensions addressed',
      description_hi: 'अत्यधिक सटीक, व्यापक कवरेज, सभी आयाम संबोधित',
    },
    good: {
      range: [7, 8],
      description: 'Mostly accurate, good coverage, most dimensions addressed',
      description_hi: 'ज्यादातर सटीक, अच्छा कवरेज, अधिकांश आयाम संबोधित',
    },
    average: {
      range: [5, 6],
      description: 'Some factual errors, limited coverage',
      description_hi: 'कुछ तथ्यात्मक त्रुटियां, सीमित कवरेज',
    },
    poor: {
      range: [0, 4],
      description: 'Major factual errors, irrelevant content',
      description_hi: 'प्रमुख तथ्यात्मक त्रुटियां, अप्रासंगिक सामग्री',
    },
  },
  analysis: {
    excellent: {
      range: [9, 10],
      description: 'Deep critical thinking, multiple perspectives, excellent interlinking',
      description_hi: 'गहरी आलोचनात्मक सोच, कई दृष्टिकोण, उत्कृष्ट इंटरलिंकिंग',
    },
    good: {
      range: [7, 8],
      description: 'Good analysis, some perspectives shown',
      description_hi: 'अच्छा विश्लेषण, कुछ दृष्टिकोण दिखाए गए',
    },
    average: {
      range: [5, 6],
      description: 'Basic analysis, limited perspectives',
      description_hi: 'मूल विश्लेषण, सीमित दृष्टिकोण',
    },
    poor: {
      range: [0, 4],
      description: 'No analysis, only factual statements',
      description_hi: 'कोई विश्लेषण नहीं, केवल तथ्यात्मक बयान',
    },
  },
  presentation: {
    excellent: {
      range: [9, 10],
      description: 'Excellent clarity, relevant Indian examples, mentions diagrams/flowcharts',
      description_hi: 'उत्कृष्ट स्पष्टता, प्रासंगिक भारतीय उदाहरण, आरेख/फ़्लोचार्ट का उल्लेख',
    },
    good: {
      range: [7, 8],
      description: 'Good clarity, some examples',
      description_hi: 'अच्छी स्पष्टता, कुछ उदाहरण',
    },
    average: {
      range: [5, 6],
      description: 'Readable but lacks examples',
      description_hi: 'पठनीय लेकिन उदाहरणों की कमी',
    },
    poor: {
      range: [0, 4],
      description: 'Poor clarity, no examples',
      description_hi: 'खराब स्पष्टता, कोई उदाहरण नहीं',
    },
  },
};

/**
 * Calculate scores based on AI evaluation response
 */
export function calculateScores(aiResponse: {
  structure_score: number;
  content_score: number;
  analysis_score: number;
  presentation_score: number;
}): ScoreBreakdown {
  const { structure_score, content_score, analysis_score, presentation_score } = aiResponse;
  
  const overall = structure_score + content_score + analysis_score + presentation_score;
  const percentage = Math.round((overall / 40) * 100);
  
  // Determine grade
  let grade: ScoreBreakdown['grade'];
  if (percentage >= 80) grade = 'Excellent';
  else if (percentage >= 60) grade = 'Good';
  else if (percentage >= 40) grade = 'Average';
  else if (percentage >= 20) grade = 'Below Average';
  else grade = 'Poor';

  // Generate feedback based on scores
  const feedback = {
    structure: getFeedbackForScore('structure', structure_score),
    content: getFeedbackForScore('content', content_score),
    analysis: getFeedbackForScore('analysis', analysis_score),
    presentation: getFeedbackForScore('presentation', presentation_score),
  };

  return {
    criteria: {
      structure: structure_score,
      content: content_score,
      analysis: analysis_score,
      presentation: presentation_score,
    },
    overall,
    percentage,
    grade,
    feedback,
  };
}

/**
 * Get feedback points based on score and criteria
 */
function getFeedbackForScore(criteria: keyof typeof RUBRIC_DESCRIPTORS, score: number): string[] {
  const descriptor = RUBRIC_DESCRIPTORS[criteria];
  
  if (score >= 9) {
    return [
      `Excellent ${criteria}!`,
      `Your ${criteria} is at the top level.`,
      'Keep maintaining this quality.',
    ];
  } else if (score >= 7) {
    return [
      `Good ${criteria}.`,
      `Minor improvements can make it excellent.`,
      'Focus on consistency.',
    ];
  } else if (score >= 5) {
    return [
      `Average ${criteria}.`,
      `Needs improvement in ${criteria}.`,
      'Practice more to improve.',
    ];
  } else {
    return [
      `Poor ${criteria}.`,
      `Significant improvement needed in ${criteria}.`,
      'Focus on basics first.',
    ];
  }
}

/**
 * Validate score is within range (0-10)
 */
export function validateScore(score: number): number {
  return Math.max(0, Math.min(10, score));
}

/**
 * Calculate time-based penalty (optional)
 * If answer takes too long, reduce score slightly
 */
export function calculateTimePenalty(timeTakenSec: number, timeLimitMin: number): number {
  const timeLimitSec = timeLimitMin * 60;
  
  // No penalty if within time limit
  if (timeTakenSec <= timeLimitSec) {
    return 0;
  }
  
  // Penalty: 1 point per 2 minutes over limit (max 5 points)
  const overTimeMin = (timeTakenSec - timeLimitSec) / 60;
  const penalty = Math.min(5, Math.floor(overTimeMin / 2));
  
  return penalty;
}

/**
 * Calculate word count score adjustment
 */
export function calculateWordCountAdjustment(wordCount: number, wordLimit: number): number {
  const ratio = wordCount / wordLimit;
  
  // Ideal: 90-110% of word limit
  if (ratio >= 0.9 && ratio <= 1.1) {
    return 0; // No adjustment
  }
  
  // Too short (<70%): -2 points
  if (ratio < 0.7) {
    return -2;
  }
  
  // Short (70-90%): -1 point
  if (ratio < 0.9) {
    return -1;
  }
  
  // Long (110-130%): -1 point
  if (ratio <= 1.3) {
    return -1;
  }
  
  // Too long (>130%): -2 points
  return -2;
}

/**
 * Convert numerical score to descriptive grade
 */
export function scoreToGrade(percentage: number): string {
  if (percentage >= 80) return 'Excellent (80%+)';
  if (percentage >= 60) return 'Good (60-79%)';
  if (percentage >= 40) return 'Average (40-59%)';
  if (percentage >= 20) return 'Below Average (20-39%)';
  return 'Poor (<20%)';
}

/**
 * Get color code for score display
 */
export function getScoreColor(percentage: number): string {
  if (percentage >= 80) return 'text-green-600 bg-green-50 border-green-200';
  if (percentage >= 60) return 'text-blue-600 bg-blue-50 border-blue-200';
  if (percentage >= 40) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
  if (percentage >= 20) return 'text-orange-600 bg-orange-50 border-orange-200';
  return 'text-red-600 bg-red-50 border-red-200';
}

/**
 * Generate improvement suggestions based on low scores
 */
export function generateImprovementSuggestions(scoreBreakdown: ScoreBreakdown): string[] {
  const suggestions: string[] = [];
  
  if (scoreBreakdown.criteria.structure < 6) {
    suggestions.push(
      'Start with a clear introduction that provides context.',
      'Use headings and sub-headings to organize your answer.',
      'End with a balanced conclusion that includes a way forward.',
    );
  }
  
  if (scoreBreakdown.criteria.content < 6) {
    suggestions.push(
      'Focus on factual accuracy. Verify your information.',
      'Cover all dimensions of the question (political, social, economic, etc.).',
      'Stay relevant to the question demand (discuss, analyze, examine, etc.).',
    );
  }
  
  if (scoreBreakdown.criteria.analysis < 6) {
    suggestions.push(
      'Show critical thinking, not just factual recall.',
      'Present multiple perspectives on the issue.',
      'Interlink concepts from different topics.',
    );
  }
  
  if (scoreBreakdown.criteria.presentation < 6) {
    suggestions.push(
      'Use simple and clear language.',
      'Include relevant Indian examples.',
      'Mention where you would use diagrams or flowcharts.',
    );
  }
  
  return suggestions.slice(0, 5); // Max 5 suggestions
}
