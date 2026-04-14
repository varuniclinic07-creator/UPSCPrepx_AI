/**
 * MCQ Generator Service
 * 
 * Generates Multiple Choice Questions from current affairs articles.
 * Uses AI to create quality questions with bilingual support (EN+HI).
 * 
 * Master Prompt v8.0 - Feature F2 (READ Mode)
 * Rule 3: SIMPLIFIED_LANGUAGE_PROMPT enforced
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { callAI } from '@/lib/ai/ai-provider-client';
import { SIMPLIFIED_LANGUAGE_PROMPT } from '@/lib/onboarding/simplified-language-prompt';

let _sb: ReturnType<typeof createClient<Database>> | null = null;
function getSupabase() { if (!_sb) _sb = createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!); return _sb; }

// ============================================================================
// INTERFACES
// ============================================================================

export interface MCQOption {
  text: string;
  textHindi: string;
  isCorrect: boolean;
}

export interface MCQ {
  question: string;
  questionHindi: string;
  options: MCQOption[];
  correctAnswer: number; // 0-3 (index of correct option)
  explanation: string;
  explanationHindi: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  bloomTaxonomy: 'Remember' | 'Understand' | 'Apply' | 'Analyze' | 'Evaluate' | 'Create';
}

/** Snake_case shape returned by the AI prompt (matches JSON template in prompt) */
interface RawMCQOption {
  text: string;
  text_hindi: string;
  is_correct: boolean;
}

interface RawMCQ {
  question: string;
  question_hindi: string;
  options: RawMCQOption[];
  correct_answer: number;
  explanation: string;
  explanation_hindi: string;
  difficulty: string;
  bloom_taxonomy: string;
}

/** Database row shape returned by Supabase for ca_mcqs */
interface MCQRow {
  question: string;
  question_hindi: string;
  options: string;
  correct_answer: number;
  explanation: string;
  explanation_hindi: string;
  difficulty: string;
  bloom_taxonomy: string;
  [key: string]: unknown;
}

/** Convert snake_case AI response to camelCase MCQ */
function rawToMCQ(raw: RawMCQ): MCQ {
  return {
    question: raw.question,
    questionHindi: raw.question_hindi,
    options: raw.options.map(opt => ({
      text: opt.text,
      textHindi: opt.text_hindi,
      isCorrect: opt.is_correct,
    })),
    correctAnswer: raw.correct_answer,
    explanation: raw.explanation,
    explanationHindi: raw.explanation_hindi,
    difficulty: raw.difficulty as MCQ['difficulty'],
    bloomTaxonomy: raw.bloom_taxonomy as MCQ['bloomTaxonomy'],
  };
}

// ============================================================================
// AI PROMPT FOR MCQ GENERATION
// ============================================================================

function buildMCQGenerationPrompt(
  articleTitle: string,
  articleSummary: string,
  fullContent: string,
  count: number = 3
): string {
  return `
${SIMPLIFIED_LANGUAGE_PROMPT}

You are an expert UPSC CSE question paper setter. Your task is to create high-quality MCQs from current affairs articles.

ARTICLE INFORMATION:
===================
Title: ${articleTitle}

Summary:
${articleSummary}

Full Content:
${fullContent.substring(0, 2500)}${fullContent.length > 2500 ? '...' : ''}

TASK:
=====
Generate ${count} MCQs (Multiple Choice Questions) from this article.

MCQ REQUIREMENTS:
=================
1. Each MCQ must have:
   - Question in English (clear, unambiguous, 10th-class level)
   - Question in Hindi (accurate translation)
   - 4 options (A, B, C, D) with exactly ONE correct answer
   - Options in both English and Hindi
   - Explanation for correct answer (English + Hindi)
   - Difficulty level (Easy, Medium, Hard)
   - Bloom's taxonomy level (Remember, Understand, Apply, Analyze, Evaluate, Create)

2. Question Quality Rules:
   - Test understanding, not just memory recall
   - Include at least one application-based question
   - Avoid "All of the above" or "None of the above" as options
   - Make distractors (wrong options) plausible but clearly incorrect
   - Use simple 10th-class level language
   - No trick questions

3. Bloom's Taxonomy Distribution:
   - 1 question: Remember/Understand (basic recall)
   - 1 question: Apply/Analyze (conceptual understanding)
   - 1 question: Analyze/Evaluate (critical thinking)

4. Difficulty Distribution:
   - 1 Easy: Direct fact from article
   - 1 Medium: Requires understanding
   - 1 Hard: Application or analysis

OUTPUT FORMAT:
==============
Return a JSON array of MCQs:

[
  {
    "question": "English question text",
    "question_hindi": "Hindi question text",
    "options": [
      {"text": "Option A English", "text_hindi": "Option A Hindi", "is_correct": true},
      {"text": "Option B English", "text_hindi": "Option B Hindi", "is_correct": false},
      {"text": "Option C English", "text_hindi": "Option C Hindi", "is_correct": false},
      {"text": "Option D English", "text_hindi": "Option D Hindi", "is_correct": false}
    ],
    "correct_answer": 0,
    "explanation": "Why this answer is correct (English)",
    "explanation_hindi": "Why this answer is correct (Hindi)",
    "difficulty": "Easy|Medium|Hard",
    "bloom_taxonomy": "Remember|Understand|Apply|Analyze|Evaluate|Create"
  }
]

IMPORTANT:
- correct_answer is the INDEX (0-3) of the correct option
- Ensure exactly ONE option has is_correct: true
- Shuffle correct answer position (don't always make it A)
`;
}

// ============================================================================
// MCQ GENERATION FUNCTIONS
// ============================================================================

/**
 * Generate MCQs from a single article using AI
 */
export async function generateMCQsForArticle(
  articleId: string,
  title: string,
  summary: string,
  fullContent: string,
  count: number = 3
): Promise<MCQ[]> {
  console.debug(`Generating ${count} MCQs for article: ${title.substring(0, 50)}...`);

  try {
    // Build AI prompt
    const prompt = buildMCQGenerationPrompt(title, summary, fullContent, count);

    // Call AI with fallback chain (9Router → Groq → Ollama)
    const aiResponse = await callAI(prompt, {
      temperature: 0.5, // Moderate temperature for creativity + accuracy
      maxTokens: 2000,
    });

    // Parse JSON response (AI returns snake_case fields)
    let rawMcqs: RawMCQ[];
    try {
      rawMcqs = JSON.parse(aiResponse);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      return [];
    }

    // Validate raw MCQs before conversion
    const validRawMcqs = rawMcqs.filter(mcq => {
      // Check required fields
      if (!mcq.question || !mcq.question_hindi) return false;
      if (!Array.isArray(mcq.options) || mcq.options.length !== 4) return false;
      if (typeof mcq.correct_answer !== 'number' || mcq.correct_answer < 0 || mcq.correct_answer > 3) return false;
      if (!mcq.explanation || !mcq.explanation_hindi) return false;

      // Check options structure
      const validOptions = mcq.options.every(opt =>
        opt.text && opt.text_hindi && typeof opt.is_correct === 'boolean'
      );
      if (!validOptions) return false;

      // Check exactly one correct answer
      const correctCount = mcq.options.filter(opt => opt.is_correct).length;
      if (correctCount !== 1) return false;

      // Check correct_answer matches the is_correct option
      if (mcq.options[mcq.correct_answer].is_correct !== true) return false;

      // Validate difficulty and bloom taxonomy
      const validDifficulties = ['Easy', 'Medium', 'Hard'];
      const validBloomLevels = ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'];
      if (!validDifficulties.includes(mcq.difficulty)) return false;
      if (!validBloomLevels.includes(mcq.bloom_taxonomy)) return false;

      return true;
    });

    console.debug(`Generated ${validRawMcqs.length} valid MCQs out of ${rawMcqs.length}`);

    // Convert from snake_case to camelCase MCQ type
    return validRawMcqs.map(rawToMCQ);
  } catch (error) {
    console.error('MCQ generation failed:', error);
    return [];
  }
}

/**
 * Save MCQs to database
 */
export async function saveMCQs(
  articleId: string,
  mcqs: MCQ[]
): Promise<void> {
  if (mcqs.length === 0) {
    console.debug('No MCQs to save');
    return;
  }

  try {
    const mcqsToInsert = mcqs.map(mcq => ({
      article_id: articleId,
      question: mcq.question,
      question_hindi: mcq.questionHindi,
      options: JSON.stringify(mcq.options),
      correct_answer: mcq.correctAnswer,
      explanation: mcq.explanation,
      explanation_hindi: mcq.explanationHindi,
      difficulty: mcq.difficulty,
      bloom_taxonomy: mcq.bloomTaxonomy,
      is_active: true,
    }));

    const { error } = await (getSupabase()
      .from('ca_mcqs') as any)
      .insert(mcqsToInsert);

    if (error) throw error;

    console.debug(`Saved ${mcqs.length} MCQs for article ${articleId}`);
  } catch (error) {
    console.error('Failed to save MCQs:', error);
    throw error;
  }
}

/**
 * Process multiple articles for MCQ generation
 */
export async function processArticlesForMCQs(
  articles: Array<{
    id: string;
    title: string;
    summary: string;
    full_content: string;
  }>,
  mcqsPerArticle: number = 3
): Promise<number> {
  console.debug(`Processing ${articles.length} articles for MCQ generation...`);

  let totalMcqs = 0;
  let successCount = 0;
  let errorCount = 0;

  for (const article of articles) {
    try {
      // Generate MCQs
      const mcqs = await generateMCQsForArticle(
        article.id,
        article.title,
        article.summary,
        article.full_content,
        mcqsPerArticle
      );

      if (mcqs.length > 0) {
        // Save to database
        await saveMCQs(article.id, mcqs);
        totalMcqs += mcqs.length;
        successCount++;

        console.debug(`✓ Article ${article.id}: ${mcqs.length} MCQs`);
      } else {
        console.debug(`⚠ Article ${article.id}: No valid MCQs generated`);
      }
    } catch (error) {
      console.error(`✗ Article ${article.id} failed:`, error);
      errorCount++;
    }

    // Rate limiting: Wait 1000ms between articles to avoid API rate limits
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.debug(
    `\n=== MCQ Generation Complete ===
Success: ${successCount}/${articles.length}
Errors: ${errorCount}
Total MCQs: ${totalMcqs}
Average: ${(totalMcqs / Math.max(successCount, 1)).toFixed(1)} per article
`
  );

  return totalMcqs;
}

// ============================================================================
// MCQ VALIDATION
// ============================================================================

/**
 * Validate MCQ structure and content
 */
export function validateMCQ(mcq: MCQ): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check question
  if (!mcq.question || mcq.question.length < 10) {
    errors.push('Question too short or missing');
  }
  if (!mcq.questionHindi || mcq.questionHindi.length < 10) {
    errors.push('Hindi question too short or missing');
  }

  // Check options
  if (!Array.isArray(mcq.options) || mcq.options.length !== 4) {
    errors.push('Must have exactly 4 options');
  } else {
    const correctCount = mcq.options.filter(opt => opt.isCorrect).length;
    if (correctCount === 0) {
      errors.push('No correct answer specified');
    } else if (correctCount > 1) {
      errors.push('Multiple correct answers specified');
    }

    // Check all options are unique
    const optionTexts = mcq.options.map(opt => opt.text.toLowerCase().trim());
    const uniqueTexts = new Set(optionTexts);
    if (uniqueTexts.size !== 4) {
      errors.push('Duplicate options detected');
    }

    // Check correctAnswer index
    if (typeof mcq.correctAnswer !== 'number' || mcq.correctAnswer < 0 || mcq.correctAnswer > 3) {
      errors.push('Invalid correctAnswer index');
    } else if (!mcq.options[mcq.correctAnswer]?.isCorrect) {
      errors.push('correctAnswer does not match isCorrect option');
    }
  }

  // Check explanation
  if (!mcq.explanation || mcq.explanation.length < 10) {
    errors.push('Explanation too short or missing');
  }
  if (!mcq.explanationHindi || mcq.explanationHindi.length < 10) {
    errors.push('Hindi explanation too short or missing');
  }

  // Check difficulty
  const validDifficulties = ['Easy', 'Medium', 'Hard'];
  if (!validDifficulties.includes(mcq.difficulty)) {
    errors.push(`Invalid difficulty: ${mcq.difficulty}`);
  }

  // Check bloom taxonomy
  const validBloomLevels = ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'];
  if (!validBloomLevels.includes(mcq.bloomTaxonomy)) {
    errors.push(`Invalid bloomTaxonomy: ${mcq.bloomTaxonomy}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// MCQ QUALITY IMPROVEMENT
// ============================================================================

/**
 * Improve MCQ quality using AI feedback
 */
export async function improveMCQQuality(
  mcq: MCQ,
  articleContent: string
): Promise<MCQ> {
  const prompt = `
${SIMPLIFIED_LANGUAGE_PROMPT}

Review and improve this MCQ for quality:

ORIGINAL MCQ:
Question: ${mcq.question}
Options: ${JSON.stringify(mcq.options, null, 2)}
Correct Answer: ${mcq.correctAnswer}
Explanation: ${mcq.explanation}

ARTICLE CONTENT:
${articleContent.substring(0, 1500)}...

IMPROVEMENT CRITERIA:
1. Is the question clear and unambiguous?
2. Are all options plausible but only one correct?
3. Is the explanation accurate and helpful?
4. Is the language at 10th-class level?
5. Does it test understanding, not just memory?

Return improved MCQ in same JSON format, or return original if no improvements needed.
`;

  try {
    const aiResponse = await callAI(prompt, {
      temperature: 0.3,
      maxTokens: 1000,
    });

    const improvedRaw: RawMCQ = JSON.parse(aiResponse);
    const improvedMcq = rawToMCQ(improvedRaw);

    // Validate improved MCQ
    const validation = validateMCQ(improvedMcq);
    if (validation.isValid) {
      return improvedMcq;
    }

    // If invalid, return original
    return mcq;
  } catch (error) {
    console.error('MCQ improvement failed:', error);
    return mcq;
  }
}

// ============================================================================
// GET MCQS FOR ARTICLE
// ============================================================================

/**
 * Get MCQs for a specific article from database
 */
export async function getMCQsForArticle(articleId: string): Promise<MCQ[]> {
  const { data, error } = await getSupabase()
    .from('ca_mcqs')
    .select('*')
    .eq('article_id', articleId)
    .eq('is_active', true)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Failed to fetch MCQs:', error);
    return [];
  }

  if (!data || data.length === 0) {
    return [];
  }

  // Cast rows from Supabase (table may not be in generated types)
  const rows = data as unknown as MCQRow[];

  // Parse options from JSON string and convert to camelCase MCQ
  return rows.map(mcq => ({
    question: mcq.question,
    questionHindi: mcq.question_hindi,
    options: JSON.parse(mcq.options) as MCQOption[],
    correctAnswer: mcq.correct_answer,
    explanation: mcq.explanation,
    explanationHindi: mcq.explanation_hindi,
    difficulty: mcq.difficulty as MCQ['difficulty'],
    bloomTaxonomy: mcq.bloom_taxonomy as MCQ['bloomTaxonomy'],
  }));
}

// ============================================================================
// CLI USAGE
// ============================================================================

if (typeof require !== 'undefined' && require.main === module) {
  console.error('MCQ Generator Service - Use processArticlesForMCQs() function');
  process.exit(1);
}
