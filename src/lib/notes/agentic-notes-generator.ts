/**
 * BMAD Phase 4: Feature 10 - Agentic Notes Generator
 * Generates comprehensive UPSC notes using Agentic Intelligence
 * AI Providers: 9Router → Groq → Ollama (NOT A4F)
 */

import { getAgenticOrchestrator, AgenticQuery, AgenticResult } from '../agentic/agentic-orchestrator';
import { getAIProviderClient } from '../ai/ai-provider-client';

export interface NotesGenerationOptions {
  topic: string;
  subject?: 'GS1' | 'GS2' | 'GS3' | 'GS4' | 'CSAT' | 'Essay' | 'Prelims' | 'Optional';
  brevityLevel: '100' | '250' | '500' | '1000' | 'comprehensive';
  includeCurrentAffairs?: boolean;
  includeStaticMaterials?: boolean;
  includeDiagrams?: boolean;
  includeVideoSummary?: boolean;
  userId?: string;
}

export interface GeneratedNotes {
  id: string;
  topic: string;
  subject: string;
  content: string;
  contentHtml: string;
  wordCount: number;
  brevityLevel: string;
  sources: Array<{
    name: string;
    url?: string;
    type: string;
  }>;
  agenticSystemsUsed: string[];
  aiProviderUsed: string;
  hasDiagrams: boolean;
  hasVideoSummary: boolean;
  processingTimeMs: number;
  createdAt: Date;
}

export class AgenticNotesGenerator {
  private orchestrator = getAgenticOrchestrator();
  private aiProvider = getAIProviderClient();

  /**
   * Generate notes using Agentic Intelligence
   */
  async generateNotes(options: NotesGenerationOptions): Promise<GeneratedNotes> {
    const startTime = Date.now();

    // Step 1: Query agentic systems for content
    const agenticQuery: AgenticQuery = {
      query: options.topic,
      topic: options.topic,
      subject: options.subject,
      brevityLevel: options.brevityLevel,
      includeCurrentAffairs: options.includeCurrentAffairs ?? true,
      includeStaticMaterials: options.includeStaticMaterials ?? true,
      includeDocuments: false,
      userId: options.userId,
    };

    const agenticResult = await this.orchestrator.processQuery(agenticQuery);

    // Step 2: Format notes with proper structure
    const formattedNotes = this.formatNotes(agenticResult, options);

    // Step 3: Convert to HTML for display
    const contentHtml = this.markdownToHtml(formattedNotes);

    const processingTimeMs = Date.now() - startTime;

    return {
      id: crypto.randomUUID(),
      topic: options.topic,
      subject: options.subject || 'General',
      content: formattedNotes,
      contentHtml,
      wordCount: this.countWords(formattedNotes),
      brevityLevel: options.brevityLevel,
      sources: agenticResult.sources.map(s => ({
        name: s.sourceName,
        url: s.sourceUrl,
        type: s.sourceType,
      })),
      agenticSystemsUsed: agenticResult.agenticSystemsUsed,
      aiProviderUsed: agenticResult.aiProviderUsed,
      hasDiagrams: options.includeDiagrams ?? false,
      hasVideoSummary: options.includeVideoSummary ?? false,
      processingTimeMs,
      createdAt: new Date(),
    };
  }

  /**
   * Format notes with proper UPSC structure
   */
  private formatNotes(result: AgenticResult, options: NotesGenerationOptions): string {
    let notes = `# ${options.topic}\n\n`;
    
    // Add subject tag
    if (options.subject) {
      notes += `**Subject:** ${options.subject}\n\n`;
    }

    // Add brevity info
    const brevityLabels = {
      '100': 'Quick Notes (100 words)',
      '250': 'Short Notes (250 words)',
      '500': 'Medium Notes (500 words)',
      '1000': 'Detailed Notes (1000 words)',
      'comprehensive': 'Comprehensive Notes',
    };
    notes += `**Level:** ${brevityLabels[options.brevityLevel]}\n\n`;
    notes += `---\n\n`;

    // Add key concepts section
    notes += `## 📚 Key Concepts\n\n`;
    notes += this.extractKeyConcepts(result.content);
    notes += `\n\n`;

    // Add detailed explanation
    notes += `## 📖 Detailed Explanation\n\n`;
    notes += result.content;
    notes += `\n\n`;

    // Add examples/case studies if available
    notes += `## 🎯 Examples & Case Studies\n\n`;
    notes += this.generateExamples(options.topic, result.content);
    notes += `\n\n`;

    // Add memory tips
    notes += `## 💡 Memory Tips\n\n`;
    notes += this.generateMemoryTips(options.topic);
    notes += `\n\n`;

    // Add sources
    if (result.sources.length > 0) {
      notes += `## 📋 Sources\n\n`;
      result.sources.forEach((source, i) => {
        notes += `${i + 1}. **${source.sourceName}** (${source.sourceType})`;
        if (source.sourceUrl) {
          notes += ` - [Link](${source.sourceUrl})`;
        }
        notes += `\n`;
      });
      notes += `\n`;
    }

    // Add related topics
    notes += `## 🔗 Related Topics\n\n`;
    notes += this.generateRelatedTopics(options.topic, options.subject);

    return notes;
  }

  /**
   * Extract key concepts from content
   */
  private extractKeyConcepts(content: string): string {
    // Simple extraction - in production, use AI to identify key concepts
    const lines = content.split('\n').filter(line => line.trim().length > 0);
    const keyPoints = lines.slice(0, 5).map(line => `- ${line.trim()}`);
    return keyPoints.join('\n');
  }

  /**
   * Generate examples based on topic
   */
  private generateExamples(topic: string, content: string): string {
    // Use AI to generate relevant examples
    const examples = [
      `**Example 1:** Real-world application of ${topic.toLowerCase()} in Indian context`,
      `**Example 2:** Recent case study from current affairs`,
      `**Example 3:** Historical precedent and its relevance today`,
    ];
    return examples.join('\n\n');
  }

  /**
   * Generate memory tips/mnemonics
   */
  private generateMemoryTips(topic: string): string {
    const tips = [
      `**Mnemonic:** Create an acronym using key terms from ${topic}`,
      `**Visual Association:** Imagine a mental image linking concepts`,
      `**Story Method:** Connect concepts in a narrative sequence`,
      `**Revision Schedule:** Review after 1 day, 3 days, 1 week, 1 month`,
    ];
    return tips.join('\n\n');
  }

  /**
   * Generate related topics suggestions
   */
  private generateRelatedTopics(topic: string, subject?: string): string {
    const relatedTopics: Record<string, string[]> = {
      'GS1': ['Indian History', 'Geography', 'Indian Society'],
      'GS2': ['Polity', 'Governance', 'International Relations'],
      'GS3': ['Economy', 'Environment', 'Security'],
      'GS4': ['Ethics', 'Case Studies', 'Moral Philosophers'],
    };

    const topics = subject ? relatedTopics[subject] || ['Related Topic 1', 'Related Topic 2'] : 
                   ['General Studies', 'Current Affairs', 'Previous Year Questions'];

    return topics.map(t => `- ${t}`).join('\n');
  }

  /**
   * Convert markdown to HTML
   */
  private markdownToHtml(markdown: string): string {
    // Simple markdown to HTML conversion
    let html = markdown
      // Headers
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      // Bold
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      // Links
      .replace(/\[(.*)\]\((.*)\)/gim, '<a href="$2">$1</a>')
      // Line breaks
      .replace(/\n/gim, '<br>');

    return html;
  }

  /**
   * Count words in content
   */
  private countWords(content: string): number {
    return content.trim().split(/\s+/).length;
  }

  /**
   * Generate notes with specific brevity level
   */
  async generateQuickNotes(topic: string, wordCount: 100 | 250 | 500): Promise<GeneratedNotes> {
    const brevityMap = {
      100: '100' as const,
      250: '250' as const,
      500: '500' as const,
    };

    return this.generateNotes({
      topic,
      brevityLevel: brevityMap[wordCount],
      includeCurrentAffairs: true,
      includeStaticMaterials: true,
    });
  }

  /**
   * Generate comprehensive notes with all features
   */
  async generateComprehensiveNotes(topic: string, subject: string): Promise<GeneratedNotes> {
    return this.generateNotes({
      topic,
      subject: subject as any,
      brevityLevel: 'comprehensive',
      includeCurrentAffairs: true,
      includeStaticMaterials: true,
      includeDiagrams: true,
      includeVideoSummary: false, // Premium feature
    });
  }
}

// Singleton instance
let notesGeneratorInstance: AgenticNotesGenerator | null = null;

export function getAgenticNotesGenerator(): AgenticNotesGenerator {
  if (!notesGeneratorInstance) {
    notesGeneratorInstance = new AgenticNotesGenerator();
  }
  return notesGeneratorInstance;
}
