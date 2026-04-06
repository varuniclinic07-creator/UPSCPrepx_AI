# Agentic Services Deployment Guide

## Overview

This guide explains how to deploy the 3 agentic services (Web Search, AutoDocThinker, File Search) to your VPS using Coolify.

## Prerequisites

- Coolify running on 89.117.60.144:8000
- Docker networks configured
- Main UPSC app deployed and accessible

## Service 1: Web Search (DuckDuckGo-based)

### Repository Setup
```bash
# Base repository
https://github.com/bahathabet/agentic-search

# Fork or clone to modify
git clone https://github.com/bahathabet/agentic-search
cd agentic-search
```

### Dockerfile Example
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy service code
COPY . .

# Expose port
EXPOSE 8030

# Start service
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8030"]
```

### Coolify Configuration
```yaml
Service Name: web-search
Port: 8030
Type: Dockerfile
Repository: [your-fork-url]
Environment Variables:
  - AI_PROVIDER_URL=http://upsc-app:3000/api/ai/chat
  - SEARCH_ENGINE=duckduckgo
  - CACHE_TTL=86400
  - MAX_RESULTS=10
```

## Service 2: AutoDocThinker (Multi-Agent RAG)

### Repository Setup
```bash
https://github.com/Md-Emon-Hasan/AutoDocThinker

git clone https://github.com/Md-Emon-Hasan/AutoDocThinker
cd AutoDocThinker
```

### Dockerfile Example
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    poppler-utils \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8031

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8031"]
```

### Coolify Configuration
```yaml
Service Name: autodoc
Port: 8031
Type: Dockerfile
Repository: [your-fork-url]
Environment Variables:
  - AI_PROVIDER_URL=http://upsc-app:3000/api/ai/chat
  - MAX_PAGES=100
  - CHUNK_SIZE=1000
  - CHUNK_OVERLAP=200
  - AGENTS=retriever,summarizer,web_searcher,router
```

## Service 3: File Search (Dynamic Navigation)

### Repository Setup
```bash
https://github.com/PromtEngineer/agentic-file-search

git clone https://github.com/PromtEngineer/agentic-file-search
cd agentic-file-search
```

### Dockerfile Example
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8032

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8032"]
```

### Coolify Configuration
```yaml
Service Name: file-search
Port: 8032
Type: Dockerfile
Repository: [your-fork-url]
Environment Variables:
  - AI_PROVIDER_URL=http://upsc-app:3000/api/ai/chat
  - MATERIALS_PATH=/materials
  - MODE=dynamic
  - MAX_DEPTH=10
Volumes:
  - minio-data:/materials (for materials access)
```

## Deployment Steps

### Option 1: Deploy via Coolify UI

1. **Add Service in Coolify**
   - Go to Coolify dashboard
   - Click "New Service"
   - Select "Dockerfile"

2. **Configure Repository**
   - Paste repository URL
   - Set branch to `main`
   - Dockerfile path: `Dockerfile`

3. **Set Environment Variables**
   - Add all required env vars from above
   - Important: `AI_PROVIDER_URL` must point to main app

4. **Configure Port**
   - Internal port: 8030/8031/8032
   - External port: Same (or map as needed)

5. **Deploy**
   - Click "Deploy"
   - Monitor logs for errors
   - Check health endpoint once running

### Option 2: Deploy via Docker Compose

Create `docker-compose.agentic.yml`:
```yaml
version: '3.8'

services:
  web-search:
    build: ./agentic-search
    ports:
      - "8030:8030"
    environment:
      - AI_PROVIDER_URL=http://upsc-app:3000/api/ai/chat
      - SEARCH_ENGINE=duckduckgo
    networks:
      - upsc-network

  autodoc:
    build: ./AutoDocThinker
    ports:
      - "8031:8031"
    environment:
      - AI_PROVIDER_URL=http://upsc-app:3000/api/ai/chat
    networks:
      - upsc-network

  file-search:
    build: ./agentic-file-search
    ports:
      - "8032:8032"
    environment:
      - AI_PROVIDER_URL=http://upsc-app:3000/api/ai/chat
      - MATERIALS_PATH=/materials
    volumes:
      - minio-data:/materials
    networks:
      - upsc-network

networks:
  upsc-network:
    external: true

volumes:
  minio-data:
    external: true
```

Deploy:
```bash
docker-compose -f docker-compose.agentic.yml up -d
```

## Health Check

Test each service:
```bash
# Web Search
curl http://89.117.60.144:8030/health

# AutoDoc
curl http://89.117.60.144:8031/health

# File Search
curl http://89.117.60.144:8032/health
```

## Testing

### Test Web Search
```bash
curl -X POST http://89.117.60.144:8030/search \
  -H "Content-Type: application/json" \
  -d '{"query": "latest India news", "limit": 5}'
```

### Test AutoDoc
```bash
curl -X POST http://89.117.60.144:8031/analyze \
  -H "Content-Type: application/json" \
  -d '{"query": "summarize this", "documents": [...]}'
```

### Test File Search
```bash
curl -X POST http://89.117.60.144:8032/search \
  -H "Content-Type: application/json" \
  -d '{"query": "federalism", "mode": "dynamic"}'
```

## Troubleshooting

### Service Won't Start
- Check Docker logs: `docker logs [container-name]`
- Verify environment variables are set
- Ensure ports are not in use

### Can't Connect to AI Router
- Verify `AI_PROVIDER_URL` is correct
- Check network connectivity
- Ensure main app is running

### File Search Can't Access Materials
- Check MinIO volume mount
- Verify bucket exists
- Check file permissions

## Monitoring

Add to Uptime Kuma:
```
Web Search: http://web-search:8030/health
AutoDoc: http://autodoc:8031/health
File Search: http://file-search:8032/health
```

## Next Steps

1. Deploy all 3 services
2. Run database migration on Supabase
3. Create MinIO bucket for materials
4. Upload first study material (NCERT)
5. Test end-to-end query via `/api/agentic/query`

## Success Criteria

- [ ] All 3 services show "healthy" status
- [ ] Web search returns results from DuckDuckGo
- [ ] AutoDoc can analyze uploaded documents
- [ ] File search can navigate static materials
- [ ] Main app can call `/api/agentic/query` successfully
- [ ] Orchestrator routes queries to appropriate services
