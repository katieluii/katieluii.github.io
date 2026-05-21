export type MechanismTag =
  | 'Dual GLP-1/GIP'
  | 'Triple agonist (GLP-1/GIP/Glucagon)'
  | 'Mono GLP-1'
  | 'Oral SM GLP-1'
  | 'Amylin agonist'
  | 'GLP-1 + amylin combo'
  | 'Unimolecular GLP-1/amylin'
  | 'GLP-1/glucagon dual'
  | 'GIPR antagonist + GLP-1 agonist'
  | 'CB1 inverse agonist'
  | 'Oral DACRA';

export type RouteTag =
  | 'Marketed'
  | 'Oral daily'
  | 'Oral weekly'
  | 'SubQ weekly'
  | 'SubQ monthly';

export type OwnerType =
  | 'Big pharma in-house'
  | 'Big pharma licensed-in'
  | 'Independent biotech';

export type PhaseTag =
  | 'Marketed'
  | 'NDA Submitted'
  | 'Phase 3'
  | 'Phase 2→3'
  | 'Phase 2'
  | 'Phase 1';

export interface LikelyAcquirer {
  ticker: string;
  rationale: string;
}

export interface ObesityAsset {
  id: string;
  name: string;
  sponsor: string;            // ticker (or 'KAILERA' for private)
  sponsorName?: string;       // display name override for non-traded sponsors
  mechanism: MechanismTag;
  route: RouteTag;
  phase: PhaseTag;
  ownerType: OwnerType;
  isLeadObesityAsset: boolean; // exactly one true per Tier 2 sponsor
  isDifferentiated: boolean;
  isObesityIndication: boolean;
  hasPocData: boolean;
  peakSalesEstimateB?: number;
  nextReadout?: string;
  statusNote?: string;        // concise current-status note for timeline hover
  nctId?: string;
  likelyAcquirers?: LikelyAcquirer[];
}

export const OBESITY_ASSETS: ObesityAsset[] = [
  // ── Eli Lilly ─────────────────────────────────────────────────────────────
  {
    id: 'tirzepatide',
    name: 'Tirzepatide (Zepbound)',
    sponsor: 'LLY',
    mechanism: 'Dual GLP-1/GIP',
    route: 'Marketed',
    phase: 'Marketed',
    ownerType: 'Big pharma in-house',
    isLeadObesityAsset: true,
    isDifferentiated: true,
    isObesityIndication: true,
    hasPocData: true,
  },
  {
    id: 'retatrutide',
    name: 'Retatrutide',
    sponsor: 'LLY',
    mechanism: 'Triple agonist (GLP-1/GIP/Glucagon)',
    route: 'SubQ weekly',
    phase: 'Phase 3',
    ownerType: 'Big pharma in-house',
    isLeadObesityAsset: false,
    isDifferentiated: true,
    isObesityIndication: true,
    hasPocData: true,
  },
  {
    id: 'orforglipron',
    name: 'Orforglipron',
    sponsor: 'LLY',
    mechanism: 'Oral SM GLP-1',
    route: 'Oral daily',
    phase: 'Phase 3',
    ownerType: 'Big pharma in-house',
    isLeadObesityAsset: false,
    isDifferentiated: true,
    isObesityIndication: true,
    hasPocData: true,
  },
  {
    id: 'eloralintide',
    name: 'Eloralintide',
    sponsor: 'LLY',
    mechanism: 'Amylin agonist',
    route: 'SubQ weekly',
    phase: 'Phase 3',
    ownerType: 'Big pharma in-house',
    isLeadObesityAsset: false,
    isDifferentiated: true,
    isObesityIndication: true,
    hasPocData: true,
  },
  // ── Novo Nordisk ──────────────────────────────────────────────────────────
  {
    id: 'semaglutide',
    name: 'Semaglutide (Wegovy / Ozempic)',
    sponsor: 'NVO',
    mechanism: 'Mono GLP-1',
    route: 'Marketed',
    phase: 'Marketed',
    ownerType: 'Big pharma in-house',
    isLeadObesityAsset: true,
    isDifferentiated: false,
    isObesityIndication: true,
    hasPocData: true,
  },
  {
    id: 'cagrisema',
    name: 'CagriSema',
    sponsor: 'NVO',
    mechanism: 'GLP-1 + amylin combo',
    route: 'SubQ weekly',
    phase: 'NDA Submitted',
    ownerType: 'Big pharma in-house',
    isLeadObesityAsset: false,
    isDifferentiated: true,
    isObesityIndication: true,
    hasPocData: true,
  },
  {
    id: 'amycretin',
    name: 'Amycretin',
    sponsor: 'NVO',
    mechanism: 'Unimolecular GLP-1/amylin',
    route: 'SubQ weekly',
    phase: 'Phase 3',
    ownerType: 'Big pharma in-house',
    isLeadObesityAsset: false,
    isDifferentiated: true,
    isObesityIndication: true,
    hasPocData: true,
  },
  // ── Amgen ─────────────────────────────────────────────────────────────────
  {
    id: 'maridebart',
    name: 'Maridebart cafraglutide (MariTide)',
    sponsor: 'AMGN',
    mechanism: 'GIPR antagonist + GLP-1 agonist',
    route: 'SubQ monthly',
    phase: 'Phase 3',
    ownerType: 'Big pharma in-house',
    isLeadObesityAsset: true,
    isDifferentiated: true,
    isObesityIndication: true,
    hasPocData: true,
    nextReadout: '2027-01-01',
    statusNote: 'Ph3 MARITIME program ongoing. Monthly dosing (vs. weekly peers) is a key differentiator. Ph3 readout expected H1 2027.',
  },
  // ── AstraZeneca ───────────────────────────────────────────────────────────
  {
    id: 'azd5004',
    name: 'AZD5004 (Elecoglipron)',
    sponsor: 'AZN',
    mechanism: 'Oral SM GLP-1',
    route: 'Oral daily',
    phase: 'Phase 3',
    ownerType: 'Big pharma in-house',
    isLeadObesityAsset: true,
    isDifferentiated: true,
    isObesityIndication: true,
    hasPocData: true,
    nextReadout: '2027-01-01',
    statusNote: 'AZD5004 (elecoglipron) licensed from Eccogene. Oral daily GLP-1 agonist in Ph3 ACHIEVE program. Readout expected 2027.',
  },
  {
    id: 'azd6234',
    name: 'AZD6234',
    sponsor: 'AZN',
    mechanism: 'Amylin agonist',
    route: 'SubQ weekly',
    phase: 'Phase 2',
    ownerType: 'Big pharma in-house',
    isLeadObesityAsset: false,
    isDifferentiated: true,
    isObesityIndication: true,
    hasPocData: false,
    nextReadout: '2026-12-01',
    statusNote: 'AZD6234 is an amylin analogue (SARA mechanism). Ph2 obesity study ongoing; readout expected late 2026.',
  },
  // ── Roche (licensed-in from Carmot + Zealand) ─────────────────────────────
  {
    id: 'ct388',
    name: 'CT-388',
    sponsor: 'RHHBY',
    mechanism: 'Dual GLP-1/GIP',
    route: 'SubQ weekly',
    phase: 'Phase 2',
    ownerType: 'Big pharma licensed-in',
    isLeadObesityAsset: true,
    isDifferentiated: true,
    isObesityIndication: true,
    hasPocData: true,
  },
  {
    id: 'ct996',
    name: 'CT-996',
    sponsor: 'RHHBY',
    mechanism: 'Oral SM GLP-1',
    route: 'Oral daily',
    phase: 'Phase 2',
    ownerType: 'Big pharma licensed-in',
    isLeadObesityAsset: false,
    isDifferentiated: true,
    isObesityIndication: true,
    hasPocData: false,
  },
  {
    id: 'petrelintide',
    name: 'Petrelintide',
    sponsor: 'RHHBY',
    mechanism: 'Amylin agonist',
    route: 'SubQ weekly',
    phase: 'Phase 2',
    ownerType: 'Big pharma licensed-in',
    isLeadObesityAsset: false,
    isDifferentiated: true,
    isObesityIndication: true,
    hasPocData: false,
  },
  // ── Kailera / Hengrui (private sponsor, Phase 3) ──────────────────────────
  {
    id: 'kai9531',
    name: 'KAI-9531 / Ribupatide (HRS9531)',
    sponsor: 'KAILERA',
    sponsorName: 'Kailera / Hengrui',
    mechanism: 'Dual GLP-1/GIP',
    route: 'SubQ weekly',
    phase: 'Phase 3',
    ownerType: 'Big pharma licensed-in',
    isLeadObesityAsset: true,
    isDifferentiated: true,
    isObesityIndication: true,
    hasPocData: true,
    nextReadout: '2028-06-01',
    statusNote: 'Global Ph3 underway (GLP-1/GIP once-weekly SubQ, partnered with Hengrui). Primary readout not expected until 2028 — beyond this chart window. Near-term trading driven by sector sentiment, not company-specific data.',
  },
  // ── Tier 2 — Independent biotechs ─────────────────────────────────────────
  {
    id: 'vk2735_subq',
    name: 'VK2735 (SubQ)',
    sponsor: 'VKTX',
    mechanism: 'Dual GLP-1/GIP',
    route: 'SubQ weekly',
    phase: 'Phase 3',
    ownerType: 'Independent biotech',
    isLeadObesityAsset: true,
    isDifferentiated: true,
    isObesityIndication: true,
    hasPocData: true,
    peakSalesEstimateB: 8.0,
    likelyAcquirers: [
      { ticker: 'RHHBY', rationale: 'Rebuilding obesity bench' },
      { ticker: 'NVO',   rationale: 'Franchise extension' },
      { ticker: 'MRK',   rationale: 'Patent cliff diversification' },
    ],
  },
  {
    id: 'vk2735_oral',
    name: 'VK2735 (Oral)',
    sponsor: 'VKTX',
    mechanism: 'Oral SM GLP-1',
    route: 'Oral daily',
    phase: 'Phase 2',
    ownerType: 'Independent biotech',
    isLeadObesityAsset: false,
    isDifferentiated: true,
    isObesityIndication: true,
    hasPocData: false,
    peakSalesEstimateB: 8.0,
  },
  {
    id: 'pemvidutide',
    name: 'Pemvidutide',
    sponsor: 'ALT',
    mechanism: 'GLP-1/glucagon dual',
    route: 'SubQ weekly',
    phase: 'Phase 2',
    ownerType: 'Independent biotech',
    isLeadObesityAsset: true,
    isDifferentiated: true,
    isObesityIndication: true,
    hasPocData: true,
    peakSalesEstimateB: 2.5,
    likelyAcquirers: [
      { ticker: 'AMGN',  rationale: 'Mechanism complement to MariTide' },
      { ticker: 'AZN',   rationale: 'Pipeline diversification' },
      { ticker: 'MRK',   rationale: 'Obesity entry point' },
    ],
  },
  {
    id: 'aleniglipron',
    name: 'Aleniglipron (GSBR-1290)',
    sponsor: 'GPCR',
    mechanism: 'Oral SM GLP-1',
    route: 'Oral daily',
    phase: 'Phase 2→3',
    ownerType: 'Independent biotech',
    isLeadObesityAsset: true,
    isDifferentiated: true,
    isObesityIndication: true,
    hasPocData: true,
    peakSalesEstimateB: 5.0,
    nextReadout: '2026-08',
    statusNote: 'ACCESS + ACCESS II Ph2 data readout completed March 2026. Ph3 design finalization expected Q2 2026; Ph3 initiation targeting Q3 2026. Leading oral-only GLP-1 candidate.',
    nctId: 'NCT07169942',
    likelyAcquirers: [
      { ticker: 'LLY',   rationale: 'Defensive oral GLP-1 position' },
      { ticker: 'NVO',   rationale: 'Oral formulation gap' },
      { ticker: 'PFE',   rationale: 'Obesity franchise building post-Metsera' },
    ],
  },
  {
    id: 'accg2671',
    name: 'ACCG-2671',
    sponsor: 'GPCR',
    mechanism: 'Oral DACRA',
    route: 'Oral daily',
    phase: 'Phase 1',
    ownerType: 'Independent biotech',
    isLeadObesityAsset: false,
    isDifferentiated: true,
    isObesityIndication: true,
    hasPocData: false,
    nextReadout: '2026-09-01',
    statusNote: 'Ph1 SAD (single ascending dose) study ongoing; initial data expected Q3 2026 — first clinical proof-of-concept for this oral DACRA mechanism.',
  },
  {
    id: 'crb913',
    name: 'CRB-913',
    sponsor: 'CRBP',
    mechanism: 'CB1 inverse agonist',
    route: 'Oral daily',
    phase: 'Phase 1',
    ownerType: 'Independent biotech',
    isLeadObesityAsset: true,
    isDifferentiated: true,
    isObesityIndication: true,
    hasPocData: false,
    peakSalesEstimateB: 1.5,
    nextReadout: '2026-07-01',
    statusNote: 'Ph1 dose-escalation ongoing; initial safety and efficacy data expected Q3 2026. First CB1 inverse agonist in clinical development for obesity since rimonabant (withdrawn 2008). Differentiated non-GLP-1 mechanism.',
    likelyAcquirers: [
      { ticker: 'NVO',   rationale: 'CB1 class precedent (Inversago 2023)' },
      { ticker: 'RHHBY', rationale: 'Mechanism diversification' },
      { ticker: 'AZN',   rationale: 'Pipeline complementarity' },
    ],
  },
];

export function getLeadAsset(sponsorTicker: string): ObesityAsset | undefined {
  return OBESITY_ASSETS.find(a => a.sponsor === sponsorTicker && a.isLeadObesityAsset);
}

export function getTier2Assets(): ObesityAsset[] {
  return OBESITY_ASSETS.filter(a => a.ownerType === 'Independent biotech' && a.isLeadObesityAsset);
}

// Mechanism color map — consistent across Pipeline and Stock Charts tabs
export const MECHANISM_COLOURS: Record<MechanismTag, string> = {
  'Dual GLP-1/GIP':                   '#6366f1', // indigo
  'Triple agonist (GLP-1/GIP/Glucagon)': '#8b5cf6', // violet
  'Mono GLP-1':                        '#3b82f6', // blue
  'Oral SM GLP-1':                     '#0ea5e9', // sky
  'Amylin agonist':                    '#10b981', // emerald
  'GLP-1 + amylin combo':              '#14b8a6', // teal
  'Unimolecular GLP-1/amylin':         '#06b6d4', // cyan
  'GLP-1/glucagon dual':               '#f59e0b', // amber
  'GIPR antagonist + GLP-1 agonist':   '#a78bfa', // light violet
  'CB1 inverse agonist':               '#f43f5e', // rose
  'Oral DACRA':                        '#ec4899', // pink
};
