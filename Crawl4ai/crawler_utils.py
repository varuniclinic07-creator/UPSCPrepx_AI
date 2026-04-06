"""
UPSC Content Crawler - Utilities
Testing, maintenance, and monitoring utilities
"""

import asyncio
import sys
from datetime import datetime, timedelta
from typing import List, Dict
import json
from pathlib import Path

from supabase import create_client
from upsc_content_crawler import UPSCContentCrawler
from upsc_crawler_config import CRAWLER_SOURCES, ContentCategory, UpdateFrequency


class CrawlerUtilities:
    """Utility functions for crawler management"""
    
    def __init__(self, supabase_url: str, supabase_key: str):
        self.supabase = create_client(supabase_url, supabase_key)
        self.crawler = UPSCContentCrawler(supabase_url, supabase_key)
    
    def test_connection(self) -> bool:
        """Test Supabase connection"""
        try:
            result = self.supabase.table('upsc_content').select('id').limit(1).execute()
            print("✅ Supabase connection successful")
            return True
        except Exception as e:
            print(f"❌ Supabase connection failed: {e}")
            return False
    
    def get_database_stats(self) -> Dict:
        """Get database statistics"""
        try:
            # Total content count
            total = self.supabase.table('upsc_content')\
                .select('id', count='exact')\
                .execute()
            
            # Content by category
            categories = {}
            for cat in ContentCategory:
                result = self.supabase.table('upsc_content')\
                    .select('id', count='exact')\
                    .eq('category', cat.value)\
                    .execute()
                categories[cat.value] = result.count
            
            # Recent crawls (last 24 hours)
            yesterday = (datetime.utcnow() - timedelta(days=1)).isoformat()
            recent = self.supabase.table('upsc_content')\
                .select('id', count='exact')\
                .gte('crawled_at', yesterday)\
                .execute()
            
            # Failed crawls (last 24 hours)
            failed = self.supabase.table('crawl_logs')\
                .select('id', count='exact')\
                .eq('status', 'failed')\
                .gte('created_at', yesterday)\
                .execute()
            
            stats = {
                'total_content': total.count,
                'categories': categories,
                'recent_24h': recent.count,
                'failed_24h': failed.count,
                'timestamp': datetime.utcnow().isoformat()
            }
            
            return stats
            
        except Exception as e:
            print(f"Error getting stats: {e}")
            return {}
    
    def print_database_stats(self):
        """Print formatted database statistics"""
        stats = self.get_database_stats()
        
        if not stats:
            return
        
        print("\n" + "="*60)
        print("DATABASE STATISTICS")
        print("="*60)
        print(f"Total Content Items: {stats['total_content']:,}")
        print(f"Recent Crawls (24h): {stats['recent_24h']:,}")
        print(f"Failed Crawls (24h): {stats['failed_24h']:,}")
        print("\nContent by Category:")
        for cat, count in sorted(stats['categories'].items(), key=lambda x: x[1], reverse=True):
            if count > 0:
                print(f"  {cat:.<40} {count:>6,}")
        print("="*60 + "\n")
    
    def list_sources(self, category: str = None, frequency: str = None):
        """List configured sources with filters"""
        sources = CRAWLER_SOURCES
        
        # Apply filters
        if category:
            sources = [s for s in sources if s.category.value == category]
        if frequency:
            sources = [s for s in sources if s.update_frequency.value == frequency]
        
        print(f"\n{'='*80}")
        print(f"CONFIGURED SOURCES ({len(sources)} total)")
        print(f"{'='*80}")
        print(f"{'Name':<35} {'Category':<20} {'Frequency':<12} {'Priority':<8}")
        print(f"{'-'*80}")
        
        for source in sorted(sources, key=lambda x: (x.priority, x.name)):
            print(f"{source.name:<35} {source.category.value:<20} "
                  f"{source.update_frequency.value:<12} {source.priority:<8}")
        
        print(f"{'='*80}\n")
    
    async def test_single_source(self, source_name: str):
        """Test crawling a single source"""
        source = next((s for s in CRAWLER_SOURCES if s.name == source_name), None)
        
        if not source:
            print(f"❌ Source '{source_name}' not found")
            return False
        
        print(f"\n🔍 Testing: {source.name}")
        print(f"URL: {source.url}")
        print(f"Category: {source.category.value}")
        print(f"Frequency: {source.update_frequency.value}")
        print(f"\nStarting crawl...\n")
        
        try:
            from crawl4ai import AsyncWebCrawler
            async with AsyncWebCrawler(verbose=True) as crawler:
                success = await self.crawler.crawl_source(source, crawler)
                
                if success:
                    print(f"\n✅ Successfully crawled {source.name}")
                    return True
                else:
                    print(f"\n❌ Failed to crawl {source.name}")
                    return False
        except Exception as e:
            print(f"\n❌ Error: {e}")
            return False
    
    def search_content(self, query: str, limit: int = 10):
        """Search stored content"""
        try:
            result = self.supabase.rpc(
                'search_content',
                {'search_query': query, 'limit_count': limit}
            ).execute()
            
            if not result.data:
                print(f"No results found for: {query}")
                return
            
            print(f"\n🔍 Search Results for: '{query}'")
            print(f"Found {len(result.data)} results\n")
            print("="*80)
            
            for i, item in enumerate(result.data, 1):
                print(f"\n{i}. {item['source_name']}")
                print(f"   Category: {item['category']}")
                print(f"   URL: {item['url']}")
                print(f"   Date: {item['crawled_at']}")
                print(f"   Relevance: {item['rank']:.4f}")
                
                # Preview
                preview = item['markdown_content'][:200] + "..." \
                    if len(item['markdown_content']) > 200 else item['markdown_content']
                print(f"   Preview: {preview}")
            
            print("\n" + "="*80 + "\n")
            
        except Exception as e:
            print(f"Search error: {e}")
    
    def cleanup_old_content(self, days: int = 180):
        """Remove content older than specified days"""
        cutoff = (datetime.utcnow() - timedelta(days=days)).isoformat()
        
        try:
            # Count items to delete
            count_result = self.supabase.table('upsc_content')\
                .select('id', count='exact')\
                .lt('crawled_at', cutoff)\
                .eq('is_verified', False)\
                .execute()
            
            count = count_result.count
            
            if count == 0:
                print(f"No content older than {days} days to clean up")
                return
            
            print(f"Found {count} items older than {days} days")
            confirm = input("Delete these items? (yes/no): ")
            
            if confirm.lower() != 'yes':
                print("Cleanup cancelled")
                return
            
            # Delete
            result = self.supabase.table('upsc_content')\
                .delete()\
                .lt('crawled_at', cutoff)\
                .eq('is_verified', False)\
                .execute()
            
            print(f"✅ Deleted {count} old content items")
            
        except Exception as e:
            print(f"Cleanup error: {e}")
    
    def export_sources_json(self, filepath: str = "sources_export.json"):
        """Export source configuration to JSON"""
        sources_data = []
        
        for source in CRAWLER_SOURCES:
            sources_data.append({
                'name': source.name,
                'url': source.url,
                'category': source.category.value,
                'update_frequency': source.update_frequency.value,
                'priority': source.priority,
                'rate_limit_delay': source.rate_limit_delay
            })
        
        with open(filepath, 'w') as f:
            json.dump(sources_data, f, indent=2)
        
        print(f"✅ Exported {len(sources_data)} sources to {filepath}")
    
    def validate_sources(self):
        """Validate all source URLs are accessible"""
        print("\n🔍 Validating source URLs...\n")
        
        import requests
        from requests.exceptions import RequestException
        
        valid = []
        invalid = []
        
        for source in CRAWLER_SOURCES:
            try:
                response = requests.head(
                    source.url, 
                    timeout=10,
                    allow_redirects=True,
                    headers={'User-Agent': 'UPSC-Crawler-Validator/1.0'}
                )
                
                if response.status_code < 400:
                    valid.append(source)
                    print(f"✅ {source.name}")
                else:
                    invalid.append((source, response.status_code))
                    print(f"❌ {source.name} - Status: {response.status_code}")
                    
            except RequestException as e:
                invalid.append((source, str(e)))
                print(f"❌ {source.name} - Error: {e}")
        
        print(f"\n{'='*60}")
        print(f"Validation Complete")
        print(f"Valid: {len(valid)}/{len(CRAWLER_SOURCES)}")
        print(f"Invalid: {len(invalid)}/{len(CRAWLER_SOURCES)}")
        print(f"{'='*60}\n")
        
        return valid, invalid
    
    def get_recent_content(self, hours: int = 24, category: str = None):
        """Get recent content"""
        cutoff = (datetime.utcnow() - timedelta(hours=hours)).isoformat()
        
        query = self.supabase.table('upsc_content')\
            .select('*')\
            .gte('crawled_at', cutoff)\
            .order('crawled_at', desc=True)
        
        if category:
            query = query.eq('category', category)
        
        result = query.execute()
        
        if not result.data:
            print(f"No content found in last {hours} hours")
            return
        
        print(f"\n📰 Recent Content (Last {hours} hours)")
        print(f"Found {len(result.data)} items\n")
        print("="*80)
        
        for item in result.data[:20]:  # Show first 20
            print(f"\n{item['source_name']}")
            print(f"  Category: {item['category']}")
            print(f"  URL: {item['url']}")
            print(f"  Crawled: {item['crawled_at']}")
            print(f"  Words: {item['metadata'].get('word_count', 'N/A')}")
        
        print("\n" + "="*80 + "\n")


def main():
    """CLI for utilities"""
    import argparse
    import os
    from dotenv import load_dotenv
    
    load_dotenv()
    
    parser = argparse.ArgumentParser(description='UPSC Crawler Utilities')
    parser.add_argument('command', choices=[
        'test-connection',
        'stats',
        'list-sources',
        'test-source',
        'search',
        'cleanup',
        'export',
        'validate',
        'recent'
    ])
    parser.add_argument('--name', help='Source name for test-source')
    parser.add_argument('--query', help='Search query')
    parser.add_argument('--category', help='Filter by category')
    parser.add_argument('--frequency', help='Filter by frequency')
    parser.add_argument('--days', type=int, default=180, help='Days for cleanup')
    parser.add_argument('--hours', type=int, default=24, help='Hours for recent content')
    parser.add_argument('--limit', type=int, default=10, help='Limit for search results')
    
    args = parser.parse_args()
    
    SUPABASE_URL = os.getenv('SUPABASE_URL')
    SUPABASE_KEY = os.getenv('SUPABASE_KEY')
    
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("❌ Missing SUPABASE_URL or SUPABASE_KEY environment variables")
        sys.exit(1)
    
    utils = CrawlerUtilities(SUPABASE_URL, SUPABASE_KEY)
    
    if args.command == 'test-connection':
        utils.test_connection()
    
    elif args.command == 'stats':
        utils.print_database_stats()
    
    elif args.command == 'list-sources':
        utils.list_sources(args.category, args.frequency)
    
    elif args.command == 'test-source':
        if not args.name:
            print("❌ Please provide --name argument")
            sys.exit(1)
        asyncio.run(utils.test_single_source(args.name))
    
    elif args.command == 'search':
        if not args.query:
            print("❌ Please provide --query argument")
            sys.exit(1)
        utils.search_content(args.query, args.limit)
    
    elif args.command == 'cleanup':
        utils.cleanup_old_content(args.days)
    
    elif args.command == 'export':
        utils.export_sources_json()
    
    elif args.command == 'validate':
        utils.validate_sources()
    
    elif args.command == 'recent':
        utils.get_recent_content(args.hours, args.category)


if __name__ == "__main__":
    main()
