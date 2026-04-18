import { Phase2Placeholder } from '@/components/phase-2-placeholder';

export const metadata = { title: 'Lectures' };

export default function LecturesPage() {
  return (
    <Phase2Placeholder
      title="Lecture & Media Pipeline"
      tagline="Curated video lectures with time-coded notes, quizzes, and transcript search."
      whatsComing={[
        'Hand-picked video lectures mapped to the UPSC syllabus.',
        'Time-coded transcripts — jump to the exact moment a concept is explained.',
        'Auto-generated comprehension quizzes per lecture segment.',
        'Lecture progress feeds your mastery map just like notes and quizzes do.',
      ]}
      parkedReason="Lectures require a media-processing pipeline (transcription, chunking, syncing) that is a full vertical of its own. Phase 1 focuses on the text-and-quiz learning loop. Lectures land in Phase 4 once the text loop is production-proven and we can layer media on top of the same mastery model."
      targetPhase="Phase 4"
    />
  );
}
