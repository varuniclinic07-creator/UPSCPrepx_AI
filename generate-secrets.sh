#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════
# SECRETS GENERATOR FOR UPSC CSE MASTER PRODUCTION
# Generates cryptographically secure secrets for all services
# ═══════════════════════════════════════════════════════════════════════════

set -e

echo "═══════════════════════════════════════════════════════════════"
echo "  UPSC CSE MASTER - Production Secrets Generator"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Create secrets directory
mkdir -p /opt/upsc-master/secrets
SECRETS_DIR="/opt/upsc-master/secrets"

# Function to generate random string
generate_secret() {
    local length=$1
    openssl rand -base64 $length | tr -d "=+/" | cut -c1-$length
}

# Function to generate hex string
generate_hex() {
    local length=$1
    openssl rand -hex $length
}

echo "Generating cryptographically secure secrets..."
echo ""

# Database secrets
DB_PASSWORD=$(generate_secret 32)
echo "DB_PASSWORD=$DB_PASSWORD" > $SECRETS_DIR/db_password
echo "✓ Generated database password"

# Redis password
REDIS_PASSWORD=$(generate_secret 64)
echo "REDIS_PASSWORD=$REDIS_PASSWORD" > $SECRETS_DIR/redis_password
echo "✓ Generated Redis password"

# MinIO credentials
MINIO_ACCESS_KEY=$(generate_secret 20)
MINIO_SECRET_KEY=$(generate_secret 40)
echo "MINIO_ACCESS_KEY=$MINIO_ACCESS_KEY" > $SECRETS_DIR/minio_access_key
echo "MINIO_SECRET_KEY=$MINIO_SECRET_KEY" > $SECRETS_DIR/minio_secret_key
echo "✓ Generated MinIO credentials"

# NextAuth secret
NEXTAUTH_SECRET=$(generate_secret 32)
echo "NEXTAUTH_SECRET=$NEXTAUTH_SECRET" > $SECRETS_DIR/nextauth_secret
echo "✓ Generated NextAuth secret"

# JWT Secret
JWT_SECRET=$(generate_secret 32)
echo "JWT_SECRET=$JWT_SECRET" > $SECRETS_DIR/jwt_secret
echo "✓ Generated JWT secret"

# Encryption key (for API keys storage)
ENCRYPTION_KEY=$(generate_hex 32)
echo "ENCRYPTION_KEY=$ENCRYPTION_KEY" > $SECRETS_DIR/encryption_key
echo "✓ Generated encryption key"

# Grafana admin password
GRAFANA_PASSWORD=$(generate_secret 24)
echo "GRAFANA_PASSWORD=$GRAFANA_PASSWORD" > $SECRETS_DIR/grafana_password
echo "✓ Generated Grafana password"

# Mautic database password
MAUTIC_DB_PASSWORD=$(generate_secret 32)
echo "MAUTIC_DB_PASSWORD=$MAUTIC_DB_PASSWORD" > $SECRETS_DIR/mautic_db_password
echo "✓ Generated Mautic DB password"

# Plausible secret key base
PLAUSIBLE_SECRET=$(generate_secret 64)
echo "PLAUSIBLE_SECRET=$PLAUSIBLE_SECRET" > $SECRETS_DIR/plausible_secret
echo "✓ Generated Plausible secret"

# Crawl4AI API token
CRAWL4AI_TOKEN=$(generate_secret 32)
echo "CRAWL4AI_TOKEN=$CRAWL4AI_TOKEN" > $SECRETS_DIR/crawl4ai_token
echo "✓ Generated Crawl4AI token"

# N8N API key
N8N_API_KEY=$(generate_secret 64)
echo "N8N_API_KEY=$N8N_API_KEY" > $SECRETS_DIR/n8n_api_key
echo "✓ Generated N8N API key"

# Set proper permissions
chmod 600 $SECRETS_DIR/*
echo ""
echo "✓ All secrets generated and secured (chmod 600)"
echo ""

# Generate .env file from template
ENV_FILE="/opt/upsc-master/.env"
if [ -f "$ENV_FILE.template" ]; then
    echo "Generating .env file from template..."
    
    cp $ENV_FILE.template $ENV_FILE
    
    # Replace placeholders
    sed -i "s/{{DB_PASSWORD}}/$DB_PASSWORD/g" $ENV_FILE
    sed -i "s/{{REDIS_PASSWORD}}/$REDIS_PASSWORD/g" $ENV_FILE
    sed -i "s/{{MINIO_ACCESS_KEY}}/$MINIO_ACCESS_KEY/g" $ENV_FILE
    sed -i "s/{{MINIO_SECRET_KEY}}/$MINIO_SECRET_KEY/g" $ENV_FILE
    sed -i "s/{{NEXTAUTH_SECRET}}/$NEXTAUTH_SECRET/g" $ENV_FILE
    sed -i "s/{{JWT_SECRET}}/$JWT_SECRET/g" $ENV_FILE
    sed -i "s/{{ENCRYPTION_KEY}}/$ENCRYPTION_KEY/g" $ENV_FILE
    sed -i "s/{{GRAFANA_PASSWORD}}/$GRAFANA_PASSWORD/g" $ENV_FILE
    sed -i "s/{{MAUTIC_DB_PASSWORD}}/$MAUTIC_DB_PASSWORD/g" $ENV_FILE
    sed -i "s/{{PLAUSIBLE_SECRET}}/$PLAUSIBLE_SECRET/g" $ENV_FILE
    sed -i "s/{{CRAWL4AI_TOKEN}}/$CRAWL4AI_TOKEN/g" $ENV_FILE
    sed -i "s/{{N8N_API_KEY}}/$N8N_API_KEY/g" $ENV_FILE
    
    chmod 600 $ENV_FILE
    echo "✓ .env file generated"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  Secrets Summary"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "All secrets are stored in: $SECRETS_DIR"
echo ""
echo "To view a secret:"
echo "  cat $SECRETS_DIR/<secret_name>"
echo ""
echo "To use secrets in docker-compose:"
echo "  docker-compose --env-file .env up -d"
echo ""
echo "⚠️  IMPORTANT SECURITY NOTES:"
echo "  1. Never commit secrets to version control"
echo "  2. Back up secrets to secure location (Vault, encrypted storage)"
echo "  3. Rotate secrets every 90 days"
echo "  4. Use different secrets for staging/production"
echo "  5. Limit access to secrets directory"
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  Secrets generation complete!"
echo "═══════════════════════════════════════════════════════════════"
