// Therapeutic-area → indication taxonomy for the Atlas Reader information
// hierarchy. The synced ETLM JSON carries `therapeutic_area` only sometimes and
// inconsistently, so this map is the source of truth for grouping.

export type TherapeuticArea = 'Oncology' | 'Metabolic' | 'Neurology' | 'Other';

/** Display order of therapeutic-area sections on the landing page. */
export const TA_ORDER: TherapeuticArea[] = ['Oncology', 'Metabolic', 'Neurology', 'Other'];

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
  parkinsons: 'Neurology',
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
  parkinsons: "Parkinson's",
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
  const base = slug.replace(/_\d{4}-\d{2}-\d{2}$/, '');
  return base
    .split('_')
    .map((w) => {
      const u = w.toLowerCase();
      if (u === 'adc') return 'ADC';
      if (u === 'kras') return 'KRAS';
      if (u === 'glp1') return 'GLP-1';
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join(' ');
}
