# UPSC Video Rendering Service — FFmpeg-based
FROM node:20-slim

WORKDIR /app

# Install FFmpeg and fonts (no Chromium needed)
RUN apt-get update && apt-get install -y \
    curl \
    ffmpeg \
    fonts-liberation \
    fonts-noto \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd -m -u 1000 render && \
    mkdir -p /app/output /app/temp /app/cache && \
    chown -R render:render /app

# Copy package files
COPY --chown=render:render package*.json ./

# Install Node dependencies
RUN npm ci --only=production

# Copy application code
COPY --chown=render:render . .

# Switch to non-root user
USER render

# Environment variables
ENV NODE_ENV=production
ENV PORT=8034
ENV REMOTION_CONCURRENCY=2

# Expose API port
EXPOSE 8034

# Health check
HEALTHCHECK --interval=2m --timeout=10s --start-period=20s --retries=3 \
    CMD curl -f http://localhost:8034/health || exit 1

# Start Express server
CMD ["node", "server.js"]
