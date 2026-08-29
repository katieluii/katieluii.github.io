import { projects, type Project } from './projects';

/* ── The product suite shown on the home page ──────────────────────────────────
   Five products, lettered A→E (the names are alphabetical — the letter is the
   index, not decoration). Each product fronts one landing page and is "made of"
   existing tools that stay listed on /projects. Constituent tools are referenced
   by projects.ts `id` so titles and hrefs can't drift from the archive view.
   Status carries a TEXT label and a shape cue in the UI — never hue alone. */

export type SuiteStatus = 'Live' | 'Preview' | 'In build';

export interface SuiteProduct {
  letter: string;
  name: string;
  /** what it does — short role line, sentence case */
  role: string;
  /** who buys it — the visitor's self-selection cue */
  audience: string;
  /** the job it does — one plain sentence; tense must match status */
  job: string;
  status: SuiteStatus;
  /** landing page (internal route or external URL) */
  href: string;
  /** projects.ts ids of the tools this product is built from */
  madeOf: string[];
}


export const suite: SuiteProduct[] = [
  {
    letter: 'A',
    name: 'Atlas',
    role: 'Landscape monitoring',
    audience: 'drug-development and strategy teams',
    job: 'Tracks every indication in your scope, from registries and readouts to regulatory moves, and keeps a living landscape map per indication.',
    status: 'Live',
    href: '/atlas-drug-dev-analyst',
    madeOf: ['atlas-drug-dev-analyst', 'clinical-news-monitor', 'conference-catalyst-monitor'],
  },
  {
    letter: 'B',
    name: 'Bellwether',
    role: 'Sell-side research',
    audience: 'pharma equity analysts',
    job: 'Routes each large-cap pharma name to the valuation model that fits it and lines them up on one comparable view. Refreshed each quarter after results; every cut is reviewed before it ships.',
    status: 'Live',
    href: '/pharma-landscape',
    madeOf: ['pharma-landscape'],
  },
  {
    letter: 'C',
    name: 'Crane',
    role: 'Buy-side investing and fund operations',
    audience: 'biotech investors, early-stage VC funds and venture builders',
    job: 'Diligence and deal-flow tooling: a structured investment memo, fund-holdings and financing trackers, and deal monitoring. Also the home of the AI-native VC offering: a machine-legible operating record and agents on the fund\u2019s own pipeline stages, each earning write access one tier at a time.',
    status: 'Live',
    href: '/projects?suite=C',
    madeOf: ['investment-memo-agent', 'sec13f', 'biotech-fundraising', 'ai-biopharma-feed', 'obesity-stock-analysis'],
  },
  {
    letter: 'D',
    name: 'Dove',
    role: 'Clinical-trial analysis',
    audience: 'clinical operations and trial planners',
    job: 'Predicts how long a trial will take to enrol from its registry record, so plans start from the base rate.',
    status: 'Live',
    href: '/trial-recruitment',
    madeOf: ['trial-recruitment'],
  },
  {
    letter: 'E',
    name: 'Edge',
    role: 'Conference and BD prioritisation',
    audience: 'business-development teams at biotechs and their service partners',
    job: 'Scores every company attending BIO, JPM or BioEquity against your own angle, shows the reasoning on each row, and drafts the first note you edit before sending. Live on the BIO 2026 exhibitor list.',
    status: 'Live',
    href: '/partner-prioritisation',
    madeOf: ['partner-prioritisation'],
  },
];

export interface ResolvedTool {
  id: string;
  title: string;
  href: string;
}

/** Resolve a product's constituent tools against projects.ts. Unknown ids are dropped
    (and reported in dev) rather than rendered as dead links. */
export function resolveMadeOf(product: SuiteProduct): ResolvedTool[] {
  const out: ResolvedTool[] = [];
  for (const id of product.madeOf) {
    const p: Project | undefined = projects.find((x) => x.id === id);
    if (!p) {
      if (import.meta.env.DEV) console.warn(`[suite] unknown project id "${id}" on ${product.name}`);
      continue;
    }
    out.push({ id, title: p.shortTitle ?? p.title, href: p.links.live || `/projects/${p.slug}` });
  }
  return out;
}

/** Ids of every project that some product is made of — used by /projects to mark them. */
export function suiteMembership(): Map<string, SuiteProduct> {
  const m = new Map<string, SuiteProduct>();
  suite.forEach((s) => s.madeOf.forEach((id) => m.set(id, s)));
  return m;
}
