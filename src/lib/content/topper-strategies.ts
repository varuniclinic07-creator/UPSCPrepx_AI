// ═══════════════════════════════════════════════════════════════
// TOPPER STRATEGIES DATABASE
// Success stories and strategies from UPSC toppers
// ═══════════════════════════════════════════════════════════════

export interface TopperProfile {
    id: string;
    name: string;
    rank: number;
    year: number;
    optionalSubject: string;
    photoUrl?: string;
    interviewVideoUrl?: string;
    strategy: string;
    dailySchedule: DailyScheduleItem[];
    resources: Resource[];
    tips: string[];
    uniqueApproach: string;
    attemptsCount: number;
    backgroundInfo: string;
}

export interface DailyScheduleItem {
    time: string;
    activity: string;
    duration: string;
}

export interface Resource {
    type: 'book' | 'website' | 'course' | 'notes';
    name: string;
    description: string;
}

export const TOPPER_STRATEGIES: TopperProfile[] = [
    {
        id: 'topper-1',
        name: 'Anudeep Durishetty',
        rank: 1,
        year: 2017,
        optionalSubject: 'Anthropology',
        strategy: `Anudeep focused on understanding concepts rather than rote learning. His strategy revolved around:
1. Making concise notes from standard sources
2. Revising those notes multiple times
3. Integrating current affairs with static portions
4. Regular answer writing practice
5. Maintaining consistency throughout preparation`,
        dailySchedule: [
            { time: '5:00 AM - 7:00 AM', activity: 'Newspaper reading & Current Affairs', duration: '2 hours' },
            { time: '9:00 AM - 1:00 PM', activity: 'Static subjects (GS/Optional)', duration: '4 hours' },
            { time: '2:00 PM - 3:00 PM', activity: 'Review & Consolidation', duration: '1 hour' },
            { time: '4:00 PM - 7:00 PM', activity: 'Optional Subject', duration: '3 hours' },
            { time: '8:00 PM - 10:00 PM', activity: 'Answer Writing Practice', duration: '2 hours' }
        ],
        resources: [
            { type: 'book', name: 'NCERT (6-12)', description: 'Foundation building' },
            { type: 'book', name: 'Laxmikanth', description: 'Polity' },
            { type: 'book', name: 'Spectrum', description: 'Modern History' },
            { type: 'book', name: 'Anthropology Optional Books', description: 'Optional subject' }
        ],
        tips: [
            'Make your own notes - they are gold for revision',
            'Current affairs should be integrated, not separate',
            'Answer writing is as important as reading',
            'Regular revision is the key to retention',
            'Stay consistent even on difficult days'
        ],
        uniqueApproach: 'Integration of static and dynamic portions through consistent note-making and multiple revisions',
        attemptsCount: 1,
        backgroundInfo: 'Engineering background, quit job to prepare full-time'
    },
    {
        id: 'topper-2',
        name: 'Tina Dabi',
        rank: 1,
        year: 2015,
        optionalSubject: 'Political Science',
        strategy: `Tina emphasized structured preparation with clear goals:
1. Following a definite timetable
2. Extensive newspaper reading for current affairs
3. Regular mock tests and answer writing
4. Staying updated with government schemes
5. Maintaining a positive mindset`,
        dailySchedule: [
            { time: '6:00 AM - 8:00 AM', activity: 'Newspaper & Magazines', duration: '2 hours' },
            { time: '9:00 AM - 12:00 PM', activity: 'GS Subjects', duration: '3 hours' },
            { time: '1:00 PM - 2:00 PM', activity: 'Current Affairs Notes', duration: '1 hour' },
            { time: '3:00 PM - 6:00 PM', activity: 'Optional Subject', duration: '3 hours' },
            { time: '7:00 PM - 9:00 PM', activity: 'Revision & Practice', duration: '2 hours' }
        ],
        resources: [
            { type: 'book', name: 'NCERTs', description: 'Basics' },
            { type: 'book', name: 'The Hindu', description: 'Daily newspaper' },
            { type: 'book', name: 'Yojana & Kurukshetra', description: 'Government magazines' },
            { type: 'course', name: 'Test Series', description: 'Regular practice' }
        ],
        tips: [
            'Newspaper reading is non-negotiable',
            'Make notes from the beginning',
            'Test series help in time management',
            'Stay calm during the exam',
            'Healthy body supports a healthy mind'
        ],
        uniqueApproach: 'Balanced approach with equal focus on all papers and consistent daily routine',
        attemptsCount: 1,
        backgroundInfo: 'Delhi University graduate, consistent topper in academics'
    },
    {
        id: 'topper-3',
        name: 'Kanishak Kataria',
        rank: 1,
        year: 2018,
        optionalSubject: 'Mathematics',
        strategy: `Kanishak's analytical approach:
1. Understanding fundamentals thoroughly
2. Solving previous year questions
3. Regular self-assessment through tests
4. Focused answer writing with structure
5. Utilizing his engineering background effectively`,
        dailySchedule: [
            { time: '5:30 AM - 7:30 AM', activity: 'Current Affairs & Newspaper', duration: '2 hours' },
            { time: '8:30 AM - 12:30 PM', activity: 'Mathematics Optional', duration: '4 hours' },
            { time: '2:00 PM - 3:00 PM', activity: 'Revision', duration: '1 hour' },
            { time: '4:00 PM - 7:00 PM', activity: 'GS Preparation', duration: '3 hours' },
            { time: '8:00 PM - 10:00 PM', activity: 'Answer Writing', duration: '2 hours' }
        ],
        resources: [
            { type: 'book', name: 'Mathematics Optional Books', description: 'Primary source' },
            { type: 'book', name: 'Standard GS Books', description: 'General Studies' },
            { type: 'website', name: 'Online Forums', description: 'Peer learning' },
            { type: 'notes', name: 'Self-made Notes', description: 'Revision material' }
        ],
        tips: [
            'Choose optional based on interest and scoring potential',
            'Previous year papers give clarity on exam pattern',
            'Engineering background helps in logical thinking',
            'Maintain a balance between reading and writing',
            'Regular breaks prevent burnout'
        ],
        uniqueApproach: 'Mathematical and analytical approach to problem-solving in GS papers',
        attemptsCount: 2,
        backgroundInfo: 'IIT Bombay graduate, worked before starting preparation'
    }
];

export function getTopperById(id: string): TopperProfile | undefined {
    return TOPPER_STRATEGIES.find(t => t.id === id);
}

export function getToppersByYear(year: number): TopperProfile[] {
    return TOPPER_STRATEGIES.filter(t => t.year === year);
}

export function getToppersByOptional(optional: string): TopperProfile[] {
    return TOPPER_STRATEGIES.filter(t =>
        t.optionalSubject.toLowerCase().includes(optional.toLowerCase())
    );
}

export function getAllYears(): number[] {
    return [...new Set(TOPPER_STRATEGIES.map(t => t.year))].sort((a, b) => b - a);
}

export function getAllOptionals(): string[] {
    return [...new Set(TOPPER_STRATEGIES.map(t => t.optionalSubject))].sort();
}
