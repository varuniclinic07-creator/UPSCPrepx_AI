// ═══════════════════════════════════════════════════════════════
// ETHICS SCENARIO ENGINE
// AI-driven ethics case studies and roleplay
// ═══════════════════════════════════════════════════════════════

import { aiRouter } from '@/lib/ai/provider-router';

export interface EthicsScenario {
    id: string;
    title: string;
    situation: string;
    stakeholders: string[];
    dilemma: string;
    possibleActions: string[];
}

export interface RoleplayResponse {
    aiResponse: string;
    ethicalAnalysis: string;
    suggestedApproach: string;
}

const CASE_STUDIES: EthicsScenario[] = [
    {
        id: 'case-1',
        title: 'Whistleblowing Dilemma',
        situation: 'You are a civil servant who discovers financial irregularities in your department. Your senior officer is involved.',
        stakeholders: ['You', 'Senior Officer', 'Department', 'Public'],
        dilemma: 'Report and risk career vs. Stay silent and compromise integrity',
        possibleActions: [
            'Report to higher authorities',
            'Confront senior officer privately',
            'Document evidence and wait',
            'Report to anti-corruption bureau'
        ]
    },
    {
        id: 'case-2',
        title: 'Resource Allocation',
        situation: 'As a district magistrate during floods, you have limited relief supplies. One area has more media presence, another has greater need.',
        stakeholders: ['Media', 'Affected populations', 'Political leaders', 'Your career'],
        dilemma: 'Media pressure vs. Actual need-based allocation',
        possibleActions: [
            'Allocate based purely on need assessment',
            'Balance between need and visibility',
            'Prioritize media-covered area',
            'Request additional resources'
        ]
    }
];

/**
 * Get case studies
 */
export function getCaseStudies(): EthicsScenario[] {
    return CASE_STUDIES;
}

/**
 * AI roleplay interaction
 */
export async function getRoleplayResponse(
    scenarioId: string,
    userAction: string
): Promise<RoleplayResponse> {

    const scenario = CASE_STUDIES.find(s => s.id === scenarioId);
    if (!scenario) throw new Error('Scenario not found');

    const prompt = `You are simulating stakeholders in an ethics case study for UPSC preparation.

Scenario: ${scenario.title}
Situation: ${scenario.situation}
Stakeholders: ${scenario.stakeholders.join(', ')}

User's Action: ${userAction}

Provide:
1. How stakeholders would react to this action
2. Ethical analysis (principles involved, pros/cons)
3. Suggested balanced approach

Respond in JSON:
{
  "aiResponse": "stakeholder reactions",
  "ethicalAnalysis": "principles and analysis",
  "suggestedApproach": "recommended balanced action"
}`;

    const response = await aiRouter.chat({
        model: 'provider-8/claude-sonnet-4.5',
        messages: [
            {
                role: 'system',
                content: 'You are an ethics expert guiding UPSC aspirants through case studies.'
            },
            { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 1500
    });

    const content = response.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(content);

    return {
        aiResponse: parsed.aiResponse || '',
        ethicalAnalysis: parsed.ethicalAnalysis || '',
        suggestedApproach: parsed.suggestedApproach || ''
    };
}
