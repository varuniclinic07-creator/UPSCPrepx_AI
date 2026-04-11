# Quick Deploy Guide — Supabase Cloud

## Architecture: Supabase Cloud (NOT Self-Hosted)

Your app uses **Supabase Cloud** (managed service), not self-hosted Supabase.

- **Project Ref:** `emotqkukvfwjycvwfvyj`
- **Cloud URL:** `https://emotqukvfwjycvwfvyj.supabase.co`
- **Dashboard:** https://supabase.com/dashboard/project/emotqkukvfwjycvwfvyj

## Prerequisites Complete
- ✅ All 15 Edge Functions written
- ✅ Shared dependencies configured (`_shared/ai-provider.ts`, `cors.ts`, `entitlement.ts`, `simplified-lang.ts`)
- ✅ Deployment scripts created (`scripts/deploy-edge-functions.ps1` and `.sh`)
- ✅ Scripts configured for Supabase Cloud deployment

## Manual Steps Required

### Step 1: Authenticate with Supabase Cloud

Open browser and run:
```bash
npx supabase@latest login
```

This opens a browser window. Complete the OAuth flow to authenticate with Supabase Cloud.

**Alternative:** Set access token as environment variable:
```bash
# Get token from: https://supabase.com/dashboard/account/tokens
set SUPABASE_ACCESS_TOKEN=your_token_here
```

### Step 2: Deploy All Functions to Cloud

**PowerShell (Windows):**
```powershell
.\scripts\deploy-edge-functions.ps1
```

**Bash (Linux/Mac/WSL):**
```bash
./scripts/deploy-edge-functions.sh
```

This deploys all 15 Edge Functions to your Supabase Cloud project at the edge (globally distributed).

### Step 3: Set Environment Variables in Supabase Cloud Dashboard

Go to: https://supabase.com/dashboard/project/emotqkukvfwjycvwfvyj/settings/edge-functions

Add these secrets (Edge Functions Secrets):
```
SUPABASE_URL=https://emotqkukvfwjycvwfvyj.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (from Dashboard → Settings → API)
NINE_ROUTER_API_KEY=sk-da7a2ad945e26f3a-qsxe57-15d6ca9a
GROQ_API_KEY=<use rotation key from .env.vps>
OLLAMA_API_KEY=qwen3.5:397b-cloud
```

**Important:** These secrets are stored in Supabase Cloud, not in your local `.env` files. Edge Functions run at the edge and need their own secrets.

### Step 4: Test Deployment

```bash
curl -X POST https://emotqkukvfwjycvwfvyj.supabase.co/functions/v1/doubt-solver-pipe ^
  -H "Authorization: Bearer YOUR_JWT_TOKEN" ^
  -H "Content-Type: application/json" ^
  -d "{\"userId\":\"test\",\"question\":\"What is Article 370?\",\"subject\":\"GS2\"}"
```

## Deployed Functions

All 15 functions deployed to Supabase Cloud edge:

```
https://emotqkukvfwjycvwfvyj.supabase.co/functions/v1/{function-name}
```

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

See `DEPLOYMENT.md` for complete troubleshooting.
