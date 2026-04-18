/**
 * Lexical-safe agent version comparison (spec §1.2 rule 4).
 * Format: `v` followed by a positive integer (v1, v2, v10, v100, ...).
 * Never compare version strings directly with </>/== — always use this utility.
 */

const VERSION_PATTERN = /^v([1-9][0-9]*)$/;

export function isValidVersionString(s: string): boolean {
  return VERSION_PATTERN.test(s);
}

/**
 * Numeric-only ordering of agent version strings.
 * @returns -1 if a < b, 0 if equal, 1 if a > b.
 * @throws Error if either input is not a valid version string.
 */
export function compareAgentVersions(a: string, b: string): -1 | 0 | 1 {
  if (!isValidVersionString(a)) throw new Error(`Invalid version string: "${a}"`);
  if (!isValidVersionString(b)) throw new Error(`Invalid version string: "${b}"`);
  const aNum = parseInt(a.slice(1), 10);
  const bNum = parseInt(b.slice(1), 10);
  if (aNum < bNum) return -1;
  if (aNum > bNum) return 1;
  return 0;
}
