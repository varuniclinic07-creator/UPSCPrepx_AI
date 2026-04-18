# RAG / Embeddings Code Inventory — Phase 1 A3 Prep

**Date:** 2026-04-18
**Purpose:** Document every file that currently touches embeddings, vector search, or RAG, so the Knowledge Agent (A3) knows what to wrap vs. replace.

## TypeScript modules

| File | LOC | Role | Consumers |
|---|---|---|---|
| `src/lib/doubt/rag-search.ts` | 554 | `RAGSearchService` — hybrid keyword + pgvector search over `search_index` table. Public API: `ragSearch.search(query) → SearchResult`. Supports source filtering (`content_library`, `notes`, `ca`, `ncert`) and subject-aware ranking. | `src/lib/doubt/answer-generator.ts` |
| `src/lib/search/embedding-service.ts` | 208 | `EmbeddingService` — generates 1536-dim embeddings via custom AI provider router (`callAI` → 9Router → Groq/Ollama fallback). **Not direct OpenAI.** Public API: `embeddingService.generate(text) → number[]`. | `src/app/api/search/query/route.ts` |
| `src/lib/agentic/file-search-client.ts` | 179 | `FileSearchClient` — agentic file-search wrapper (separate from knowledge RAG — operates on user-uploaded PDFs, not curated corpus). Public API: `searchFiles(query) → FileSearchResponse`. | (none in-tree; exported helper) |
| `src/app/api/search/query/route.ts` | 405 | HTTP surface wrapping embedding + pgvector search. | Frontend search UI |
| `src/types/agentic.ts` | 322 | Type declarations for agentic search pipeline. | Referenced by agentic libs |
| `src/types/supabase.ts` | generated | Contains row types for `search_index`, `search_history`, `saved_searches`, `search_analytics`. | Typed queries |

**Total wrapping surface:** ~1,668 LOC across 5 hand-written files, plus 1 generated types file.

## SQL schema

- `supabase/migrations/014_agentic_intelligence.sql` — defines legacy `embedding vector(1536)` column on an agentic table (separate from search_index).
- `supabase/migrations/018_rag_search_engine.sql` — enables `pgvector`, creates:
  - `search_index` table with `embedding vector(1536)`, `content_text`, `syllabus_tags`, `source`, `content_type`
  - IVFFlat index on `embedding`
  - GIN index on `to_tsvector('english', content_text)` for keyword search
  - `match_documents(query_embedding, match_threshold, match_count)` SQL function using `1 - (embedding <=> query_embedding)` cosine similarity
  - Helper tables: `search_history`, `saved_searches`, `search_analytics`
- `supabase/migrations/019_notes_library_and_generator.sql` — extends notes with GIN text index (non-vector).

**pgvector is live and populated.** The existing `search_index` table is the knowledge corpus; migration 018 is the canonical vector search layer.

## Wrap strategy for Knowledge Agent (A3)

**Decision: WRAP existing `ragSearch.search()` inside the Knowledge Agent's `retrieve()` method.**

Rationale — existing RAG is a coherent module (two files, one table, one SQL function), not scattered:

1. **`KnowledgeAgent.retrieve(query, opts)`** → delegates to `ragSearch.search({ query, sources, subject, limit })`, maps `SearchDocument[]` → `RetrievedChunk[]` (rename fields: `content` → `text`, `metadata.source_type` → `meta.sourceType`, preserve `score` and rank). Each `RetrievedChunk.id` uses `SearchDocument.id`.
2. **`KnowledgeAgent.ground(query, chunks, opts)`** → NEW — calls OpenAI `chat()` helper from `src/lib/agents/core/openai-client.ts` (Task 3.2) with a prompt template that includes chunks as context and asks for cited answer. Parses citations and returns `GroundedAnswer`.
3. **`KnowledgeAgent.ingest(source)`** → NEW — chunks `source.content`, calls `embed()` from the new OpenAI helper (not the legacy `embeddingService` — we want direct OpenAI at the v8 boundary per spec §tech-stack), inserts into `search_index` with `source_type` mapped from `SourceInput.type`.

**Why direct OpenAI for new ingests:** the spec mandates `text-embedding-3-small` (1536 dim, OpenAI) as the v8 embedding model. The legacy `embeddingService` routes through the 9Router / Groq fallback chain, which produces vectors that may not be 1:1 comparable with `text-embedding-3-small`. Mixing embedding models in one `search_index` degrades retrieval quality. Phase 1 ingests (thin CA slice, D2) will use direct OpenAI via the new `embed()` helper. The legacy `embeddingService` stays in the tree to serve already-indexed rows during the transition, but is marked for retirement in Phase 2A.

**Legacy code retirement tracking:**
- `src/lib/doubt/rag-search.ts` — KEEP (wrapped, not replaced).
- `src/lib/search/embedding-service.ts` — RETIRE in Phase 2A once all ingest paths use OpenAI direct.
- `src/lib/doubt/answer-generator.ts` — consumer of rag-search, unaffected; continues to work.
- `src/app/api/search/query/route.ts` — unchanged in Phase 1; Phase 2A will migrate it to route through the Knowledge Agent.

## Swap-implementation test (Contract Gate requirement)

The Knowledge Agent contract test (Day 3.3) must pass with TWO `KnowledgeAgent` implementations:
1. `KnowledgeAgentImpl` — the real, wraps-rag-search implementation.
2. `FakeKnowledgeAgent` — in-memory stub for testing.

Same test, same assertions, both pass. Proves the interface is implementation-agnostic (contract-first, not leaky).

## Files the Knowledge Agent will touch

**Read:** `src/lib/doubt/rag-search.ts`, `search_index` table
**Create:** `src/lib/agents/knowledge/knowledge-agent.ts`, `src/lib/agents/knowledge/fake-knowledge-agent.ts`, `src/lib/agents/knowledge/__tests__/knowledge-agent.contract.test.ts`
**Modify:** None in Phase 1 (wrapping = zero Hermes-era file modifications, dual-write guardrail preserved)
