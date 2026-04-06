// ═══════════════════════════════════════════════════════════════
// CONSTITUTIONAL ARTICLES DATABASE
// Indian Constitution articles with metadata
// ═══════════════════════════════════════════════════════════════

export interface ConstitutionalArticle {
    id: string;
    articleNumber: string;
    partNumber?: string;
    title: string;
    content: string;
    description: string;
    amendments?: Amendment[];
    relatedArticles: string[];
    keywords: string[];
    upscRelevance: number; // 1-10
}

export interface Amendment {
    number: number;
    year: number;
    changes: string;
}

export const CONSTITUTIONAL_ARTICLES: ConstitutionalArticle[] = [
    {
        id: 'art-1',
        articleNumber: '1',
        partNumber: 'I',
        title: 'Name and Territory of the Union',
        description: 'India, that is Bharat, shall be a Union of States',
        content: `Article 1 declares that India, also known as Bharat, shall be a Union of States. The territory of India comprises:
(a) The territories of the States
(b) The Union territories specified in the First Schedule
(c) Such other territories as may be acquired

This article establishes India as an indestructible union of destructible states.`,
        amendments: [
            { number: 7, year: 1956, changes: 'States reorganization' }
        ],
        relatedArticles: ['2', '3', '4'],
        keywords: ['union', 'states', 'territory', 'bharat', 'india'],
        upscRelevance: 10
    },
    {
        id: 'art-12',
        articleNumber: '12',
        partNumber: 'III',
        title: 'Definition of State',
        description: 'Defines "State" for the purpose of Fundamental Rights',
        content: `Article 12 defines the term "State" for the purposes of Part III (Fundamental Rights). It includes:
(a) The Government and Parliament of India
(b) The Government and Legislature of each State
(c) All local or other authorities within the territory of India
(d) All authorities under the control of the Government of India

This definition is crucial for determining against whom fundamental rights can be enforced.`,
        relatedArticles: ['13', '32', '226'],
        keywords: ['state', 'definition', 'fundamental rights', 'government'],
        upscRelevance: 9
    },
    {
        id: 'art-14',
        articleNumber: '14',
        partNumber: 'III',
        title: 'Equality before Law',
        description: 'Right to Equality - No person shall be denied equality before law',
        content: `Article 14 guarantees equality before law and equal protection of laws:
- The State shall not deny to any person equality before the law
- The State shall not deny equal protection of the laws within India

This is a fundamental right applicable to all persons, citizens and non-citizens alike. It prohibits class legislation but permits reasonable classification.`,
        relatedArticles: ['15', '16', '19'],
        keywords: ['equality', 'fundamental rights', 'equal protection', 'discrimination'],
        upscRelevance: 10
    },
    {
        id: 'art-19',
        articleNumber: '19',
        partNumber: 'III',
        title: 'Protection of certain rights regarding freedom of speech, etc.',
        description: 'Six fundamental freedoms guaranteed to citizens',
        content: `Article 19(1) guarantees six freedoms to all citizens:
(a) Freedom of speech and expression
(b) Freedom to assemble peacefully without arms
(c) Freedom to form associations or unions
(d) Freedom to move freely throughout India
(e) Freedom to reside and settle in any part of India
(f) Freedom to practice any profession, or to carry on any occupation, trade or business

All these freedoms are subject to reasonable restrictions in the interest of sovereignty, integrity, security, public order, morality, etc.`,
        amendments: [
            { number: 44, year: 1978, changes: 'Removed right to property from fundamental rights' }
        ],
        relatedArticles: ['20', '21', '22'],
        keywords: ['freedom', 'speech', 'expression', 'movement', 'profession'],
        upscRelevance: 10
    },
    {
        id: 'art-21',
        articleNumber: '21',
        partNumber: 'III',
        title: 'Protection of Life and Personal Liberty',
        description: 'No person shall be deprived of life or liberty except by law',
        content: `Article 21 is the heart of fundamental rights. It states:
"No person shall be deprived of his life or personal liberty except according to procedure established by law."

Through judicial interpretation, Article 21 has been expanded to include:
- Right to privacy
- Right to livelihood
- Right to education
- Right to health
- Right to clean environment
- Many more rights essential for dignified life`,
        relatedArticles: ['14', '19', '22'],
        keywords: ['life', 'liberty', 'fundamental rights', 'personal freedom'],
        upscRelevance: 10
    },
    {
        id: 'art-32',
        articleNumber: '32',
        partNumber: 'III',
        title: 'Remedies for Enforcement of Fundamental Rights',
        description: 'Right to Constitutional Remedies - Supreme Court jurisdiction',
        content: `Article 32 provides the right to move the Supreme Court for enforcement of fundamental rights. The Supreme Court can issue:
- Habeas Corpus: To produce a person before court
- Mandamus: To command performance of public duty
- Prohibition: To prohibit inferior courts from exceeding jurisdiction
- Certiorari: To quash illegal orders
- Quo Warranto: To enquire into legality of claim to public office

Dr. Ambedkar called Article 32 the "heart and soul" of the Constitution.`,
        relatedArticles: ['226', '13'],
        keywords: ['remedies', 'supreme court', 'writs', 'fundamental rights'],
        upscRelevance: 10
    },
    {
        id: 'art-51a',
        articleNumber: '51A',
        partNumber: 'IVA',
        title: 'Fundamental Duties',
        description: 'Lists 11 fundamental duties of citizens',
        content: `Article 51A lists 11 fundamental duties of citizens:
1. Abide by Constitution and respect national symbols
2. Cherish noble ideals of freedom struggle
3. Uphold sovereignty, unity and integrity
4. Defend the country
5. Promote harmony and spirit of brotherhood
6. Value and preserve composite culture
7. Preserve natural environment
8. Develop scientific temper
9. Safeguard public property
10. Strive for excellence
11. Provide opportunities for education (parents/guardians)

These duties were added by the 42nd Amendment in 1976.`,
        amendments: [
            { number: 42, year: 1976, changes: 'Added fundamental duties' },
            { number: 86, year: 2002, changes: 'Added 11th duty on education' }
        ],
        relatedArticles: ['19', '21'],
        keywords: ['duties', 'fundamental duties', 'citizens', 'responsibility'],
        upscRelevance: 8
    },
    {
        id: 'art-356',
        articleNumber: '356',
        partNumber: 'XVIII',
        title: 'Provisions in case of failure of constitutional machinery in States',
        description: 'President\'s Rule - Emergency provisions',
        content: `Article 356 empowers the President to impose President's Rule in a State if:
- The Governor reports that constitutional machinery has failed
- The President is satisfied that the State cannot be carried on in accordance with the Constitution

During President's Rule:
- President assumes all powers of the State government
- Governor acts as an agent of the President
- State Legislature may be dissolved or kept in suspended animation
- Parliament makes laws for the State

This provision has been subject to misuse and is now regulated by SR Bommai case guidelines.`,
        amendments: [
            { number: 44, year: 1978, changes: 'Added safeguards against misuse' }
        ],
        relatedArticles: ['352', '360', '365'],
        keywords: ['president rule', 'emergency', 'constitutional machinery', 'state government'],
        upscRelevance: 9
    }
];

export function getArticleById(id: string): ConstitutionalArticle | undefined {
    return CONSTITUTIONAL_ARTICLES.find(art => art.id === id);
}

export function getArticleByNumber(articleNumber: string): ConstitutionalArticle | undefined {
    return CONSTITUTIONAL_ARTICLES.find(art => art.articleNumber === articleNumber);
}

export function searchArticles(query: string): ConstitutionalArticle[] {
    const lowerQuery = query.toLowerCase();
    return CONSTITUTIONAL_ARTICLES.filter(art =>
        art.title.toLowerCase().includes(lowerQuery) ||
        art.description.toLowerCase().includes(lowerQuery) ||
        art.keywords.some(kw => kw.includes(lowerQuery)) ||
        art.content.toLowerCase().includes(lowerQuery)
    );
}

export function getHighRelevanceArticles(): ConstitutionalArticle[] {
    return CONSTITUTIONAL_ARTICLES.filter(art => art.upscRelevance >= 8)
        .sort((a, b) => b.upscRelevance - a.upscRelevance);
}
