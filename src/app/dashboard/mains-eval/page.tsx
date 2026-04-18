import { Phase2Placeholder } from '@/components/phase-2-placeholder';

export const metadata = { title: 'Mains Evaluation' };

export default function MainsEvalPage() {
  return (
    <Phase2Placeholder
      title="Mains Answer Evaluation"
      tagline="AI-graded practice for UPSC Mains with structure, language, and content scoring."
      whatsComing={[
        'Upload or type your Mains answer; receive a structured rubric score.',
        'Per-paragraph feedback on structure, language, content depth, and examples.',
        'Your weak-topic map updates based on evaluation patterns.',
        'PYQ-linked model answers for every question.',
      ]}
      parkedReason="Mains evaluation extends the Evaluation Agent with a new scoring dimension. Shipping this before the core agent is stable would mean rebuilding it later. Phase 1 proves the Evaluation Agent on MCQs first; Mains evaluation is a clean extension in Phase 2B."
      targetPhase="Phase 2B"
    />
  );
}
