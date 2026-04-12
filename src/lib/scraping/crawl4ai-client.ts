import { withCircuitBreaker } from '@/lib/resilience/circuit-breaker';
import { logger } from '@/lib/logger/logger';

const CRAWL4AI_URL = process.env.CRAWL4AI_URL || '';
const TIMEOUT_MS = 30000;

// Lazy token getter - only validates when actually used (not at build time)
function getCrawl4AIToken(): string {
  const token = process.env.CRAWL4AI_API_TOKEN || process.env.CRAWL4AI_TOKEN;
  if (!token) {
    throw new Error('CRAWL4AI_API_TOKEN or CRAWL4AI_TOKEN required');
  }
  return token;
}

interface ScrapeResult {
  url: string;
  title: string;
  content: string;
  markdown: string;
  html: string;
  links: string[];
  images: string[];
}

const ALLOWED_DOMAINS = [
  'thehindu.com', 'indianexpress.com', 'pib.gov.in',
  'visionias.in', 'drishtiias.com', 'rajyasabha.nic.in',
  'loksabha.nic.in', 'insightsonindia.com'
];

function validateUrl(url: string): void {
  const parsed = new URL(url);
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('Invalid protocol');
  }
  if (!ALLOWED_DOMAINS.some(d => parsed.hostname.includes(d))) {
    throw new Error('Domain not whitelisted');
  }
}

export async function scrapeUrl(url: string): Promise<ScrapeResult> {
  validateUrl(url);
  
  return withCircuitBreaker(async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await fetch(`${CRAWL4AI_URL}/crawl`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getCrawl4AIToken()}`,
        },
        body: JSON.stringify({ url }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Crawl4AI error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      logger.error('Scrape failed', error as Error, { url });
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  });
}

export async function scrapeCurrentAffairs(sources: string[]): Promise<ScrapeResult[]> {
  const results = await Promise.allSettled(
    sources.map((url) => scrapeUrl(url))
  );

  const succeeded = results.filter((r) => r.status === 'fulfilled').length;
  logger.info('Scraping complete', { total: sources.length, succeeded });

  return results
    .filter((r) => r.status === 'fulfilled')
    .map((r) => (r as PromiseFulfilledResult<ScrapeResult>).value);
}

export const NEWS_SOURCES = {
  THE_HINDU: 'https://www.thehindu.com/opinion/editorial/',
  INDIAN_EXPRESS: 'https://indianexpress.com/section/upsc-current-affairs/',
  PIB: 'https://pib.gov.in/allRel.aspx',
  VISION_IAS: 'https://www.visionias.in/daily-current-affairs',
  DRISHTI_IAS: 'https://www.drishtiias.com/daily-updates/daily-news-analysis',
} as const;