/**
 * Normalizer Agent — resolves any user input to a Knowledge Graph node
 * 3-tier resolution: exact cache → fuzzy syllabus map → AI classification
 */
import { BaseAgent } from './base-agent';
import { findSyllabusMatch } from '../ai/upsc-syllabus-map';
import { createHash } from 'crypto';

export interface NormalizationResult {
  subject: string;
  topic: string;
  subtopic: string;
  nodeId: string | null;
  confidence: number;
  method: 'exact' | 'fuzzy' | 'ai' | 'none';
  cacheKey: string;
}

export class NormalizerAgent extends BaseAgent {
  constructor() {
    super('normalizer');
  }

  /**
   * Normalize raw user input to structured UPSC topic data.
   * Returns subject, topic, subtopic, KG nodeId, confidence, and resolution method.
   */
  async normalize(rawInput: string): Promise<NormalizationResult> {
    if (!rawInput || rawInput.trim().length === 0) {
      return {
        subject: 'General',
        topic: 'General',
        subtopic: '',
        nodeId: null,
        confidence: 0,
        method: 'none',
        cacheKey: '',
      };
    }

    const cleaned = rawInput.toLowerCase().trim();
    const cacheKey = createHash('md5').update(cleaned).digest('hex');

    // Tier 1: Check cache
    try {
      const cached = await this.checkCache(cacheKey);
      if (cached) {
        return { ...cached, cacheKey };
      }
    } catch (err) {
      this.log('warn', 'Cache lookup failed, continuing to fuzzy match', err);
    }

    // Tier 2: Fuzzy syllabus map
    const fuzzyMatch = findSyllabusMatch(rawInput);
    if (fuzzyMatch && fuzzyMatch.confidence >= 0.4) {
      const nodeId = await this.findOrCreateNode(fuzzyMatch.subject, fuzzyMatch.topic, fuzzyMatch.subtopic);
      const result: NormalizationResult = {
        subject: fuzzyMatch.subject,
        topic: fuzzyMatch.topic,
        subtopic: fuzzyMatch.subtopic,
        nodeId,
        confidence: fuzzyMatch.confidence,
        method: fuzzyMatch.method,
        cacheKey,
      };
      await this.writeCache(cacheKey, rawInput, result);
      return result;
    }

    // Tier 3: AI classification
    try {
      const aiResult = await this.classifyWithAI(rawInput);
      if (aiResult) {
        const nodeId = await this.findOrCreateNode(aiResult.subject, aiResult.topic, aiResult.subtopic);
        const result: NormalizationResult = {
          subject: aiResult.subject,
          topic: aiResult.topic,
          subtopic: aiResult.subtopic,
          nodeId,
          confidence: aiResult.confidence,
          method: 'ai',
          cacheKey,
        };
        await this.writeCache(cacheKey, rawInput, result);
        return result;
      }
    } catch (err) {
      this.log('warn', 'AI classification failed', err);
    }

    // Fallback: use fuzzy match even with low confidence, or default
    if (fuzzyMatch) {
      const nodeId = await this.findOrCreateNode(fuzzyMatch.subject, fuzzyMatch.topic, fuzzyMatch.subtopic);
      return {
        subject: fuzzyMatch.subject,
        topic: fuzzyMatch.topic,
        subtopic: fuzzyMatch.subtopic,
        nodeId,
        confidence: fuzzyMatch.confidence,
        method: 'fuzzy',
        cacheKey,
      };
    }

    return {
      subject: 'General',
      topic: rawInput.slice(0, 100),
      subtopic: '',
      nodeId: null,
      confidence: 0.1,
      method: 'none',
      cacheKey,
    };
  }

  /** Tier 1: Check upsc_input_normalizations cache */
  private async checkCache(hash: string): Promise<Omit<NormalizationResult, 'cacheKey'> | null> {
    const { data, error } = await this.supabase
      .from('upsc_input_normalizations')
      .select('resolved_subject, resolved_topic, resolved_subtopic, node_id, confidence, method')
      .eq('raw_input_hash', hash)
      .maybeSingle();

    if (error || !data) return null;

    return {
      subject: data.resolved_subject || 'General',
      topic: data.resolved_topic || 'General',
      subtopic: data.resolved_subtopic || '',
      nodeId: data.node_id,
      confidence: data.confidence,
      method: data.method as 'exact' | 'fuzzy' | 'ai',
    };
  }

  /** Write result to normalizer cache */
  private async writeCache(hash: string, rawInput: string, result: NormalizationResult): Promise<void> {
    try {
      // raw_input_hash is a DB-generated column (md5(lower(trim(raw_input)))) — do NOT send it
      await this.supabase
        .from('upsc_input_normalizations')
        .upsert({
          raw_input: rawInput.slice(0, 500),
          resolved_subject: result.subject,
          resolved_topic: result.topic,
          resolved_subtopic: result.subtopic,
          node_id: result.nodeId,
          method: result.method === 'none' ? 'fuzzy' : result.method,
          confidence: result.confidence,
        }, { onConflict: 'raw_input_hash' });
    } catch (err) {
      this.log('warn', 'Cache write failed', err);
    }
  }

  /** Find or create a knowledge_nodes entry for the resolved topic */
  private async findOrCreateNode(subject: string, topic: string, subtopic: string): Promise<string | null> {
    try {
      // Try to find existing node
      const { data: existing } = await this.supabase
        .from('knowledge_nodes')
        .select('id')
        .eq('type', subtopic ? 'subtopic' : 'topic')
        .eq('subject', subject)
        .eq('title', subtopic || topic)
        .maybeSingle();

      if (existing) return existing.id;

      // Create new node
      const { data: created, error } = await this.supabase
        .from('knowledge_nodes')
        .insert({
          type: subtopic ? 'subtopic' : 'topic',
          title: subtopic || topic,
          subject,
          metadata: { topic, subtopic },
        })
        .select('id')
        .single();

      if (error || !created) {
        this.log('warn', 'Failed to create knowledge node', error);
        return null;
      }

      return created.id;
    } catch (err) {
      this.log('warn', 'Node lookup/create failed', err);
      return null;
    }
  }

  /** Tier 3: Use AI to classify input into UPSC subject/topic/subtopic */
  private async classifyWithAI(input: string): Promise<{
    subject: string;
    topic: string;
    subtopic: string;
    confidence: number;
  } | null> {
    try {
      const { callAI } = await import('../ai/ai-provider-client');
      const response = await callAI({
        messages: [
          {
            role: 'system',
            content: `You are a UPSC CSE syllabus classifier. Given a user query, return ONLY a JSON object with:
{
  "subject": "GS1|GS2|GS3|GS4|CSAT|Essay|General|Optional",
  "topic": "main topic name",
  "subtopic": "specific subtopic",
  "confidence": 0.0-1.0
}
Subjects: GS1=History/Geography/Society, GS2=Polity/Governance/IR, GS3=Economy/Env/S&T/Security, GS4=Ethics.
Return ONLY valid JSON, no other text.`,
          },
          { role: 'user', content: input },
        ],
        temperature: 0.2,
        maxTokens: 200,
        skipSimplifiedLanguage: true,
        providerPreferences: this.getProviderPreferences(),
      });

      // Parse AI response — extract JSON from potentially wrapped output
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return null;

      const parsed = JSON.parse(jsonMatch[0]);
      return {
        subject: parsed.subject || 'General',
        topic: parsed.topic || input.slice(0, 100),
        subtopic: parsed.subtopic || '',
        confidence: Math.min(parsed.confidence || 0.6, 1),
      };
    } catch (err) {
      this.log('warn', 'AI classify parse failed', err);
      return null;
    }
  }
}

// Singleton
const normalizerInstance = new NormalizerAgent();

/**
 * Convenience function — call from any API route:
 *   const normalized = await normalizeUPSCInput(body.topic);
 */
export async function normalizeUPSCInput(rawInput: string): Promise<NormalizationResult> {
  return normalizerInstance.normalize(rawInput);
}
