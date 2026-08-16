// Access-gating config for the Atlas Reader.
//
// Model (2026-07-19): OPEN for traction. The email/lead-capture wall is OFF
// (ACCESS_WALL_ENABLED = false) — every published deliverable (summary + deep
// report) is fully viewable with no email required. The gate UI is retained
// behind the flag so it can be restored in one line.
//
// TWO independent layers — do not conflate:
//  1. UI/signup wall (this file, ACCESS_WALL_ENABLED). Currently OFF. Pure
//     lead-capture friction; toggling it never changes WHAT data ships.
//  2. QC/data-publish gate (scripts/atlas-redaction-config.json + the sync).
//     This decides which drafts ship at all (etlm_whitelist = nsclc, obesity)
//     and strips internal keys/notes. Unvetted/unapproved drafts never enter
//     the bundle — so they can't leak regardless of the wall.

/** Master switch for the email/lead-capture access wall.
 *  Set false 2026-07-19 (Katie) to open pipelines + reports for traction — no
 *  email signup required to view. When false: RedactionGate passes through, the
 *  DetailHook email tease becomes an open "read the full report" CTA, and locked
 *  catalog cards render as a non-interactive "In draft" chip (no email modal).
 *  Flip back to true to restore the full gate. NOTE: this is the UI/signup wall
 *  only — it does NOT publish drafts that aren't in the sync whitelist. */
export const ACCESS_WALL_ENABLED = false;

/** Formspree endpoint for the Atlas access form. Env-only: with the wall off the
 *  form isn't shown, so no token ships in the public bundle. Set
 *  VITE_FORMSPREE_ENDPOINT to re-enable server capture; otherwise the form falls
 *  back to a mailto. (The old hardcoded token was retired 2026-07-19 — rotate it
 *  in the Formspree dashboard and enable its captcha/honeypot before reusing.) */
const ENV_ENDPOINT = (import.meta.env as Record<string, string | undefined>)
  .VITE_FORMSPREE_ENDPOINT?.trim();
export const FORMSPREE_ENDPOINT = ENV_ENDPOINT || '';

/** Fallback inbox when Formspree isn't configured. */
export const ACCESS_CONTACT_EMAIL = 'katie@renascor.xyz';

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
  'breast',
  'aml_mds',
  'prostate',
  'melanoma',
  'hcc',
  'ovarian',
  'parkinsons',
];

/** Free content height (px) before the blur-fade mask begins. */
export const PREVIEW_MAX_HEIGHT = 460;

/** localStorage key — suppresses re-prompting the form within a session.
 *  Cosmetic only: gated content stays gated whether or not this is set. */
export const ACCESS_REQUESTED_KEY = 'atlas_access_requested';
