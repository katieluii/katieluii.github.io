import { labelText } from './labelText';
// Therapeutic-area → indication taxonomy for the Atlas Reader information
// hierarchy. The synced ETLM JSON carries `therapeutic_area` only sometimes and
// inconsistently, so this map is the source of truth for grouping.

export type TherapeuticArea =
  | 'Oncology'
  | 'Metabolic'
  | 'Neurology'
  | 'Autoimmune and Inflammation'
  | 'Other';

/** Display order of therapeutic-area sections on the landing page. */
export const TA_ORDER: TherapeuticArea[] = [
  'Oncology',
  'Metabolic',
  'Neurology',
  'Autoimmune and Inflammation',
  'Other',
];

/** indication_code → therapeutic area. */
const INDICATION_TA: Record<string, TherapeuticArea> = {
  nsclc: 'Oncology',
  sclc: 'Oncology',
  breast: 'Oncology',
  crc: 'Oncology',
  nhl_dlbcl: 'Oncology',
  mm: 'Oncology',
  aml_mds: 'Oncology',
  prostate: 'Oncology',
  ovarian: 'Oncology',
  pdac: 'Oncology',
  hcc: 'Oncology',
  gbm: 'Oncology',
  melanoma: 'Oncology',
  thyroid: 'Oncology',
  urothelial: 'Oncology',
  obesity: 'Metabolic',
  mash: 'Metabolic',
  t1d: 'Metabolic',
  parkinsons: 'Neurology',
  alzheimers: 'Neurology',
  treatment_resistant_depression: 'Neurology',
  ms: 'Neurology',
  als: 'Neurology',
  rheumatoid_arthritis: 'Autoimmune and Inflammation',
  psoriasis: 'Autoimmune and Inflammation',
  ulcerative_colitis: 'Autoimmune and Inflammation',
  sle: 'Autoimmune and Inflammation',
  atopic_dermatitis: 'Autoimmune and Inflammation',
};

/** indication_code → short display name (used when no ETLM provides one). */
export const INDICATION_DISPLAY: Record<string, string> = {
  nsclc: 'NSCLC',
  sclc: 'SCLC',
  breast: 'Breast',
  crc: 'Colorectal',
  nhl_dlbcl: 'NHL / DLBCL',
  mm: 'Multiple Myeloma',
  aml_mds: 'AML / MDS',
  prostate: 'Prostate',
  ovarian: 'Ovarian',
  pdac: 'Pancreatic (PDAC)',
  hcc: 'Hepatocellular (HCC)',
  gbm: 'Glioblastoma',
  melanoma: 'Melanoma',
  thyroid: 'Thyroid',
  urothelial: 'Urothelial',
  obesity: 'Obesity',
  mash: 'MASH',
  t1d: 'Type 1 diabetes',
  parkinsons: "Parkinson's",
  alzheimers: "Alzheimer's",
  treatment_resistant_depression: 'Treatment-resistant depression',
  ms: 'Multiple sclerosis',
  als: 'ALS',
  rheumatoid_arthritis: 'Rheumatoid arthritis',
  psoriasis: 'Psoriasis',
  ulcerative_colitis: 'Ulcerative colitis',
  sle: 'Systemic lupus erythematosus',
  atopic_dermatitis: 'Atopic dermatitis',
};

/** Theme slug prefix → therapeutic area (overrides indication-derived TA). */
const THEME_TA: { match: RegExp; ta: TherapeuticArea }[] = [
  { match: /^adc_/, ta: 'Oncology' },
  { match: /^kras_/, ta: 'Oncology' },
  { match: /^glp1_/, ta: 'Metabolic' },
];

export function taForIndication(code?: string): TherapeuticArea {
  return (code && INDICATION_TA[code]) || 'Other';
}

export function indicationDisplay(code?: string, fallback?: string): string {
  if (code && INDICATION_DISPLAY[code]) return INDICATION_DISPLAY[code];
  return fallback ?? (code ? code.toUpperCase() : 'Unknown');
}

/** Theme TA: explicit prefix map first, else derived from touched indications. */
export function taForTheme(slug: string, indicationsTouched?: string[]): TherapeuticArea {
  for (const { match, ta } of THEME_TA) if (match.test(slug)) return ta;
  for (const code of indicationsTouched ?? []) {
    const ta = taForIndication(code);
    if (ta !== 'Other') return ta;
  }
  return 'Other';
}

/** Clean short label for a theme from its slug (strips trailing date). */
export function themeShortLabel(slug: string): string {
  // Routed through the shared labelText() rather than keeping a private 3-entry
  // acronym map and naive title case. It rendered "Adc Class State" in TITLE case
  // beside labelText's sentence case on the same page, and its map knew only
  // adc/kras/glp1 — labelText's is derived from the corpus and has 112 entries.
  return labelText(slug.replace(/_\d{4}-\d{2}-\d{2}$/, ''));
}
