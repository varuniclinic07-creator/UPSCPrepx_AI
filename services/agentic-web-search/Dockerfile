# ═══════════════════════════════════════════════════════════════
# AGENTIC WEB SEARCH SERVICE - DUCKDUCKGO
# Port: 8030
# Purpose: Real-time web search for UPSC content
# ═══════════════════════════════════════════════════════════════

FROM python:3.11-slim

WORKDIR /app

# Install dependencies
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY main.py .
COPY utils ./utils

# Create non-root user
RUN useradd -m -u 1001 searchuser
RUN chown -R searchuser:searchuser /app
USER searchuser

EXPOSE 8030

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:8030/health || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8030"]
