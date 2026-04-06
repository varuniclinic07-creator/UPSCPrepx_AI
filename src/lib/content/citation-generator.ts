// ═══════════════════════════════════════════════════════════════
// CITATION GENERATOR
// Add proper source citations
// ═══════════════════════════════════════════════════════════════

export interface Source {
    type: 'book' | 'article' | 'website' | 'video' | 'report' | 'government';
    title: string;
    author?: string;
    url?: string;
    date?: string;
    publisher?: string;
    accessDate?: string;
}

/**
 * Generate APA style citation
 */
export function generateCitation(source: Source): string {
    const { type, title, author, url, date, publisher, accessDate } = source;

    let citation = '';

    switch (type) {
        case 'book':
            citation = `${author || 'Unknown'}. (${date || 'n.d.'}). *${title}*. ${publisher || ''}.`;
            break;

        case 'article':
            citation = `${author || 'Unknown'}. (${date || 'n.d.'}). ${title}. ${publisher || 'Online'}.`;
            if (url) citation += ` Retrieved from ${url}`;
            break;

        case 'website':
            citation = `${author || title}. (${date || 'n.d.'}). Retrieved ${accessDate || 'recently'} from ${url}`;
            break;

        case 'video':
            citation = `${author || 'Unknown'}. (${date || 'n.d.'}). ${title} [Video]. YouTube. ${url}`;
            break;

        case 'report':
            citation = `${author || publisher || 'Unknown'}. (${date || 'n.d.'}). *${title}*. ${publisher || ''}.`;
            break;

        case 'government':
            citation = `${publisher || 'Government of India'}. (${date || 'n.d.'}). *${title}*.`;
            if (url) citation += ` Retrieved from ${url}`;
            break;

        default:
            citation = `${title}. ${author ? `By ${author}.` : ''} ${date || ''}`;
    }

    return citation;
}

/**
 * Format multiple references
 */
export function formatReferences(sources: Source[]): string {
    const citations = sources
        .map((source, idx) => `${idx + 1}. ${generateCitation(source)}`)
        .join('\n\n');

    return `## References\n\n${citations}`;
}

/**
 * Extract sources from content
 */
export function extractSources(content: string): string[] {
    // Extract URLs
    const urlPattern = /https?:\/\/[^\s]+/g;
    const urls = content.match(urlPattern) || [];

    // Extract references section
    const referencesMatch = content.match(/## References([\s\S]*?)(?=##|$)/);
    const refSection = referencesMatch ? referencesMatch[1] : '';

    const sources = [...urls];

    // Extract from references section
    const refLines = refSection.split('\n').filter(line => line.trim());
    sources.push(...refLines);

    return [...new Set(sources)]; // Remove duplicates
}

/**
 * Validate sources in content
 */
export function validateSources(content: string): boolean {
    const sources = extractSources(content);

    // Check if there are at least some sources
    if (sources.length === 0) {
        return false;
    }

    // Check if sources look valid
    const validSources = sources.filter(source => {
        // Must be URL or proper citation format
        return source.includes('http') ||
            source.includes('.') ||
            source.match(/\(\d{4}\)/); // Has year in parentheses
    });

    return validSources.length > 0;
}

/**
 * Generate in-text citation
 */
export function inTextCitation(author: string, year: string): string {
    return `(${author}, ${year})`;
}

/**
 * Add citations to content
 */
export function addCitationsToContent(
    content: string,
    sources: Source[]
): string {
    const referencesSection = formatReferences(sources);
    return `${content}\n\n${referencesSection}`;
}
