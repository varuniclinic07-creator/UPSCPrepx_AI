"""
UPSC Content Crawler - Automated Scheduler
Handles scheduled crawling based on update frequencies
"""

import asyncio
import schedule
import time
from datetime import datetime, timedelta
from typing import Dict, Callable
import logging
from pathlib import Path
import os
from dotenv import load_dotenv

from upsc_content_crawler import UPSCContentCrawler
from upsc_crawler_config import UpdateFrequency, SCHEDULE_CONFIG

# Load environment variables
load_dotenv()

# Configure logging
logger = logging.getLogger(__name__)


class CrawlerScheduler:
    """Manages scheduled crawling tasks"""
    
    def __init__(self, supabase_url: str, supabase_key: str):
        self.crawler = UPSCContentCrawler(supabase_url, supabase_key)
        self.is_running = False
        self.current_task = None
        self.task_history: Dict[str, datetime] = {}
        
    async def crawl_realtime(self):
        """Crawl realtime sources (every 30 minutes)"""
        logger.info("Starting REALTIME crawl")
        try:
            await self.crawler.crawl_by_frequency(UpdateFrequency.REALTIME)
            self.task_history['realtime'] = datetime.utcnow()
        except Exception as e:
            logger.error(f"REALTIME crawl failed: {e}")
    
    async def crawl_daily(self):
        """Crawl daily sources"""
        logger.info("Starting DAILY crawl")
        try:
            await self.crawler.crawl_by_frequency(UpdateFrequency.DAILY)
            self.task_history['daily'] = datetime.utcnow()
        except Exception as e:
            logger.error(f"DAILY crawl failed: {e}")
    
    async def crawl_weekly(self):
        """Crawl weekly sources"""
        logger.info("Starting WEEKLY crawl")
        try:
            await self.crawler.crawl_by_frequency(UpdateFrequency.WEEKLY)
            self.task_history['weekly'] = datetime.utcnow()
        except Exception as e:
            logger.error(f"WEEKLY crawl failed: {e}")
    
    async def crawl_monthly(self):
        """Crawl monthly sources"""
        logger.info("Starting MONTHLY crawl")
        try:
            await self.crawler.crawl_by_frequency(UpdateFrequency.MONTHLY)
            self.task_history['monthly'] = datetime.utcnow()
        except Exception as e:
            logger.error(f"MONTHLY crawl failed: {e}")
    
    def schedule_tasks(self):
        """Set up all scheduled tasks"""
        
        # Realtime sources - every 30 minutes
        schedule.every(30).minutes.do(
            lambda: asyncio.run(self.crawl_realtime())
        )
        
        # Daily sources - 6 AM every day
        schedule.every().day.at("06:00").do(
            lambda: asyncio.run(self.crawl_daily())
        )
        
        # Weekly sources - Sunday 6 AM
        schedule.every().sunday.at("06:00").do(
            lambda: asyncio.run(self.crawl_weekly())
        )
        
        # Monthly sources - 1st of month at 6 AM
        # Note: schedule doesn't support monthly, so we check date
        schedule.every().day.at("06:00").do(
            self._check_monthly_crawl
        )
        
        logger.info("All crawl tasks scheduled")
    
    def _check_monthly_crawl(self):
        """Check if it's the first day of the month for monthly crawl"""
        if datetime.now().day == 1:
            asyncio.run(self.crawl_monthly())
    
    def start(self, run_initial: bool = True):
        """Start the scheduler"""
        logger.info("Starting UPSC Content Crawler Scheduler")
        
        self.schedule_tasks()
        self.is_running = True
        
        # Run initial crawls
        if run_initial:
            logger.info("Running initial crawls...")
            asyncio.run(self.crawl_daily())
            asyncio.run(self.crawl_weekly())
        
        # Main scheduling loop
        try:
            while self.is_running:
                schedule.run_pending()
                time.sleep(60)  # Check every minute
        except KeyboardInterrupt:
            logger.info("Scheduler stopped by user")
            self.stop()
    
    def stop(self):
        """Stop the scheduler"""
        logger.info("Stopping scheduler...")
        self.is_running = False
        schedule.clear()
    
    def get_status(self) -> Dict:
        """Get scheduler status"""
        return {
            'is_running': self.is_running,
            'scheduled_jobs': len(schedule.jobs),
            'last_tasks': self.task_history,
            'next_run': schedule.next_run() if schedule.jobs else None
        }


class CrawlerDaemon:
    """Run crawler as a background daemon"""
    
    def __init__(self, supabase_url: str, supabase_key: str):
        self.scheduler = CrawlerScheduler(supabase_url, supabase_key)
        self.pid_file = Path("/tmp/upsc_crawler.pid")
    
    def start(self):
        """Start the daemon"""
        if self.pid_file.exists():
            logger.error("Daemon already running (PID file exists)")
            return
        
        # Write PID file
        with open(self.pid_file, 'w') as f:
            f.write(str(os.getpid()))
        
        try:
            logger.info("Starting crawler daemon...")
            self.scheduler.start(run_initial=True)
        finally:
            # Cleanup
            if self.pid_file.exists():
                self.pid_file.unlink()
    
    def stop(self):
        """Stop the daemon"""
        if not self.pid_file.exists():
            logger.error("Daemon not running (no PID file)")
            return
        
        # Read PID and send stop signal
        with open(self.pid_file, 'r') as f:
            pid = int(f.read().strip())
        
        import signal
        try:
            os.kill(pid, signal.SIGTERM)
            logger.info(f"Sent stop signal to daemon (PID: {pid})")
        except ProcessLookupError:
            logger.warning("Daemon process not found")
            self.pid_file.unlink()
    
    def status(self):
        """Check daemon status"""
        if not self.pid_file.exists():
            return "Daemon is not running"
        
        with open(self.pid_file, 'r') as f:
            pid = int(f.read().strip())
        
        try:
            os.kill(pid, 0)  # Check if process exists
            return f"Daemon is running (PID: {pid})"
        except ProcessLookupError:
            self.pid_file.unlink()
            return "Daemon PID file exists but process is not running"


# ============================================
# CLI Interface
# ============================================

def main():
    """Main entry point for scheduler"""
    import argparse
    
    parser = argparse.ArgumentParser(description='UPSC Content Crawler Scheduler')
    parser.add_argument(
        'action',
        choices=['start', 'stop', 'status', 'run-once'],
        help='Action to perform'
    )
    parser.add_argument(
        '--frequency',
        choices=['daily', 'weekly', 'monthly', 'realtime', 'all'],
        default='daily',
        help='Frequency for run-once mode'
    )
    parser.add_argument(
        '--daemon',
        action='store_true',
        help='Run as daemon (background process)'
    )
    parser.add_argument(
        '--no-initial',
        action='store_true',
        help='Skip initial crawl on start'
    )
    
    args = parser.parse_args()
    
    # Get credentials from environment
    SUPABASE_URL = os.getenv('SUPABASE_URL')
    SUPABASE_KEY = os.getenv('SUPABASE_KEY')
    
    if not SUPABASE_URL or not SUPABASE_KEY:
        logger.error("Missing SUPABASE_URL or SUPABASE_KEY environment variables")
        return
    
    if args.daemon:
        daemon = CrawlerDaemon(SUPABASE_URL, SUPABASE_KEY)
        
        if args.action == 'start':
            daemon.start()
        elif args.action == 'stop':
            daemon.stop()
        elif args.action == 'status':
            print(daemon.status())
    else:
        scheduler = CrawlerScheduler(SUPABASE_URL, SUPABASE_KEY)
        
        if args.action == 'start':
            scheduler.start(run_initial=not args.no_initial)
        elif args.action == 'status':
            status = scheduler.get_status()
            print(f"Scheduler Status: {status}")
        elif args.action == 'run-once':
            # Run a single crawl
            if args.frequency == 'all':
                asyncio.run(scheduler.crawler.crawl_all(force=True))
            else:
                freq_map = {
                    'daily': UpdateFrequency.DAILY,
                    'weekly': UpdateFrequency.WEEKLY,
                    'monthly': UpdateFrequency.MONTHLY,
                    'realtime': UpdateFrequency.REALTIME,
                }
                asyncio.run(
                    scheduler.crawler.crawl_by_frequency(freq_map[args.frequency])
                )


if __name__ == "__main__":
    main()
