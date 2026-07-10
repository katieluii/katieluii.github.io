// WS15 — content for the two audience pages (teams / investors), authored in the
// Atlas zinc/editorial design SYSTEM (folded into /atlas-drug-dev-analyst's look —
// zinc palette, light+dark, system sans, lucide icons). Copy carries the
// differentiation; the layout is shared, path-swapped by audience.
//
// House rules baked in (do not relitigate — WWM_REDESIGN_PROMPT.md hardened plan):
//  • NO price numbers, either audience.
//  • Entry SKU = a fixed-scope PAID PILOT (named deliverable + turnaround + the
//    decision it informs) that converts to the living subscription.
//  • Teams = fixed-scope ladder framing (loss framing OK). Funds = value-anchored,
//    edge / asymmetry-of-information register (NOT cost-of-mistake).
//  • Founding cohort = CAPACITY SCARCITY. No "reference in exchange for discount".
//  • Proof = capability proof only (live Atlas product + real sample deliverables).
//    NO fabricated outcomes / numbers / testimonials.

// ── Katie-editable constants ────────────────────────────────────────────────────
// Capacity-scarcity N — the number of founding engagements taken this quarter.
export const COHORT_N = 3; /* TODO: Katie to set N */

export interface WorkItem {
  kind: string;      // deliverable type badge (e.g. 'ETLM landscape')
  title: string;
  dek: string;       // what it contains — real, sourced, no fabricated figures
  meta: string;      // date / status
  href: string;      // points at the REAL rendered artifact in the reader
}

// the fixed-scope paid pilot — the entry SKU, gripping surface, per audience
export interface Pilot {
  deliverable: string;   // the named first deliverable
  turnaround: string;    // how fast it comes back
  decision: string;      // the decision it informs
  converts: string;      // how it becomes the living subscription
}

// one differentiator line + supporting detail (the "what you actually get" grid)
export interface Point {
  icon: string;      // lucide icon name, resolved via the page's icon registry
  title: string;
  detail: string;
}

export interface WwmContent {
  variant: 'teams' | 'investors';
  navOther: { label: string; href: string };
  // hero — OUTCOME headline + one proof point (differentiation survives a skim)
  outcome: string;         // the outcome headline
  sub: string;             // one supporting line
  proofPoint: string;      // the single hero proof point (capability, not a result)
  // job-to-be-done, stated in words for this audience
  jobLabel: string;
  job: string;
  // the fixed-scope paid pilot
  pilot: Pilot;
  // what you actually get — differentiator points
  points: Point[];
  // proof = real sample deliverables (restyled as proof, not catalog)
  work: WorkItem[];        // [0] leads
  workLead: string;        // one line framing the proof
  // how-it-works caption (the demoted, below-the-fold diagram)
  howLabel: string;
  howLead: string;
  // close
  closeHeadline: string;
  closeBody: string;
}

// ── the real sample deliverables (shared; ordered differently per page) ──────────
// hrefs point at REAL rendered artifacts in the Atlas Reader. No fabricated figures.
const ETLM: WorkItem = {
  kind: 'ETLM landscape',
  title: 'Obesity competitive landscape',
  dek: 'The approved therapies, the active pipeline, the mechanism map, and the differentiation axes — every claim linked to its primary source, kept current against new trials and congress readouts.',
  meta: 'Living document · updated Jun 2026',
  href: '/atlas-reader/etlm/obesity',
};
const TPP: WorkItem = {
  kind: 'Target product profile',
  title: 'TPP — 1L injectable, BMI ≥ 30',
  dek: 'The bar a new first-line injectable has to clear — the efficacy bar, the safety bar, and the axes that separate winners — anchored to the current frontier and named comparators.',
  meta: 'Sample deliverable · refreshed Jun 2026',
  href: '/atlas-reader/tpp/tpp_obesity_1L_injectable_bmi30_2026-06-05',
};
const THEME: WorkItem = {
  kind: 'Thematic synthesis',
  title: 'GLP-1 class — competitive supply',
  dek: 'A cross-asset read on the class: where supply is concentrating, which mechanisms are crowding, and what that means for a differentiated entrant.',
  meta: 'Sample deliverable · Jun 2026',
  href: '/atlas-reader/theme/glp1_class_competitive_supply_2026-06-05',
};

// ── TEAMS ────────────────────────────────────────────────────────────────────────
// buys: a decision they'll build a program on. Fixed-scope ladder + loss framing OK.
export const TEAMS: WwmContent = {
  variant: 'teams',
  navOther: { label: 'For investors', href: '/work-with-me/investors' },
  outcome: 'Walk into the next program decision with the landscape already settled.',
  sub: 'Competitive landscapes, target product profiles, and positioning for the teams building drugs — current, sourced, on your deadline.',
  proofPoint: 'The same engine behind the live Atlas product — 40+ indications held on one architecture, every claim traced to its primary source.',
  jobLabel: 'The job',
  job: 'A program decision you commit to — where the bar sits, who already clears it, and which axis you differentiate on — resolved into an artifact you can put in front of your board without a caveat.',
  pilot: {
    deliverable: 'A sourced competitive-landscape grid on your lead indication — the leading assets, head-to-head on efficacy and safety, each linked to its pivotal trial.',
    turnaround: 'Back within days, not weeks.',
    decision: 'So you can see exactly where a new entrant has to land before you commit the program.',
    converts: 'It stands alone. If it earns its place, it becomes the living memory of your field — re-baselined as new readouts land, so the picture is never last quarter’s.',
  },
  points: [
    {
      icon: 'gauge',
      title: 'A decision, not a deck',
      detail: 'You get the artifact your next call is built on — the landscape, the TPP, the positioning — not a pile of slides to still interpret.',
    },
    {
      icon: 'layers',
      title: 'The whole field, not a snapshot',
      detail: 'A living memory of your indication, kept current as trials read out — so you are never rebuilding the picture from scratch the week before a decision.',
    },
    {
      icon: 'shield-check',
      title: 'Defensible to the primary source',
      detail: 'Every number, comparator, and readout traces to ClinicalTrials.gov, FDA, or the publication. Modelled figures are flagged as modelled. Auditable, not a black box.',
    },
    {
      icon: 'lock',
      title: 'Walled from the other side of the table',
      detail: 'I also work with investors. Biotech-side and investor-side engagements are kept behind a strict information barrier — your pipeline, questions, and data never cross.',
    },
  ],
  work: [ETLM, TPP, THEME],
  workLead: 'Real deliverables, straight from the Atlas Reader — redacted samples of exactly what lands.',
  howLabel: 'How it works',
  howLead: 'Four streams feed one living memory; the deliverables fall out of it — which is why they stay current and agree with each other.',
  closeHeadline: 'Founding engagements are limited.',
  closeBody: 'I take on a small number of founding partners so each gets the depth. Send your lead indication and you get a sourced sample back before you commit to anything.',
};

// ── INVESTORS ─────────────────────────────────────────────────────────────────────
// buys: a position that survives IC. Value-anchored, edge / asymmetry register.
export const INVESTORS: WwmContent = {
  variant: 'investors',
  navOther: { label: 'For biotech teams', href: '/work-with-me/teams' },
  outcome: 'Hold a position on the science before the rest of the table has read the record.',
  sub: 'IC-grade diligence and scientific underwrites for biotech investors — sourced to the primary record, current with your deal flow.',
  proofPoint: 'Built on the live Atlas engine — the same source-linked landscape memory, pointed at the names you are underwriting.',
  jobLabel: 'The job',
  job: 'A position that survives the committee — the comparator set, the citations, and the what-has-to-be-true assembled before IC, not reconstructed the night before — so your conviction rests on the science holding up, not on the pitch.',
  pilot: {
    deliverable: 'A source-linked landscape grid on one live name — the competitive set head-to-head, every claim tied to its trial and publication, the comparators the deck left out surfaced.',
    turnaround: 'Current as of the day it lands, back on your deal-flow timeline.',
    decision: 'So you can judge where the asset actually sits in its class before you take it to the partners.',
    converts: 'It stands alone. If it earns its place, it becomes a standing edge on the names you are live in — the landscape kept current, so you are reading the field ahead of the room.',
  },
  points: [
    {
      icon: 'target',
      title: 'An edge, assembled ahead of the room',
      detail: 'The comparator set and the citations organised before IC — an information advantage on the asset, not a reconstruction the night before the meeting.',
    },
    {
      icon: 'shield-check',
      title: 'Every claim underwritten to source',
      detail: 'Clinical claims trace to the primary record; modelled figures are flagged as modelled. A position you can defend line by line when the committee probes it.',
    },
    {
      icon: 'refresh-cw',
      title: 'Current with your deal flow',
      detail: 'The landscape is re-baselined as trials read out — so the read is current as of the day it lands, not last quarter’s.',
    },
    {
      icon: 'lock',
      title: 'A wall between you and the assets',
      detail: 'I also work with biotech teams. Investor-side and company-side engagements sit behind a strict information barrier — what you are diligencing, and what you conclude, never crosses.',
    },
  ],
  work: [THEME, ETLM, TPP],
  workLead: 'Real deliverables, straight from the Atlas Reader — redacted samples of the rigor you get on a live name.',
  howLabel: 'How it works',
  howLead: 'Structured diligence in — the data room, the market, the cap table, the team — fact-checked by agents, refined by hand, synthesised into one committee-ready read.',
  closeHeadline: `Limited to ${COHORT_N} founding engagements this quarter.`,
  closeBody: 'A small cohort, so each name gets the depth. Send a live name and you get a source-linked landscape grid back — current as of that day — so you can judge the rigor before you commit to anything.',
};

export const WWM: Record<'teams' | 'investors', WwmContent> = {
  teams: TEAMS,
  investors: INVESTORS,
};

// ── Underwrite funnel data ────────────────────────────────────────────────────────
// Standalone — consumed by the LIVE /investment-memo project page (InvestmentMemo.tsx)
// via the shared <UnderwriteFunnel/> diagram (cool variant). Kept decoupled from the
// WWM audience content above (the WWM investor page describes the track plainly and does
// NOT use the coined "underwrite funnel" phrasing). Do not remove — /investment-memo
// renders from this.
export interface Underwrite {
  eyebrow: string;
  lead: string;
  inputs: { icon: 'doc' | 'market' | 'cap' | 'team'; label: string; dek: string }[];
  agentsLabel: string;
  agentsSub: string;
  agents: string[];
  output: { label: string; dek: string };
  reviewLabel?: string;
  wrapper: string;
  wrapperTags: string[];
}

export const UNDERWRITE: Underwrite = {
  eyebrow: 'How the underwrite works',
  lead: 'Structured diligence in, one memo your committee can’t pick apart.',
  inputs: [
    { icon: 'doc', label: 'Data room', dek: 'Pitch deck & files, indexed' },
    { icon: 'market', label: 'Market sizing', dek: 'Peak revenue · SOM' },
    { icon: 'cap', label: 'Cap table & exit', dek: 'MOIC · IRR · waterfall' },
    { icon: 'team', label: 'Founding team', dek: 'Structured assessment' },
  ],
  agentsLabel: 'Six diligence agents',
  agentsSub: 'Run in parallel, every claim fact-checked, each refined by hand.',
  agents: ['Fund-fit', 'Scientific', 'Competitive', 'Clinical & regulatory', 'Financing & valuation', 'IP & FTO'],
  output: { label: 'IC memo', dek: 'Exportable Word document' },
  reviewLabel: 'Reviewed & annotated by hand',
  wrapper: 'Every deal rolls up to a deal page, inside a pipeline you read at a glance — so partners and analysts track the book and see what they should be seeing.',
  wrapperTags: ['Pipeline view', 'Deal page'],
};
