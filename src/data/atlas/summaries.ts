// Sync-safe SUMMARY OVERLAY for Atlas briefings.
//
// The synced artifact files (etlm/*.json, tpp/*.md, theme/*.md) are OVERWRITTEN on
// every `scripts/sync-atlas-content.py` run, so the briefing summary layer
// (verdict / key facts / key takeaways) lives here instead, keyed by artifact id.
//
// These are HAND-DERIVED DRAFTS from the existing body — refine the clinical
// framing where marked TODO(human). Where no entry exists for an artifact, the
// viewer derives a graceful fallback from the body (see AtlasReaderTPP):
//   - verdict      ← first sentence of "## TPP summary — the brief" / preamble
//   - keyTakeaways ← bolded lead clauses of the unmet-need bullets
//   - topUnmetNeeds← unmet-need bullets (default severity)
//
// TODO(upstream): once WS12 emits a summary block in the source markdown, teach
// the sync script to carry it through and merge it here.

import type { Severity } from '../../components/atlas/briefing/SeverityTag';
import type { KeyFact } from '../../components/atlas/briefing/KeyFactsStrip';
import type { Takeaway } from '../../components/atlas/briefing/KeyTakeaways';

export type UnmetNeed = { need: string; severity: Severity; note?: string };

export type ArtifactSummary = {
  verdict: string;
  keyFacts: KeyFact[]; // 2–5
  keyTakeaways: Takeaway[]; // ≤5
  topUnmetNeeds?: UnmetNeed[]; // top 3 surfaced on the briefing
};

export const tppSummaries: Record<string, ArtifactSummary> = {
  // Reference pattern — fully drafted. TODO(human): confirm market-size + bar framing.
  tpp_nsclc_1L_bispecific_vs_pd1chemo_2026_06_05: {
    verdict:
      'A new 1L all-comer NSCLC bispecific must beat pembrolizumab+chemotherapy on OS (HR ≤0.75, mOS ≥30 mo) in a globally enrolled Phase 3 — not merely beat PD-1 monotherapy as ivonescimab did.',
    keyFacts: [
      { label: '1L driver-neg NSCLC', value: '~140k/yr', note: 'US + EU incidence' },
      { label: 'SoC mOS (pembro+chemo)', value: '23–26 mo', note: '5-yr OS ~19%' },
      { label: 'OS bar to clear', value: 'HR ≤0.75', note: '≤0.70 = step-change' },
      { label: 'Class anchor (ivonescimab)', value: 'HR 0.66', note: 'vs PD-1 alone, China-enrolled' },
      { label: 'US peak revenue', value: '$3–5B', note: 'this segment alone' },
    ],
    keyTakeaways: [
      {
        lead: 'The bar is OS vs chemo-IO, not PD-1 alone',
        rest: 'FDA will require pembrolizumab+platinum as the comparator; ivonescimab beat only PD-1 monotherapy, so the head-to-head vs the full standard is undemonstrated.',
      },
      {
        lead: 'Ivonescimab sets class proof-of-concept (OS HR 0.66)',
        rest: 'but China-only enrollment leaves Western generalisability unconfirmed.',
      },
      {
        lead: 'A COINS Act / BIOSECURE overhang could block the Akeso/Summit US path',
        rest: 'creating structural white space for a Western-manufactured PD-1×VEGF or dual-checkpoint bispecific.',
      },
      {
        lead: 'The highest-value design is chemo-free',
        rest: 'bispecific alone vs pembro+chemo in PD-L1-unselected patients — differentiated from both ivonescimab and the chemo-IO standard at once.',
      },
      {
        lead: 'STK11/KEAP1-mutant (~20% non-squamous) is unaddressed',
        rest: 'no approved or Phase 3 bispecific shows OS benefit in this primary IO-resistance cohort.',
      },
    ],
    topUnmetNeeds: [
      {
        need: 'Efficacy plateau in driver-negative all-comers',
        severity: 'Critical',
        note: '60–70% progress within 12 months; 5-yr OS only ~19%.',
      },
      {
        need: 'STK11/KEAP1 co-mutation drives IO resistance',
        severity: 'Critical',
        note: '~20% of non-squamous; mOS ~6–8 mo on current IO+chemo.',
      },
      {
        need: 'Squamous NSCLC underserved beyond KEYNOTE-407',
        severity: 'High',
        note: '~25–30% of NSCLC; 5-yr OS 18.4%, few targeted options.',
      },
    ],
  },
};

/** Look up a TPP summary; slug dots/dashes are normalised to match keys. */
export function getTppSummary(slug: string): ArtifactSummary | undefined {
  return tppSummaries[slug] ?? tppSummaries[slug.replace(/[-.]/g, '_')];
}

// --- ETLM overlay --------------------------------------------------------------
// Key facts + unmet needs derive automatically from the ETLM JSON; only the
// one-line verdict and the standard-of-care anchor assets are authored here.
// TODO(human): refine verdicts; add anchorAssets per new indication.

export type EtlmSummary = {
  verdict: string;
  /** Brand/drug names to highlight as SoC anchor rows in the therapies table. */
  anchorAssets?: string[];
};

export const etlmSummaries: Record<string, EtlmSummary> = {
  nsclc: {
    verdict:
      'A mature, molecularly-segmented market: 1L is locked by chemo-IO and driver-targeted TKIs — the open battlegrounds are post-osimertinib EGFR resistance, KRAS-mutant durability, and the PD-1×VEGF bispecific challenge to the chemo-IO standard.',
    anchorAssets: ['keytruda', 'pembrolizumab', 'tagrisso', 'osimertinib'],
  },
  obesity: {
    verdict:
      'An incretin-defined market racing up the efficacy curve: semaglutide and tirzepatide anchor today, while the open questions are the Phase-3 tolerability ceiling, oral access, and whether triple-G agonists reset the bar.',
    anchorAssets: ['wegovy', 'semaglutide', 'zepbound', 'tirzepatide', 'mounjaro', 'ozempic'],
  },
};

export function getEtlmSummary(code: string): EtlmSummary | undefined {
  return etlmSummaries[code];
}
