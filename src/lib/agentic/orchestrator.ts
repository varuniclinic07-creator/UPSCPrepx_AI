// ═══════════════════════════════════════════════════════════════════════════
// AGENTIC ORCHESTRATOR - Routes queries to appropriate agentic services
// ═══════════════════════════════════════════════════════════════════════════

import { searchWeb } from './web-search-client';
import { generateExplanation as analyzeDocument } from './autodoc-client';
import { searchFiles } from './file-search-client';
import { callAI } from '@/lib/ai/ai-provider-client';
import type {
    AgenticQueryRequest,
    AgenticQueryResponse,
    QueryIntent,
    AgenticServiceType,
} from '@/types/agentic';

export class AgenticOrchestrator {
    /**
     * Main orchestration method - routes to appropriate services
     */
    async query(request: AgenticQueryRequest): Promise<AgenticQueryResponse> {
        const startTime = Date.now();

        try {
            // Analyze query intent
            const intent = await this.analyzeIntent(request.query, request.context);

            // Route to appropriate service(s)
            let servicesUsed: AgenticServiceType[] = [];
            let sources: any[] = [];
            let answer = '';

            // Web search for current affairs
            if (intent === 'current_affairs' || request.options?.includeWebSearch) {
                const webResults = await searchWeb(request.query, 10);
                servicesUsed.push('web_search');

                sources.push(...webResults.map(r => ({
                    type: 'web_search' as AgenticServiceType,
                    title: r.title,
                    url: r.url,
                    excerpt: r.snippet,
                    relevanceScore: 0.8,
                })));
            }

            // Document analysis for uploaded documents
            if (intent === 'document_based' && request.context?.userDocuments) {
                const docResults = await analyzeDocument(
                    request.query,
                    request.context.userDocuments.join('\n\n')
                );
                servicesUsed.push('doc_thinker');

                if (docResults) {
                    sources.push({
                        type: 'doc_thinker' as AgenticServiceType,
                        title: 'Document Analysis',
                        excerpt: docResults || '',
                        relevanceScore: 0.9,
                    });
                }
            }

            // File search for static materials
            if (intent === 'static_materials' || request.options?.includeStaticMaterials) {
                const fileResults = await searchFiles(request.query);
                servicesUsed.push('file_search');

                sources.push(...fileResults.map(r => ({
                    type: 'file_search' as AgenticServiceType,
                    title: r.filePath,
                    excerpt: r.content,
                    relevanceScore: 0.85,
                })));
            }

            // If no specific service was used or combine is requested, use all
            if (servicesUsed.length === 0 || request.options?.combineServices) {
                // Combine all sources
                answer = await this.generateAnswer(request.query, sources);
            } else {
                // Generate answer from specific service
                answer = await this.generateAnswer(request.query, sources);
            }

            // Refine content
            const refined = await this.refineContent(answer, sources, request.context);

            return {
                answer: refined.answer,
                sources: sources.slice(0, 10), // Top 10 sources
                servicesUsed,
                intent,
                processingTime: Date.now() - startTime,
                cached: false,
                tokensUsed: refined.tokens || 0,
            };
        } catch (error) {
            console.error('Orchestrator error:', error);
            throw new Error(`Query failed: ${(error as Error).message}`);
        }
    }

    /**
     * Analyze query intent to determine routing
     */
    private async analyzeIntent(query: string, context?: any): Promise<QueryIntent> {
        const queryLower = query.toLowerCase();

        // Current affairs patterns
        if (
            queryLower.includes('current') ||
            queryLower.includes('recent') ||
            queryLower.includes('latest') ||
            queryLower.includes('today') ||
            queryLower.includes('news')
        ) {
            return 'current_affairs';
        }

        // Document-based if user documents provided
        if (context?.userDocuments && context.userDocuments.length > 0) {
            return 'document_based';
        }

        // Static materials for specific topics
        if (
            queryLower.includes('ncert') ||
            queryLower.includes('laxmikanth') ||
            queryLower.includes('spectrum') ||
            queryLower.match(/chapter|section|page/)
        ) {
            return 'static_materials';
        }

        // Default to general (will use web search + file search)
        return 'general';
    }

    /**
     * Generate answer using AI router
     */
    private async generateAnswer(query: string, sources: any[]): Promise<string> {
        // Combine source content
        const context = sources
            .map(s => `[${s.type}] ${s.title}: ${s.excerpt}`)
            .join('\n\n');

        // Use callAI for generation
        const answer = await callAI(
            `Question: ${query}\n\nSources:\n${context}\n\nProvide a detailed answer for UPSC CSE preparation.`,
            {
                system: 'You are a UPSC CSE preparation assistant. Provide comprehensive, accurate answers based on the given sources. Always cite sources.',
                temperature: 0.7,
                maxTokens: 4096,
            }
        );

        return answer;
    }

    /**
     * Refine content for quality and relevance
     */
    private async refineContent(
        content: string,
        _sources: any[],
        _context?: any
    ): Promise<{ answer: string; tokens: number }> {
        // Use callAI for refinement
        const refined = await callAI(
            `Refine this content:\n\n${content}`,
            {
                system: `You are a content refiner for UPSC CSE preparation. Your task:
1. Simplify language to 10th standard level
2. Remove irrelevant content
3. Add proper citations
4. Ensure UPSC syllabus relevance
5. Structure content clearly`,
                temperature: 0.3,
                maxTokens: 4096,
            }
        );

        return {
            answer: refined || content,
            tokens: 0,
        };
    }

    /**
     * Health check for all services
     */
    async checkHealth(): Promise<Record<AgenticServiceType, boolean>> {
        return {
            web_search: true, // Implement actual health checks
            doc_thinker: true,
            file_search: true,
        };
    }
}

// Export singleton
export const agenticOrchestrator = new AgenticOrchestrator();