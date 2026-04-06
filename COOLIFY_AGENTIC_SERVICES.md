# ============================================
# AGENTIC SERVICES DEPLOYMENT GUIDE
# For Coolify VPS Deployment
# ============================================

Since Coolify can't access local `./AgenticServices/` code, deploy these 3 services separately:

## Option 1: Build & Push to Docker Registry (Recommended)

### 1. Web Search Service
```bash
cd AgenticServices/web-search
docker build -t yourusername/upsc-web-search:latest .
docker push yourusername/upsc-web-search:latest
```

Then in Coolify:
- Create new "Docker Image" service
- Image: `yourusername/upsc-web-search:latest`
- Port: 8030
- Network: same as main stack

### 2. AutoDoc Service
```bash
cd AgenticServices/autodoc
docker build -t yourusername/upsc-autodoc:latest .
docker push yourusername/upsc-autodoc:latest
```

Then in Coolify:
- Create new "Docker Image" service  
- Image: `yourusername/upsc-autodoc:latest`
- Port: 8031
- Network: same as main stack

### 3. File Search Service
```bash
cd AgenticServices/file-search
docker build -t yourusername/upsc-file-search:latest .
docker push yourusername/upsc-file-search:latest
```

Then in Coolify:
- Create new "Docker Image" service
- Image: `yourusername/upsc-file-search:latest`
- Port: 8032
- Network: same as main stack

## Option 2: Use Coolify Git Repository

If your code is in a Git repo:
1. In Coolify, create 3 new services using "Dockerfile" option
2. Point each to your Git repo
3. Set Dockerfile path for each:
   - `AgenticServices/web-search/Dockerfile`
   - `AgenticServices/autodoc/Dockerfile`
   - `AgenticServices/file-search/Dockerfile`
4. Configure ports 8030, 8031, 8032 respectively

## Environment Variables

Ensure these are set in your main Next.js app environment:
```
AGENTIC_WEB_SEARCH_URL=http://<service-name>:8030
AGENTIC_DOC_CHAT_URL=http://<service-name>:8031
AGENTIC_FILE_SEARCH_URL=http://<service-name>:8032
```

Replace `<service-name>` with Coolify's generated service names or use the VPS IP.
