// Atlas — canonical shared copy. Single source of truth for content that appears
// on BOTH the portfolio showcase page (/atlas-drug-dev-analyst) and the WS15 sales
// page (/work-with-me/teams), so the two can't drift. Page-specific framing (offer
// ladder, design-partner CTA, hub brand name) stays on the respective pages.

export interface DataflowNode {
  name: string;
  detail?: string; // shown on the portfolio (card) theme; ignored by the editorial (bullet) theme
}

export interface DataflowHub {
  name: string;
  line: string;
  badge?: string;
}

export interface AtlasDataflowModel {
  inputs: DataflowNode[];
  hub: DataflowHub;
  outputs: DataflowNode[];
}

// the living-memory dataflow: continuous public sources → ETLM → strategic deliverables.
// inputs/outputs are the canonical, drift-prone content; the hub label is intentionally
// contextual (ETLM in the architecture view, ATLAS in the sales/brand view).
export const ATLAS_DATAFLOW: AtlasDataflowModel = {
  inputs: [
    { name: 'Published literature', detail: 'PubMed · bioRxiv · medRxiv' },
    { name: 'Clinical-trial registries', detail: 'ClinicalTrials.gov · EU CTR · FDA · EMA' },
    { name: 'Congress readouts', detail: 'ASCO · ESMO · AACR · ASH' },
    { name: 'Trade & deal-flow press', detail: 'Fierce · Endpoints · BioPharma Dive' },
  ],
  hub: {
    name: 'ETLM',
    badge: 'Persistent intelligence',
    line: 'Emerging Therapeutic Landscape Map — one per indication. Every asset, mechanism, and readout tied to its source, kept current as the field moves.',
  },
  outputs: [
    {
      name: 'Competitive landscape',
      detail: 'Approved + pipeline · unmet need · efficacy & safety benchmarks',
    },
    {
      name: 'Target Product Profile',
      detail: 'Efficacy bar vs named comparators · differentiation axes that move the answer',
    },
    {
      name: 'Deep thematic synthesis',
      detail: 'Cross-indication mechanism & modality reads',
    },
  ],
};

// Redaction hook — canonical wording shown at the foot of every redacted ETLM
// summary. The summary view shows the SHAPE of the landscape (names, sponsors,
// targets, approval status); the benchmarks, pipeline read, and so-what are the
// paid layer kept in the knowledge base. This copy names that value so the
// redaction reads as a deliberate teaser, not a missing feature.
export const DETAIL_HOOK = {
  shownLabel: 'What this view shows',
  shown:
    'The sourced benchmark grid for the leading assets — head-to-head efficacy & safety, each linked to its pivotal trial and publication — plus the headline unmet needs and the reasoning behind them. Kept current as the field moves.',
  withheldLabel: 'What the full landscape adds',
  withheld: [
    'The full pipeline read — every asset in development, phase, readout timing, and what each catalyst re-rates.',
    'The so-what — competitive positioning: where the bar sits, who clears it, and who is exposed.',
    'Regulatory & deal context and the cross-asset synthesis — the complete landscape report.',
  ],
  cta: 'Get the full landscape',
  ctaNote: "Drop your email and I'll send the complete, source-linked report — or set up a walkthrough.",
} as const;

// Funnel flag. While false, the WS15 /work-with-me pages stay OFF the live site
// AND the Atlas page's "Work with me" CTA stays hidden. Flip to true in ONE place
// to relaunch both together.
// 2026-06-25: flipped ON. Staleness audit run on the 3 showcase artifacts — IC memo
// clean; obesity ETLM corrected (orforglipron + MariTide estimands, primary-source
// verified); obesity 1L TPP PULLED pending refresh (re-add when its redraft passes QC).
export const WWM_LIVE = true;
