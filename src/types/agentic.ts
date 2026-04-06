// ═══════════════════════════════════════════════════════════════════════════
// AGENTIC SERVICES TYPES - Shared TypeScript interfaces
// ═══════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════
// COMMON TYPES
// ═══════════════════════════════════════════════════================================================================

export type AgenticServiceType = 'web_search' | 'doc_thinker' | 'file_search';

export type QueryIntent = 'current_affairs' | 'document_based' | 'static_materials' | 'general' | 'combined';

// ═══════════════════════════════════════════════════════════════════════════
// WEB SEARCH TYPES (DuckDuckGo-based)
// ═══════════════════════════════════════════════════════════════════════════

export interface WebSearchRequest {
    query: string;
    maxResults?: number;
    filters?: {
        upscSources?: boolean; // Prioritize UPSC-relevant sources
        dateRange?: 'day' | 'week' | 'month' | 'year' | 'all';
        domains?: string[]; // Specific domains to search
    };
    cache?: boolean;
}

export interface WebSearchResult {
    title: string;
    url: string;
    snippet: string;
    source: string;
    relevanceScore: number;
    publishedDate?: string;
    isUpscRelevant: boolean;
}

export interface WebSearchResponse {
    results: WebSearchResult[];
    totalResults: number;
    query: string;
    cached: boolean;
    processingTime: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// AUTODOC THINKER TYPES (Multi-Agent Document RAG)
// ═══════════════════════════════════════════════════════════════════════════

export interface DocAnalyzeRequest {
    query: string;
    documents?: {
        id: string;
        content?: string;
        url?: string;
    }[];
    materialIds?: string[]; // Reference to static_materials table
    agents?: ('retriever' | 'summarizer' | 'web_searcher' | 'router')[];
    options?: {
        includeWebSearch?: boolean;
        maxPages?: number;
        citationStyle?: 'page' | 'section' | 'both';
    };
}

export interface DocAnalyzeResponse {
    answer: string;
    sources: Array<{
        documentId: string;
        documentName: string;
        pageNumber?: number;
        sectionTitle?: string;
        excerpt: string;
        relevanceScore: number;
    }>;
    agentsUsed: string[];
    webSearchUsed: boolean;
    processingTime: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// FILE SEARCH TYPES (Dynamic Navigation)
// ═══════════════════════════════════════════════════════════════════════════

export interface FileSearchRequest {
    query: string;
    materialIds?: string[]; // Specific materials to search
    filters?: {
        subject?: string;
        category?: string;
        isStandard?: boolean;
    };
    mode?: 'dynamic' | 'hybrid'; // dynamic = no embeddings, hybrid = with embeddings
    maxDepth?: number; // Cross-reference depth
}

export interface FileSearchResult {
    materialId: string;
    materialName: string;
    chunkId: string;
    content: string;
    pageNumber?: number;
    sectionTitle?: string;
    chapter?: string;
    relevanceScore: number;
    reasoningPath?: string[]; // How it was found
}

export interface FileSearchResponse {
    results: FileSearchResult[];
    totalResults: number;
    query: string;
    materialsSearched: number;
    navigationPath: string[]; // Shows the search path
    processingTime: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// ORCHESTRATOR TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface AgenticQueryRequest {
    query: string;
    context?: {
        userDocuments?: string[]; // Uploaded doc IDs
        preferredSources?: AgenticServiceType[];
        upscPaper?: string; // GS1, GS2, etc.
    };
    options?: {
        combineServices?: boolean; // Use multiple services
        includeWebSearch?: boolean;
        includeStaticMaterials?: boolean;
        cache?: boolean;
    };
}

export interface AgenticQueryResponse {
    answer: string;
    sources: Array<{
        type: AgenticServiceType;
        title: string;
        url?: string;
        excerpt: string;
        relevanceScore: number;
    }>;
    servicesUsed: AgenticServiceType[];
    intent: QueryIntent;
    processingTime: number;
    cached: boolean;
    tokensUsed: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONTENT REFINER TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface ContentRefineRequest {
    content: string;
    sources: any[];
    options?: {
        checkSyllabus?: boolean;
        simplifyLanguage?: boolean;
        addCitations?: boolean;
        removeIrrelevant?: boolean;
        targetPaper?: string;
    };
}

export interface ContentRefineResponse {
    refinedContent: string;
    citations: Array<{
        text: string;
        source: string;
        url?: string;
    }>;
    syllabusTopics: string[];
    readabilityScore: number;
    removedSections: string[];
}

// ═══════════════════════════════════════════════════════════════════════════
// DATABASE TYPES (Matching schema)
// ═══════════════════════════════════════════════════════════════════════════

export interface AIProvider {
    id: string;
    name: string;
    slug: string;
    providerType: string;
    apiBaseUrl: string;
    apiKeyEncrypted?: string;
    availableModels: Array<{
        id: string;
        name: string;
        contextLength?: number;
        pricing?: any;
    }>;
    defaultModel?: string;
    rateLimitRpm: number;
    rateLimitTpm: number;
    isActive: boolean;
    isDefault: boolean;
    healthStatus: 'healthy' | 'degraded' | 'down' | 'unknown';
    totalRequests: number;
    totalTokens: number;
    totalCost: number;
}

export interface StaticMaterial {
    id: string;
    name: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    fileUrl: string;
    subject: string;
    category: string;
    tags: string[];
    author?: string;
    publisher?: string;
    edition?: string;
    year?: number;
    isProcessed: boolean;
    processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
    chunkCount: number;
    isStandard: boolean;
    priority: number;
    searchCount: number;
    uploadedBy: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface MaterialChunk {
    id: string;
    materialId: string;
    content: string;
    chunkIndex: number;
    pageNumber?: number;
    sectionTitle?: string;
    chapter?: string;
    embedding?: number[];
    wordCount: number;
    hasTable: boolean;
    hasImage: boolean;
}

export interface ContentRule {
    id: string;
    name: string;
    description: string;
    ruleType: 'source_filter' | 'keyword_filter' | 'syllabus_check' | 'language_level';
    ruleConfig: any;
    appliesTo: string[];
    isActive: boolean;
    priority: number;
    createdBy: string;
}

export interface FeatureConfig {
    id: string;
    featureId: string;
    displayName: string;
    description: string;
    icon: string;
    isEnabled: boolean;
    isVisible: boolean;
    maintenanceMode: boolean;
    maintenanceMessage?: string;
    minSubscriptionTier: 'trial' | 'basic' | 'premium';
    usageLimitTrial?: number;
    usageLimitBasic?: number;
    usageLimitPremium?: number;
    defaultAiProvider?: string;
    defaultAiModel?: string;
    fallbackAiProvider?: string;
    previewType?: string;
    previewContent?: any;
    totalUsage: number;
}

export interface UPSCSyllabusItem {
    id: string;
    paper: string;
    subject: string;
    topic: string;
    subtopics: string[];
    keywords: string[];
    priority: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// SERVICE CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

export const AGENTIC_SERVICES = {
    webSearch: {
        name: 'Agentic Web Search',
        url: process.env.AGENTIC_WEB_SEARCH_URL || 'http://localhost:8030',
        healthEndpoint: '/health',
        searchEndpoint: '/search',
    },
    docThinker: {
        name: 'AutoDocThinker',
        url: process.env.AGENTIC_AUTODOC_URL || 'http://localhost:8031',
        healthEndpoint: '/health',
        analyzeEndpoint: '/analyze',
    },
    fileSearch: {
        name: 'Agentic File Search',
        url: process.env.AGENTIC_FILE_SEARCH_URL || 'http://localhost:8032',
        healthEndpoint: '/health',
        searchEndpoint: '/search',
    },
} as const;

export const CACHE_TTL = {
    webSearch: 24 * 60 * 60, // 24 hours
    docAnalysis: 7 * 24 * 60 * 60, // 7 days
    fileSearch: 24 * 60 * 60, // 24 hours
    staticContent: 30 * 24 * 60 * 60, // 30 days
} as const;
