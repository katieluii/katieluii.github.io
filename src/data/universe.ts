export type CompanyTier = 'acquirer' | 'target';

export interface UniverseCompany {
  ticker: string;
  name: string;
  tier: CompanyTier;
  isObesityActive: boolean; // has an active obesity programme
  tags: string[];
}

export const UNIVERSE: UniverseCompany[] = [
  // ── Tier 1 — Acquirers (sorted by stretch firepower descending) ────────────
  { ticker: 'JNJ',   name: 'Johnson & Johnson',     tier: 'acquirer', isObesityActive: false, tags: ['Sitting out', 'Highest firepower'] },
  { ticker: 'LLY',   name: 'Eli Lilly',             tier: 'acquirer', isObesityActive: true,  tags: ['GLP-1 incumbent', 'Tirzepatide'] },
  { ticker: 'NVO',   name: 'Novo Nordisk',           tier: 'acquirer', isObesityActive: true,  tags: ['GLP-1 incumbent', 'Semaglutide'] },
  { ticker: 'MRK',   name: 'Merck',                 tier: 'acquirer', isObesityActive: false, tags: ['Patent cliff', 'Active acquirer'] },
  { ticker: 'RHHBY', name: 'Roche',                 tier: 'acquirer', isObesityActive: true,  tags: ['Active acquirer', 'Carmot / 89bio / Zealand'] },
  { ticker: 'NVS',   name: 'Novartis',              tier: 'acquirer', isObesityActive: false, tags: ['Sitting out', 'Leqvio focus'] },
  { ticker: 'AZN',   name: 'AstraZeneca',           tier: 'acquirer', isObesityActive: true,  tags: ['AZD5004 Ph3', 'Mid-tier firepower'] },
  { ticker: 'PFE',   name: 'Pfizer',                tier: 'acquirer', isObesityActive: true,  tags: ['Post-Metsera', 'Constrained'] },
  { ticker: 'ABBV',  name: 'AbbVie',                tier: 'acquirer', isObesityActive: false, tags: ['Sitting out', 'Constrained post-Allergan'] },
  { ticker: 'AMGN',  name: 'Amgen',                 tier: 'acquirer', isObesityActive: true,  tags: ['MariTide Ph3', 'Constrained post-Horizon'] },
  // ── Tier 2 — Targets ──────────────────────────────────────────────────────
  { ticker: 'VKTX',  name: 'Viking Therapeutics',   tier: 'target',   isObesityActive: true,  tags: ['Dual GLP-1/GIP', 'Phase 3'] },
  { ticker: 'GPCR',  name: 'Structure Therapeutics',tier: 'target',   isObesityActive: true,  tags: ['Oral GLP-1', 'Phase 2→3'] },
  { ticker: 'ALT',   name: 'Altimmune',             tier: 'target',   isObesityActive: true,  tags: ['GLP-1/glucagon', 'Phase 2'] },
  { ticker: 'CRBP',  name: 'Corbus Pharmaceuticals',tier: 'target',   isObesityActive: true,  tags: ['CB1 inverse agonist', 'Phase 1'] },
];

export const ACQUIRERS = UNIVERSE.filter(c => c.tier === 'acquirer');
export const TARGETS    = UNIVERSE.filter(c => c.tier === 'target');

export function getCompany(ticker: string): UniverseCompany | undefined {
  return UNIVERSE.find(c => c.ticker === ticker);
}

// Colour palette — consistent across all three tabs
export const TICKER_COLOURS: Record<string, string> = {
  // Acquirers — cool tones (blues / indigos)
  JNJ:   '#6366f1', // indigo
  LLY:   '#3b82f6', // blue
  NVO:   '#0ea5e9', // sky
  MRK:   '#06b6d4', // cyan
  RHHBY: '#8b5cf6', // violet
  NVS:   '#a78bfa', // light violet
  AZN:   '#10b981', // emerald (has internal pipeline, treated more like active player)
  PFE:   '#14b8a6', // teal
  ABBV:  '#6b7280', // gray (sitting out + constrained)
  AMGN:  '#f59e0b', // amber (constrained but active — watch closely)
  // Targets — warm tones (oranges / reds)
  VKTX:  '#f97316', // orange
  GPCR:  '#ef4444', // red
  ALT:   '#ec4899', // pink
  CRBP:  '#f43f5e', // rose
};
