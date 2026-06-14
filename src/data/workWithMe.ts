// WS15 — content for the two audience pages + hub. One canonical consultancy
// flow (hero → POV → how it works → selected work → CTA), differing by framing
// and which deliverable leads. Lean content; the layout carries the weight.

export interface WorkItem {
  eyebrow: string;   // DELIVERABLE TYPE · DOMAIN
  title: string;
  dek: string;       // quantified, describes real contents
  meta: string;      // date / status
  href: string;      // points at the REAL rendered artifact
  cta: string;       // verb on the artifact
  image?: string;    // cropped screenshot of the real artifact (featured card only)
}

// the "two ways to run it" value strip — shared shape across both pages
export interface TwoMode {
  eyebrow: string;
  a: { label: string; dek: string }; // the core / ready offering
  b: { label: string; dek: string }; // the deploy-on-your-stack option
}

// teams "how it works" — the ATLAS living-memory dataflow (inputs → memory → output)
export interface Dataflow {
  eyebrow: string;
  lead: string;            // Fraunces headline
  sub: string;             // body line under it
  inputs: string[];        // continuous feeds (abstracted — never scrapers/DBs)
  hubName: string;         // 'ATLAS'
  hubLine: string;
  outputs: string[];       // the deliverables that fall out
  closer: string;
  modes: TwoMode;          // public-record vs on-your-systems
  button: { label: string; href: string };
}

// investors "how it works" — the Underwrite diligence engine (WS4 tool architecture)
export interface Underwrite {
  eyebrow: string;
  lead: string;
  inputs: { icon: 'doc' | 'market' | 'cap' | 'team'; label: string; dek: string }[];
  agentsLabel: string;
  agentsSub: string;
  agents: string[];
  output: { label: string; dek: string };
  wrapper: string;
  wrapperTags: string[];
  modes: TwoMode;          // ready-to-run vs on-your-systems
  button: { label: string; href: string };
}

export interface WwmContent {
  variant: 'teams' | 'investors';
  navOther: { label: string; href: string };
  hero: { h1: string; sub: string };
  pov: string;             // short conviction statement
  dataflow?: Dataflow;     // teams only
  underwrite?: Underwrite; // investors only
  work: WorkItem[];        // [0] is featured
  workFootnote: string;
  credibility: string;
  ctaHeadline: string;
  ctaBody: string;
}

// ── the three real sample deliverables (shared; ordered differently per page) ──
const ETLM: WorkItem = {
  eyebrow: 'ETLM Landscape · Obesity',
  title: 'Obesity Competitive Landscape',
  dek: 'Eight approved therapies, the active pipeline, mechanism landscape, and differentiation axes. 90+ primary sources, refreshed against trials and congress readouts.',
  meta: 'Updated Jun 2026 · Living document',
  href: '/atlas-reader/etlm/obesity',
  cta: 'Read the landscape',
  image: '/images/wwm_etlm_sample.png',
};
const TPP: WorkItem = {
  eyebrow: 'Target Product Profile · Obesity',
  title: 'TPP — 1L Injectable, BMI ≥ 30',
  dek: 'The bar a new asset must clear, benchmarked to semaglutide (STEP-1) and tirzepatide (SURMOUNT-1): the efficacy bar, the safety bar, and the axes that separate winners.',
  meta: 'Sample deliverable · 2026',
  href: '/atlas-reader/tpp/tpp_obesity_1L_injectable_bmi30_2026-06-05',
  cta: 'Open the TPP',
};
const MEMO: WorkItem = {
  eyebrow: 'IC Memo · Investment',
  title: 'A GLP-1 Asset Entering Obesity',
  dek: 'An IC-grade read on the competitive bar, the clinical evidence, and the risks behind a financing decision. Every clinical claim sourced; modelled figures flagged.',
  meta: 'Sample deliverable · 2026',
  href: '/atlas-reader/memo/obesity-glp1',
  cta: 'Read the memo',
  image: '/images/wwm_memo_sample.png',
};

// teams: the living-memory dataflow that sits behind every deliverable
const DATAFLOW: Dataflow = {
  eyebrow: 'How it works',
  lead: 'Most analysis is a snapshot. This one isn’t.',
  sub: 'It runs on a living memory of your field — continuously fed by the latest data, so the evidence is current every time.',
  inputs: ['Published literature', 'Clinical trial registries', 'Congress readouts', 'Trade & deal-flow press'],
  hubName: 'ATLAS',
  hubLine: 'Every asset, mechanism, and readout tied to its source — and kept current as the field moves.',
  outputs: ['Competitive landscape', 'Target product profile', 'Deep thematic synthesis'],
  closer: 'The same memory sits behind every deliverable — which is why they stay current, and agree with each other.',
  modes: {
    eyebrow: 'Two ways to run it',
    a: {
      label: 'On the public record',
      dek: 'A proprietary agentic harness builds and maintains this memory continuously from public sources — shaped to your field, your pipeline, your questions.',
    },
    b: {
      label: 'On your systems',
      dek: 'Or the same architecture, deployed on your stack — folding your proprietary data and internal signals into the same living picture.',
    },
  },
  button: { label: 'See what it produces', href: '#work' },
};

// investors: the Underwrite diligence engine — structured modules → agents → memo
const UNDERWRITE: Underwrite = {
  eyebrow: 'How the underwrite works',
  lead: 'Structured diligence in, one memo your committee can’t pick apart.',
  inputs: [
    { icon: 'doc', label: 'Data room', dek: 'Pitch deck & files, indexed' },
    { icon: 'market', label: 'Market sizing', dek: 'Peak revenue · SOM' },
    { icon: 'cap', label: 'Cap table & exit', dek: 'MOIC · IRR · waterfall' },
    { icon: 'team', label: 'Founding team', dek: 'Structured assessment' },
  ],
  agentsLabel: 'Five diligence agents',
  agentsSub: 'Run in parallel, every claim fact-checked, each refined by hand.',
  agents: ['Fund-fit', 'Scientific', 'Competitive', 'Clinical & regulatory', 'Financing & valuation'],
  output: { label: 'IC memo', dek: 'Exportable Word document' },
  wrapper: 'Every deal rolls up to a deal page, inside a pipeline you read at a glance — so partners and analysts track the book and see what they should be seeing.',
  wrapperTags: ['Pipeline view', 'Deal page'],
  modes: {
    eyebrow: 'Two ways to run it',
    a: {
      label: 'Ready to run',
      dek: 'The tools and agents above, ready to underwrite your analysis and diligence from day one.',
    },
    b: {
      label: 'On your systems',
      dek: 'Or the same agentic architecture, deployed on your stack — so your proprietary data and signals feed the diligence.',
    },
  },
  button: { label: 'Read a sample memo', href: '#work' },
};

export const TEAMS: WwmContent = {
  variant: 'teams',
  navOther: { label: 'For investors', href: '/work-with-me/investors' },
  hero: {
    h1: 'Drug-development analysis you can defend.',
    sub: 'Competitive landscapes, target product profiles, and positioning for the teams building drugs. Current, sourced, on your deadline.',
  },
  pov: 'Good development calls come from current evidence, not last quarter’s deck. I keep a living memory of your field and turn it into the artifact your next decision needs.',
  dataflow: DATAFLOW,
  work: [ETLM, TPP, MEMO],
  workFootnote: 'Other work, from full landscape builds to regulatory drafts, is scoped in conversation.',
  credibility: 'Nothing I deliver is generated. Every number, comparator, and readout comes from the primary record and gets checked. The models do the breadth. The judgment and the sourcing are mine.',
  ctaHeadline: 'I take on a few design partners at a reduced rate.',
  ctaBody: 'In exchange for a reference once the work earns it. Send me your lead indication, and you will get a sample back before you spend anything.',
};

export const INVESTORS: WwmContent = {
  variant: 'investors',
  navOther: { label: 'For biotech teams', href: '/work-with-me/teams' },
  hero: {
    h1: 'Underwrite the science, not the story.',
    sub: 'IC-grade memos and scientific diligence for biotech investors. Sourced to the primary record, fast enough to keep up with your deal flow.',
  },
  pov: 'Conviction comes from the science holding up, not the pitch. I underwrite the evidence, source every claim, and hand you a memo your committee cannot pick apart.',
  underwrite: UNDERWRITE,
  work: [MEMO, ETLM, TPP],
  workFootnote: 'Other work, from landscape deep-dives to portfolio monitoring, is scoped in conversation.',
  credibility: 'Nothing I deliver is generated. Every number, comparator, and readout comes from the primary record and gets checked. The models do the breadth. The judgment, the financials, and the sourcing are mine.',
  ctaHeadline: 'I take on a few design partners at a reduced rate.',
  ctaBody: 'In exchange for a reference once the work earns it. Send me a live deal, and you will get a sample memo back before you spend anything.',
};

export const WWM: Record<'teams' | 'investors', WwmContent> = {
  teams: TEAMS,
  investors: INVESTORS,
};
