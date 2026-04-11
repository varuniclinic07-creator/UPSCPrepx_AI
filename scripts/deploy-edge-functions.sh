#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# Deploy Supabase Edge Functions
# ═══════════════════════════════════════════════════════════════
# Prerequisites:
#   1. Install Supabase CLI: npx supabase@latest
#   2. Login: npx supabase login (opens browser)
#   3. Or set SUPABASE_ACCESS_TOKEN env var
#
# Usage:
#   ./scripts/deploy-edge-functions.sh
# ═══════════════════════════════════════════════════════════════

set -e

PROJECT_REF="emotqkukvfwjycvwfvyj"
FUNCTIONS_DIR="supabase/functions"

echo "═══════════════════════════════════════════════════════════════"
echo "  Supabase Edge Functions Deployment"
echo "  Project: $PROJECT_REF"
echo "═══════════════════════════════════════════════════════════════"

# Check if logged in
if ! npx supabase status 2>/dev/null | grep -q "Logged in"; then
    echo ""
    echo "Not logged in to Supabase."
    echo "Please run: npx supabase login"
    echo "Or set SUPABASE_ACCESS_TOKEN environment variable."
    exit 1
fi

# List of functions to deploy
FUNCTIONS=(
    "doubt-solver-pipe"
    "mains-evaluator-pipe"
    "mentor-chat-pipe"
    "notes-generator-pipe"
    "quiz-engine-pipe"
    "search-pipe"
    "daily-digest-pipe"
    "video-shorts-pipe"
    "gamification-pipe"
    "onboarding-pipe"
    "planner-pipe"
    "ethics-pipe"
    "legal-pipe"
    "math-solver-pipe"
    "custom-notes-pipe"
)

# Deploy each function
for FUNC in "${FUNCTIONS[@]}"; do
    echo ""
    echo "Deploying: $FUNC"
    echo "───────────────────────────────────────────────────────────"

    if npx supabase functions deploy "$FUNC" --project-ref "$PROJECT_REF" --debug; then
        echo "✓ $FUNC deployed successfully"
    else
        echo "✗ $FUNC deployment failed"
        exit 1
    fi
done

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  All Edge Functions deployed successfully!"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "Function URLs:"
for FUNC in "${FUNCTIONS[@]}"; do
    echo "  https://$PROJECT_REF.supabase.co/functions/v1/$FUNC"
done
echo ""
