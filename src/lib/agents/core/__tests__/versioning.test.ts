import { compareAgentVersions, isValidVersionString } from '../versioning';

describe('compareAgentVersions', () => {
  it('returns 0 for equal versions', () => {
    expect(compareAgentVersions('v1', 'v1')).toBe(0);
  });

  it('returns negative for a < b numerically', () => {
    expect(compareAgentVersions('v1', 'v2')).toBeLessThan(0);
  });

  it('returns positive for a > b numerically', () => {
    expect(compareAgentVersions('v3', 'v2')).toBeGreaterThan(0);
  });

  it('handles double-digit versions lexically-safely (v10 > v2)', () => {
    expect(compareAgentVersions('v10', 'v2')).toBeGreaterThan(0);
    expect(compareAgentVersions('v2', 'v10')).toBeLessThan(0);
  });

  it('handles v100 > v11', () => {
    expect(compareAgentVersions('v100', 'v11')).toBeGreaterThan(0);
  });

  it('throws on invalid version string', () => {
    expect(() => compareAgentVersions('1.0', 'v1')).toThrow();
    expect(() => compareAgentVersions('bad', 'v1')).toThrow();
    expect(() => compareAgentVersions('', 'v1')).toThrow();
  });
});

describe('isValidVersionString', () => {
  it('accepts v1, v2, v10, v100', () => {
    expect(isValidVersionString('v1')).toBe(true);
    expect(isValidVersionString('v10')).toBe(true);
    expect(isValidVersionString('v100')).toBe(true);
  });

  it('rejects v0, V1, v1.0, 1, empty', () => {
    expect(isValidVersionString('v0')).toBe(false);
    expect(isValidVersionString('V1')).toBe(false);
    expect(isValidVersionString('v1.0')).toBe(false);
    expect(isValidVersionString('1')).toBe(false);
    expect(isValidVersionString('')).toBe(false);
  });
});
