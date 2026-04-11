# UPSC PrepX-AI — Edge Functions Deployment Guide

## Architecture: Supabase Cloud (NOT Self-Hosted)

This guide deploys Edge Functions to **Supabase Cloud** (managed service).

- **Project Ref:** `emotqkukvfwjycvwfvyj`
- **Cloud URL:** `https://emotqkukvfwjycvwfvyj.supabase.co`
- **Dashboard:** https://supabase.com/dashboard/project/emotqkukvfwjycvwfvyj

> **Note:** No self-hosted Supabase configuration needed. All functions deploy to Supabase's global edge network.

## Prerequisites

1. **Node.js 20+** — Already installed (verified)
2. **Supabase CLI** — Install via `npx supabase@latest`

## Step 1: Login to Supabase

```bash
# Interactive login (opens browser)
npx supabase login

# OR set access token as environment variable
# Get token from: https://supabase.com/dashboard/account/tokens
set SUPABASE_ACCESS_TOKEN=your_token_here
```

## Step 2: Deploy Edge Functions

### Windows (PowerShell)
```powershell
.\scripts\deploy-edge-functions.ps1
```

### Linux/Mac (Bash)
```bash
./scripts/deploy-edge-functions.sh
```

### Manual Deployment (Alternative)
```bash
# Deploy individual functions
npx supabase functions deploy doubt-solver-pipe --project-ref emotqkukvfwjycvwfvyj
npx supabase functions deploy mains-evaluator-pipe --project-ref emotqkukvfwjycvwfvyj
npx supabase functions deploy mentor-chat-pipe --project-ref emotqkukvfwjycvwfvyj
# ... repeat for all 15 functions
```

## Step 3: Verify Deployment

After deployment, test each function:

```bash
# Test doubt-solver-pipe
curl -X POST https://emotqkukvfwjycvwfvyj.supabase.co/functions/v1/doubt-solver-pipe \
  -H "Authorization: Bearer YOUR_SUPABASE_JWT" \
  -H "Content-Type: application/json" \
  -d '{"userId":"test-user","question":"What is Article 370?","subject":"GS2"}'
```

## Deployed Function URLs

| Function | URL |
|----------|-----|
| doubt-solver-pipe | `https://emotqkukvfwjycvwfvyj.supabase.co/functions/v1/doubt-solver-pipe` |
| mains-evaluator-pipe | `https://emotqkukvfwjycvwfvyj.supabase.co/functions/v1/mains-evaluator-pipe` |
| mentor-chat-pipe | `https://emotqkukvfwjycvwfvyj.supabase.co/functions/v1/mentor-chat-pipe` |
| notes-generator-pipe | `https://emotqkukvfwjycvwfvyj.supabase.co/functions/v1/notes-generator-pipe` |
| quiz-engine-pipe | `https://emotqkukvfwjycvwfvyj.supabase.co/functions/v1/quiz-engine-pipe` |
| search-pipe | `https://emotqkukvfwjycvwfvyj.supabase.co/functions/v1/search-pipe` |
| daily-digest-pipe | `https://emotqkukvfwjycvwfvyj.supabase.co/functions/v1/daily-digest-pipe` |
| video-shorts-pipe | `https://emotqkukvfwjycvwfvyj.supabase.co/functions/v1/video-shorts-pipe` |
| gamification-pipe | `https://emotqkukvfwjycvwfvyj.supabase.co/functions/v1/gamification-pipe` |
| onboarding-pipe | `https://emotqkukvfwjycvwfvyj.supabase.co/functions/v1/onboarding-pipe` |
| planner-pipe | `https://emotqkukvfwjycvwfvyj.supabase.co/functions/v1/planner-pipe` |
| ethics-pipe | `https://emotqkukvfwjycvwfvyj.supabase.co/functions/v1/ethics-pipe` |
| legal-pipe | `https://emotqkukvfwjycvwfvyj.supabase.co/functions/v1/legal-pipe` |
| math-solver-pipe | `https://emotqkukvfwjycvwfvyj.supabase.co/functions/v1/math-solver-pipe` |
| custom-notes-pipe | `https://emotqkukvfwjycvwfvyj.supabase.co/functions/v1/custom-notes-pipe` |

## Environment Variables Required

Each Edge Function requires these Supabase project environment variables:

```bash
# In Supabase Dashboard → Edge Functions → Secrets
SUPABASE_URL=https://emotqkukvfwjycvwfvyj.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service_role_key>
NINE_ROUTER_API_KEY=<9router_key>
GROQ_API_KEY=<groq_key>
OLLAMA_API_KEY=<ollama_key>
```

## Testing with Authenticated Requests

```bash
# Get JWT token from your app (after login)
# Then test:

curl -X POST https://emotqkukvfwjycvwfvyj.supabase.co/functions/v1/doubt-solver-pipe \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-uuid-here",
    "question": "Explain the difference between Prelims and Mains?",
    "subject": "General"
  }'
```

## Troubleshooting

### "Function not found"
- Ensure deployment completed successfully
- Check function name matches exactly (case-sensitive)

### "Permission denied"
- Verify JWT token is valid
- Check Supabase RLS policies allow function execution

### "All AI providers failed"
- Verify API keys are set in Supabase Secrets
- Check provider status (9Router, Groq, Ollama)

## Next Steps

1. ✅ Deploy Edge Functions (this guide)
2. ⏭️ Update API routes to invoke Edge Functions (optional)
3. ⏭️ Test end-to-end flow from frontend → Edge Function → AI → Database
