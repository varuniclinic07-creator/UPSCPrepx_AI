// ═══════════════════════════════════════════════════════════════
// ATLAS DATA
// Comprehensive geographical data for India and world
// ═══════════════════════════════════════════════════════════════

export interface MapFeature {
    id: string;
    name: string;
    type: 'state' | 'country' | 'river' | 'mountain' | 'port';
    coordinates: [number, number];
    description: string;
    upscRelevance: string;
    relatedTopics: string[];
}

export const INDIA_STATES: MapFeature[] = [
    {
        id: 'mh',
        name: 'Maharashtra',
        type: 'state',
        coordinates: [19.7515, 75.7139],
        description: 'Largest economy state, Mumbai financial capital',
        upscRelevance: 'Industrial policy, ports, Western Ghats biodiversity',
        relatedTopics: ['Economy', 'Geography', 'Environment']
    },
    {
        id: 'ka',
        name: 'Karnataka',
        type: 'state',
        coordinates: [15.3173, 75.7139],
        description: 'IT hub, Bangalore, Western Ghats',
        upscRelevance: 'Technology policy, coffee cultivation',
        relatedTopics: ['Economy', 'Agriculture']
    }
    // Add more states...
];

export const MAJOR_RIVERS: MapFeature[] = [
    {
        id: 'ganges',
        name: 'Ganges',
        type: 'river',
        coordinates: [25.3189, 83.0128],
        description: 'Holiest river, originates from Gangotri',
        upscRelevance: 'River linkage, pollution (Namami Gange), water disputes',
        relatedTopics: ['Environment', 'Geography', 'Governance']
    }
    // Add more rivers...
];

export function searchAtlas(query: string): MapFeature[] {
    const allFeatures = [...INDIA_STATES, ...MAJOR_RIVERS];
    const lower = query.toLowerCase();

    return allFeatures.filter(f =>
        f.name.toLowerCase().includes(lower) ||
        f.description.toLowerCase().includes(lower) ||
        f.relatedTopics.some(t => t.toLowerCase().includes(lower))
    );
}
