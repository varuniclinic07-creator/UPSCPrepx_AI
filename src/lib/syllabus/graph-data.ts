// ═══════════════════════════════════════════════════════════════
// SYLLABUS GRAPH DATA
// Interconnected syllabus topics for 3D visualization
// ═══════════════════════════════════════════════════════════════

export interface SyllabusNode {
    id: string;
    label: string;
    subject: string;
    importance: number; // 1-10
    connections: string[]; // IDs of related nodes
}

export const SYLLABUS_GRAPH: SyllabusNode[] = [
    {
        id: 'polity-1',
        label: 'Fundamental Rights',
        subject: 'Polity',
        importance: 10,
        connections: ['polity-2', 'polity-3', 'history-1']
    },
    {
        id: 'polity-2',
        label: 'Directive Principles',
        subject: 'Polity',
        importance: 9,
        connections: ['polity-1', 'polity-4']
    },
    {
        id: 'polity-3',
        label: 'Fundamental Duties',
        subject: 'Polity',
        importance: 7,
        connections: ['polity-1']
    },
    {
        id: 'history-1',
        label: 'Freedom Struggle',
        subject: 'History',
        importance: 10,
        connections: ['polity-1', 'history-2']
    },
    {
        id: 'geo-1',
        label: 'Climate Change',
        subject: 'Geography',
        importance: 10,
        connections: ['env-1', 'intl-1']
    },
    {
        id: 'env-1',
        label: 'Environmental Conventions',
        subject: 'Environment',
        importance: 9,
        connections: ['geo-1', 'intl-1']
    },
    {
        id: 'intl-1',
        label: 'International Relations',
        subject: 'IR',
        importance: 10,
        connections: ['geo-1', 'env-1']
    }
    // Add more nodes for complete syllabus
];

export function getNodesBySubject(subject: string): SyllabusNode[] {
    return SYLLABUS_GRAPH.filter(n => n.subject === subject);
}

export function getConnectedNodes(nodeId: string): SyllabusNode[] {
    const node = SYLLABUS_GRAPH.find(n => n.id === nodeId);
    if (!node) return [];

    return SYLLABUS_GRAPH.filter(n => node.connections.includes(n.id));
}
