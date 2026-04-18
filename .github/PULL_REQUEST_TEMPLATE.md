## What

<!-- 1–3 sentence summary of what this PR does. -->

## Why

<!-- Motivation / linked issue / reference to spec section. -->

## Verification

### Contract Gate — required for PRs touching `src/lib/agents/core/**`

- [ ] `npx jest src/lib/agents/core/__tests__ --testTimeout=60000` all green locally
- [ ] CI green on the latest commit
- [ ] Golden snapshots unchanged (or version bumped with a `docs/changelog/` entry explaining the drift)
- [ ] Swap-implementation test (real + mock) both pass for every agent this PR touches

### Demo Gate — required for PRs touching `src/app/dashboard/**`

- [ ] Capture attached for (tick all that apply): _______________
      ( ) Notes (C1)  ( ) Quiz (C2)  ( ) Mentor: explain / strategy / revision / diagnostic (C3)
      ( ) Splash (B1)  ( ) Dashboard (B3)  ( ) Thin CA (D2)
- [ ] Fresh-user smoke script run ID / commit SHA: _______________
- [ ] `agent_traces` sample rows from that fresh user (paste 3–5 rows, proves real work, not canned):

```sql
-- paste output of:
select agent, method, feature, status, latency_ms, tokens_in, tokens_out
from agent_traces
where user_id = '<fresh-user-id>'
order by created_at desc
limit 5;
```

### Reviewer sign-off — required

- [ ] I watched the demo capture end-to-end and confirm:
  - [ ] Flow is coherent (no dead-end screens, no spinner-forever states)
  - [ ] Output is sensible (not hallucinated garbage; citations resolve)
  - [ ] No obvious UX break or misleading state (e.g., no `Math.random` fake stats)
  - [ ] Dual-write guardrail preserved (no new writes to legacy Hermes tables from v8 agent paths)

### Notes / caveats (optional)

<!-- Anything the reviewer should know: scope pulls, deferred items, pending blockers. -->
