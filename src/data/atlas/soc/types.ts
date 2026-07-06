// Standard-of-Care anchor table — shared types.
// The full record is the ETLM JSON (WS9 truth, synced); these types describe the
// SoC-only overlay (repo-owned sidecar) + the derived per-endpoint state that both
// the renderer and the build-time integrity gate consume from ONE code path.

export type IndicationClass =
  | 'general-obesity'
  | 'obesity+T2D'
  | 'rare-genetic'
  | 'pediatric'
  | 'unclassified'; // fail-closed default: excluded from ranking + visibly marked

export type Jurisdiction = 'US' | 'EU';

export type ExclusivityStatus =
  | 'novel-pre-LOE' // on-patent, no generic/biosimilar in this jurisdiction
  | 'generic-available'
  | 'biosimilar-available'
  | 'status-unconfirmed'; // fail-closed default: assert no competitive claim

// Provenance / verification axis (Axis A). Only the first two ship to the site.
export type Verification =
  | 'verified-primary' // figure seen in the authoritative source; value_verified===true
  | 'sourced-unverified' // has a citation but not primary-verified (incl. secondary-corroborated)
  | 'needs-verification' // explicitly flagged; MUST NOT ship (build gate = RED)
  | 'placeholder'; // no real source at all; MUST NOT ship (build gate = RED)

// Value caveats (Axis B) — orthogonal to verification.
export type Caveat = 'corrected' | 'pooling-caveat' | 'comparability-caveat' | 'source-conflict';

export interface EndpointState {
  verification: Verification;
  secondary: boolean; // sourced-unverified via >=2 corroborating sources (renders "~")
  caveats: Caveat[];
  /** True when this state is allowed on the shipped site (green or amber). */
  shippable: boolean;
}

export interface ProvenanceView {
  sourceId?: string;
  quotedMetric?: string;
  location?: string;
  estimand?: string;
  verifiedOn?: string;
  url?: string;
  type?: string;
  label?: string;
}

/** Repo-owned SoC overlay for one asset. Never lives in the synced ETLM JSON
 *  (a WS9 re-sync would clobber it); matched to the ETLM asset by drug/brand. */
export interface AssetSoc {
  id: string; // stable id (never positional)
  matchDrug?: string; // case-insensitive substring of drug_name
  matchBrand?: string; // case-insensitive substring of brand
  indicationClass: IndicationClass;
  /** Jurisdiction-keyed; the site renders its canonical jurisdiction only. */
  exclusivity: Partial<Record<Jurisdiction, ExclusivityStatus>>;
}
