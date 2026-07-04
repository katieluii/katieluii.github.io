// Repo-owned SoC overlay for obesity. Authored here (NOT in the synced ETLM JSON)
// so a WS9 re-sync can never clobber it. indicationClass drives ranking exclusion;
// exclusivity powers the generic/biosimilar/novel distinction behind "General name".
//
// Defaults are fail-closed: any asset with no entry here resolves to
// indicationClass 'unclassified' (excluded from ranking + visibly marked) and
// exclusivity 'status-unconfirmed' (no competitive claim) — see classify.ts.
//
// Canonical site jurisdiction = US. (semaglutide has generic status in some ex-US
// markets, but the US LoE is what an investor screening SoC durability cares about;
// jurisdiction-keyed so that stays honest.)

import type { AssetSoc } from './types';

export const OBESITY_SOC: AssetSoc[] = [
  {
    id: 'wegovy',
    matchDrug: 'semaglutide 2.4',
    matchBrand: 'Wegovy',
    indicationClass: 'general-obesity',
    exclusivity: { US: 'novel-pre-LOE', EU: 'novel-pre-LOE' },
  },
  {
    id: 'zepbound',
    matchDrug: 'tirzepatide',
    matchBrand: 'Zepbound',
    indicationClass: 'general-obesity',
    exclusivity: { US: 'novel-pre-LOE', EU: 'novel-pre-LOE' },
  },
  {
    id: 'oral-wegovy',
    matchDrug: 'oral semaglutide',
    matchBrand: 'oral Wegovy',
    indicationClass: 'general-obesity',
    exclusivity: { US: 'novel-pre-LOE', EU: 'novel-pre-LOE' },
  },
  {
    id: 'foundayo',
    matchDrug: 'orforglipron',
    matchBrand: 'Foundayo',
    indicationClass: 'general-obesity',
    exclusivity: { US: 'novel-pre-LOE', EU: 'novel-pre-LOE' },
  },
  {
    id: 'imcivree',
    matchDrug: 'setmelanotide',
    matchBrand: 'Imcivree',
    indicationClass: 'rare-genetic', // POMC/PCSK1/LEPR — excluded from the SoC ranking
    exclusivity: { US: 'novel-pre-LOE', EU: 'novel-pre-LOE' },
  },
];

/** Registry keyed by indication code, so the adapter/gate can look up per indication. */
export const SOC_OVERLAYS: Record<string, AssetSoc[]> = {
  obesity: OBESITY_SOC,
};
