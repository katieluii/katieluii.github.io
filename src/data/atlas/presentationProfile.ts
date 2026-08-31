// Presentation profile — the data-driven contract between an ETLM's clinical
// JSON and how the Atlas Reader renders it. The /etlm-curator skill (analysis-craft)
// emits one of these per indication so the renderer never hard-codes per-indication
// column sets or key allow-lists. If an ETLM has no `presentation_profile`, the
// renderer falls back to its therapeutic-area defaults — this is strictly additive.
//
// See ws9-etlm/ETLM_CURATOR_SPEC.md for the authoring side.

import type { ReactNode } from 'react';
import type { Column } from '../../components/atlas/briefing/DataTable';

export type ColumnSpec = {
  key: string;
  label: string;
  align?: 'left' | 'right';
  /** Where the value comes from. */
  from: 'field' | 'derive' | 'metric';
  /** `field`: dot/pipe path with fallbacks, e.g. "brand|drug_name|asset_name". */
  path?: string;
  /** `derive`: named deriver (implemented below). */
  deriver?: 'route_from_modality';
  /** `metric`: object to scan + how. */
  object?: string;        // e.g. "custom_efficacy"
  match?: string;         // case-insensitive substring on the key, e.g. "tbwl"
  pick?: 'latest_week' | 'first' | 'max' | 'min';
  /** Output formatting. */
  format?: 'pct' | 'yyyy-mm' | 'mo' | 'raw';
};

export type CollapseSpec = {
  section: string;        // e.g. "approved_therapies_legacy"
  mode: 'class_summary';
  lead: string;
  line_metric?: { object: string; match: string; pick?: ColumnSpec['pick']; format?: ColumnSpec['format'] };
};

export type CaveatSpec = {
  match_field: string;    // e.g. "indication_line"
  match_regex: string;    // case-insensitive
  tag: string;            // e.g. "rare genetic"
  why?: string;
};

export type PresentationProfile = {
  schema_version: number;
  curated_by?: string;
  cut_rationale?: string;
  headline_table?: {
    source: string;       // which array drives the table, e.g. "approved_therapies_novel"
    columns: ColumnSpec[];
    /** Optional curated ordering for the TOP_N summary slice. Each string is
     *  matched (case-insensitive substring) against brand|drug_name|asset_name;
     *  matched rows sort first, in the order listed, and everything else keeps
     *  its existing relative order. Opt-in per indication: without it the array
     *  order is used unchanged, so already-published profiles are unaffected.
     *  Exists because the source arrays are often chronological, which can push
     *  a whole modern class below the TOP_N cut (mm: all six BCMA/GPRC5D
     *  T-cell redirectors sat at index 10+). */
    order_by?: string[];
  };
  collapse?: CollapseSpec[];
  caveats?: CaveatSpec[];
  endpoint_glossary?: Record<string, string>;
};

function isObj(v: unknown): v is Record<string, unknown> {
  return Boolean(v) && typeof v === 'object' && !Array.isArray(v);
}

/** Trailing integer in a key (tbwl_pct_w68_or_72 -> 72, vs_placebo_tbwl_pct -> 0). */
function weekOf(key: string): number {
  const m = key.match(/(\d+)(?!.*\d)/);
  return m ? Number(m[1]) : 0;
}

function getField(entry: Record<string, unknown>, path: string): unknown {
  for (const p of path.split('|')) {
    const v = p.split('.').reduce<unknown>((acc, k) => (isObj(acc) ? acc[k] : undefined), entry);
    if (v != null && v !== '') return v;
  }
  return undefined;
}

function deriveRoute(modality: string): string {
  const m = modality.toLowerCase();
  if (m.includes('oral')) return 'Oral';
  if (/s\.c\.|subcutaneous|\bsc\b|inject/.test(m)) return 'S.C.';
  if (/i\.v\.|intravenous|\biv\b|infus/.test(m)) return 'I.V.';
  return '—';
}

/** Pick a numeric metric from an object by substring + strategy. */
function pickMetric(
  obj: unknown,
  match: string,
  strategy: ColumnSpec['pick'] = 'latest_week',
): number | undefined {
  if (!isObj(obj)) return undefined;
  const m = match.toLowerCase();
  const keys = Object.keys(obj).filter(
    (k) => k.toLowerCase().includes(m) && typeof obj[k] === 'number',
  );
  if (keys.length === 0) return undefined;
  if (strategy === 'first') return obj[keys[0]] as number;
  if (strategy === 'max') return Math.max(...keys.map((k) => obj[k] as number));
  if (strategy === 'min') return Math.min(...keys.map((k) => obj[k] as number));
  keys.sort((a, b) => weekOf(b) - weekOf(a)); // latest_week
  return obj[keys[0]] as number;
}

/** The KEY that pickMetric resolves to (so a state dot / provenance lookup uses the
 *  SAME endpoint the renderer displays — renderer and integrity gate can't diverge). */
export function pickMetricKey(
  obj: unknown,
  match: string,
  strategy: ColumnSpec['pick'] = 'latest_week',
): string | undefined {
  if (!isObj(obj)) return undefined;
  const m = match.toLowerCase();
  const keys = Object.keys(obj).filter(
    (k) => k.toLowerCase().includes(m) && typeof obj[k] === 'number',
  );
  if (keys.length === 0) return undefined;
  if (strategy === 'first') return keys[0];
  if (strategy === 'max') return keys.reduce((a, b) => ((obj[a] as number) >= (obj[b] as number) ? a : b));
  if (strategy === 'min') return keys.reduce((a, b) => ((obj[a] as number) <= (obj[b] as number) ? a : b));
  keys.sort((a, b) => weekOf(b) - weekOf(a)); // latest_week
  return keys[0];
}

function fmt(v: unknown, format: ColumnSpec['format']): string {
  if (v == null || v === '') return '—';
  switch (format) {
    case 'pct':
      return `${v}%`;
    case 'mo':
      return `${v} mo`;
    case 'yyyy-mm':
      return String(v).slice(0, 7);
    default:
      return String(v);
  }
}

export type ResolvedCell = { display: ReactNode; sort: string | number };

/** Build DataTable Column[] from a profile's headline columns. */
export function profileColumns(profile: PresentationProfile): Column[] {
  const cols = profile.headline_table?.columns ?? [];
  return cols.map((c) => ({ key: c.key, label: c.label, align: c.align }));
}

/** Resolve one entry into per-column { display, sort } values. */
export function resolveEntry(
  profile: PresentationProfile,
  entry: Record<string, unknown>,
): Record<string, ResolvedCell> {
  const out: Record<string, ResolvedCell> = {};
  for (const c of profile.headline_table?.columns ?? []) {
    let raw: unknown;
    if (c.from === 'field') {
      raw = c.path ? getField(entry, c.path) : undefined;
    } else if (c.from === 'derive' && c.deriver === 'route_from_modality') {
      raw = deriveRoute(String(entry.modality ?? ''));
    } else if (c.from === 'metric' && c.object) {
      raw = pickMetric(entry[c.object], c.match ?? '', c.pick);
    }
    const display = fmt(raw, c.format);
    const sort =
      typeof raw === 'number' ? raw : typeof raw === 'string' ? raw.toLowerCase() : '';
    out[c.key] = { display, sort };
  }
  return out;
}

/** First matching caveat tag for an entry (e.g. "rare genetic"). */
export function entryCaveat(
  profile: PresentationProfile,
  entry: Record<string, unknown>,
): CaveatSpec | undefined {
  for (const cav of profile.caveats ?? []) {
    const field = String(getField(entry, cav.match_field) ?? '');
    if (field && new RegExp(cav.match_regex, 'i').test(field)) return cav;
  }
  return undefined;
}

/** Single-line metric for a collapsed legacy row. */
export function collapseLineMetric(
  spec: CollapseSpec,
  entry: Record<string, unknown>,
): string {
  if (!spec.line_metric) return '—';
  const v = pickMetric(entry[spec.line_metric.object], spec.line_metric.match, spec.line_metric.pick);
  return v != null ? fmt(v, spec.line_metric.format ?? 'pct') : '—';
}

export function getProfile(etlm: Record<string, unknown>): PresentationProfile | null {
  const p = etlm.presentation_profile;
  return isObj(p) && typeof p.schema_version === 'number' ? (p as PresentationProfile) : null;
}

/**
 * Render one element of an ETLM list field as a single readable line.
 *
 * Analysts write these lists in two shapes and BOTH are correct. Most ETLMs use
 * prose strings ("High-risk cytogenetics single hit: ~25-30% (del17p, …)");
 * urothelial uses structured objects that carry the same facts in named fields
 * ({segment, prevalence_pct, notes}). The renderers used to call String() on the
 * element, which turned every object into "[object Object]" — the exact failure
 * the presentation_profile layer exists to prevent: a hard-coded React assumption
 * silently destroying correctly-keyed analyst data.
 *
 * Structured is the better shape, so this formats it rather than asking the
 * analyst to flatten back to prose. Shape-agnostic by design: it walks the
 * object's own key order instead of naming fields, so a list that gains a new
 * key renders without a code change. First scalar is the label; the rest follow,
 * separated by , . A *_pct key gets its unit back, since "75" alone is not a
 * prevalence.
 *
 * Field NAMES are deliberately not emitted. This is the formatter for a BULLET
 * IN A LIST OF PEER ITEMS, where every bullet repeats the same keys, so the keys
 * are schema plumbing and only the values are content. It is NOT the formatter
 * for a labelled key→value readout, where the key is the reader's only handle on
 * which fact they are looking at — see humanizeValue() in ETLMSections.tsx, which
 * owns that role and keeps its labels.
 *
 * Nested containers RECURSE rather than being dropped. The earlier version
 * skipped any object/array value, which was safe while it only ever saw flat
 * two- and three-key objects, but it silently deletes analyst text the moment a
 * list element gains a nested key — so it recurses to a bounded depth instead.
 * Nested levels omit the em-dash label break (there is only one label, at the
 * top). Provenance/bookkeeping keys (`*_source`, `source`, `sources`, `*_id`,
 * `id`, `ids`) stay excluded at every level: a bare URL run-in is not readable
 * prose, and `sources` arrays have their own renderer (SourceLinks).
 *
 * `depth` is intentionally NOT part of the exported signature — `arr.map(listItemText)`
 * would otherwise feed the array index in as the depth and format element 0
 * differently from element 5.
 */
const LIST_ITEM_SKIP_KEY = /_source$|^sources?$|_id$|^id$|^ids$/i;
const LIST_ITEM_MAX_DEPTH = 3;

function listItemWalk(v: unknown, depth: number): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (Array.isArray(v)) {
    return v.map((x) => listItemWalk(x, depth + 1)).filter(Boolean).join(' , ');
  }
  if (!isObj(v)) return String(v);

  const parts: string[] = [];
  for (const [k, raw] of Object.entries(v)) {
    if (raw === null || raw === undefined || raw === '') continue;
    if (LIST_ITEM_SKIP_KEY.test(k)) continue;       // provenance/bookkeeping
    if (typeof raw === 'object') {                  // nested — flatten, don't drop
      if (depth >= LIST_ITEM_MAX_DEPTH) continue;
      const nested = listItemWalk(raw, depth + 1);
      if (nested) parts.push(nested);
      continue;
    }
    const val = /_pct$/i.test(k) ? `${raw}%` : String(raw);
    parts.push(val);
  }
  if (parts.length === 0) return '';
  // One separator throughout, and it is NOT an em-dash. The first version used
  // ' — ' between the label and the rest, which collided with the analysts' own
  // em-dashes: 5 values already contain one, so 8 bullets ended up with two or
  // more and the field boundary became indistinguishable from punctuation
  // ("AstraZeneca — Durvalumab perioperative MIBC (NIAGARA …) — now CO-LEADER …").
  // ' , ' collides with nothing in the corpus.
  return parts.join(' , ');
}

export function listItemText(v: unknown): string {
  return listItemWalk(v, 0);
}
