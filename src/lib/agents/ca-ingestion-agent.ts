import { BaseAgent } from './base-agent';
import { callAI } from '../ai/ai-provider-client';
import { normalizeUPSCInput } from './normalizer-agent';

export interface CAArticle {
  title: string;
  summary: string;
  source: string;
  sourceUrl: string;
  subject: string;
  topics: string[];
  nodeId?: string;
}

export interface CAIngestionResult {
  articles: CAArticle[];
  processed: number;
  errors: string[];
}

interface CASource {
  name: string;
  url: string;
}

const DEFAULT_CA_SOURCES: CASource[] = [
  { name: 'PIB', url: process.env.AGENTIC_WEB_SEARCH_URL || '' },
  { name: 'The Hindu', url: process.env.AGENTIC_WEB_SEARCH_URL || '' },
  { name: 'Indian Express', url: process.env.AGENTIC_WEB_SEARCH_URL || '' },
  { name: 'Drishti IAS', url: process.env.AGENTIC_WEB_SEARCH_URL || '' },
  { name: 'Yojana', url: process.env.AGENTIC_WEB_SEARCH_URL || '' },
  { name: 'Kurukshetra', url: process.env.AGENTIC_WEB_SEARCH_URL || '' },
];

class CAIngestionAgent extends BaseAgent {
  constructor() {
    super('ca_ingestion');
  }

  async execute(params: {
    date?: string;
    sources?: string[];
  }): Promise<CAIngestionResult> {
    const date = params.date || new Date().toISOString().split('T')[0];
    const sourcesToUse = params.sources
      ? DEFAULT_CA_SOURCES.filter((s) => params.sources!.includes(s.name))
      : DEFAULT_CA_SOURCES;

    const runId = await this.startRun();
    const articles: CAArticle[] = [];
    const errors: string[] = [];

    try {
      for (const source of sourcesToUse) {
        try {
          const rawResults = await this.fetchFromSource(source, date);
          if (!rawResults || rawResults.length === 0) {
            this.log('info', `No results from ${source.name} for ${date}`);
            continue;
          }

          for (const result of rawResults) {
            try {
              const extracted = await this.extractArticleData(result, source);
              if (!extracted) continue;

              const normalized = await normalizeUPSCInput(
                `${extracted.title} ${extracted.summary}`
              );
              const nodeId = normalized?.nodeId;

              const article: CAArticle = {
                title: extracted.title,
                summary: extracted.summary,
                source: source.name,
                sourceUrl: extracted.sourceUrl || source.url,
                subject: extracted.subject,
                topics: extracted.topics,
                nodeId,
              };

              // Insert into current_affairs table
              try {
                await this.supabase.from('current_affairs').insert({
                  title: article.title,
                  summary: article.summary,
                  source: article.source,
                  source_url: article.sourceUrl,
                  subject: article.subject,
                  topics: article.topics,
                  node_id: article.nodeId,
                  published_date: date,
                });
              } catch (dbError) {
                this.log('warn', `Failed to insert into current_affairs: ${dbError}`);
                errors.push(`DB insert failed for "${article.title}": ${dbError}`);
              }

              // Create knowledge_edge linking article node to topic nodes
              if (nodeId && article.topics.length > 0) {
                for (const topic of article.topics) {
                  try {
                    await this.supabase.from('knowledge_edges').insert({
                      source_node_id: nodeId,
                      target_topic: topic,
                      edge_type: 'related_to',
                      created_by: 'ca_ingestion',
                    });
                  } catch (edgeError) {
                    this.log('warn', `Failed to create knowledge_edge for topic ${topic}: ${edgeError}`);
                  }
                }
              }

              // Write to content_queue
              try {
                await this.supabase.from('content_queue').insert({
                  node_id: nodeId,
                  content_type: 'ca_brief',
                  generated_content: {
                    title: article.title,
                    summary: article.summary,
                    source: article.source,
                    subject: article.subject,
                    topics: article.topics,
                    date,
                  },
                  agent_type: 'ca_ingestion',
                });
              } catch (queueError) {
                this.log('warn', `Failed to write to content_queue: ${queueError}`);
                errors.push(`Queue insert failed for "${article.title}": ${queueError}`);
              }

              articles.push(article);
            } catch (articleError) {
              const msg = `Failed to process article from ${source.name}: ${articleError}`;
              this.log('warn', msg);
              errors.push(msg);
            }
          }
        } catch (sourceError) {
          const msg = `Failed to fetch from ${source.name}: ${sourceError}`;
          this.log('warn', msg);
          errors.push(msg);
        }
      }

      await this.completeRun('completed', { content_generated: articles.length });
    } catch (error) {
      this.log('error', `CA ingestion failed: ${error}`);
      errors.push(`Critical failure: ${error}`);
      await this.completeRun('failed', { errors: [`${error}`] });
    }

    return {
      articles,
      processed: articles.length,
      errors,
    };
  }

  private async fetchFromSource(
    source: CASource,
    date: string
  ): Promise<Record<string, unknown>[]> {
    if (!source.url) {
      this.log('info', `No URL configured for source ${source.name}`);
      return [];
    }

    try {
      const response = await fetch(source.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `${source.name} UPSC current affairs ${date}`,
        }),
      });

      if (!response.ok) {
        this.log('warn', `HTTP ${response.status} from ${source.name}`);
        return [];
      }

      const data = await response.json();
      return Array.isArray(data) ? data : data.results || [];
    } catch (fetchError) {
      this.log('warn', `Fetch error for ${source.name}: ${fetchError}`);
      return [];
    }
  }

  private async extractArticleData(
    rawResult: Record<string, unknown>,
    source: CASource
  ): Promise<{
    title: string;
    summary: string;
    subject: string;
    topics: string[];
    sourceUrl: string;
  } | null> {
    try {
      const content = JSON.stringify(rawResult);

      const systemPrompt = [
        'You are a UPSC current affairs analyst.',
        'Extract and structure the following article data.',
        'Return ONLY valid JSON with these fields:',
        '{ "title": string, "summary": string (2-3 sentences), "subject": string (GS1/GS2/GS3/GS4/Essay), "topics": string[] (UPSC syllabus topics), "sourceUrl": string }',
        'The subject must map to UPSC General Studies papers.',
      ].join(' ');

      const response = await callAI({
        systemPrompt,
        userPrompt: `Source: ${source.name}\n\nRaw content:\n${content}`,
        skipSimplifiedLanguage: true,
      });

      return this.parseExtractedArticle(response);
    } catch (error) {
      this.log('warn', `AI extraction failed for article from ${source.name}: ${error}`);
      return null;
    }
  }

  private parseExtractedArticle(raw: string): {
    title: string;
    summary: string;
    subject: string;
    topics: string[];
    sourceUrl: string;
  } | null {
    try {
      const parsed = JSON.parse(raw);
      if (parsed.title && parsed.summary) {
        return {
          title: parsed.title,
          summary: parsed.summary,
          subject: parsed.subject || 'General Studies',
          topics: Array.isArray(parsed.topics) ? parsed.topics : [],
          sourceUrl: parsed.sourceUrl || '',
        };
      }
    } catch {
      // Try extracting JSON from wrapped text
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.title && parsed.summary) {
            return {
              title: parsed.title,
              summary: parsed.summary,
              subject: parsed.subject || 'General Studies',
              topics: Array.isArray(parsed.topics) ? parsed.topics : [],
              sourceUrl: parsed.sourceUrl || '',
            };
          }
        } catch {
          // Could not parse
        }
      }
    }

    return null;
  }
}

export const caIngestionAgent = new CAIngestionAgent();
