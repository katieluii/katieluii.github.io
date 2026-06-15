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

// Funnel flag. While false, the WS15 /work-with-me pages stay OFF the live site
// (pending Katie's review + the corpus-wide stale-data audit) AND the Atlas page's
// "Work with me" CTA stays hidden. Flip to true in ONE place to relaunch both together.
export const WWM_LIVE = false;
