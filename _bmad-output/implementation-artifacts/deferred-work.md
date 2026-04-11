# Deferred Work

## Deferred from: code review of IMPLEMENTATION_REPORT (2026-04-09)

- **#10 Middleware skips auth for all /api/ routes** — `src/middleware.ts:61` returns `NextResponse.next()` for all `/api/` paths except `/api/user`. AI endpoints are unprotected at middleware level.
- **#17 callAI uses (client as any) 8 times** — `src/lib/ai/ai-provider-client.ts` bypasses TypeScript type safety to access private internals. Fragile maintenance hazard.
- **#24 ThemeProvider stale closure on system theme change** — `src/lib/theme/theme-provider.tsx` media query listener captures stale `theme` value.
- **#26 eval/mains/submit uses deprecated createRouteHandlerClient** — `src/app/api/eval/mains/submit/route.ts` uses `@supabase/auth-helpers-nextjs` instead of project's `createServerSupabaseClient`.
- **#30 FileNavigator getPublicUrl exposes files** — `src/components/tools/file-navigator.tsx` uses `getPublicUrl` which may expose documents without auth depending on bucket policy.
- **#31 mentor/chat GET has no auth check** — `src/app/api/mentor/chat/route.ts` GET endpoint doesn't validate user identity.
- **#32 orchestrator fetch without timeout** — `src/app/api/agentic/orchestrator/route.ts` external fetch has no AbortSignal timeout.
- **#33 AI provider singleton shares mutable state** — `src/lib/ai/ai-provider-client.ts` shares health/failure state across concurrent requests with no recovery mechanism.
