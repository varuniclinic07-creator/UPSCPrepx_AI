# UPSC Remotion Video Service - Docker Configuration
FROM node:20-slim

WORKDIR /app

# Install system dependencies for Remotion
RUN apt-get update && apt-get install -y \
    curl \
    ffmpeg \
    chromium \
    fonts-liberation \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd -m -u 1000 remotion && \
    mkdir -p /app/output /app/cache && \
    chown -R remotion:remotion /app

# Copy package files
COPY --chown=remotion:remotion package*.json ./

# Install Node dependencies
RUN npm ci --only=production

# Copy application code
COPY --chown=remotion:remotion . .

# Switch to non-root user
USER remotion

# Environment variables
ENV NODE_ENV=production
ENV PORT=8034
ENV REMOTION_CONCURRENCY=2
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Expose API port
EXPOSE 8034

# Health check
HEALTHCHECK --interval=2m --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8034/health || exit 1

# Start Express server
CMD ["node", "server.js"]
