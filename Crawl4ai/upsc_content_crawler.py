"""
UPSC Content Crawler - Main Implementation
Enterprise-grade content crawler with all safety features
"""

import asyncio
import aiohttp
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, List, Any
from urllib.parse import urlparse, urljoin
from urllib.robotparser import RobotFileParser
import time
import random
import hashlib
import json
from pathlib import Path
from dataclasses import asdict
from crawl4ai import AsyncWebCrawler, CrawlerRunConfig, CacheMode
from crawl4ai.markdown_generation_strategy import DefaultMarkdownGenerator
from crawl4ai.content_filter_strategy import PruningContentFilter
from supabase import create_client, Client
import backoff

from upsc_crawler_config import (
    CRAWLER_SOURCES, CRAWLER_SETTINGS, STORAGE_SETTINGS, 
    ERROR_SETTINGS, UpdateFrequency, SourceConfig
)

# Configure Logging
logging.basicConfig(
    level=getattr(logging, ERROR_SETTINGS['log_level']),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(ERROR_SETTINGS['log_file']),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


class RobotsChecker:
    """Handle robots.txt compliance for all domains"""
    
    def __init__(self):
        self.parsers: Dict[str, RobotFileParser] = {}
        self.user_agent = CRAWLER_SETTINGS['user_agent']
        
    async def can_fetch(self, url: str) -> bool:
        """Check if we can fetch the URL according to robots.txt"""
        if not CRAWLER_SETTINGS['respect_robots_txt']:
            return True
            
        parsed = urlparse(url)
        domain = f"{parsed.scheme}://{parsed.netloc}"
        
        if domain not in self.parsers:
            robots_url = urljoin(domain, '/robots.txt')
            parser = RobotFileParser()
            parser.set_url(robots_url)
            try:
                parser.read()
                self.parsers[domain] = parser
                logger.info(f"Loaded robots.txt for {domain}")
            except Exception as e:
                logger.warning(f"Could not read robots.txt for {domain}: {e}")
                # If we can't read robots.txt, assume we can fetch
                return True
        
        can_fetch = self.parsers[domain].can_fetch(self.user_agent, url)
        if not can_fetch:
            logger.warning(f"Blocked by robots.txt: {url}")
        return can_fetch


class RateLimiter:
    """Rate limiting with per-domain tracking"""
    
    def __init__(self):
        self.last_request: Dict[str, float] = {}
        
    async def wait_if_needed(self, domain: str, delay: float):
        """Wait if necessary to respect rate limits"""
        current_time = time.time()
        
        if domain in self.last_request:
            time_since_last = current_time - self.last_request[domain]
            if time_since_last < delay:
                wait_time = delay - time_since_last
                # Add random jitter to avoid thundering herd
                wait_time += random.uniform(0, 1)
                logger.debug(f"Rate limiting: waiting {wait_time:.2f}s for {domain}")
                await asyncio.sleep(wait_time)
        
        self.last_request[domain] = time.time()


class ContentMetadataExtractor:
    """Extract metadata from crawled content"""
    
    @staticmethod
    def extract(html: str, markdown: str, url: str) -> Dict[str, Any]:
        """Extract metadata from content"""
        metadata = {
            'url': url,
            'crawled_at': datetime.utcnow().isoformat(),
            'content_hash': hashlib.sha256(markdown.encode()).hexdigest(),
            'word_count': len(markdown.split()),
            'character_count': len(markdown),
            'html_size': len(html),
        }
        
        # Add more sophisticated extraction as needed
        # (title, author, publish_date, tags, etc.)
        
        return metadata


class SupabaseStorage:
    """Handle storage to Supabase"""
    
    def __init__(self, supabase_url: str, supabase_key: str):
        self.client: Client = create_client(supabase_url, supabase_key)
        self.table_name = 'current_affairs'  # Match Next.js app table
        
    async def store_content(self, data: Dict[str, Any]) -> bool:
        """Store content to Supabase with error handling"""
        try:
            # Transform to match current_affairs schema
            transformed = {
                'title': data.get('source_name', 'Untitled')[:500],
                'summary': data.get('cleaned_content', '')[:500],
                'full_content': data.get('markdown_content', '')[:50000],
                'source_url': data['url'],
                'source_name': data.get('source_name', ''),
                'category': data.get('category', 'current_affairs'),
                'published_date': datetime.utcnow().date().isoformat(),
                'content_hash': data['metadata']['content_hash'],
                'crawl_metadata': data['metadata'],
            }
            
            # Check if content already exists by hash
            existing = self.client.table(self.table_name)\
                .select('id, content_hash')\
                .eq('content_hash', transformed['content_hash'])\
                .execute()
            
            if existing.data and len(existing.data) > 0:
                logger.debug(f"Content already exists: {data['url']}")
                return True
            else:
                # Insert new content
                self.client.table(self.table_name)\
                    .insert(transformed)\
                    .execute()
                logger.info(f"Inserted new content: {data['url']}")
                return True
                
        except Exception as e:
            logger.error(f"Failed to store content for {data['url']}: {e}")
            return False
    
    async def store_batch(self, batch: List[Dict[str, Any]]) -> int:
        """Store multiple items in batch"""
        success_count = 0
        for item in batch:
            if await self.store_content(item):
                success_count += 1
        return success_count
    
    async def get_last_crawl_time(self, url: str) -> Optional[datetime]:
        """Get last successful crawl time for a URL"""
        try:
            result = self.client.table(self.table_name)\
                .select('crawled_at')\
                .eq('url', url)\
                .order('crawled_at', desc=True)\
                .limit(1)\
                .execute()
            
            if result.data and len(result.data) > 0:
                return datetime.fromisoformat(result.data[0]['crawled_at'])
            return None
        except Exception as e:
            logger.error(f"Failed to get last crawl time for {url}: {e}")
            return None


class UPSCContentCrawler:
    """Main crawler class with all features"""
    
    def __init__(self, supabase_url: str, supabase_key: str):
        self.storage = SupabaseStorage(supabase_url, supabase_key)
        self.robots_checker = RobotsChecker()
        self.rate_limiter = RateLimiter()
        self.failure_counts: Dict[str, int] = {}
        self.stats = {
            'total_attempted': 0,
            'total_success': 0,
            'total_failed': 0,
            'total_blocked': 0,
            'start_time': None,
            'end_time': None,
        }
        
    def _get_domain(self, url: str) -> str:
        """Extract domain from URL"""
        return urlparse(url).netloc
    
    @backoff.on_exception(
        backoff.expo,
        (aiohttp.ClientError, asyncio.TimeoutError),
        max_tries=CRAWLER_SETTINGS['max_retries'],
        max_time=300
    )
    async def _crawl_with_retry(
        self, 
        crawler: AsyncWebCrawler, 
        source: SourceConfig
    ) -> Optional[Dict[str, Any]]:
        """Crawl a single URL with retry logic"""
        
        # Check robots.txt
        if not await self.robots_checker.can_fetch(source.url):
            self.stats['total_blocked'] += 1
            return None
        
        # Apply rate limiting
        domain = self._get_domain(source.url)
        await self.rate_limiter.wait_if_needed(domain, source.rate_limit_delay)
        
        # Configure crawl
        config = CrawlerRunConfig(
            cache_mode=CacheMode.BYPASS,
            markdown_generator=DefaultMarkdownGenerator(),
            content_filter=PruningContentFilter(),
            word_count_threshold=10,
            excluded_tags=['nav', 'footer', 'header'],
            remove_overlay_elements=True,
            user_agent=CRAWLER_SETTINGS['user_agent'],
            verbose=False,
        )
        
        try:
            logger.info(f"Crawling: {source.name} - {source.url}")
            
            # Perform crawl
            result = await crawler.arun(
                url=source.url,
                config=config,
                session_id=f"upsc_{domain}"
            )
            
            if not result.success:
                raise Exception(f"Crawl failed: {result.error_message}")
            
            # Extract content and metadata
            metadata = ContentMetadataExtractor.extract(
                result.html, 
                result.markdown_v2.raw_markdown, 
                source.url
            )
            
            # Prepare data for storage
            data = {
                'url': source.url,
                'source_name': source.name,
                'category': source.category.value,
                'priority': source.priority,
                'html_content': result.html if STORAGE_SETTINGS['store_raw_html'] else None,
                'markdown_content': result.markdown_v2.raw_markdown,
                'cleaned_content': result.markdown_v2.markdown_with_citations,
                'metadata': metadata,
                'crawled_at': datetime.utcnow().isoformat(),
                'update_frequency': source.update_frequency.value,
            }
            
            # Reset failure count on success
            self.failure_counts[source.url] = 0
            self.stats['total_success'] += 1
            
            logger.info(f"Successfully crawled: {source.name}")
            return data
            
        except Exception as e:
            # Track failures
            self.failure_counts[source.url] = self.failure_counts.get(source.url, 0) + 1
            self.stats['total_failed'] += 1
            
            logger.error(f"Failed to crawl {source.name}: {e}")
            
            # Alert if too many consecutive failures
            if self.failure_counts[source.url] >= ERROR_SETTINGS['max_consecutive_failures']:
                logger.critical(f"Max consecutive failures reached for {source.name}")
                # Here you could send email/SMS alert
            
            raise
    
    async def crawl_source(
        self, 
        source: SourceConfig, 
        crawler: AsyncWebCrawler
    ) -> bool:
        """Crawl a single source"""
        self.stats['total_attempted'] += 1
        
        try:
            data = await self._crawl_with_retry(crawler, source)
            if data:
                return await self.storage.store_content(data)
            return False
        except Exception as e:
            logger.error(f"Final failure for {source.name} after all retries: {e}")
            return False
    
    async def crawl_by_frequency(
        self, 
        frequency: UpdateFrequency, 
        force: bool = False
    ):
        """Crawl all sources with specific update frequency"""
        sources = [s for s in CRAWLER_SOURCES if s.update_frequency == frequency]
        
        if not force:
            # Filter sources that need updating
            filtered_sources = []
            for source in sources:
                last_crawl = await self.storage.get_last_crawl_time(source.url)
                if self._should_crawl(last_crawl, frequency):
                    filtered_sources.append(source)
            sources = filtered_sources
        
        logger.info(f"Crawling {len(sources)} sources with {frequency.value} frequency")
        await self.crawl_sources(sources)
    
    def _should_crawl(self, last_crawl: Optional[datetime], frequency: UpdateFrequency) -> bool:
        """Determine if source should be crawled based on last crawl time"""
        if last_crawl is None:
            return True
        
        now = datetime.utcnow()
        delta = now - last_crawl
        
        if frequency == UpdateFrequency.REALTIME:
            return delta > timedelta(minutes=30)
        elif frequency == UpdateFrequency.DAILY:
            return delta > timedelta(hours=20)  # Allow some flexibility
        elif frequency == UpdateFrequency.WEEKLY:
            return delta > timedelta(days=6)
        elif frequency == UpdateFrequency.MONTHLY:
            return delta > timedelta(days=28)
        
        return True
    
    async def crawl_sources(self, sources: List[SourceConfig]):
        """Crawl multiple sources with concurrency control"""
        self.stats['start_time'] = datetime.utcnow()
        
        async with AsyncWebCrawler(verbose=False) as crawler:
            # Sort by priority
            sources = sorted(sources, key=lambda x: x.priority)
            
            # Process in batches to control concurrency
            batch_size = CRAWLER_SETTINGS['max_concurrent_requests']
            for i in range(0, len(sources), batch_size):
                batch = sources[i:i + batch_size]
                tasks = [self.crawl_source(source, crawler) for source in batch]
                await asyncio.gather(*tasks, return_exceptions=True)
                
                # Small delay between batches
                if i + batch_size < len(sources):
                    await asyncio.sleep(random.uniform(1, 3))
        
        self.stats['end_time'] = datetime.utcnow()
        self._print_stats()
    
    async def crawl_all(self, force: bool = False):
        """Crawl all configured sources"""
        logger.info("Starting full crawl of all sources")
        if force:
            await self.crawl_sources(CRAWLER_SOURCES)
        else:
            # Crawl by frequency to respect update schedules
            for frequency in UpdateFrequency:
                await self.crawl_by_frequency(frequency, force=False)
    
    def _print_stats(self):
        """Print crawling statistics"""
        duration = (self.stats['end_time'] - self.stats['start_time']).total_seconds()
        
        logger.info("=" * 60)
        logger.info("CRAWL STATISTICS")
        logger.info("=" * 60)
        logger.info(f"Duration: {duration:.2f} seconds")
        logger.info(f"Total Attempted: {self.stats['total_attempted']}")
        logger.info(f"Total Success: {self.stats['total_success']}")
        logger.info(f"Total Failed: {self.stats['total_failed']}")
        logger.info(f"Total Blocked: {self.stats['total_blocked']}")
        logger.info(f"Success Rate: {(self.stats['total_success'] / max(self.stats['total_attempted'], 1) * 100):.2f}%")
        logger.info("=" * 60)


# Example usage
async def main():
    """Example usage of the crawler"""
    
    # Your Supabase credentials
    SUPABASE_URL = "https://your-project.supabase.co"
    SUPABASE_KEY = "your-supabase-key"
    
    # Initialize crawler
    crawler = UPSCContentCrawler(SUPABASE_URL, SUPABASE_KEY)
    
    # Crawl all daily sources
    await crawler.crawl_by_frequency(UpdateFrequency.DAILY)
    
    # Or crawl all sources (respecting schedules)
    # await crawler.crawl_all()
    
    # Or force crawl everything
    # await crawler.crawl_all(force=True)


if __name__ == "__main__":
    asyncio.run(main())
