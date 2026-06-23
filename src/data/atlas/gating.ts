// Access-gating config for the Atlas Reader.
//
// The reader shows a free top slice of each deliverable, then blurs the rest
// behind an email-capture access gate (see components/atlas/AccessGate.tsx).
//
// Two safety rules encoded here:
//  1. Only PREVIEWABLE indications ship real ETLM JSON (via the sync whitelist).
//     Everything else is a LOCKED catalog card — title only, no data in the
//     bundle — so unvetted/unapproved drafts never leak through a blurred div.
//  2. The email form posts to Formspree when configured; otherwise it falls
//     back to a mailto: so the gate still works on a fresh checkout.

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

/** Showcase samples linked from the portfolio "Selected work" — fully OPEN,
 *  no gate, so a prospect can read one complete deliverable end to end.
 *  Keep in sync with SELECTED_WORK in src/pages/AtlasDrugDevAnalyst.tsx. */
export const UNGATED_ETLM = new Set<string>(['obesity']);
export const UNGATED_TPP = new Set<string>(['tpp_obesity_1L_injectable_bmi30_2026-06-05']);
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
