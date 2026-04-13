import { findSyllabusMatch, getSyllabusEntryCount } from '@/lib/ai/upsc-syllabus-map';

describe('UPSC Syllabus Map', () => {
  it('has at least 170 entries', () => {
    expect(getSyllabusEntryCount()).toBeGreaterThanOrEqual(170);
  });

  it('exact match returns high confidence', () => {
    const result = findSyllabusMatch('fundamental rights');
    expect(result).not.toBeNull();
    expect(result!.subject).toBe('GS2');
    expect(result!.topic).toBe('Indian Polity');
    expect(result!.confidence).toBeGreaterThanOrEqual(0.8);
  });

  it('fuzzy match finds close terms', () => {
    const result = findSyllabusMatch('fundmental rigts'); // typo
    expect(result).not.toBeNull();
    expect(result!.subject).toBe('GS2');
  });

  it('maps economy keywords correctly', () => {
    const result = findSyllabusMatch('monetary policy rbi');
    expect(result).not.toBeNull();
    expect(result!.subject).toBe('GS3');
    expect(result!.topic).toBe('Indian Economy');
  });

  it('maps geography keywords', () => {
    const result = findSyllabusMatch('western ghats biodiversity');
    expect(result).not.toBeNull();
    expect(result!.subject).toMatch(/GS1|GS3/);
  });

  it('maps ethics keywords', () => {
    const result = findSyllabusMatch('ethical dilemma case study');
    expect(result).not.toBeNull();
    expect(result!.subject).toBe('GS4');
  });

  it('returns null for irrelevant input', () => {
    const result = findSyllabusMatch('random gibberish xyz123');
    expect(result === null || result.confidence < 0.4).toBe(true);
  });

  it('handles empty string', () => {
    const result = findSyllabusMatch('');
    expect(result).toBeNull();
  });

  it('maps current affairs keywords', () => {
    const result = findSyllabusMatch('pib press information bureau');
    expect(result).not.toBeNull();
    expect(result!.topic).toBe('Current Affairs');
  });

  it('maps history keywords', () => {
    const result = findSyllabusMatch('mughal empire history');
    expect(result).not.toBeNull();
    expect(result!.subject).toBe('GS1');
    expect(result!.topic).toBe('History');
  });
});
