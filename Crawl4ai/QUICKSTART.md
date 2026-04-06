# 🚀 Quick Start Guide - UPSC Content Crawler

Get up and running in 5 minutes!

## Step 1: Prerequisites (1 minute)

```bash
# Check Python version (must be 3.11+)
python --version

# If not installed, download from python.org
```

## Step 2: Setup Supabase (2 minutes)

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project" → Sign up (free)
3. Create new project:
   - Name: `upsc-crawler`
   - Database Password: (save this!)
   - Region: Choose closest to you
4. Wait for project to initialize (~2 minutes)
5. Go to Settings → API
   - Copy `Project URL`
   - Copy `service_role` key (not anon!)

## Step 3: Install Crawler (2 minutes)

```bash
# Download
git clone https://github.com/yourusername/upsc-crawler.git
cd upsc-crawler

# Install
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Configure
cp .env.template .env
nano .env  # Or use any text editor

# Add your credentials:
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=eyJxxxxxxxxxxxx
```

## Step 4: Setup Database (1 minute)

```bash
# In Supabase Dashboard:
# 1. Click "SQL Editor" (left sidebar)
# 2. Click "New Query"
# 3. Copy entire contents of supabase_schema.sql
# 4. Paste and click "Run"
# 5. Should see "Success" message
```

## Step 5: Test Run (30 seconds)

```bash
# Test connection
python crawler_utils.py test-connection
# Should see: ✅ Supabase connection successful

# Test single source
python crawler_utils.py test-source --name "PIB Daily Releases"

# View configured sources
python crawler_utils.py list-sources
```

## Step 6: Start Crawling! (Immediate)

```bash
# Option A: Run once (good for testing)
python crawler_scheduler.py run-once --frequency daily

# Option B: Start automated scheduler
python crawler_scheduler.py start

# Option C: Run as background service
python crawler_scheduler.py start --daemon
```

## ✅ Verification

After first crawl (takes 5-15 minutes):

```bash
# Check stats
python crawler_utils.py stats

# Search content
python crawler_utils.py search --query "economy"

# View recent content
python crawler_utils.py recent --hours 1
```

## 📊 Expected Output

After successful crawl:
```
============================================================
CRAWL STATISTICS
============================================================
Duration: 245.32 seconds
Total Attempted: 45
Total Success: 44
Total Failed: 1
Success Rate: 97.78%
============================================================
```

## 🎯 What Gets Crawled?

### First Run (DAILY frequency)
- **PIB**: Latest press releases
- **The Hindu**: Editorials & national news
- **Indian Express**: UPSC section & explained articles
- **Vision IAS**: Daily current affairs
- **Drishti IAS**: Daily news analysis
- **45+ more daily sources**

### Total Content
- 100+ sources configured
- Daily, weekly, monthly schedules
- Automatic categorization
- Full-text search enabled

## 🔄 Scheduling Options

```bash
# Daily sources (45 sources) - Runs at 6 AM
Frequency: daily
Sources: PIB, newspapers, coaching institutes

# Weekly sources (30 sources) - Runs Sunday 6 AM
Frequency: weekly
Sources: Ministry updates, RBI, NITI Aayog

# Monthly sources (25 sources) - Runs 1st of month
Frequency: monthly
Sources: Magazines, statistical reports

# Realtime (select sources) - Every 30 minutes
Frequency: realtime
Sources: Breaking news, urgent updates
```

## 🛠️ Common Commands

```bash
# View all sources
python crawler_utils.py list-sources

# Filter by category
python crawler_utils.py list-sources --category current_affairs

# Test before full crawl
python crawler_utils.py validate

# Check database stats
python crawler_utils.py stats

# Search stored content
python crawler_utils.py search --query "your search term"

# View recent content
python crawler_utils.py recent --hours 24

# Clean old content
python crawler_utils.py cleanup --days 180
```

## 🐳 Docker Quick Start

```bash
# If you prefer Docker:
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

## 📱 Next Steps

1. **Set up monitoring**: Add email alerts for failures
2. **Integrate with frontend**: Use Supabase client in your app
3. **Add custom sources**: Edit `upsc_crawler_config.py`
4. **Schedule backup**: Regular database backups
5. **Deploy to production**: Use systemd service or Docker

## 🆘 Troubleshooting

### "Connection refused"
```bash
# Check Supabase URL and key
echo $SUPABASE_URL
# Should start with https://

# Verify key is service_role (not anon)
# service_role starts with: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9
```

### "Module not found"
```bash
# Ensure virtual environment is activated
source venv/bin/activate

# Reinstall dependencies
pip install -r requirements.txt
```

### "Rate limited"
```bash
# Adjust rate limit in .env
DEFAULT_RATE_LIMIT=5.0  # Increase delay

# Or reduce concurrent requests
MAX_CONCURRENT_REQUESTS=2
```

### "No content stored"
```bash
# Check database connection
python crawler_utils.py test-connection

# Verify table exists
# In Supabase: Database → Tables → Should see "upsc_content"

# Check logs
tail -f logs/crawler.log
```

## 📚 Full Documentation

- **README.md**: Complete documentation
- **upsc_crawler_config.py**: Source configuration
- **crawler_utils.py**: Utility commands
- **supabase_schema.sql**: Database schema

## 🎓 Example Queries (In Your App)

```python
from supabase import create_client

client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Get latest current affairs
result = client.table('upsc_content')\
    .select('*')\
    .eq('category', 'current_affairs')\
    .order('crawled_at', desc=True)\
    .limit(10)\
    .execute()

# Search content
result = client.rpc('search_content', {
    'search_query': 'climate change',
    'limit_count': 20
}).execute()

# Get by date range
from datetime import datetime, timedelta
week_ago = (datetime.utcnow() - timedelta(days=7)).isoformat()

result = client.table('upsc_content')\
    .select('*')\
    .gte('crawled_at', week_ago)\
    .execute()
```

## 🎉 Success Checklist

- [ ] Supabase project created
- [ ] Database schema installed
- [ ] Environment variables configured
- [ ] Test connection successful
- [ ] First crawl completed
- [ ] Content visible in database
- [ ] Scheduled crawler running
- [ ] Logs being generated

## 💡 Pro Tips

1. **Start small**: Begin with daily sources only
2. **Monitor first week**: Watch logs for any failures
3. **Adjust rate limits**: Based on your network
4. **Regular backups**: Export database weekly
5. **Test before scale**: Validate all sources work
6. **Use categories**: Filter content by UPSC syllabus topics
7. **Set alerts**: Get notified of crawl failures

## 🚀 Ready to Scale?

Once comfortable:
1. Enable all frequencies (daily, weekly, monthly)
2. Add custom sources
3. Integrate with your UPSC app
4. Set up automated backups
5. Deploy to production server
6. Add monitoring dashboard

---

**Need Help?**
- GitHub Issues
- Documentation: README.md
- Email: support@upsc-cse-master.com

**Happy Crawling! 📚**
