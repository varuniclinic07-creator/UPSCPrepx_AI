# ═══════════════════════════════════════════════════════════════
# Deploy Supabase Edge Functions (PowerShell)
# ═══════════════════════════════════════════════════════════════
# Prerequisites:
#   1. Install Supabase CLI: npx supabase@latest
#   2. Login: npx supabase login (opens browser)
#   3. Or set SUPABASE_ACCESS_TOKEN env var
#
# Usage:
#   .\scripts\deploy-edge-functions.ps1
# ═══════════════════════════════════════════════════════════════

$PROJECT_REF = "emotqkukvfwjycvwfvyj"
$FUNCTIONS_DIR = "supabase/functions"

Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Supabase Edge Functions Deployment" -ForegroundColor Cyan
Write-Host "  Project: $PROJECT_REF" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan

# List of functions to deploy
$FUNCTIONS = @(
    "doubt-solver-pipe",
    "mains-evaluator-pipe",
    "mentor-chat-pipe",
    "notes-generator-pipe",
    "quiz-engine-pipe",
    "search-pipe",
    "daily-digest-pipe",
    "video-shorts-pipe",
    "gamification-pipe",
    "onboarding-pipe",
    "planner-pipe",
    "ethics-pipe",
    "legal-pipe",
    "math-solver-pipe",
    "custom-notes-pipe"
)

# Deploy each function
foreach ($FUNC in $FUNCTIONS) {
    Write-Host ""
    Write-Host "Deploying: $FUNC" -ForegroundColor Green
    Write-Host "───────────────────────────────────────────────────────────" -ForegroundColor Gray

    $result = npx supabase functions deploy $FUNC --project-ref $PROJECT_REF 2>&1

    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ $FUNC deployed successfully" -ForegroundColor Green
    } else {
        Write-Host "✗ $FUNC deployment failed" -ForegroundColor Red
        Write-Host $result -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  All Edge Functions deployed successfully!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "Function URLs:" -ForegroundColor Cyan
foreach ($FUNC in $FUNCTIONS) {
    Write-Host "  https://$PROJECT_REF.supabase.co/functions/v1/$FUNC" -ForegroundColor White
}
Write-Host ""
