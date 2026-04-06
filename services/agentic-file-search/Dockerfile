# ═══════════════════════════════════════════════════════════════
# AGENTIC FILE SEARCH SERVICE - DOCKERFILE
# Port: 8032
# Purpose: Intelligent navigation of static materials
# Based on: https://github.com/PromtEngineer/agentic-file-search
# ═══════════════════════════════════════════════════════════════

FROM python:3.11-slim

WORKDIR /app

# Install uv for faster package management
RUN pip install uv

# Copy requirements
COPY requirements.txt .
RUN uv pip install --system -r requirements.txt

# Copy application
COPY main.py .
COPY explorer ./explorer

# Create materials directory
RUN mkdir -p /materials /cache

# Create non-root user
RUN useradd -m -u 1001 fileuser
RUN chown -R fileuser:fileuser /app /materials /cache
USER fileuser

EXPOSE 8032

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8032/health || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8032"]
