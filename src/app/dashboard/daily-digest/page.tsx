import { Phase2Placeholder } from '@/components/phase-2-placeholder';

export const metadata = { title: 'Daily Digest' };

export default function DailyDigestPage() {
  return (
    <Phase2Placeholder
      title="Daily Digest"
      tagline="One concise read each morning — today's UPSC-relevant news, parsed and linked."
      whatsComing={[
        'Morning-fresh summary of the last 24h of UPSC-relevant current affairs.',
        'Every item linked to the source and tagged with a syllabus topic.',
        'Quick 3-question drill at the bottom so you remember what you just read.',
        'Delivered in-app and by email; skippable and revisitable.',
      ]}
      parkedReason="The digest sits on top of the current-affairs ingestion and Knowledge Agent summarization. Phase 1 ships the thin CA slice (3–5 entries) to prove ingestion. A daily digest requires robust ingestion cadence, reliable tagging, and summarization quality — all of which Phase 2B will harden before we commit to sending users a daily artifact."
      targetPhase="Phase 2B"
    />
  );
}
