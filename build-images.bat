@echo off
echo ========================================
echo Building UPSC CSE Master Docker Images
echo ========================================

echo.
echo [1/6] Building Crawl4AI service...
docker build -t upsc-crawl4ai:latest ./Crawl4ai

echo.
echo [2/6] Building Web Search service...
docker build -t upsc-web-search:latest ./AgenticServices/web-search

echo.
echo [3/6] Building File Search service...
docker build -t upsc-file-search:latest ./AgenticServices/file-search

echo.
echo [4/6] Building AutoDoc service...
docker build -t upsc-autodoc:latest ./AgenticServices/autodoc

echo.
echo [5/6] Building Manim service...
docker build -t upsc-manim:latest ./manim-service

echo.
echo [6/6] Building Remotion service...
docker build -t upsc-remotion:latest ./remotion-service

echo.
echo ========================================
echo All images built successfully!
echo ========================================
echo.
echo Run: docker-compose -f docker-compose.complete.yml up -d
echo.
