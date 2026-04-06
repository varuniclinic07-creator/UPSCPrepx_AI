/**
 * SIMPLIFIED_LANGUAGE_PROMPT - Master Prompt v8.0 Rule 3
 * 
 * CRITICAL: This prompt MUST be prepended to EVERY AI call
 * that generates user-facing content.
 * 
 * Purpose: Ensure all content is understandable by a 10th-class student.
 */

export const SIMPLIFIED_LANGUAGE_PROMPT = `
CRITICAL LANGUAGE RULES — FOLLOW STRICTLY:

1. Write for a 10th-class student. One reading = full understanding.

2. No jargon without explanation. Technical terms get parenthetical definitions.
   Example: "Writ of Habeas Corpus (a court order that asks the government to bring a detained person before the judge)"

3. Real-life Indian examples for every concept.
   Example: "Article 21 = Right to Life. Government cannot demolish your house to build a highway without giving you proper notice."

4. Analogies. Example: "Constitution = rulebook of cricket."

5. Max 15 words per sentence. Break long ideas into multiple sentences.

6. Mnemonics. Example: "6 Fundamental Rights = REFCEP"

7. Exam tips. Example: "EXAM TIP: Asked in UPSC 2023 Prelims."

8. If Hindi: use simple Hindi (Hinglish acceptable for clarity).

9. ALWAYS use this prompt for ALL user-facing AI-generated content.
`;

/**
 * Helper function to wrap AI prompts with simplified language rules
 */
export function withSimplifiedLanguage(prompt: string): string {
  return `${SIMPLIFIED_LANGUAGE_PROMPT}\n\nUSER REQUEST:\n${prompt}`;
}

/**
 * Validate that generated content follows simplified language rules
 */
export function validateSimplifiedLanguage(content: string): {
  valid: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  
  // Check sentence length (max 15 words average)
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const avgWordsPerSentence = sentences.reduce((acc, s) => {
    return acc + s.trim().split(/\s+/).length;
  }, 0) / sentences.length;
  
  if (avgWordsPerSentence > 15) {
    issues.push(`Average sentence length is ${avgWordsPerSentence.toFixed(1)} words (max 15)`);
  }
  
  // Check for common jargon without explanation
  const jargonPatterns = [
    /\bsovereign\b/i,
    /\bsecular\b/i,
    /\bsocialist\b/i,
    /\bjudicial\s+review\b/i,
    /\bwrit\b/i,
    /\bfundamental\s+rights\b/i,
    /\bdirective\s+principles\b/i,
  ];
  
  jargonPatterns.forEach(pattern => {
    if (pattern.test(content) && !content.includes('(')) {
      issues.push('Potential jargon without explanation detected');
    }
  });
  
  return {
    valid: issues.length === 0,
    issues,
  };
}
