#!/usr/bin/env node
/**
 * Phase-1 D2 — Thin Current-Affairs slice seed.
 *
 * Ingests 5 pre-generated CA entries through the Knowledge Agent ingest
 * pipeline so that:
 *   - v8_knowledge_chunks has real embeddings from the 9router Gemini model
 *   - /dashboard/current-affairs shows real content on a fresh deploy
 *   - /api/agents/knowledge retrieve returns cited chunks from day one
 *
 * Run: `node scripts/seed-ca-thin-slice.mjs`
 *
 * Env required (reads .env.local then .env.coolify):
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 *   - NINEROUTER_EMBED_BASE_URL
 *   - NINEROUTER_EMBED_API_KEY
 *   - EMBED_MODEL (default gemini/gemini-embedding-2-preview)
 *
 * Safe to re-run: each entry has a stable slug meta.url; existing rows are
 * skipped via (source_type='ca', meta->>'url') dedupe query.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

// ─── env loader: .env.local then .env.coolify overlay ──────────────────────
for (const file of ['.env.local', '.env.coolify']) {
  const p = path.resolve(process.cwd(), file);
  if (!fs.existsSync(p)) continue;
  for (const line of fs.readFileSync(p, 'utf-8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    const [, k, v] = m;
    if (!process.env[k]) process.env[k] = v.replace(/^['"]|['"]$/g, '');
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const EMBED_URL = process.env.NINEROUTER_EMBED_BASE_URL;
const EMBED_KEY = process.env.NINEROUTER_EMBED_API_KEY;
const EMBED_MODEL = process.env.EMBED_MODEL || 'gemini/gemini-embedding-2-preview';

if (!SUPABASE_URL || !SUPABASE_KEY || !EMBED_URL || !EMBED_KEY) {
  console.error('[seed-ca] FATAL: missing env. Need SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, NINEROUTER_EMBED_*');
  process.exit(1);
}

// ─── 5 pre-generated CA entries covering core UPSC subjects ────────────────
const ENTRIES = [
  {
    slug: 'rbi-mpc-april-2026-repo-rate',
    topicId: 'economy',
    title: 'RBI MPC keeps repo rate at 6.50% in April 2026 review',
    publishedAt: '2026-04-05',
    content: `The Reserve Bank of India's Monetary Policy Committee (MPC), chaired by Governor Shaktikanta Das, voted 5-1 to keep the repo rate unchanged at 6.50% during its April 2026 review. The standing deposit facility rate remains at 6.25% and the marginal standing facility at 6.75%. The committee retained the stance of "withdrawal of accommodation" citing sticky core inflation at 4.3% YoY and upside risks from crude oil volatility. Real GDP growth for FY27 is projected at 6.8%, with quarterly prints of 7.1, 6.9, 6.7 and 6.5 percent. CPI inflation is projected at 4.5% for FY27. The MPC flagged food price uncertainty from unseasonal rainfall and rising pulses prices as the main near-term risk. Governor Das emphasised that the last mile of disinflation towards the 4% target is proving more protracted than anticipated and that premature easing would risk a repeat of 2022-style shocks. Markets had priced in a hold; the 10-year G-Sec yield closed 2 bps lower at 7.04%. This decision is relevant for UPSC Prelims (Monetary Policy Framework Agreement, flexible inflation targeting regime) and GS-III Economy (monetary-fiscal coordination, transmission mechanism).`,
  },
  {
    slug: 'supreme-court-electoral-bonds-followup-2026',
    topicId: 'polity',
    title: 'Supreme Court reviews electoral bond disclosure compliance',
    publishedAt: '2026-04-08',
    content: `A five-judge Constitution Bench led by the Chief Justice heard follow-up petitions on compliance with the February 2024 judgement that struck down the Electoral Bonds Scheme as violative of Article 19(1)(a) — the right to information of voters. The bench directed the State Bank of India to submit additional details of bond redemptions by political parties registered between 2018 and 2024, including the alphanumeric bond numbers that uniquely link donor to recipient. The court reiterated that anonymous corporate funding of political parties is inconsistent with the constitutional morality of free and fair elections. Senior counsel Prashant Bhushan argued that without the matching, the 2024 ruling is rendered toothless. The Attorney General submitted that the matching data has been uploaded to the ECI website. The case has implications for UPSC Prelims (Constitutional Bodies — Election Commission, Fundamental Rights) and GS-II Polity (judicial review, separation of powers, right to information jurisprudence).`,
  },
  {
    slug: 'india-eu-fta-chief-negotiator-round-2026',
    topicId: 'international-relations',
    title: 'India-EU FTA: 12th round concludes with services text breakthrough',
    publishedAt: '2026-04-10',
    content: `The twelfth round of negotiations on the India-European Union Free Trade Agreement concluded in Brussels with a breakthrough on the services chapter, specifically on Mode-4 mobility commitments for Indian IT professionals. The EU conceded longer intra-corporate transferee durations (up to five years) and portable social-security contributions, a long-standing Indian demand. However, the investment protection chapter remains stuck on the Investor-State Dispute Settlement (ISDS) mechanism; India prefers the local-remedies-exhaustion model of its 2016 Model BIT, while the EU pushes for an Investment Court System similar to the Canada-EU CETA. Agriculture — dairy, wine, spirits — and carbon border adjustment (CBAM) compatibility remain contentious. Bilateral trade in FY25 stood at USD 137 billion, with the EU being India's largest trading partner in goods and services combined. Relevance: UPSC Prelims (regional trade blocs, WTO architecture) and GS-II International Relations + GS-III Economy (trade diplomacy, non-tariff barriers).`,
  },
  {
    slug: 'isro-chandrayaan-4-sample-return-2026',
    topicId: 'science-technology',
    title: 'ISRO unveils Chandrayaan-4 sample-return architecture',
    publishedAt: '2026-04-12',
    content: `The Indian Space Research Organisation unveiled the full mission architecture for Chandrayaan-4, India's first lunar sample-return mission, targeted for a late-2027 launch. The mission uses a dual-launch profile: the Transfer Module and Lander-Ascender stack launches on LVM-3 while the Re-entry Module and Propulsion Module launch on the PSLV-XL. Rendezvous and docking occur in lunar orbit — a first for ISRO and a critical step towards the Bharatiya Antariksh Station. Target landing site is the lunar south pole near the Chandrayaan-3 Vikram touchdown point (69.37°S, 32.35°E). The mission will bring back approximately 3 kg of regolith using a sampling arm and drill. Scientific objectives include volatiles and water-ice characterisation, regolith exobiology, and geochronology of the South Pole-Aitken basin. The total mission cost is approximately ₹2,104 crore. Relevance: UPSC Prelims (planetary missions, launch vehicles) and GS-III Science & Technology (indigenous space capability, applications).`,
  },
  {
    slug: 'pmfby-redesign-kharif-2026',
    topicId: 'governance',
    title: 'PMFBY redesigned ahead of Kharif 2026 with smart-sampling CCEs',
    publishedAt: '2026-04-15',
    content: `The Union Cabinet approved a comprehensive redesign of the Pradhan Mantri Fasal Bima Yojana (PMFBY) ahead of the Kharif 2026 season. Key changes: (1) Crop-Cutting Experiments (CCEs) will now use smart-sampling with geo-tagged photographs and drone imagery, replacing the older manual-only protocol that was prone to delays and disputes. (2) Yield-data release timelines cut from 45 to 15 days post-harvest. (3) Claim settlement SLA tightened to 30 days with penal interest of 12% per annum on delayed payouts. (4) Technology-driven Yield Estimation System (YES-Tech) deployment expanded from six to fourteen states. (5) Voluntary enrolment for loanee farmers continues — reversing the 2016-to-2020 compulsory regime. (6) Premium subsidy sharing: Centre and state split 50:50 for most states and 90:10 for North-East and hilly states. FY27 budget allocation is ₹16,200 crore. Relevance: UPSC Prelims (government schemes, agricultural insurance) and GS-III Agriculture + GS-II Governance (scheme re-engineering, federal fiscal architecture).`,
  },
];

const CHUNK_SIZE = 800;
function chunkText(text) {
  const out = [];
  for (let i = 0; i < text.length; i += CHUNK_SIZE) out.push(text.slice(i, i + CHUNK_SIZE));
  return out;
}

async function embedBatch(inputs) {
  const r = await fetch(`${EMBED_URL}/embeddings`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${EMBED_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: EMBED_MODEL, input: inputs, dimensions: 3072 }),
  });
  if (!r.ok) throw new Error(`embed ${r.status}: ${await r.text()}`);
  const j = await r.json();
  return j.data.map((d) => d.embedding);
}

async function supa(path, opts = {}) {
  const url = `${SUPABASE_URL}/rest/v1${path}`;
  const r = await fetch(url, {
    ...opts,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      ...(opts.headers ?? {}),
    },
  });
  const body = await r.text();
  if (!r.ok) throw new Error(`supa ${r.status} ${path}: ${body}`);
  return body ? JSON.parse(body) : null;
}

async function alreadyIngested(slug) {
  const q = `/v8_knowledge_chunks?source_type=eq.ca&meta->>url=eq.${encodeURIComponent(slug)}&select=source_id&limit=1`;
  const rows = await supa(q, { method: 'GET' });
  return Array.isArray(rows) && rows.length > 0;
}

async function ingestOne(entry) {
  if (await alreadyIngested(entry.slug)) {
    console.log(`[seed-ca] skip (already ingested): ${entry.slug}`);
    return { skipped: true };
  }
  const chunks = chunkText(entry.content);
  const vectors = await embedBatch(chunks);
  const sourceId = crypto.randomUUID();
  const meta = {
    topicId: entry.topicId,
    title: entry.title,
    url: entry.slug,
    publishedAt: entry.publishedAt,
  };
  const rows = chunks.map((chunk, i) => ({
    source_id: sourceId,
    topic_id: entry.topicId,
    source_type: 'ca',
    chunk_text: chunk,
    embedding: vectors[i],
    meta,
  }));
  await supa('/v8_knowledge_chunks', { method: 'POST', body: JSON.stringify(rows) });
  console.log(`[seed-ca] ingested ${entry.slug} (${chunks.length} chunks)`);
  return { sourceId, chunkCount: chunks.length };
}

(async () => {
  console.log(`[seed-ca] ingesting ${ENTRIES.length} thin-slice CA entries…`);
  let ok = 0;
  for (const entry of ENTRIES) {
    try {
      await ingestOne(entry);
      ok++;
    } catch (err) {
      console.error(`[seed-ca] FAIL ${entry.slug}:`, err.message);
    }
  }
  console.log(`[seed-ca] done: ${ok}/${ENTRIES.length} succeeded`);
  process.exit(ok === ENTRIES.length ? 0 : 1);
})();
