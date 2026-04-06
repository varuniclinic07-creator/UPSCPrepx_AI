# UPSC Content Crawler

Enterprise-grade content aggregation system for UPSC Civil Services Examination preparation. Automatically crawls and stores content from 100+ authoritative sources including government websites, newspapers, coaching institutes, and research organizations.

## 🚀 Features

- ✅ **Rate Limiting**: Configurable delays between requests (2-5 seconds)
- ✅ **Robots.txt Compliance**: Respects website crawling rules
- ✅ **Smart User-Agent**: Descriptive identification for transparent crawling
- ✅ **Error Handling**: Exponential backoff retry logic with failure tracking
- ✅ **Metadata Storage**: Stores content with timestamps, source, and category
- ✅ **Update Frequency**: Intelligent scheduling (realtime, daily, weekly, monthly)
- ✅ **Content Deduplication**: Hash-based duplicate detection
- ✅ **Full-Text Search**: PostgreSQL FTS with ranking
- ✅ **Supabase Integration**: Cloud-native database storage
- ✅ **Automated Scheduling**: Cron-based task management
- ✅ **Logging & Monitoring**: Comprehensive logging with error tracking
- ✅ **Docker Support**: Containerized deployment ready

## 📋 Prerequisites

- Python 3.11+
- Supabase Account (free tier available)
- 2GB RAM minimum
- 10GB storage for content

## 🔧 Installation

### Option 1: Local Installation

```bash
# Clone repository
git clone https://github.com/yourusername/upsc-crawler.git
cd upsc-crawler

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Setup Playwright (if JavaScript rendering needed)
playwright install chromium

# Configure environment
cp .env.template .env
nano .env  # Edit with your Supabase credentials
```

### Option 2: Docker Installation

```bash
# Clone repository
git clone https://github.com/yourusername/upsc-crawler.git
cd upsc-crawler

# Configure environment
cp .env.template .env
nano .env  # Edit with your Supabase credentials

# Build and run
docker-compose up -d

# View logs
docker-compose logs -f upsc-crawler
```

## 🗄️ Database Setup

### 1. Create Supabase Project

1. Go to https://supabase.com
2. Create new project
3. Copy your project URL and API keys

### 2. Initialize Database Schema

```bash
# In Supabase Dashboard > SQL Editor, run:
cat supabase_schema.sql

# Or use Supabase CLI
supabase db push
```

### 3. Verify Tables

```sql
-- Check if tables are created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Should show:
-- upsc_content
-- crawl_logs
-- content_quality
-- content_tags
```

## ⚙️ Configuration

### Environment Variables

Edit `.env` file with your credentials:

```env
# Required
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-key

# Optional (uses defaults if not set)
LOG_LEVEL=INFO
MAX_CONCURRENT_REQUESTS=3
DEFAULT_RATE_LIMIT=3.0
```

### Source Configuration

Edit `upsc_crawler_config.py` to:
- Add/remove sources
- Adjust rate limits
- Change update frequencies
- Modify priorities

Example:
```python
SourceConfig(
    name="Your Custom Source",
    url="https://example.com",
    category=ContentCategory.CURRENT_AFFAIRS,
    update_frequency=UpdateFrequency.DAILY,
    priority=1,
    rate_limit_delay=3.0
)
```

## 🎯 Usage

### Command Line Interface

```bash
# Run single crawl (all daily sources)
python crawler_scheduler.py run-once --frequency daily

# Run all sources once
python crawler_scheduler.py run-once --frequency all

# Start automated scheduler
python crawler_scheduler.py start

# Start as daemon (background)
python crawler_scheduler.py start --daemon

# Check status
python crawler_scheduler.py status

# Stop daemon
python crawler_scheduler.py stop --daemon
```

### Python API

```python
from upsc_content_crawler import UPSCContentCrawler
from upsc_crawler_config import UpdateFrequency
import asyncio

# Initialize
crawler = UPSCContentCrawler(
    supabase_url="your-url",
    supabase_key="your-key"
)

# Crawl by frequency
async def main():
    # Crawl daily sources
    await crawler.crawl_by_frequency(UpdateFrequency.DAILY)
    
    # Crawl all (respecting schedules)
    await crawler.crawl_all()
    
    # Force crawl everything
    await crawler.crawl_all(force=True)

asyncio.run(main())
```

## 📊 Monitoring

### View Crawl Statistics

```python
# After crawling, stats are printed
crawler._print_stats()

# Output:
# ============================================================
# CRAWL STATISTICS
# ============================================================
# Duration: 245.32 seconds
# Total Attempted: 50
# Total Success: 48
# Total Failed: 2
# Total Blocked: 0
# Success Rate: 96.00%
# ============================================================
```

### Database Queries

```sql
-- Recent content by category
SELECT category, COUNT(*) as count, MAX(crawled_at) as latest
FROM upsc_content
WHERE crawled_at > NOW() - INTERVAL '7 days'
GROUP BY category
ORDER BY count DESC;

-- Failed crawls
SELECT source_name, COUNT(*) as failures
FROM crawl_logs
WHERE status = 'failed' AND created_at > NOW() - INTERVAL '1 day'
GROUP BY source_name
ORDER BY failures DESC;

-- Search content
SELECT * FROM search_content('economy budget 2024', 10);

-- Daily summary
SELECT * FROM daily_content_summary
WHERE date > NOW() - INTERVAL '7 days'
ORDER BY date DESC;
```

## 🔍 Content Sources

### Daily Sources (Priority 1)
- PIB Press Releases
- The Hindu Editorial & Lead Articles
- Indian Express Explained & UPSC Section
- Vision IAS Daily Current Affairs
- Drishti IAS Daily News Analysis

### Weekly Sources
- Government Ministry Updates
- RBI Publications
- NITI Aayog Reports
- Think Tank Publications

### Monthly Sources
- Yojana & Kurukshetra Magazines
- Statistical Reports
- International Organization Reports

### Realtime Sources (Every 30 mins)
- Breaking News Updates
- Policy Announcements

**Total: 100+ Sources Configured**

## 🛡️ Best Practices

### Rate Limiting
```python
# Adjust per source in config
rate_limit_delay=3.0  # seconds between requests

# Global setting
MAX_CONCURRENT_REQUESTS=3  # parallel requests
```

### Error Handling
```python
# Automatic retry with exponential backoff
max_retries=3
retry_delay=5  # starts at 5s, then 10s, 20s...

# Failure tracking
max_consecutive_failures=3  # alert threshold
```

### Content Freshness
```python
# Automatic deduplication by content hash
# Only stores if content changed
# Keeps historical versions
```

### Storage Optimization
```python
# Options in config
store_raw_html=False  # Save space
enable_compression=True
batch_size=100  # Bulk operations
```

## 📈 Scaling

### Horizontal Scaling
```bash
# Run multiple instances with different frequencies
# Instance 1: Daily sources
python crawler_scheduler.py run-once --frequency daily

# Instance 2: Weekly sources
python crawler_scheduler.py run-once --frequency weekly
```

### Vertical Scaling
```yaml
# docker-compose.yml
resources:
  limits:
    cpus: '4'  # Increase CPU
    memory: 4G  # Increase RAM
```

## 🐛 Troubleshooting

### Issue: "Blocked by robots.txt"
**Solution**: 
```python
# In config, set:
RESPECT_ROBOTS_TXT=False  # Use with caution
```

### Issue: "Connection timeout"
**Solution**:
```python
# Increase timeout in config
timeout=60  # seconds
```

### Issue: "Too many failures"
**Solution**:
```python
# Check rate limits
# Increase delay between requests
rate_limit_delay=5.0

# Check robots.txt compliance
# Verify source URLs are accessible
```

### Issue: "Database connection error"
**Solution**:
```bash
# Verify Supabase credentials
echo $SUPABASE_URL
echo $SUPABASE_KEY

# Test connection
python -c "from supabase import create_client; \
    client = create_client('your-url', 'your-key'); \
    print(client.table('upsc_content').select('*').limit(1).execute())"
```

## 📝 Logs

### Location
```bash
# Default
logs/crawler.log

# Docker
docker-compose logs -f upsc-crawler

# Systemd
sudo journalctl -u upsc-crawler -f
```

### Log Levels
```python
LOG_LEVEL=DEBUG  # Detailed debug info
LOG_LEVEL=INFO   # General info (default)
LOG_LEVEL=WARNING  # Warnings only
LOG_LEVEL=ERROR  # Errors only
```

## 🔒 Security

### API Keys
```bash
# Never commit .env file
echo ".env" >> .gitignore

# Use service_role key for crawler
# Use anon key for frontend
```

### Row-Level Security
```sql
-- Already configured in schema
-- Crawler uses service_role (full access)
-- Frontend uses anon key (read-only)
```

## 🚀 Deployment

### Systemd Service (Linux)
```bash
# Copy service file
sudo cp upsc-crawler.service /etc/systemd/system/

# Enable and start
sudo systemctl daemon-reload
sudo systemctl enable upsc-crawler
sudo systemctl start upsc-crawler

# Check status
sudo systemctl status upsc-crawler
```

### Docker Production
```bash
# Production deployment
docker-compose -f docker-compose.prod.yml up -d

# With auto-restart
docker-compose up -d --restart unless-stopped
```

### VPS Deployment
```bash
# On your VPS
cd /opt
git clone https://github.com/yourusername/upsc-crawler.git
cd upsc-crawler

# Setup
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.template .env
nano .env

# Install as systemd service
sudo cp upsc-crawler.service /etc/systemd/system/
sudo systemctl enable upsc-crawler
sudo systemctl start upsc-crawler
```

## 📊 Sample Output

### Successful Crawl
```
2024-01-15 06:00:01 - INFO - Starting DAILY crawl
2024-01-15 06:00:01 - INFO - Crawling 45 sources with daily frequency
2024-01-15 06:00:02 - INFO - Crawling: PIB Daily Releases
2024-01-15 06:00:05 - INFO - Successfully crawled: PIB Daily Releases
2024-01-15 06:00:08 - INFO - Crawling: The Hindu Editorial
2024-01-15 06:00:11 - INFO - Successfully crawled: The Hindu Editorial
...
============================================================
CRAWL STATISTICS
============================================================
Duration: 425.67 seconds
Total Attempted: 45
Total Success: 44
Total Failed: 1
Total Blocked: 0
Success Rate: 97.78%
============================================================
```

## 🤝 Contributing

1. Fork repository
2. Create feature branch
3. Add sources to config
4. Test thoroughly
5. Submit pull request

## 📄 License

MIT License - See LICENSE file

## 🙏 Acknowledgments

- Crawl4AI for powerful async crawling
- Supabase for database infrastructure
- All UPSC content creators

## 📞 Support

- GitHub Issues: [Create Issue](https://github.com/yourusername/upsc-crawler/issues)
- Email: support@upsc-cse-master.com
- Documentation: [Full Docs](https://docs.upsc-cse-master.com)

---

**Built with ❤️ for UPSC Aspirants**
