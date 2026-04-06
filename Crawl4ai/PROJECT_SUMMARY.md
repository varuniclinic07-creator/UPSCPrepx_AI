# UPSC Content Crawler - Project Summary

## 📁 Project Structure

```
upsc-content-crawler/
├── 📄 upsc_crawler_config.py      # Source configuration (100+ URLs)
├── 📄 upsc_content_crawler.py     # Main crawler implementation
├── 📄 crawler_scheduler.py        # Automated scheduling system
├── 📄 crawler_utils.py            # Utility commands & testing
├── 📄 crawler_monitoring.py       # Production monitoring & alerts
├── 📄 supabase_schema.sql         # Database schema
├── 📄 requirements.txt            # Python dependencies
├── 📄 .env.template               # Environment variables template
├── 📄 Dockerfile                  # Docker configuration
├── 📄 docker-compose.yml          # Docker Compose setup
├── 📄 upsc-crawler.service        # Systemd service file
├── 📄 README.md                   # Complete documentation
├── 📄 QUICKSTART.md               # Quick start guide
└── 📄 logs/                       # Log directory (created automatically)
```

## ✨ Key Features Implemented

### 1. Rate Limiting ✅
- **Per-domain tracking**: Separate rate limits for each website
- **Configurable delays**: 2-5 seconds between requests (customizable)
- **Random jitter**: Prevents thundering herd issues
- **Implementation**: `RateLimiter` class in `upsc_content_crawler.py`

### 2. Robots.txt Compliance ✅
- **Automatic checking**: Reads and respects robots.txt
- **Domain caching**: Caches robots.txt per domain
- **Override option**: Can be disabled if needed
- **Implementation**: `RobotsChecker` class

### 3. User-Agent ✅
- **Descriptive identification**: "UPSC-CSE-Master-Bot/1.0"
- **Contact information**: Includes website URL
- **Educational purpose**: Clearly states purpose
- **Configurable**: Easy to customize

### 4. Error Handling ✅
- **Exponential backoff**: Automatic retry with backoff
- **Failure tracking**: Tracks consecutive failures
- **Alert system**: Notifies on repeated failures
- **Comprehensive logging**: All errors logged
- **Implementation**: `@backoff.on_exception` decorator

### 5. Data Storage with Metadata ✅
- **Supabase integration**: Cloud-native database
- **Rich metadata**: Hash, word count, timestamps, category
- **Versioning**: Tracks content changes
- **Deduplication**: Hash-based duplicate detection
- **Full-text search**: PostgreSQL FTS enabled

### 6. Update Frequency ✅
- **4 frequency levels**: Realtime, Daily, Weekly, Monthly
- **Smart scheduling**: Only crawls when needed
- **Cron-based**: Uses schedule library
- **Customizable**: Easy to adjust frequencies

## 🎯 Content Sources (100+ URLs)

### High Priority (Priority 1) - 25 sources
- PIB (Press Information Bureau)
- The Hindu (Editorials, Lead Articles)
- Indian Express (UPSC Section, Explained)
- Vision IAS (Daily CA, PT 365, Mains 365)
- Drishti IAS (Daily Analysis, Editorials)
- Government Schemes Portal
- UPSC Official Website

### Medium Priority (Priority 2) - 45 sources
- All Ministry Websites (MEA, MHA, Finance, etc.)
- Economic Sources (RBI, NITI Aayog, Budget)
- Newspapers (National news, Economy, Science)
- Coaching Institutes (Secondary content)
- Reports (World Bank, IMF, UNDP)

### Lower Priority (Priority 3) - 30 sources
- Think Tanks (ORF, IDSA, ICRIER)
- Specialized Agencies (ISRO, DRDO, IMD)
- Cultural Organizations (ASI, IGNCA)
- Research Publications

## 🗂️ Content Categories

1. **Current Affairs** - Daily news and analysis
2. **Government Schemes** - Policies and programs
3. **Economy** - Economic news and data
4. **Polity** - Constitutional and governance
5. **Geography** - Physical and human geography
6. **History & Culture** - Heritage and traditions
7. **Science & Technology** - Latest developments
8. **Environment** - Climate and ecology
9. **Social Issues** - Society and development
10. **International Relations** - Foreign affairs
11. **Security** - Defense and internal security
12. **Ethics** - Ethical issues and case studies
13. **Reports & Surveys** - Important reports

## 🚀 Deployment Options

### 1. Local Development
```bash
python crawler_scheduler.py start
```

### 2. Docker Container
```bash
docker-compose up -d
```

### 3. Systemd Service (Linux)
```bash
sudo systemctl start upsc-crawler
```

### 4. Background Daemon
```bash
python crawler_scheduler.py start --daemon
```

## 📊 Database Schema

### Main Tables
1. **upsc_content** - Stores all crawled content
   - URL, source, category, priority
   - HTML and Markdown content
   - Metadata (hash, word count, etc.)
   - Full-text search vector
   - Timestamps

2. **crawl_logs** - Monitors crawl attempts
   - Success/failure tracking
   - Response times
   - Error messages

3. **content_quality** - Quality metrics
   - Relevance, completeness, freshness scores
   - Verification status

4. **content_tags** - Content categorization
   - Tags by type (topic, subtopic, keyword)
   - Confidence scores

### Views & Functions
- `latest_content_by_source` - Latest from each source
- `daily_content_summary` - Daily statistics
- `crawl_statistics` - Crawl performance
- `search_content()` - Full-text search function
- `cleanup_old_content()` - Maintenance function

## 🛠️ Utility Commands

```bash
# Testing
python crawler_utils.py test-connection
python crawler_utils.py test-source --name "PIB Daily Releases"
python crawler_utils.py validate

# Monitoring
python crawler_utils.py stats
python crawler_utils.py recent --hours 24
python crawler_utils.py list-sources

# Searching
python crawler_utils.py search --query "economy"

# Maintenance
python crawler_utils.py cleanup --days 180
python crawler_utils.py export
```

## 📈 Performance Metrics

### Expected Performance
- **Crawl Speed**: 5-10 seconds per source
- **Daily Crawl**: 45 sources in ~5-10 minutes
- **Success Rate**: 95%+ expected
- **Storage**: ~10MB per 1000 articles
- **Database Queries**: <100ms for searches

### Resource Usage
- **RAM**: 500MB - 2GB
- **CPU**: 10-20% average, 80% during crawl
- **Network**: 100-500MB per day
- **Storage**: 1GB per month (estimated)

## 🔐 Security Features

- **Environment variables**: Sensitive data in .env
- **Row-level security**: Supabase RLS enabled
- **Service role isolation**: Separate keys for crawler/frontend
- **Input validation**: URL and data validation
- **Error sanitization**: No sensitive data in logs
- **Rate limiting**: Prevents abuse

## 📱 Integration Examples

### Python API
```python
from upsc_content_crawler import UPSCContentCrawler
crawler = UPSCContentCrawler(url, key)
await crawler.crawl_by_frequency(UpdateFrequency.DAILY)
```

### Supabase Client (Frontend)
```javascript
const { data } = await supabase
  .from('upsc_content')
  .select('*')
  .eq('category', 'current_affairs')
  .order('crawled_at', { ascending: false })
  .limit(10)
```

### Search API
```python
result = client.rpc('search_content', {
    'search_query': 'climate change',
    'limit_count': 20
}).execute()
```

## 🎓 Best Practices Implemented

1. **Respectful Crawling**
   - Robots.txt compliance
   - Rate limiting
   - Descriptive user-agent
   - Off-peak scheduling

2. **Reliability**
   - Retry logic
   - Error handling
   - Failure tracking
   - Health monitoring

3. **Data Quality**
   - Deduplication
   - Metadata extraction
   - Content versioning
   - Quality scoring

4. **Maintainability**
   - Modular code
   - Comprehensive logging
   - Configuration files
   - Documentation

5. **Scalability**
   - Async operations
   - Batch processing
   - Caching
   - Database indexing

## 🎯 Next Steps

1. **Setup** (5 minutes)
   - Create Supabase project
   - Configure environment
   - Install dependencies

2. **Test** (5 minutes)
   - Test connection
   - Run single source
   - Verify database

3. **Deploy** (10 minutes)
   - Choose deployment method
   - Start crawler
   - Monitor logs

4. **Integrate** (Ongoing)
   - Connect to your app
   - Build UI
   - Add features

## 📞 Support & Resources

- **Documentation**: README.md (comprehensive)
- **Quick Start**: QUICKSTART.md (5-minute setup)
- **Configuration**: upsc_crawler_config.py
- **Schema**: supabase_schema.sql
- **Examples**: crawler_utils.py

## ✅ Checklist for Production

- [ ] Supabase project created
- [ ] Environment variables configured
- [ ] Database schema installed
- [ ] Test crawl successful
- [ ] Monitoring enabled
- [ ] Alerts configured
- [ ] Backup strategy defined
- [ ] Documentation reviewed
- [ ] Service deployed
- [ ] Health checks passing

## 🎉 Success Indicators

After 24 hours of running:
- ✅ 40+ sources crawled successfully
- ✅ 95%+ success rate
- ✅ 1000+ content items stored
- ✅ No critical errors
- ✅ Search functionality working
- ✅ Scheduled tasks executing

---

**Built for excellence. Ready for scale. 🚀**
