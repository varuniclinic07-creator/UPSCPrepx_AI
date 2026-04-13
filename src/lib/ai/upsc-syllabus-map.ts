/**
 * UPSC Syllabus Map — 180-entry lookup table with fuse.js fuzzy matching
 * Used by NormalizerAgent as tier-2 resolution (after cache miss, before AI)
 */
import Fuse from 'fuse.js';

export interface SyllabusEntry {
  term: string;
  subject: string;
  topic: string;
  subtopic: string;
}

export interface SyllabusMatch {
  subject: string;
  topic: string;
  subtopic: string;
  confidence: number;
  method: 'exact' | 'fuzzy';
}

// ============================================================================
// GS1 — History, Geography, Society (40 entries)
// ============================================================================

const GS1_HISTORY: SyllabusEntry[] = [
  { term: 'ancient india', subject: 'GS1', topic: 'History', subtopic: 'Ancient India' },
  { term: 'indus valley civilization', subject: 'GS1', topic: 'History', subtopic: 'Indus Valley Civilization' },
  { term: 'harappa mohenjo daro', subject: 'GS1', topic: 'History', subtopic: 'Indus Valley Civilization' },
  { term: 'vedic period', subject: 'GS1', topic: 'History', subtopic: 'Vedic Period' },
  { term: 'maurya empire ashoka', subject: 'GS1', topic: 'History', subtopic: 'Mauryan Empire' },
  { term: 'gupta dynasty', subject: 'GS1', topic: 'History', subtopic: 'Gupta Period' },
  { term: 'medieval india', subject: 'GS1', topic: 'History', subtopic: 'Medieval India' },
  { term: 'mughal empire', subject: 'GS1', topic: 'History', subtopic: 'Mughal Period' },
  { term: 'delhi sultanate', subject: 'GS1', topic: 'History', subtopic: 'Delhi Sultanate' },
  { term: 'bhakti sufi movement', subject: 'GS1', topic: 'History', subtopic: 'Bhakti and Sufi Movements' },
  { term: 'modern india', subject: 'GS1', topic: 'History', subtopic: 'Modern India' },
  { term: 'freedom struggle independence', subject: 'GS1', topic: 'History', subtopic: 'Freedom Struggle' },
  { term: 'revolt 1857 sepoy mutiny', subject: 'GS1', topic: 'History', subtopic: 'Revolt of 1857' },
  { term: 'gandhi mahatma nonviolence', subject: 'GS1', topic: 'History', subtopic: 'Gandhian Era' },
  { term: 'quit india movement', subject: 'GS1', topic: 'History', subtopic: 'Quit India Movement' },
  { term: 'partition india pakistan', subject: 'GS1', topic: 'History', subtopic: 'Partition of India' },
  { term: 'world war history', subject: 'GS1', topic: 'History', subtopic: 'World History' },
  { term: 'french revolution', subject: 'GS1', topic: 'History', subtopic: 'French Revolution' },
  { term: 'industrial revolution', subject: 'GS1', topic: 'History', subtopic: 'Industrial Revolution' },
  { term: 'indian art culture heritage', subject: 'GS1', topic: 'Art & Culture', subtopic: 'Indian Art and Culture' },
];

const GS1_GEOGRAPHY: SyllabusEntry[] = [
  { term: 'physical geography', subject: 'GS1', topic: 'Geography', subtopic: 'Physical Geography' },
  { term: 'indian geography', subject: 'GS1', topic: 'Geography', subtopic: 'Indian Geography' },
  { term: 'monsoon climate india', subject: 'GS1', topic: 'Geography', subtopic: 'Indian Monsoon' },
  { term: 'western ghats eastern ghats', subject: 'GS1', topic: 'Geography', subtopic: 'Western & Eastern Ghats' },
  { term: 'river systems india ganga', subject: 'GS1', topic: 'Geography', subtopic: 'River Systems' },
  { term: 'himalaya mountains', subject: 'GS1', topic: 'Geography', subtopic: 'Himalayan Region' },
  { term: 'soil types india', subject: 'GS1', topic: 'Geography', subtopic: 'Indian Soils' },
  { term: 'earthquake volcano tsunami', subject: 'GS1', topic: 'Geography', subtopic: 'Geophysical Phenomena' },
  { term: 'population distribution urbanisation', subject: 'GS1', topic: 'Geography', subtopic: 'Population and Urbanisation' },
  { term: 'ocean currents tides', subject: 'GS1', topic: 'Geography', subtopic: 'Oceanography' },
  { term: 'atmosphere weather', subject: 'GS1', topic: 'Geography', subtopic: 'Climatology' },
  { term: 'world geography continents', subject: 'GS1', topic: 'Geography', subtopic: 'World Geography' },
  { term: 'mineral resources mining', subject: 'GS1', topic: 'Geography', subtopic: 'Mineral Resources' },
  { term: 'agricultural geography crops', subject: 'GS1', topic: 'Geography', subtopic: 'Agricultural Geography' },
  { term: 'mapping cartography gis', subject: 'GS1', topic: 'Geography', subtopic: 'Cartography and GIS' },
];

const GS1_SOCIETY: SyllabusEntry[] = [
  { term: 'indian society diversity', subject: 'GS1', topic: 'Society', subtopic: 'Indian Society' },
  { term: 'communalism secularism', subject: 'GS1', topic: 'Society', subtopic: 'Communalism and Secularism' },
  { term: 'women empowerment gender', subject: 'GS1', topic: 'Society', subtopic: 'Women Empowerment' },
  { term: 'caste system reservation', subject: 'GS1', topic: 'Society', subtopic: 'Caste System' },
  { term: 'globalization indian society', subject: 'GS1', topic: 'Society', subtopic: 'Globalization Effects' },
];

// ============================================================================
// GS2 — Polity, Governance, IR (40 entries)
// ============================================================================

const GS2_POLITY: SyllabusEntry[] = [
  { term: 'indian polity constitution', subject: 'GS2', topic: 'Indian Polity', subtopic: 'Indian Constitution' },
  { term: 'preamble constitution', subject: 'GS2', topic: 'Indian Polity', subtopic: 'Preamble' },
  { term: 'fundamental rights', subject: 'GS2', topic: 'Indian Polity', subtopic: 'Part III - Fundamental Rights' },
  { term: 'article 21 right life', subject: 'GS2', topic: 'Indian Polity', subtopic: 'Article 21 - Right to Life' },
  { term: 'directive principles dpsp', subject: 'GS2', topic: 'Indian Polity', subtopic: 'DPSP' },
  { term: 'fundamental duties', subject: 'GS2', topic: 'Indian Polity', subtopic: 'Fundamental Duties' },
  { term: 'parliament lok sabha rajya sabha', subject: 'GS2', topic: 'Indian Polity', subtopic: 'Parliament' },
  { term: 'president india executive', subject: 'GS2', topic: 'Indian Polity', subtopic: 'President and Executive' },
  { term: 'prime minister cabinet', subject: 'GS2', topic: 'Indian Polity', subtopic: 'Prime Minister and Cabinet' },
  { term: 'governor state executive', subject: 'GS2', topic: 'Indian Polity', subtopic: 'Governor' },
  { term: 'judiciary supreme court high court', subject: 'GS2', topic: 'Indian Polity', subtopic: 'Judiciary' },
  { term: 'federalism centre state', subject: 'GS2', topic: 'Indian Polity', subtopic: 'Federalism' },
  { term: 'constitutional amendment', subject: 'GS2', topic: 'Indian Polity', subtopic: 'Constitutional Amendments' },
  { term: 'election commission voting', subject: 'GS2', topic: 'Indian Polity', subtopic: 'Election Commission' },
  { term: 'local government panchayati raj', subject: 'GS2', topic: 'Indian Polity', subtopic: 'Panchayati Raj' },
  { term: 'union territories', subject: 'GS2', topic: 'Indian Polity', subtopic: 'Union Territories' },
  { term: 'emergency provisions', subject: 'GS2', topic: 'Indian Polity', subtopic: 'Emergency Provisions' },
  { term: 'comptroller auditor general cag', subject: 'GS2', topic: 'Indian Polity', subtopic: 'CAG' },
  { term: 'upsc public service commission', subject: 'GS2', topic: 'Indian Polity', subtopic: 'UPSC and State PSCs' },
  { term: 'right to information rti', subject: 'GS2', topic: 'Indian Polity', subtopic: 'RTI Act' },
  { term: 'niti aayog planning commission', subject: 'GS2', topic: 'Indian Polity', subtopic: 'NITI Aayog' },
  { term: 'citizenship act nrc caa', subject: 'GS2', topic: 'Indian Polity', subtopic: 'Citizenship' },
  { term: 'scheduled castes tribes sc st', subject: 'GS2', topic: 'Indian Polity', subtopic: 'SC/ST Provisions' },
  { term: 'anti defection law', subject: 'GS2', topic: 'Indian Polity', subtopic: 'Anti-Defection Law' },
  { term: 'judicial review writ petition', subject: 'GS2', topic: 'Indian Polity', subtopic: 'Judicial Review' },
];

const GS2_GOVERNANCE: SyllabusEntry[] = [
  { term: 'governance transparency accountability', subject: 'GS2', topic: 'Governance', subtopic: 'Good Governance' },
  { term: 'e-governance digital india', subject: 'GS2', topic: 'Governance', subtopic: 'E-Governance' },
  { term: 'civil services bureaucracy', subject: 'GS2', topic: 'Governance', subtopic: 'Civil Services' },
  { term: 'self help groups shg', subject: 'GS2', topic: 'Governance', subtopic: 'SHGs and NGOs' },
  { term: 'welfare schemes government', subject: 'GS2', topic: 'Governance', subtopic: 'Government Schemes' },
  { term: 'healthcare education policy', subject: 'GS2', topic: 'Governance', subtopic: 'Social Sector Policies' },
  { term: 'statutory regulatory body', subject: 'GS2', topic: 'Governance', subtopic: 'Statutory Bodies' },
  { term: 'pressure groups ngo', subject: 'GS2', topic: 'Governance', subtopic: 'Pressure Groups' },
  { term: 'corruption lokpal lokayukta', subject: 'GS2', topic: 'Governance', subtopic: 'Anti-Corruption' },
  { term: 'decentralization devolution', subject: 'GS2', topic: 'Governance', subtopic: 'Decentralization' },
];

const GS2_IR: SyllabusEntry[] = [
  { term: 'international relations foreign policy', subject: 'GS2', topic: 'International Relations', subtopic: 'Foreign Policy' },
  { term: 'india china relations', subject: 'GS2', topic: 'International Relations', subtopic: 'India-China Relations' },
  { term: 'india pakistan relations', subject: 'GS2', topic: 'International Relations', subtopic: 'India-Pakistan Relations' },
  { term: 'united nations un', subject: 'GS2', topic: 'International Relations', subtopic: 'United Nations' },
  { term: 'brics sco g20', subject: 'GS2', topic: 'International Relations', subtopic: 'Multilateral Groupings' },
];

// ============================================================================
// GS3 — Economy, Environment, S&T, Security (50 entries)
// ============================================================================

const GS3_ECONOMY: SyllabusEntry[] = [
  { term: 'indian economy', subject: 'GS3', topic: 'Indian Economy', subtopic: 'Indian Economy Overview' },
  { term: 'gdp economic growth', subject: 'GS3', topic: 'Indian Economy', subtopic: 'GDP and Growth' },
  { term: 'rbi reserve bank monetary policy', subject: 'GS3', topic: 'Indian Economy', subtopic: 'Monetary Policy' },
  { term: 'monetary policy rbi interest rate', subject: 'GS3', topic: 'Indian Economy', subtopic: 'Monetary Policy' },
  { term: 'inflation cpi wpi', subject: 'GS3', topic: 'Indian Economy', subtopic: 'Inflation' },
  { term: 'union budget fiscal policy', subject: 'GS3', topic: 'Indian Economy', subtopic: 'Fiscal Policy' },
  { term: 'banking sector npa', subject: 'GS3', topic: 'Indian Economy', subtopic: 'Banking Sector' },
  { term: 'fdi fpi foreign investment', subject: 'GS3', topic: 'Indian Economy', subtopic: 'Foreign Investment' },
  { term: 'gst taxation tax reform', subject: 'GS3', topic: 'Indian Economy', subtopic: 'Taxation and GST' },
  { term: 'poverty inequality unemployment', subject: 'GS3', topic: 'Indian Economy', subtopic: 'Poverty and Inequality' },
  { term: 'agriculture farming crop', subject: 'GS3', topic: 'Indian Economy', subtopic: 'Agriculture' },
  { term: 'food security pds', subject: 'GS3', topic: 'Indian Economy', subtopic: 'Food Security' },
  { term: 'infrastructure development', subject: 'GS3', topic: 'Indian Economy', subtopic: 'Infrastructure' },
  { term: 'make in india manufacturing', subject: 'GS3', topic: 'Indian Economy', subtopic: 'Industrial Policy' },
  { term: 'msme small medium enterprise', subject: 'GS3', topic: 'Indian Economy', subtopic: 'MSME Sector' },
  { term: 'external trade balance payments', subject: 'GS3', topic: 'Indian Economy', subtopic: 'External Sector' },
  { term: 'financial inclusion jan dhan', subject: 'GS3', topic: 'Indian Economy', subtopic: 'Financial Inclusion' },
  { term: 'disinvestment privatisation', subject: 'GS3', topic: 'Indian Economy', subtopic: 'Disinvestment' },
  { term: 'economic survey', subject: 'GS3', topic: 'Indian Economy', subtopic: 'Economic Survey' },
  { term: 'sebi stock market capital', subject: 'GS3', topic: 'Indian Economy', subtopic: 'Capital Markets' },
  { term: 'digital economy fintech upi', subject: 'GS3', topic: 'Indian Economy', subtopic: 'Digital Economy' },
  { term: 'wto trade agreement', subject: 'GS3', topic: 'Indian Economy', subtopic: 'International Trade' },
  { term: 'land reform agrarian', subject: 'GS3', topic: 'Indian Economy', subtopic: 'Land Reforms' },
  { term: 'cooperative movement', subject: 'GS3', topic: 'Indian Economy', subtopic: 'Cooperatives' },
  { term: 'public expenditure subsidy', subject: 'GS3', topic: 'Indian Economy', subtopic: 'Public Expenditure' },
  { term: 'cryptocurrency blockchain digital currency', subject: 'GS3', topic: 'Indian Economy', subtopic: 'Digital Currency' },
];

const GS3_ENVIRONMENT: SyllabusEntry[] = [
  { term: 'environment ecology biodiversity', subject: 'GS3', topic: 'Environment', subtopic: 'Environment and Ecology' },
  { term: 'climate change global warming', subject: 'GS3', topic: 'Environment', subtopic: 'Climate Change' },
  { term: 'pollution air water soil', subject: 'GS3', topic: 'Environment', subtopic: 'Pollution' },
  { term: 'forest conservation wildlife', subject: 'GS3', topic: 'Environment', subtopic: 'Conservation' },
  { term: 'renewable energy solar wind', subject: 'GS3', topic: 'Environment', subtopic: 'Renewable Energy' },
  { term: 'disaster management flood drought', subject: 'GS3', topic: 'Environment', subtopic: 'Disaster Management' },
  { term: 'sustainable development sdg', subject: 'GS3', topic: 'Environment', subtopic: 'Sustainable Development' },
  { term: 'paris agreement cop', subject: 'GS3', topic: 'Environment', subtopic: 'International Climate Agreements' },
  { term: 'western ghats biodiversity', subject: 'GS3', topic: 'Environment', subtopic: 'Western Ghats Biodiversity' },
  { term: 'environmental impact assessment eia', subject: 'GS3', topic: 'Environment', subtopic: 'EIA' },
];

const GS3_SCIENCE: SyllabusEntry[] = [
  { term: 'science technology innovation', subject: 'GS3', topic: 'Science & Technology', subtopic: 'S&T Overview' },
  { term: 'space isro satellite', subject: 'GS3', topic: 'Science & Technology', subtopic: 'Space Technology' },
  { term: 'nuclear energy atomic', subject: 'GS3', topic: 'Science & Technology', subtopic: 'Nuclear Technology' },
  { term: 'biotechnology genetic engineering', subject: 'GS3', topic: 'Science & Technology', subtopic: 'Biotechnology' },
  { term: 'artificial intelligence ai robotics', subject: 'GS3', topic: 'Science & Technology', subtopic: 'AI and Robotics' },
  { term: 'nanotechnology', subject: 'GS3', topic: 'Science & Technology', subtopic: 'Nanotechnology' },
  { term: 'cyber security digital threat', subject: 'GS3', topic: 'Science & Technology', subtopic: 'Cyber Security' },
  { term: 'defence technology missile', subject: 'GS3', topic: 'Science & Technology', subtopic: 'Defence Technology' },
  { term: 'intellectual property patent', subject: 'GS3', topic: 'Science & Technology', subtopic: 'IPR' },
  { term: 'health technology telemedicine', subject: 'GS3', topic: 'Science & Technology', subtopic: 'Health Technology' },
];

const GS3_SECURITY: SyllabusEntry[] = [
  { term: 'internal security naxalism', subject: 'GS3', topic: 'Security', subtopic: 'Internal Security' },
  { term: 'terrorism counter terrorism', subject: 'GS3', topic: 'Security', subtopic: 'Counter Terrorism' },
  { term: 'border management security', subject: 'GS3', topic: 'Security', subtopic: 'Border Management' },
  { term: 'money laundering hawala', subject: 'GS3', topic: 'Security', subtopic: 'Money Laundering' },
  { term: 'organized crime', subject: 'GS3', topic: 'Security', subtopic: 'Organized Crime' },
];

// ============================================================================
// GS4 — Ethics (25 entries)
// ============================================================================

const GS4_ETHICS: SyllabusEntry[] = [
  { term: 'ethics integrity aptitude', subject: 'GS4', topic: 'Ethics', subtopic: 'Ethics and Human Interface' },
  { term: 'attitude values morals', subject: 'GS4', topic: 'Ethics', subtopic: 'Attitude' },
  { term: 'emotional intelligence', subject: 'GS4', topic: 'Ethics', subtopic: 'Emotional Intelligence' },
  { term: 'ethical dilemma case study', subject: 'GS4', topic: 'Ethics', subtopic: 'Ethical Dilemmas' },
  { term: 'public service values', subject: 'GS4', topic: 'Ethics', subtopic: 'Public Service Values' },
  { term: 'probity governance ethics', subject: 'GS4', topic: 'Ethics', subtopic: 'Probity in Governance' },
  { term: 'corporate governance ethics', subject: 'GS4', topic: 'Ethics', subtopic: 'Corporate Governance' },
  { term: 'conscience moral compass', subject: 'GS4', topic: 'Ethics', subtopic: 'Conscience' },
  { term: 'thinkers philosophers gandhi', subject: 'GS4', topic: 'Ethics', subtopic: 'Ethical Thinkers' },
  { term: 'code of conduct ethics civil', subject: 'GS4', topic: 'Ethics', subtopic: 'Code of Conduct' },
  { term: 'whistleblower corruption ethics', subject: 'GS4', topic: 'Ethics', subtopic: 'Whistleblowing' },
  { term: 'right wrong justice fairness', subject: 'GS4', topic: 'Ethics', subtopic: 'Justice and Fairness' },
  { term: 'empathy compassion tolerance', subject: 'GS4', topic: 'Ethics', subtopic: 'Empathy and Compassion' },
  { term: 'accountability transparency ethics', subject: 'GS4', topic: 'Ethics', subtopic: 'Accountability' },
  { term: 'conflict of interest ethics', subject: 'GS4', topic: 'Ethics', subtopic: 'Conflict of Interest' },
  { term: 'ethics case study scenario', subject: 'GS4', topic: 'Ethics', subtopic: 'Case Studies' },
  { term: 'civil service conduct rule', subject: 'GS4', topic: 'Ethics', subtopic: 'Civil Service Conduct Rules' },
  { term: 'bioethics medical ethics', subject: 'GS4', topic: 'Ethics', subtopic: 'Bioethics' },
  { term: 'environmental ethics', subject: 'GS4', topic: 'Ethics', subtopic: 'Environmental Ethics' },
  { term: 'information ethics privacy', subject: 'GS4', topic: 'Ethics', subtopic: 'Information Ethics' },
  { term: 'leadership ethics', subject: 'GS4', topic: 'Ethics', subtopic: 'Ethical Leadership' },
  { term: 'work culture ethics values', subject: 'GS4', topic: 'Ethics', subtopic: 'Work Culture' },
  { term: 'social influence persuasion', subject: 'GS4', topic: 'Ethics', subtopic: 'Social Influence' },
  { term: 'utilitarian deontological virtue', subject: 'GS4', topic: 'Ethics', subtopic: 'Ethical Theories' },
  { term: 'quotes ethics governance aptitude', subject: 'GS4', topic: 'Ethics', subtopic: 'Ethics Quotations' },
];

// ============================================================================
// Other — CSAT, Essay, Current Affairs (25 entries)
// ============================================================================

const OTHER: SyllabusEntry[] = [
  { term: 'csat aptitude test', subject: 'CSAT', topic: 'CSAT', subtopic: 'Aptitude' },
  { term: 'logical reasoning csat', subject: 'CSAT', topic: 'CSAT', subtopic: 'Logical Reasoning' },
  { term: 'reading comprehension csat', subject: 'CSAT', topic: 'CSAT', subtopic: 'Reading Comprehension' },
  { term: 'data interpretation csat', subject: 'CSAT', topic: 'CSAT', subtopic: 'Data Interpretation' },
  { term: 'mental ability mathematics csat', subject: 'CSAT', topic: 'CSAT', subtopic: 'Mental Ability' },
  { term: 'essay writing upsc mains', subject: 'Essay', topic: 'Essay', subtopic: 'Essay Writing' },
  { term: 'essay philosophical', subject: 'Essay', topic: 'Essay', subtopic: 'Philosophical Essays' },
  { term: 'essay social issues', subject: 'Essay', topic: 'Essay', subtopic: 'Social Issue Essays' },
  { term: 'essay science technology', subject: 'Essay', topic: 'Essay', subtopic: 'S&T Essays' },
  { term: 'essay political governance', subject: 'Essay', topic: 'Essay', subtopic: 'Political Essays' },
  { term: 'current affairs daily', subject: 'General', topic: 'Current Affairs', subtopic: 'Daily Current Affairs' },
  { term: 'pib press information bureau', subject: 'General', topic: 'Current Affairs', subtopic: 'PIB' },
  { term: 'the hindu editorial analysis', subject: 'General', topic: 'Current Affairs', subtopic: 'The Hindu Analysis' },
  { term: 'yojana magazine', subject: 'General', topic: 'Current Affairs', subtopic: 'Yojana' },
  { term: 'kurukshetra magazine', subject: 'General', topic: 'Current Affairs', subtopic: 'Kurukshetra' },
  { term: 'economic survey highlights', subject: 'General', topic: 'Current Affairs', subtopic: 'Economic Survey' },
  { term: 'government scheme yojana', subject: 'General', topic: 'Current Affairs', subtopic: 'Government Schemes' },
  { term: 'supreme court judgment', subject: 'General', topic: 'Current Affairs', subtopic: 'SC Judgments' },
  { term: 'arc report administrative reform', subject: 'General', topic: 'Current Affairs', subtopic: 'ARC Reports' },
  { term: 'prelims pyq previous year', subject: 'General', topic: 'PYQ', subtopic: 'Prelims PYQ' },
  { term: 'mains pyq answer writing', subject: 'General', topic: 'PYQ', subtopic: 'Mains PYQ' },
  { term: 'ncert textbook notes', subject: 'General', topic: 'NCERT', subtopic: 'NCERT Notes' },
  { term: 'optional subject', subject: 'Optional', topic: 'Optional', subtopic: 'Optional Subject' },
  { term: 'interview personality test', subject: 'General', topic: 'Interview', subtopic: 'Personality Test' },
  { term: 'topper strategy preparation', subject: 'General', topic: 'Strategy', subtopic: 'Preparation Strategy' },
];

// ============================================================================
// Combined syllabus and Fuse.js search
// ============================================================================

const ALL_ENTRIES: SyllabusEntry[] = [
  ...GS1_HISTORY,
  ...GS1_GEOGRAPHY,
  ...GS1_SOCIETY,
  ...GS2_POLITY,
  ...GS2_GOVERNANCE,
  ...GS2_IR,
  ...GS3_ECONOMY,
  ...GS3_ENVIRONMENT,
  ...GS3_SCIENCE,
  ...GS3_SECURITY,
  ...GS4_ETHICS,
  ...OTHER,
];

// Lazy-initialized fuse instance
let fuseInstance: Fuse<SyllabusEntry> | null = null;

function getFuse(): Fuse<SyllabusEntry> {
  if (!fuseInstance) {
    fuseInstance = new Fuse(ALL_ENTRIES, {
      keys: ['term'],
      threshold: 0.4,
      includeScore: true,
      minMatchCharLength: 2,
    });
  }
  return fuseInstance;
}

/**
 * Find the best UPSC syllabus match for a raw input string.
 * Returns null if no match found above confidence threshold.
 */
export function findSyllabusMatch(input: string): SyllabusMatch | null {
  if (!input || input.trim().length === 0) return null;

  const normalized = input.toLowerCase().trim();
  const fuse = getFuse();

  const results = fuse.search(normalized);
  if (results.length === 0) return null;

  const best = results[0];
  // Fuse score: 0 = perfect, 1 = worst. Convert to confidence: 1 - score
  const confidence = 1 - (best.score ?? 1);

  if (confidence < 0.3) return null;

  return {
    subject: best.item.subject,
    topic: best.item.topic,
    subtopic: best.item.subtopic,
    confidence,
    method: confidence >= 0.9 ? 'exact' : 'fuzzy',
  };
}

/** Get total entry count (for diagnostics) */
export function getSyllabusEntryCount(): number {
  return ALL_ENTRIES.length;
}
