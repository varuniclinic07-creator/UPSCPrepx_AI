# Phase 18: Multi-Region Readiness Strategy

## Current State (Single Region — eu-central)

| Component | Location | Notes |
|-----------|----------|-------|
| App server | 89.117.60.144 (Frankfurt, Hetzner nbg1) | Docker + docker-compose |
| Database | Supabase (eu-central-1 AWS) | Managed, globally accessible |
| Redis | 89.117.60.144:6379 | Session cache + queue |
| MinIO | 89.117.60.144:9000 | Object storage |
| CDN | cdn.aimasteryedu.in (Cloudflare) | Already global |
| DNS | Cloudflare (proxied) | Already global |

---

## Multi-Region Expansion Plan

### Stateless Service Design

The app is **stateless by design**:
- No in-process session state — all auth is JWT-based via Supabase
- Redis is used only for transient caching (`CACHE_TTL_SECONDS=300`), not for durable state
- Queue jobs are idempotent — safe to retry from any region
- File uploads go directly to MinIO/CDN, not to app-server disk

**To add a new region:**
1. Provision server via `infrastructure/multi-region/main.tf` with `enabled = true`
2. Point new server at the same `NEXT_PUBLIC_SUPABASE_URL` (Supabase is globally distributed)
3. Set `REDIS_URL` to a region-local Redis or the primary Redis (acceptable for low-latency regions)
4. Set `MINIO_ENDPOINT` to the primary MinIO or a replicated bucket
5. Update `CORS_ORIGINS` to include the new region's domain
6. Flip Cloudflare load balancer to include the new origin

### Session Handling (Region-Agnostic)

```
User → Cloudflare (global) → Any region server
                                   ↓
                          Supabase Auth (JWT verify)
                                   ↓
                          App logic (stateless)
                                   ↓
                          Supabase DB (globally accessible)
```

JWT tokens are verified against `SUPABASE_JWT_SECRET` which is the same in all regions.
No server-to-server session stickiness is required.

### CDN Asset Delivery

- Static assets: `CDN_ASSET_PREFIX` env var points `_next/static` to CDN edge
- Study materials: `MATERIALS_BASE_URL=https://cdn.aimasteryedu.in/materials` (Cloudflare-cached)
- Images: `next/image` uses CDN-aware `remotePatterns` in `next.config.js`

### Data Replication Strategy

| Data type | Strategy |
|-----------|----------|
| User accounts / auth | Supabase Auth (single global instance) |
| Notes / MCQ / content | Supabase Postgres (single source of truth) |
| AI usage logs | Write to primary; read replicas can be added via Supabase |
| Study materials (PDFs, videos) | MinIO primary + Cloudflare CDN cache |
| Session cache | Redis (region-local acceptable) |

### Failover

1. Cloudflare health checks monitor each region's `/api/health` endpoint
2. If a region fails health check, Cloudflare routes traffic to remaining regions
3. Current deploy scripts handle rollback via `docker-compose down && docker-compose up -d`

### Adding a Second Region (Checklist)

- [ ] Copy `infrastructure/multi-region/example.tfvars` → `us-east.tfvars`
- [ ] Set `enabled = true`
- [ ] Run `terraform apply -var-file=us-east.tfvars`
- [ ] SSH into new server, install Docker, clone repo
- [ ] Copy `.env.production` to new server (same secrets, different `SERVER_IP`)
- [ ] Run `docker-compose up -d`
- [ ] Add new server IP to Cloudflare load balancer
- [ ] Verify `/api/health` on new region
- [ ] Monitor error rates in Grafana for 30 min

---

## Important Constraints

- **Do not migrate primary region** — eu-central is stable production, expand additively
- **Do not split the database** — use Supabase read replicas if read traffic is high
- **Do not add sticky sessions** — this breaks horizontal scaling; keep JWT-only auth
