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

export const etlmSummaries: Record<string, EtlmSummary> = {};

export function getEtlmSummary(code: string): EtlmSummary | undefined {
  return etlmSummaries[code];
}
