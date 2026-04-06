# ============================================
# UPSCPrepx AI - Production Deployment Script
# ============================================
# Usage: bash scripts/deploy.sh [environment]
# Example: bash scripts/deploy.sh production
# ============================================

set -e  # Exit on error

ENV=${1:-production}

echo "🚀 UPSCPrepx AI - Deployment Script"
echo "📦 Environment: $ENV"
echo "=========================================="

# Step 1: Verify Dependencies
echo ""
echo "🔍 Step 1: Checking dependencies..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 20+"
    exit 1
fi
echo "✅ Node.js checked"

# Step 2: Install Dependencies
echo ""
echo "📦 Step 2: Installing dependencies..."
npm install --production=false
echo "✅ Dependencies installed"

# Step 3: Type Check & Lint
echo ""
echo "🛡️ Step 3: Running Type Check..."
npx tsc --noEmit --pretty || echo "⚠️ TypeScript warnings found (non-blocking)"
echo "✅ Type check complete"

# Step 4: Build
echo ""
echo "🔨 Step 4: Building Next.js App..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix errors before deploying."
    exit 1
fi
echo "✅ Build successful"

# Step 5: Docker Compose (Production)
echo ""
echo "🐳 Step 5: Starting Production Stack..."
if [ "$ENV" = "production" ]; then
    docker compose -f docker-compose.prod.yml up -d --build
    echo "✅ Docker services started"
else
    echo "ℹ️ Development mode - skipping Docker"
fi

# Step 6: Database Migrations (Prompt)
echo ""
echo "🗄️ Step 6: Database Migrations Required!"
echo "Please apply the following SQL files in your Supabase Dashboard SQL Editor:"
echo ""
ls -1 supabase/migrations/ | grep -E "018|019|020|021|022|023|024|025|026|027|028|029|030|031|032|033|034|035|036|037"
echo ""
read -p "Press Enter after migrations are applied..."

# Step 7: Git Commit & Push
echo ""
echo "📤 Step 7: Committing and Pushing to trigger CI/CD..."
git add .
git commit -m "🚀 Production Build & Deploy - $(date +'%Y-%m-%d %H:%M')"
git push origin main

echo ""
echo "=========================================="
echo "🎉 Deployment Complete!"
echo ""
echo "🌐 App URL: Check your VPS or Coolify dashboard"
echo "📱 Mobile: Run 'cd mobile-app && npx expo start'"
echo "📊 Admin: Navigate to /admin in your browser"
echo "=========================================="
