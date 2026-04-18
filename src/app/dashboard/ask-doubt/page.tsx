import { Phase2Placeholder } from '@/components/phase-2-placeholder';

export const metadata = { title: 'Ask Doubt' };

export default function AskDoubtPage() {
  return (
    <Phase2Placeholder
      title="Agentic Ask-Doubt"
      tagline="Ask any UPSC question and get a grounded answer with live citations."
      whatsComing={[
        'Natural-language question answering grounded in your notes, PYQs, and current affairs.',
        'Live citations back to the source paragraph so you can verify every claim.',
        'Follow-up clarifications remember context across the conversation.',
        'Automatic tagging — the agent logs each doubt against its topic so your weak-map learns.',
      ]}
      parkedReason="Ask-Doubt is the full conversational surface over the Knowledge Agent. Phase 1 proves the Knowledge Agent on the Notes page (a single-query surface) before opening it up to free-form multi-turn conversation. Shipping Ask-Doubt before Notes is stable would mean debugging conversation state on top of an unstable retriever."
      targetPhase="Phase 2A"
    />
  );
}
