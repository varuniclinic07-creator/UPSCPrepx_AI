# UPSC Manim Animation Service - Docker Configuration
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for Manim
RUN apt-get update && apt-get install -y \
    curl \
    ffmpeg \
    libcairo2-dev \
    libpango1.0-dev \
    texlive \
    texlive-latex-extra \
    texlive-fonts-extra \
    texlive-science \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd -m -u 1000 manim && \
    mkdir -p /app/output /app/cache && \
    chown -R manim:manim /app

# Copy requirements
COPY --chown=manim:manim requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY --chown=manim:manim *.py .

# Switch to non-root user
USER manim

# Environment variables
ENV PYTHONUNBUFFERED=1
ENV PORT=8033
ENV MANIM_QUALITY=medium_quality

# Expose API port
EXPOSE 8033

# Health check
HEALTHCHECK --interval=2m --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8033/health || exit 1

# Start FastAPI server
CMD ["python", "main.py"]
