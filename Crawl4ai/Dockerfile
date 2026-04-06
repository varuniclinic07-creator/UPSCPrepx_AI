# UPSC Content Crawler - Docker Configuration
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd -m -u 1000 crawler && \
    mkdir -p /app/logs && \
    chown -R crawler:crawler /app

# Copy requirements
COPY --chown=crawler:crawler requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY --chown=crawler:crawler *.py .

# Switch to non-root user
USER crawler

# Environment variables
ENV PYTHONUNBUFFERED=1
ENV LOG_LEVEL=INFO
ENV API_PORT=11235

# Expose API port
EXPOSE 11235

# Health check
HEALTHCHECK --interval=2m --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:11235/health || exit 1

# Start FastAPI server
CMD ["python", "api_server.py"]
