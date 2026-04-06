# ═══════════════════════════════════════════════════════════════
# AUTODOC THINKER SERVICE - DOCKERFILE
# Port: 8031
# Purpose: Document chat with RAG
# Based on: https://github.com/Md-Emon-Hasan/AutoDocThinker
# ═══════════════════════════════════════════════════════════════

FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    poppler-utils \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY main.py .
COPY rag ./rag
COPY models ./models

# Create directories
RUN mkdir -p /uploads /cache

# Create non-root user
RUN useradd -m -u 1001 docuser
RUN chown -R docuser:docuser /app /uploads /cache
USER docuser

EXPOSE 8031

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8031/health || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8031"]
