# ═══════════════════════════════════════════════════════════════
# UPSC CSE MASTER - PRODUCTION DOCKERFILE
# Multi-stage build for Next.js application
# ═══════════════════════════════════════════════════════════════

# Stage 1: Dependencies
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files and npm config
COPY package.json package-lock.json .npmrc ./
RUN npm ci --ignore-scripts --legacy-peer-deps

# Stage 2: Builder
FROM node:22-alpine AS builder
WORKDIR /app

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Build application
RUN npm run build

# Stage 3: Runner
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Set ownership
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT=3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "const http=require('http');const r=http.get('http://localhost:3000/api/health',res=>{process.exit(res.statusCode<500?0:1)});r.on('error',()=>process.exit(1));r.setTimeout(5000,()=>{r.destroy();process.exit(1)})"

# Do NOT use ENV HOSTNAME — Docker overrides it with container ID at runtime.
# Instead, pass hostname directly to the server via node -e wrapper.
CMD ["node", "-e", "process.env.HOSTNAME='0.0.0.0'; require('./server.js')"]
