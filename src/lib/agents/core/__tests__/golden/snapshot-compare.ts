/**
 * Golden-snapshot comparison utility (spec §4, R11).
 *
 * Usage in a contract test:
 *   const actual = await agent.ground(query, chunks, { cite: true });
 *   snapshotOrAssert('knowledge-ground', actual, 'knowledge');
 *
 * First run: no baseline file → writes `<name>.snap.json.candidate` and
 *   throws. Reviewer inspects the candidate, renames to `<name>.snap.json`,
 *   commits. From then on, further runs assert against that baseline
 *   within the per-agent thresholds in `../lock-thresholds.json`.
 *
 * Thresholds keyed by agent:
 *   - knowledge.citationCountDeviation / lengthPct
 *   - evaluation.scoreDriftPct / masteryDriftPct
 *   - orchestrator.citationCountDeviation / lengthPct / modeShapeStrict
 *   - all.schemaStrict — top-level key set must match
 */
import fs from 'fs';
import path from 'path';

const BASELINE_DIR = path.join(__dirname, 'baseline');
const THRESHOLDS_PATH = path.join(__dirname, '../lock-thresholds.json');

type AgentName = 'knowledge' | 'evaluation' | 'orchestrator';

interface Thresholds {
  schemaStrict?: boolean;
  citationCountDeviation?: number;
  lengthPct?: number;
  scoreDriftPct?: number;
  masteryDriftPct?: number;
  modeShapeStrict?: boolean;
}

function loadThresholds(agent: AgentName): Thresholds {
  const raw = JSON.parse(fs.readFileSync(THRESHOLDS_PATH, 'utf8'));
  return raw[agent] ?? {};
}

export function snapshotOrAssert(
  name: string,
  actual: unknown,
  agent: AgentName,
): void {
  if (!fs.existsSync(BASELINE_DIR)) fs.mkdirSync(BASELINE_DIR, { recursive: true });
  const file = path.join(BASELINE_DIR, `${name}.snap.json`);
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file + '.candidate', JSON.stringify(actual, null, 2));
    throw new Error(
      `No baseline for ${name}. Candidate written to ${file}.candidate — ` +
      `review and rename to ${path.basename(file)} to promote.`,
    );
  }

  const baseline = JSON.parse(fs.readFileSync(file, 'utf8'));
  const t = loadThresholds(agent);
  const a = actual as any;
  const b = baseline as any;

  // Schema strict: same top-level keys.
  if (t.schemaStrict) {
    const bk = Object.keys(b).sort().join(',');
    const ak = Object.keys(a).sort().join(',');
    if (bk !== ak) {
      throw new Error(`Schema drift in ${name}: baseline=[${bk}] actual=[${ak}]`);
    }
  }

  // Citation count drift.
  if (typeof t.citationCountDeviation === 'number'
      && Array.isArray(b.citations) && Array.isArray(a.citations)) {
    const diff = Math.abs(b.citations.length - a.citations.length);
    if (diff > t.citationCountDeviation) {
      throw new Error(
        `Citation count drift in ${name}: baseline=${b.citations.length} ` +
        `actual=${a.citations.length} (allowed ±${t.citationCountDeviation})`,
      );
    }
  }

  // Text-length drift (string field `text` or `answer`).
  if (typeof t.lengthPct === 'number') {
    const bText = typeof b.text === 'string' ? b.text
                : typeof b.answer === 'string' ? b.answer : null;
    const aText = typeof a.text === 'string' ? a.text
                : typeof a.answer === 'string' ? a.answer : null;
    if (bText !== null && aText !== null) {
      const pct = Math.abs(aText.length - bText.length) / Math.max(1, bText.length);
      if (pct > t.lengthPct) {
        throw new Error(
          `Length drift in ${name}: baseline=${bText.length} ` +
          `actual=${aText.length} (${(pct*100).toFixed(1)}% > ${(t.lengthPct*100).toFixed(0)}%)`,
        );
      }
    }
  }

  // Score drift (evaluation).
  if (typeof t.scoreDriftPct === 'number'
      && typeof b.accuracyPct === 'number' && typeof a.accuracyPct === 'number') {
    const drift = Math.abs(a.accuracyPct - b.accuracyPct) / Math.max(1, b.accuracyPct);
    if (drift > t.scoreDriftPct) {
      throw new Error(
        `Score drift in ${name}: baseline=${b.accuracyPct} actual=${a.accuracyPct} ` +
        `(${(drift*100).toFixed(1)}% > ${(t.scoreDriftPct*100).toFixed(0)}%)`,
      );
    }
  }

  // Mode shape (orchestrator): baseline.mode must equal actual.mode.
  if (t.modeShapeStrict && b.mode !== undefined) {
    if (b.mode !== a.mode) {
      throw new Error(`Mode drift in ${name}: baseline=${b.mode} actual=${a.mode}`);
    }
  }
}
