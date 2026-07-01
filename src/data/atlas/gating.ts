// Access-gating config for the Atlas Reader.
//
// Model (2026-06-30): REDACT, don't block. Every previewable ETLM is openly
// viewable as a SUMMARY — the shape of the landscape (asset names, sponsors,
// targets, route, approval status). The DETAILS — head-to-head efficacy/safety
// benchmarks, the pipeline read, and the so-what — are the paid layer that lives
// in the knowledge base, surfaced via a DetailHook value tease (no blur wall on
// the summary). The deep full-report route stays behind RedactionGate as the
// paid detail layer.
//
// Safety rules still encoded here:
//  1. Only PREVIEWABLE indications ship real ETLM JSON (via the sync whitelist).
//     Everything else is a LOCKED catalog card — title only, no data in the
//     bundle — so unvetted/unapproved drafts never leak.
//  2. The email form posts to Formspree when configured; otherwise it falls
//     back to a mailto: so lead capture still works on a fresh checkout.

/** Formspree endpoint for the Atlas access form. This is a public client-side
 *  endpoint (not a secret), so it lives in the committed build. Override per
 *  environment with VITE_FORMSPREE_ENDPOINT if needed. */
const ENV_ENDPOINT = (import.meta.env as Record<string, string | undefined>)
  .VITE_FORMSPREE_ENDPOINT?.trim();
export const FORMSPREE_ENDPOINT = ENV_ENDPOINT || 'https://formspree.io/f/xjgqkjnp';

/** Fallback inbox when Formspree isn't configured. */
export const ACCESS_CONTACT_EMAIL = 'katieluikakiu@gmail.com';

/** Indications whose real ETLM ships and gets a genuine free top slice.
 *  Must match `etlm_whitelist` in scripts/atlas-redaction-config.json. */
export const PREVIEWABLE_INDICATIONS = new Set<string>(['nsclc', 'obesity']);

/** ETLMs shown with FULL detail (benchmarks un-redacted, per-row drill-down,
 *  deep report open). Empty by default: under the redact-don't-block model every
 *  previewable ETLM shows a redacted summary + DetailHook, and the benchmarks are
 *  the paid layer. Add an indication code here only to deliberately open one end
 *  to end (e.g. a time-boxed showcase). Keep in sync with SELECTED_WORK in
 *  src/pages/AtlasDrugDevAnalyst.tsx. */
export const FULL_DETAIL_ETLM = new Set<string>([]);
// tpp_obesity_1L_injectable_bmi30_2026-06-05 removed 2026-06-25 — pulled pending refresh
// (staleness audit: stale efficacy bar + broken citations). Re-add when the redraft passes QC.
export const UNGATED_TPP = new Set<string>([]);
export const UNGATED_THEME = new Set<string>(['glp1_class_competitive_supply_2026-06-05']);

/** Mature drafts surfaced as locked catalog cards (no data shipped).
 *  Display names + therapeutic areas resolve via taxonomy.ts. */
export const LOCKED_INDICATIONS: string[] = [
  'nhl_dlbcl',
  'breast',
  'aml_mds',
  'crc',
  'prostate',
  'melanoma',
  'mm',
  'hcc',
  'ovarian',
  'parkinsons',
];

/** Free content height (px) before the blur-fade mask begins. */
export const PREVIEW_MAX_HEIGHT = 460;

/** localStorage key — suppresses re-prompting the form within a session.
 *  Cosmetic only: gated content stays gated whether or not this is set. */
export const ACCESS_REQUESTED_KEY = 'atlas_access_requested';
