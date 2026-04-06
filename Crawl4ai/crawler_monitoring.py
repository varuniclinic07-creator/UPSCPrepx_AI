"""
UPSC Content Crawler - Monitoring & Alerting
Production monitoring with email/webhook alerts
"""

import asyncio
import smtplib
import requests
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import logging
import json
import os
from dataclasses import dataclass

from supabase import create_client
from upsc_crawler_config import ERROR_SETTINGS

logger = logging.getLogger(__name__)


@dataclass
class Alert:
    """Alert data structure"""
    severity: str  # 'info', 'warning', 'critical'
    title: str
    message: str
    timestamp: datetime
    metadata: Dict = None


class AlertManager:
    """Manage alerts via email and webhooks"""
    
    def __init__(
        self,
        email_config: Dict = None,
        webhook_url: str = None,
        slack_webhook: str = None
    ):
        self.email_config = email_config
        self.webhook_url = webhook_url
        self.slack_webhook = slack_webhook
        self.alerts_sent = []
    
    def send_email(self, alert: Alert, recipients: List[str]):
        """Send email alert"""
        if not self.email_config or not recipients:
            return False
        
        try:
            msg = MIMEMultipart()
            msg['From'] = self.email_config['from']
            msg['To'] = ', '.join(recipients)
            msg['Subject'] = f"[{alert.severity.upper()}] {alert.title}"
            
            body = f"""
UPSC Content Crawler Alert

Severity: {alert.severity.upper()}
Time: {alert.timestamp}

{alert.message}

---
Metadata: {json.dumps(alert.metadata, indent=2) if alert.metadata else 'None'}
            """
            
            msg.attach(MIMEText(body, 'plain'))
            
            # Send email
            with smtplib.SMTP(
                self.email_config['server'],
                self.email_config['port']
            ) as server:
                server.starttls()
                server.login(
                    self.email_config['username'],
                    self.email_config['password']
                )
                server.send_message(msg)
            
            logger.info(f"Email alert sent: {alert.title}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send email: {e}")
            return False
    
    def send_webhook(self, alert: Alert):
        """Send webhook notification"""
        if not self.webhook_url:
            return False
        
        try:
            payload = {
                'severity': alert.severity,
                'title': alert.title,
                'message': alert.message,
                'timestamp': alert.timestamp.isoformat(),
                'metadata': alert.metadata
            }
            
            response = requests.post(
                self.webhook_url,
                json=payload,
                timeout=10
            )
            response.raise_for_status()
            
            logger.info(f"Webhook alert sent: {alert.title}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send webhook: {e}")
            return False
    
    def send_slack(self, alert: Alert):
        """Send Slack notification"""
        if not self.slack_webhook:
            return False
        
        try:
            color = {
                'info': '#36a64f',
                'warning': '#ff9900',
                'critical': '#ff0000'
            }.get(alert.severity, '#808080')
            
            payload = {
                "attachments": [{
                    "color": color,
                    "title": alert.title,
                    "text": alert.message,
                    "fields": [
                        {
                            "title": "Severity",
                            "value": alert.severity.upper(),
                            "short": True
                        },
                        {
                            "title": "Time",
                            "value": alert.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
                            "short": True
                        }
                    ],
                    "footer": "UPSC Crawler",
                    "ts": int(alert.timestamp.timestamp())
                }]
            }
            
            response = requests.post(
                self.slack_webhook,
                json=payload,
                timeout=10
            )
            response.raise_for_status()
            
            logger.info(f"Slack alert sent: {alert.title}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send Slack: {e}")
            return False
    
    def send_alert(
        self,
        alert: Alert,
        email_recipients: List[str] = None
    ):
        """Send alert through all configured channels"""
        self.alerts_sent.append(alert)
        
        # Send to all channels
        if email_recipients:
            self.send_email(alert, email_recipients)
        
        if self.webhook_url:
            self.send_webhook(alert)
        
        if self.slack_webhook:
            self.send_slack(alert)


class CrawlerMonitor:
    """Monitor crawler health and performance"""
    
    def __init__(
        self,
        supabase_url: str,
        supabase_key: str,
        alert_manager: AlertManager
    ):
        self.supabase = create_client(supabase_url, supabase_key)
        self.alert_manager = alert_manager
        self.thresholds = {
            'max_failure_rate': 0.15,  # 15%
            'max_consecutive_failures': 3,
            'min_crawls_per_day': 30,
            'max_response_time': 30000,  # ms
            'stale_content_hours': 48,
        }
    
    async def check_health(self) -> Dict:
        """Comprehensive health check"""
        checks = {
            'database': await self._check_database(),
            'recent_crawls': await self._check_recent_crawls(),
            'failure_rate': await self._check_failure_rate(),
            'stale_content': await self._check_stale_content(),
            'storage_usage': await self._check_storage(),
        }
        
        # Overall status
        all_passed = all(check['status'] == 'ok' for check in checks.values())
        checks['overall'] = 'healthy' if all_passed else 'degraded'
        checks['timestamp'] = datetime.utcnow().isoformat()
        
        return checks
    
    async def _check_database(self) -> Dict:
        """Check database connectivity"""
        try:
            result = self.supabase.table('upsc_content')\
                .select('id')\
                .limit(1)\
                .execute()
            
            return {
                'status': 'ok',
                'message': 'Database connected'
            }
        except Exception as e:
            alert = Alert(
                severity='critical',
                title='Database Connection Failed',
                message=f'Cannot connect to Supabase: {str(e)}',
                timestamp=datetime.utcnow(),
                metadata={'error': str(e)}
            )
            self.alert_manager.send_alert(alert)
            
            return {
                'status': 'error',
                'message': f'Database error: {str(e)}'
            }
    
    async def _check_recent_crawls(self) -> Dict:
        """Check if crawling is happening"""
        try:
            hours_ago = (datetime.utcnow() - timedelta(hours=24)).isoformat()
            
            result = self.supabase.table('upsc_content')\
                .select('id', count='exact')\
                .gte('crawled_at', hours_ago)\
                .execute()
            
            count = result.count
            threshold = self.thresholds['min_crawls_per_day']
            
            if count < threshold:
                alert = Alert(
                    severity='warning',
                    title='Low Crawl Activity',
                    message=f'Only {count} crawls in last 24h (expected: {threshold}+)',
                    timestamp=datetime.utcnow(),
                    metadata={'count': count, 'threshold': threshold}
                )
                self.alert_manager.send_alert(alert)
                
                return {
                    'status': 'warning',
                    'message': f'Low activity: {count} crawls',
                    'count': count
                }
            
            return {
                'status': 'ok',
                'message': f'{count} crawls in last 24h',
                'count': count
            }
            
        except Exception as e:
            return {
                'status': 'error',
                'message': f'Check failed: {str(e)}'
            }
    
    async def _check_failure_rate(self) -> Dict:
        """Check crawl failure rate"""
        try:
            hours_ago = (datetime.utcnow() - timedelta(hours=24)).isoformat()
            
            # Total attempts
            total = self.supabase.table('crawl_logs')\
                .select('id', count='exact')\
                .gte('created_at', hours_ago)\
                .execute()
            
            # Failed attempts
            failed = self.supabase.table('crawl_logs')\
                .select('id', count='exact')\
                .eq('status', 'failed')\
                .gte('created_at', hours_ago)\
                .execute()
            
            if total.count == 0:
                return {
                    'status': 'warning',
                    'message': 'No crawl attempts logged'
                }
            
            failure_rate = failed.count / total.count
            threshold = self.thresholds['max_failure_rate']
            
            if failure_rate > threshold:
                alert = Alert(
                    severity='warning',
                    title='High Failure Rate',
                    message=f'Failure rate: {failure_rate:.1%} (threshold: {threshold:.1%})',
                    timestamp=datetime.utcnow(),
                    metadata={
                        'failed': failed.count,
                        'total': total.count,
                        'rate': failure_rate
                    }
                )
                self.alert_manager.send_alert(alert)
                
                return {
                    'status': 'warning',
                    'message': f'High failure rate: {failure_rate:.1%}',
                    'failed': failed.count,
                    'total': total.count
                }
            
            return {
                'status': 'ok',
                'message': f'Failure rate: {failure_rate:.1%}',
                'failed': failed.count,
                'total': total.count
            }
            
        except Exception as e:
            return {
                'status': 'error',
                'message': f'Check failed: {str(e)}'
            }
    
    async def _check_stale_content(self) -> Dict:
        """Check for sources with stale content"""
        try:
            threshold_time = (
                datetime.utcnow() - timedelta(hours=self.thresholds['stale_content_hours'])
            ).isoformat()
            
            # Get sources that should update daily but haven't
            result = self.supabase.table('upsc_content')\
                .select('source_name')\
                .eq('update_frequency', 'daily')\
                .lt('crawled_at', threshold_time)\
                .execute()
            
            stale_sources = list(set([r['source_name'] for r in result.data]))
            
            if stale_sources:
                alert = Alert(
                    severity='warning',
                    title='Stale Content Detected',
                    message=f'{len(stale_sources)} sources have not updated in {self.thresholds["stale_content_hours"]}h',
                    timestamp=datetime.utcnow(),
                    metadata={'sources': stale_sources[:10]}  # First 10
                )
                self.alert_manager.send_alert(alert)
                
                return {
                    'status': 'warning',
                    'message': f'{len(stale_sources)} stale sources',
                    'sources': stale_sources[:5]
                }
            
            return {
                'status': 'ok',
                'message': 'All sources up to date'
            }
            
        except Exception as e:
            return {
                'status': 'error',
                'message': f'Check failed: {str(e)}'
            }
    
    async def _check_storage(self) -> Dict:
        """Check storage usage"""
        try:
            # Get total content count
            result = self.supabase.table('upsc_content')\
                .select('id', count='exact')\
                .execute()
            
            count = result.count
            
            # Simple estimate: warn if > 1M items
            if count > 1000000:
                return {
                    'status': 'warning',
                    'message': f'High storage: {count:,} items',
                    'count': count
                }
            
            return {
                'status': 'ok',
                'message': f'Storage: {count:,} items',
                'count': count
            }
            
        except Exception as e:
            return {
                'status': 'error',
                'message': f'Check failed: {str(e)}'
            }
    
    async def run_continuous_monitoring(self, interval_minutes: int = 60):
        """Run continuous monitoring loop"""
        logger.info(f"Starting continuous monitoring (every {interval_minutes} min)")
        
        while True:
            try:
                health = await self.check_health()
                
                logger.info(f"Health check: {health['overall']}")
                
                # Send summary if not healthy
                if health['overall'] != 'healthy':
                    summary = "\n".join([
                        f"{k}: {v.get('message', 'N/A')}"
                        for k, v in health.items()
                        if k != 'overall' and isinstance(v, dict)
                    ])
                    
                    alert = Alert(
                        severity='info',
                        title='System Health Summary',
                        message=f"Status: {health['overall']}\n\n{summary}",
                        timestamp=datetime.utcnow(),
                        metadata=health
                    )
                    self.alert_manager.send_alert(alert)
                
                # Wait for next check
                await asyncio.sleep(interval_minutes * 60)
                
            except Exception as e:
                logger.error(f"Monitoring error: {e}")
                await asyncio.sleep(300)  # Wait 5 min on error


# Example usage
async def main():
    """Example monitoring setup"""
    
    # Email configuration
    email_config = {
        'server': os.getenv('SMTP_SERVER', 'smtp.gmail.com'),
        'port': int(os.getenv('SMTP_PORT', 587)),
        'username': os.getenv('SMTP_USERNAME'),
        'password': os.getenv('SMTP_PASSWORD'),
        'from': os.getenv('ALERT_EMAIL')
    }
    
    # Initialize alert manager
    alert_manager = AlertManager(
        email_config=email_config if email_config['username'] else None,
        webhook_url=os.getenv('WEBHOOK_URL'),
        slack_webhook=os.getenv('SLACK_WEBHOOK')
    )
    
    # Initialize monitor
    monitor = CrawlerMonitor(
        supabase_url=os.getenv('SUPABASE_URL'),
        supabase_key=os.getenv('SUPABASE_KEY'),
        alert_manager=alert_manager
    )
    
    # Run one-time health check
    health = await monitor.check_health()
    print(json.dumps(health, indent=2))
    
    # Or run continuous monitoring
    # await monitor.run_continuous_monitoring(interval_minutes=60)


if __name__ == "__main__":
    from dotenv import load_dotenv
    load_dotenv()
    asyncio.run(main())
