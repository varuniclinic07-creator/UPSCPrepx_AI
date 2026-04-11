# Architecture Decision: Edge Functions vs API Routes

## Decision Date
2026-04-10

## Context
The application has two parallel AI invocation paths:
1. **Next.js API Routes** (`/api/*`) - Server-side routes with full Next.js ecosystem access
2. **Supabase Edge Functions** (`supabase/functions/*-pipe`) - Deno-based functions at Supabase edge

## Decision
**Keep both paths as alternatives, not dependencies.**

API routes do NOT need to call Edge Functions. They serve different use cases:

| Aspect | API Routes | Edge Functions |
|--------|-----------|----------------|
| **Invocation** | `fetch('/api/doubt/ask')` | `supabase.functions.invoke('doubt-solver-pipe')` |
| **Runtime** | Next.js (Node.js) | Deno (edge) |
| **Cold Start** | ~500ms (Vercel) | ~50ms (Supabase edge) |
| **Cost** | Vercel compute ($0.0000044/GB-sec) | Supabase included (1M invocations/mo) |
| **Auth** | NextAuth + Supabase JWT | Supabase JWT only |
| **Database** | Via lib/supabase/server | Direct Supabase client |
| **Best For** | Complex orchestration, file uploads | Simple AI calls, real-time features |

## When to Use Each

### Use API Routes When:
- File/image upload processing needed
- Complex multi-step orchestration
- Integration with Next.js ecosystem (NextAuth, middleware)
- Rate limiting via local rate-limiter
- Custom entitlement logic beyond Supabase subscriptions

### Use Edge Functions When:
- Direct Supabase integration sufficient
- Low-latency requirements (real-time chat, streaming)
- Cost optimization (reduce Vercel compute)
- Frontend needs direct Supabase function invocation
- Simple request → AI → response flow

## Current Implementation Status

| Feature | API Route | Edge Function | Frontend Should Use |
|---------|-----------|---------------|---------------------|
| Doubt Solver | ✅ `/api/doubt/ask` | ✅ `doubt-solver-pipe` | Either (Edge Function recommended for speed) |
| Mains Evaluator | ✅ `/api/eval/mains/submit` | ✅ `mains-evaluator-pipe` | Edge Function (complex AI logic) |
| Mentor Chat | ✅ `/api/mentor/chat` | ✅ `mentor-chat-pipe` | Edge Function (real-time chat) |
| Notes Generation | ✅ `/api/notes/generate` | ✅ `notes-generator-pipe` | Either |
| Quiz/MCQ | ✅ `/api/mcq/practice/start` | ✅ `quiz-engine-pipe` | API Route (complex DB logic) |
| Search | ✅ `/api/search/query` | ✅ `search-pipe` | Edge Function (RAG-optimized) |
| Daily Digest | ✅ `/api/ca/daily` | ✅ `daily-digest-pipe` | Edge Function |
| Video Shorts | ✅ `/api/shorts/generate` | ✅ `video-shorts-pipe` | Edge Function |
| Gamification | ✅ `/api/leaderboard` | ✅ `gamification-pipe` | API Route (DB-heavy) |
| Onboarding | ✅ `/api/onboarding/*` | ✅ `onboarding-pipe` | Either |
| Planner | ✅ `/api/planner/*` | ✅ `planner-pipe` | Either |
| Ethics (GS4) | ❌ Not implemented | ✅ `ethics-pipe` | Edge Function |
| Legal | ✅ `/api/legal/explain` | ✅ `legal-pipe` | Either |
| Math Solver | ✅ `/api/math/solve` | ✅ `math-solver-pipe` | Edge Function |
| Custom Notes | ✅ `/api/studio/*` | ✅ `custom-notes-pipe` | Edge Function |

## Migration Path (Optional)

If you want frontend to use Edge Functions instead of API routes:

```typescript
// Current (API Route)
const response = await fetch('/api/doubt/ask', {
  method: 'POST',
  body: JSON.stringify({ question, subject }),
});

// Alternative (Edge Function)
const { data, error } = await supabase.functions.invoke('doubt-solver-pipe', {
  body: { userId, question, subject },
});
```

## Environment Variables

Both paths require AI provider keys:

**API Routes** (`.env.local`):
```
NINE_ROUTER_API_KEY=...
GROQ_API_KEY=...
OLLAMA_API_KEY=...
```

**Edge Functions** (Supabase Secrets):
```bash
npx supabase secrets set NINE_ROUTER_API_KEY=...
npx supabase secrets set GROQ_API_KEY=...
npx supabase secrets set OLLAMA_API_KEY=...
```

## Recommendation

1. **Deploy Edge Functions** (this session's work) ✅
2. **Keep API routes as-is** - they work correctly
3. **Update frontend gradually** to use Edge Functions for:
   - Doubt solver (faster response)
   - Mentor chat (real-time)
   - Search (RAG-optimized)
   - Mains evaluator (complex AI)
4. **Monitor costs** - compare Vercel vs Supabase usage
5. **A/B test latency** - measure actual performance difference

## Testing After Deployment

```bash
# Test Edge Function directly
curl -X POST https://emotqkukvfwjycvwfvyj.supabase.co/functions/v1/doubt-solver-pipe \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{"userId":"uuid","question":"What is Article 370?","subject":"GS2"}'

# Compare with API route
curl -X POST http://localhost:3000/api/doubt/ask \
  -H "Content-Type: application/json" \
  -d '{"title":{"en":"Article 370"},"subject":"GS2","question":"What is Article 370?"}'
```

## Conclusion

No code changes needed to API routes. Edge Functions are **additive**, not replacements. Deploy and let frontend choose the optimal path per feature.
