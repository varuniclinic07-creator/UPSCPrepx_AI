#!/bin/bash

# Crawl4AI Quick Setup Script for Coolify
# Run this on your VPS at 89.117.60.144

set -e

echo "🚀 UPSC Crawl4AI - Coolify Deployment Setup"
echo "============================================"

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
  echo "❌ Please run as root (use sudo)"
  exit 1
fi

# Configuration
DEPLOY_DIR="/opt/upsc-crawl4ai"
SERVICE_NAME="upsc-crawl4ai"

echo ""
echo "📁 Creating deployment directory..."
mkdir -p $DEPLOY_DIR
cd $DEPLOY_DIR

echo ""
echo "📝 Environment Configuration"
echo "----------------------------"

# Check if .env exists
if [ -f .env ]; then
  echo "⚠️  .env file already exists. Backup created as .env.backup"
  cp .env .env.backup
fi

# Prompt for environment variables
read -p "Enter SUPABASE_URL: " SUPABASE_URL
read -sp "Enter SUPABASE_SERVICE_ROLE_KEY: " SUPABASE_KEY
echo ""
read -p "Enter CRAWL4AI_API_TOKEN (or press Enter to generate): " API_TOKEN

# Generate token if not provided
if [ -z "$API_TOKEN" ]; then
  API_TOKEN=$(openssl rand -hex 32)
  echo "✅ Generated API Token: $API_TOKEN"
fi

read -p "Enter NEXT_PUBLIC_APP_URL (default: http://localhost:3000): " APP_URL
APP_URL=${APP_URL:-http://localhost:3000}

# Create .env file
cat > .env << EOF
# Supabase Configuration
SUPABASE_URL=$SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_KEY

# API Security
CRAWL4AI_API_TOKEN=$API_TOKEN
API_PORT=11235

# Next.js App
NEXT_PUBLIC_APP_URL=$APP_URL

# Crawler Settings
LOG_LEVEL=INFO
MAX_CONCURRENT_REQUESTS=3
DEFAULT_RATE_LIMIT=3.0
RESPECT_ROBOTS_TXT=true
PYTHONUNBUFFERED=1
WORKERS=2
EOF

echo ""
echo "✅ Environment file created"

echo ""
echo "🐳 Checking Docker..."
if ! command -v docker &> /dev/null; then
  echo "❌ Docker not found. Installing..."
  curl -fsSL https://get.docker.com -o get-docker.sh
  sh get-docker.sh
  rm get-docker.sh
else
  echo "✅ Docker is installed"
fi

echo ""
echo "🐳 Checking Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
  echo "❌ Docker Compose not found. Installing..."
  curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
  chmod +x /usr/local/bin/docker-compose
else
  echo "✅ Docker Compose is installed"
fi

echo ""
echo "📦 Building and starting service..."
docker-compose -f docker-compose.production.yml up -d --build

echo ""
echo "⏳ Waiting for service to be healthy..."
sleep 10

# Health check
MAX_RETRIES=30
RETRY_COUNT=0
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  if curl -f http://localhost:11235/health &> /dev/null; then
    echo "✅ Service is healthy!"
    break
  fi
  echo "⏳ Waiting... ($((RETRY_COUNT+1))/$MAX_RETRIES)"
  sleep 2
  RETRY_COUNT=$((RETRY_COUNT+1))
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
  echo "❌ Service failed to start. Check logs:"
  echo "   docker logs $SERVICE_NAME"
  exit 1
fi

echo ""
echo "============================================"
echo "✅ Deployment Complete!"
echo "============================================"
echo ""
echo "📊 Service Information:"
echo "   URL: http://89.117.60.144:11235"
echo "   Health: http://89.117.60.144:11235/health"
echo "   API Token: $API_TOKEN"
echo ""
echo "🔧 Useful Commands:"
echo "   View logs:    docker logs -f $SERVICE_NAME"
echo "   Restart:      docker-compose restart crawl4ai"
echo "   Stop:         docker-compose down"
echo "   Update:       docker-compose up -d --build"
echo ""
echo "📝 Next Steps:"
echo "   1. Add to Next.js .env.local:"
echo "      CRAWL4AI_URL=http://89.117.60.144:11235"
echo "      CRAWL4AI_API_TOKEN=$API_TOKEN"
echo ""
echo "   2. Test the API:"
echo "      curl http://89.117.60.144:11235/health"
echo ""
echo "   3. Configure Coolify monitoring (optional)"
echo ""
echo "🎉 Your Crawl4AI service is ready!"
