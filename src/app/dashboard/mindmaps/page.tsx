import { Phase2Placeholder } from '@/components/phase-2-placeholder';

export const metadata = { title: 'Mindmaps' };

export default function MindmapsPage() {
  return (
    <Phase2Placeholder
      title="Full-Page Mindmaps"
      tagline="Navigable concept maps you can expand, zoom, and drill into any topic of the syllabus."
      whatsComing={[
        'Interactive, zoomable syllabus-wide mindmaps.',
        'Click any node to drill into notes, PYQs, and your personal mastery on that topic.',
        'Side-by-side comparison of related concepts.',
        'Share any subtree as a study snapshot.',
      ]}
      parkedReason="Phase 1 ships a lite mindmap inside the Notes page so the Knowledge Agent's topic-graph output gets exercised in a real surface. Full-page mindmaps require a mature layout engine and interaction model that depends on the lite version's data pipeline being stable. Phase 2B promotes the lite version once its schema is locked."
      targetPhase="Phase 2B"
    />
  );
}
