# VPS SERVICES INTEGRATION ANALYSIS

**VPS IP**: 89.117.60.144:8000 (Coolify)
**Status**: Services Running on VPS - Need App Integration

---

## 🔍 SERVICES AUDIT

### ✅ ALREADY INTEGRATED

1. **Redis** (Port 6379)
   - ✅ Rate limiter uses Redis (`src/lib/ai/redis-rate-limiter.ts`)
   - ✅ BullMQ queue configured
   - ✅ Environment variable: `REDIS_URL`

2. **Supabase** (External)
   - ✅ Database client configured
   - ✅ Auth system integrated
   - ✅ RLS policies in place

---

## ❌ MISSING INTEGRATIONS

### 1. MinIO (Ports 9000, 9001)
**Purpose**: Object storage for PDFs, videos, materials
**Status**: ❌ NOT INTEGRATED
**Required**: File upload/download for materials, videos, PDFs

### 2. Crawl4AI (Port 11235)
**Purpose**: Web scraping for current affairs
**Status**: ❌ NOT INTEGRATED
**Required**: Automated current affairs scraping

### 3. Video Worker (Internal)
**Purpose**: Lecture generation with BullMQ
**Status**: ⚠️ PARTIALLY INTEGRATED (queue exists, worker missing)
**Required**: Video lecture generation system

### 4. Manim (Port 8085)
**Purpose**: Mathematical animations
**Status**: ❌ NOT INTEGRATED
**Required**: Visual content for lectures

### 5. Remotion (Port 3001)
**Purpose**: Programmatic video generation
**Status**: ❌ NOT INTEGRATED
**Required**: Video rendering

### 6. FFMPEG Worker (Internal)
**Purpose**: Video processing
**Status**: ❌ NOT INTEGRATED
**Required**: Video encoding/transcoding

### 7. Autodoc Thinker (Port 8031)
**Purpose**: Document processing
**Status**: ❌ NOT INTEGRATED
**Required**: PDF/document analysis

### 8. File Search (Port 8032)
**Purpose**: Agentic file search
**Status**: ❌ NOT INTEGRATED
**Required**: Document search functionality

### 9. Mautic (Port 8083)
**Purpose**: Marketing automation
**Status**: ❌ NOT INTEGRATED
**Required**: Lead management, email campaigns

### 10. Plausible (Port 8088)
**Purpose**: Privacy-friendly analytics
**Status**: ❌ NOT INTEGRATED
**Required**: User analytics tracking

### 11. Uptime Kuma (Port 3003)
**Purpose**: Monitoring & status page
**Status**: ❌ NOT INTEGRATED
**Required**: Service health monitoring

---

## 🎯 PRIORITY INTEGRATION PLAN

### CRITICAL (Implement Now)
1. MinIO - File storage
2. Crawl4AI - Current affairs scraping
3. Video Worker - Lecture generation

### HIGH (This Week)
4. Plausible - Analytics
5. Mautic - Marketing automation
6. Uptime Kuma - Monitoring

### MEDIUM (Next Sprint)
7. Autodoc - Document processing
8. File Search - Document search
9. FFMPEG - Video processing

### LOW (Future)
10. Manim - Math animations
11. Remotion - Advanced video rendering

---

## 📊 INTEGRATION REQUIREMENTS

### Environment Variables Needed
```env
# MinIO
MINIO_ENDPOINT=89.117.60.144
MINIO_PORT=9000
MINIO_ACCESS_KEY=upscadmin
MINIO_SECRET_KEY=upsc2026miniopass
MINIO_USE_SSL=false

# Crawl4AI
CRAWL4AI_URL=http://89.117.60.144:11235
CRAWL4AI_API_TOKEN=upsc2026crawltoken

# Agentic Services
AUTODOC_THINKER_URL=http://89.117.60.144:8031
AGENTIC_FILE_SEARCH_URL=http://89.117.60.144:8032

# Analytics
PLAUSIBLE_URL=http://89.117.60.144:8088
PLAUSIBLE_DOMAIN=aimasteryedu.in

# Marketing
MAUTIC_URL=http://89.117.60.144:8083

# Monitoring
UPTIME_KUMA_URL=http://89.117.60.144:3003
```

### API Clients Needed
- MinIO SDK client
- Crawl4AI HTTP client
- Plausible events API
- Mautic REST API client
- Uptime Kuma push API

---

## 🔒 SECURITY CONCERNS

### Issues Found
1. ❌ Hardcoded passwords in docker-compose
2. ❌ No TLS/SSL for internal services
3. ❌ Services exposed on public ports
4. ⚠️ No authentication on some services

### Recommendations
1. Use environment variables for all credentials
2. Set up internal network (VPN/Tailscale)
3. Add reverse proxy with SSL (Traefik/Nginx)
4. Implement API authentication tokens
5. Use Coolify's built-in secrets management

---

## 📝 IMPLEMENTATION CHECKLIST

### Phase 1: Critical Services
- [ ] Create MinIO client service
- [ ] Implement file upload/download APIs
- [ ] Integrate Crawl4AI for current affairs
- [ ] Connect video worker to BullMQ
- [ ] Add circuit breakers for all services

### Phase 2: Analytics & Marketing
- [ ] Integrate Plausible tracking
- [ ] Connect Mautic API
- [ ] Set up lead capture forms
- [ ] Configure email campaigns

### Phase 3: Monitoring
- [ ] Integrate Uptime Kuma
- [ ] Add health check endpoints
- [ ] Configure alerting
- [ ] Create status page

### Phase 4: Advanced Features
- [ ] Autodoc integration
- [ ] File search implementation
- [ ] FFMPEG video processing
- [ ] Manim/Remotion rendering

---

## 🚨 IMMEDIATE ACTIONS REQUIRED

1. **Update .env.example** with all VPS service URLs
2. **Create service client libraries** for each integration
3. **Add circuit breakers** to prevent cascading failures
4. **Implement retry logic** for network failures
5. **Add monitoring** for service health
6. **Document API endpoints** for each service
7. **Create integration tests** for critical services
8. **Set up error tracking** for service failures

---

## 📈 ESTIMATED EFFORT

| Service | Complexity | Time | Priority |
|---------|-----------|------|----------|
| MinIO | Medium | 4h | CRITICAL |
| Crawl4AI | Low | 2h | CRITICAL |
| Video Worker | High | 8h | CRITICAL |
| Plausible | Low | 1h | HIGH |
| Mautic | Medium | 4h | HIGH |
| Uptime Kuma | Low | 2h | HIGH |
| Autodoc | Medium | 4h | MEDIUM |
| File Search | Medium | 4h | MEDIUM |
| FFMPEG | High | 6h | MEDIUM |
| Manim | High | 8h | LOW |
| Remotion | High | 8h | LOW |

**Total Estimated Time**: 51 hours

---

## 🎯 SUCCESS CRITERIA

- [ ] All critical services integrated and tested
- [ ] Circuit breakers prevent cascading failures
- [ ] Monitoring shows service health
- [ ] Error rates < 1% for service calls
- [ ] Response times < 2s for file operations
- [ ] Analytics tracking 100% of user actions
- [ ] Marketing automation capturing leads
- [ ] Video generation working end-to-end
