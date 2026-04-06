#!/bin/bash
# Health Check Script

echo "Checking service health..."

services=(
    "http://localhost:3000/api/health:Main App"
    "http://localhost:9000/minio/health/live:MinIO"
    "http://localhost:6379:Redis"
)

for service in "${services[@]}"; do
    IFS=':' read -ra ADDR <<< "$service"
    url="${ADDR[0]}"
    name="${ADDR[1]}"
    
    if curl -f -s "$url" > /dev/null; then
        echo "✓ $name: Healthy"
    else
        echo "✗ $name: Unhealthy"
    fi
done