// The ONE resolver. Both the SoC renderer and the build-integrity gate classify
// endpoint state through these functions, so the "what state ships" decision can
// never diverge between what the user sees and what the gate checks.
//
// Runs on the SYNCED client JSON (post-strip). It does NOT depend on editor-only
// fields (endpoint_sources_gaps / source_note are stripped): state is derived from
// endpoint_provenance + citation presence. If those editor fields ARE present
// (e.g. running the gate against a WS9 draft), they tighten the result.

import type { AssetSoc, EndpointState, ExclusivityStatus, IndicationClass, Jurisdiction, ProvenanceView } from './types';

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);

function firstProvEntry(asset: Obj, key: string): Obj | undefined {
  const ep = isObj(asset.endpoint_provenance) ? asset.endpoint_provenance : undefined;
  const arr = ep && Array.isArray((ep as Obj)[key]) ? ((ep as Obj)[key] as unknown[]) : undefined;
  const first = arr?.find(isObj) as Obj | undefined;
  return first;
}

function assetHasCitation(asset: Obj): boolean {
  if (Array.isArray(asset.sources) && asset.sources.length > 0) return true;
  if (typeof asset.nct === 'string' && asset.nct) return true;
  if (typeof asset.trial === 'string' && asset.trial) return true;
  if (typeof asset.source === 'string' && asset.source) return true;
  return false;
}

/** Derive the shippable verification state for one numeric endpoint key. */
export function classifyEndpoint(asset: Obj, key: string): EndpointState {
  const entry = firstProvEntry(asset, key);
  if (entry) {
    const secondary = entry.verification === 'secondary';
    if (entry.value_verified === true && !secondary) {
      return { verification: 'verified-primary', secondary: false, caveats: [], shippable: true };
    }
    return { verification: 'sourced-unverified', secondary, caveats: [], shippable: true };
  }
  // No provenance for this key. Editor-only gap list (present only in WS9 drafts):
  const gaps = Array.isArray(asset.endpoint_sources_gaps) ? (asset.endpoint_sources_gaps as unknown[]) : [];
  const gapped = gaps.includes(key);
  const cited = assetHasCitation(asset);
  if (gapped) {
    // editor explicitly could not source this number
    return cited
      ? { verification: 'needs-verification', secondary: false, caveats: [], shippable: false }
      : { verification: 'placeholder', secondary: false, caveats: [], shippable: false };
  }
  // Not gapped: a cited-but-unverified number is honest amber; an uncited scalar is a placeholder (must not ship).
  return cited
    ? { verification: 'sourced-unverified', secondary: false, caveats: [], shippable: true }
    : { verification: 'placeholder', secondary: false, caveats: [], shippable: false };
}

/** Provenance payload for the T1 tooltip (first entry for the key). */
export function provenanceView(asset: Obj, key: string): ProvenanceView | undefined {
  const entry = firstProvEntry(asset, key);
  if (!entry) return undefined;
  const sources = Array.isArray(asset.sources) ? (asset.sources.filter(isObj) as Obj[]) : [];
  const src = sources.find((s) => String(s.id) === String(entry.source_id));
  return {
    sourceId: entry.source_id as string | undefined,
    quotedMetric: entry.quoted_metric as string | undefined,
    location: entry.location as string | undefined,
    estimand: entry.estimand as string | undefined,
    verifiedOn: entry.verified_on as string | undefined,
    url: src?.url as string | undefined,
    type: src?.type as string | undefined,
    label: src?.label as string | undefined,
  };
}

// ---- SoC overlay resolution (indicationClass / exclusivity), fail-closed ----

export function resolveSoc(asset: Obj, overlay: AssetSoc[]): AssetSoc | undefined {
  const drug = String(asset.drug_name ?? '').toLowerCase();
  const brand = String(asset.brand ?? '').toLowerCase();
  return overlay.find(
    (o) =>
      (o.matchDrug && drug.includes(o.matchDrug.toLowerCase())) ||
      (o.matchBrand && brand.includes(o.matchBrand.toLowerCase())),
  );
}

export function indicationClassOf(asset: Obj, overlay: AssetSoc[]): IndicationClass {
  return resolveSoc(asset, overlay)?.indicationClass ?? 'unclassified'; // fail-closed
}

/** rare-genetic and unclassified are excluded from the ranked comparison. */
export function isRankable(cls: IndicationClass): boolean {
  return cls !== 'rare-genetic' && cls !== 'unclassified';
}

export function exclusivityOf(
  asset: Obj,
  overlay: AssetSoc[],
  jurisdiction: Jurisdiction = 'US',
): ExclusivityStatus {
  return resolveSoc(asset, overlay)?.exclusivity?.[jurisdiction] ?? 'status-unconfirmed'; // fail-closed
}

/** Stable id for a row — never positional. */
export function assetId(asset: Obj, overlay: AssetSoc[]): string {
  const soc = resolveSoc(asset, overlay);
  if (soc) return soc.id;
  const base = String(asset.drug_name ?? asset.brand ?? asset.asset_name ?? 'asset');
  return base.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
