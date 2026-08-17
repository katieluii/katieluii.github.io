// Label formatter — turns an ETLM *schema key* into a human heading.
//
// Sibling of `listItemText` in presentationProfile.ts: that one formats a VALUE
// (an analyst-written list element) for display; this one formats a KEY. Every
// renderer that shows a schema key to a reader calls this and nothing else, so
// the casing rule lives in exactly one place.
//
// THE RULE (chosen so it CANNOT damage a real clinical token)
//   1. Underscores become spaces; whitespace collapses.
//   2. A token containing ANY uppercase letter is emitted byte-identical. The
//      analyst cased it deliberately, and it is usually the load-bearing part of
//      the label: NMIBC, MIBC, FGFR3, HER2, PD-L1, T-DXd, BCG, UTUC, ADC, IL-15,
//      mAb, ctDNA, KRAS, G12C, 1L, 2L+, R/R, R-CHOP, POLARIX, ZUMA-7, mUC.
//   3. A fully-lowercase token that is a known acronym/identifier renders in its
//      canonical form (CANONICAL below). Every entry is a CASE-ONLY variant of
//      the same characters — the map never inserts, drops, or reorders a
//      character, so no text can be lost or invented.
//   4. Otherwise only the FIRST word is touched, and only its first character,
//      and only when that character is a lowercase ASCII letter. So this is
//      SENTENCE case, not title case:
//        * it matches the reader's hard-coded headings ("Competitive dynamics",
//          "Unmet needs", "Efficacy benchmarks"),
//        * mid-label words are never re-cased, which is what keeps generic drug
//          names (INN convention = lowercase: belantamab, venetoclax,
//          retatrutide, ivonescimab) and gene/mutation symbols intact,
//        * connecting words (of, and, by, vs, per, to …) stay lowercase for
//          free — they are never in first position except in a fragment like
//          "by_line", which STOPWORDS keeps lowercase so the caller's sentence
//          ("Organised by line") still reads correctly.
//
// So the total mutation surface of this function is: one word per label, only
// when it is fully lowercase, plus the CANONICAL substitutions. Both are
// enumerable — and were enumerated against all six shipped ETLM JSONs before
// this shipped.
//
// CANONICAL was DERIVED, not invented: for each fully-lowercase token that
// reaches a label site, the six ETLM JSONs were scanned for the same token
// written with uppercase letters, and the corpus's own dominant casing was
// adopted. Two attested-looking candidates were rejected on inspection and are
// listed at the bottom — read that note before adding an entry.

/** Leading connectives that must not be capitalized (the label is a fragment). */
const STOPWORDS = new Set([
  'a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'from', 'in', 'nor',
  'of', 'on', 'or', 'per', 'the', 'to', 'via', 'vs', 'with',
]);

/** Fully-lowercase token -> its canonical casing. CASE-ONLY by construction:
 *  `key.toLowerCase() === value.toLowerCase()` must hold for every entry. */
// SPELLING — the ONLY place labelText may change a token's characters rather than
// just its case. Kept strictly separate from CANONICAL so the case-only invariant
// there stays provable (759 corpus keys, 0 violations): mixing a hyphen-inserting
// entry into CANONICAL would quietly destroy the property that makes the casing
// rule safe to trust.
//
// One entry, and it exists because routing themeShortLabel() through this function
// otherwise regressed "GLP-1 class competitive supply" to "GLP1 …". The corpus
// spells the class GLP-1 everywhere it is written by hand; only the slug elides the
// hyphen. Add here only for a token whose corpus spelling genuinely differs from
// its slug form, and say why.
const SPELLING = new Map<string, string>([
  ['glp1', 'GLP-1'],
]);

const CANONICAL = new Map<string, string>([
  // Endpoints / measures
  ['orr', 'ORR'], ['os', 'OS'], ['pfs', 'PFS'], ['efs', 'EFS'], ['dor', 'DOR'],
  ['cr', 'CR'], ['mrd', 'MRD'], ['hr', 'HR'], ['tbwl', 'TBWL'], ['ae', 'AE'],
  ['aes', 'AEs'], ['mace', 'MACE'], ['itt', 'ITT'], ['h2h', 'H2H'],
  ['hba1c', 'HbA1c'], ['bmi', 'BMI'], ['gi', 'GI'], ['cv', 'CV'],
  // Targets / genes / mutations / modalities
  ['egfr', 'EGFR'], ['kras', 'KRAS'], ['ros1', 'ROS1'], ['g2032r', 'G2032R'],
  ['btk', 'BTK'], ['jak', 'JAK'], ['bcma', 'BCMA'], ['cd38', 'CD38'],
  ['vegf', 'VEGF'], ['pd1', 'PD1'], ['glp1', 'GLP1'], ['glp1gip', 'GLP1GIP'],
  ['mc4r', 'MC4R'], ['lepr', 'LEPR'], ['pomc', 'POMC'], ['adc', 'ADC'],
  ['tpd', 'TPD'], ['tki', 'TKI'], ['io', 'IO'], ['cart', 'CART'],
  ['mrna', 'mRNA'], ['rlt', 'RLT'], ['soc', 'SOC'], ['ici', 'ICI'],
  ['cdx', 'CDx'], ['ph2', 'Ph2'], ['ph3', 'Ph3'], ['p3', 'P3'], ['rx', 'Rx'],
  // Diseases / populations / staging
  ['nsclc', 'NSCLC'], ['mash', 'MASH'], ['osa', 'OSA'], ['t2d', 'T2D'],
  ['bbs', 'BBS'], ['la', 'LA'], ['2l', '2L'], ['crc', 'CRC'],
  ['dlbcl', 'DLBCL'], ['rrmm', 'RRMM'], ['nmibc', 'NMIBC'], ['mibc', 'MIBC'],
  ['muc', 'mUC'], ['utuc', 'UTUC'],
  // Targets, biomarkers and named agents that are ALWAYS cased in this corpus.
  // Present so a key written fully lowercase by a future analyst still renders
  // the token correctly — "Her2" / "Nmibc" would be a defect, not a heading.
  ['her2', 'HER2'], ['erbb2', 'ERBB2'], ['fgfr3', 'FGFR3'], ['trop2', 'TROP2'],
  ['ctdna', 'ctDNA'], ['mab', 'mAb'], ['il-15', 'IL-15'], ['t-dxd', 'T-DXd'],
  ['sac-tmt', 'sac-TMT'], ['moa', 'MoA'], ['bcg', 'BCG'], ['ev', 'EV'],
  ['alk', 'ALK'], ['ret', 'RET'], ['g12c', 'G12C'], ['pd-1', 'PD-1'],
  ['pd-l1', 'PD-L1'], ['pdl1', 'PDL1'], ['ev+pembro', 'EV+pembro'],
  // Regulatory / commercial / provenance
  ['fda', 'FDA'], ['nda', 'NDA'], ['bla', 'BLA'], ['pdufa', 'PDUFA'],
  ['aa', 'AA'], ['ira', 'IRA'], ['pbm', 'PBM'], ['us', 'US'],
  ['nct', 'NCT'], ['pmid', 'PMID'], ['lte', 'LTE'],
  // Named acts / trials / conferences the corpus writes in a fixed form
  ['coins', 'COINS'], ['biosecure', 'BIOSECURE'], ['harmoni', 'HARMONi'],
  ['ada26', 'ADA26'], ['asco2026', 'ASCO2026'], ['evoke03', 'EVOKE03'],
  ['surmount5', 'SURMOUNT5'], ['redefine1', 'REDEFINE1'],
  // Companies, geos and brand names (generic INN drug names are deliberately
  // ABSENT — lowercase is their correct form, e.g. belantamab, venetoclax)
  ['az', 'AZ'], ['gsk', 'GSK'], ['wuxi', 'WuXi'], ['china', 'China'],
  ['nuvalent', 'Nuvalent'], ['innovent', 'Innovent'], ['dizal', 'Dizal'],
  ['wegovy', 'Wegovy'], ['zegfrovy', 'Zegfrovy'], ['zynlonta', 'Zynlonta'],
  ['cagrisema', 'CagriSema'],
  // Internal identifiers
  ['etlm', 'ETLM'], ['ws13', 'WS13'],
]);

// REJECTED on inspection — do not add these back without re-checking context:
//   'cis'  -> "CIS": ambiguous. "cis_eligible"/"cis_ineligible" mean CISPLATIN
//             (lowercase), while carcinoma in situ is already written "CIS".
//   'met'  -> "MET": the only lowercase 'met' at a label site is
//             "primary_endpoint_met" — the English verb, not the gene.
//   All-caps English words harvested from shouted enum values (NO, AND, WITH,
//   NOTE, DATE, FIRST, HIGH, PRIMARY, WATCH, PENDING, POSITIVE, SPONSOR,
//   EFFICACY, COMBINATION, MONOtherapy …) — evidence of shouting, not casing.

/**
 * Format an ETLM schema key as a reader-facing heading/label.
 * `dominant_companies` -> "Dominant companies"
 * `kras_adc_watch_note` -> "KRAS ADC watch note"
 * `NMIBC_BCG_unresponsive_CIS` -> "NMIBC BCG unresponsive CIS"  (untouched)
 */
export function labelText(key: string): string {
  const spaced = String(key).replace(/_+/g, ' ').replace(/\s+/g, ' ').trim();
  if (!spaced) return spaced;
  return spaced
    .split(' ')
    .map((word, i) => {
      if (/[A-Z]/.test(word)) return word;              // deliberately cased
      const spelled = SPELLING.get(word);                // corpus spelling wins
      if (spelled) return spelled;
      const canon = CANONICAL.get(word);
      if (canon) return canon;
      if (i > 0) return word;                           // mid-label: untouched
      if (STOPWORDS.has(word)) return word;             // leading connective
      if (!/^[a-z]/.test(word)) return word;            // starts with digit/symbol
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}
