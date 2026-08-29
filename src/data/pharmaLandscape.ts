// Bellwether — the typed data layer for the /pharma-landscape page.
//
// ONE source. Every number here comes from src/data/bellwether.generated.json, which
// scripts/sync-bellwether-data.mjs extracts from the full landscape
// (public/demos/pharma-landscape.html) — the artefact the WS6 refresh loop edits and a
// human promotes. Nothing in this module is typed by hand; the hero counts, the
// "dominant crowding" set, the ladder bounds and the data-cut stamp are all DERIVED, so
// the page cannot drift from the landscape. `npm run sync:bellwether` after a promote;
// the build gate (scripts/bellwether-sync-plugin.ts) fails on a stale JSON.
//
// Provenance vocabulary the page uses (rendered in "What is on this page"; per-figure tags
// exist for the multiple basis and the growth basis, not yet for every field):
//   reported   — a company disclosure / filing for the quarter shown (rev, gr, dev)
//   consensus  — third-party sell-side consensus at the data cut (stance, targets); each stance
//                carries who compiled it (stanceSrc) and when (stanceDate) where the cut recorded them
//   estimated  — a modelled multiple where no clean forward figure exists (pos.est)
//   model      — a conclusion the system generated (thesis / bull / bear / signal)

import raw from './bellwether.generated.json';

export type Exposure = 'high' | 'med' | 'low';
export type EraKey = 'now' | '2026-28' | '2029-31';
export type GrowthBasis = 'reported' | 'constant currency' | 'underlying' | 'operational';
/** forward = a clean forward figure the SOP did not flag; estimated = anything else (trailing, NTM,
    single-aggregator) — the `est` flag the refresh maintains decides ranking, the `ev` string says why */
export type MultipleBasis = 'forward' | 'estimated';

export interface Company {
  ticker: string;
  name: string;
  ccy: string;
  loeAsset: string;
  era: EraKey;
  exp: Exposure;
  q: string;
  qdate: string;
  rev: string;
  gr: string;
  /** how the growth figure is stated — parsed from `gr`; shown next to the number */
  growthBasis: GrowthBasis;
  /** forward P/E on the precise valuation ladder; null = no clean forward figure */
  fpe: number | null;
  /** what the multiple in `pos.pe` actually is */
  multipleBasis: MultipleBasis;
  ev: string;
  yld: string | null;
  stance: string;
  /** who compiled the consensus stance; null = the cut did not record it (rendered as such, never guessed) */
  stanceSrc: string | null;
  /** as-of date of that consensus figure: the source's stated date, else the date it was observed.
      The 16 Aug 2026 cut observed all 13 that day but logged no source — date without source is that legacy state */
  stanceDate: string | null;
  /** market capitalisation with currency, at the close in `mcapDate`; null until a sweep records it */
  mcap: string | null;
  mcapDate: string | null;
  thesis: string;
  bull: string;
  bear: string;
  /** [date, event] dated developments, newest first as authored */
  dev: [string, string][];
  /** A–E franchise mix: [core growth, lifecycle protection, future value driver, mature/LOE-exposed, watchlist] */
  ph: [number, number, number, number, number];
  /** positioning: revenue growth % (g) and P/E (pe); est=true when the multiple is estimated */
  pos: { g: number; pe: number; est?: boolean };
}

export interface ConvergenceTheme {
  name: string;
  n: number;
  tk: string[];
  desc: string;
}

export interface Signal {
  kind: 'positive' | 'negative';
  tag: string;
  ticker: string;
  name: string;
  why: string;
  /** rationale points; may contain <b>…</b> from the source — render with <Emph> */
  pts: string[];
  prov: string;
}

// ── stamps (machine-derived from the landscape, never typed here) ─────────────
export const DATA_ASOF: string = raw.dataAsOf;
export const LAST_REVIEWED: string = raw.reviewed;
export const SAMPLE_RUN_LABEL = `${DATA_ASOF} reviewed run`;
export const FULL_LANDSCAPE_ROUTE = '/demos/pharma-landscape.html';
/** deep link into the full landscape with a company drawer open */
export const landscapeHref = (ticker?: string) => (ticker ? `${FULL_LANDSCAPE_ROUTE}#tk=${ticker}` : FULL_LANDSCAPE_ROUTE);

export const ERAS = raw.eras as Record<EraKey, { yr: string; cap: string }>;

// ── parsing the stated bases out of the source strings ────────────────────────
function growthBasisOf(gr: string): GrowthBasis {
  // only the headline figure's basis counts; a parenthetical states an ALTERNATIVE basis
  const s = gr.toLowerCase().replace(/\(.*\)/, '');
  if (/underlying/.test(s)) return 'underlying';
  if (/\bcc\b|\bcer\b|constant/.test(s)) return 'constant currency';
  if (/\bop\b|operational/.test(s)) return 'operational';
  return 'reported';
}
function multipleBasisOf(fpe: number | null, est?: boolean): MultipleBasis {
  return fpe != null && !est ? 'forward' : 'estimated';
}

type RawCompany = (typeof raw.companies)[number];
const pos = raw.pos as Record<string, { g: number; pe: number; est?: number | boolean }>;

export const COMPANIES: Company[] = (raw.companies as RawCompany[]).map((c) => {
  const p = pos[c.ticker];
  const est = !!p.est;
  return {
    ticker: c.ticker,
    name: c.name,
    ccy: c.ccy,
    loeAsset: c.loeAsset,
    era: c.era as EraKey,
    exp: c.exp as Exposure,
    q: c.q,
    qdate: c.qdate,
    rev: c.rev,
    gr: c.gr,
    growthBasis: growthBasisOf(c.gr),
    fpe: c.fpe as number | null,
    multipleBasis: multipleBasisOf(c.fpe as number | null, est),
    ev: c.ev,
    yld: c.yld as string | null,
    stance: c.stance,
    stanceSrc: (c.stanceSrc as string | null) ?? null,
    stanceDate: (c.stanceDate as string | null) ?? null,
    mcap: (c.mcap as string | null) ?? null,
    mcapDate: (c.mcapDate as string | null) ?? null,
    thesis: c.thesis,
    bull: c.bull,
    bear: c.bear,
    dev: c.dev as [string, string][],
    ph: c.ph as [number, number, number, number, number],
    pos: { g: p.g, pe: p.pe, ...(est ? { est: true } : {}) },
  };
});

export const CONVERGENCE: ConvergenceTheme[] = raw.convergence as ConvergenceTheme[];

// ── derived facts the page states (each computed, so it cannot go stale) ─────
export const UNIVERSE = COMPANIES.length; // 13
/** how many stances carry a recorded source — drives the consensus disclosure wording */
export const STANCES_SOURCED = COMPANIES.filter((c) => c.stanceSrc !== null).length;
/** how many stances carry an as-of date */
export const STANCES_DATED = COMPANIES.filter((c) => c.stanceDate !== null).length;
/** the consensus disclosure's provenance clause — derived, so it cannot describe a state the data is not in */
export const CONSENSUS_PROVENANCE_NOTE: string =
  STANCES_SOURCED === UNIVERSE && STANCES_DATED === UNIVERSE
    ? 'each with its as-of date and who compiled it'
    : STANCES_SOURCED === 0 && STANCES_DATED === UNIVERSE
      ? 'this cut records the as-of date of every stance but not who compiled it, and each line says so'
      : STANCES_SOURCED === 0 && STANCES_DATED === 0
        ? 'this cut recorded neither an as-of date nor a compiler for its stances, and each line says so'
        : `${STANCES_DATED} of ${UNIVERSE} carry an as-of date and ${STANCES_SOURCED} a recorded compiler; the rest say so`;
/** how many names carry a dated market cap — the screener shows the column only when > 0 */
export const MCAP_RECORDED = COMPANIES.filter((c) => c.mcap !== null).length;
export const highExposureCount = COMPANIES.filter((c) => c.exp === 'high').length;
export const onLadder = COMPANIES.filter((c) => c.fpe !== null && !c.pos.est);
export const offLadder = COMPANIES.filter((c) => !(c.fpe !== null && !c.pos.est)).map((c) => c.ticker);
export const ladderLo = Math.min(...onLadder.map((c) => c.fpe as number));
export const ladderHi = Math.max(...onLadder.map((c) => c.fpe as number));

/** "Dominant" crowding = themes drawing in more than a third of the field, ranked by count.
    Derived from the counts shown beside each theme, never by authoring order. */
export const DOMINANT_MIN = Math.ceil(UNIVERSE / 3); // 5 of 13
export const DOMINANT = [...CONVERGENCE].sort((a, b) => b.n - a.n).filter((t) => t.n >= DOMINANT_MIN);
export const crowdCount = (c: Company) => DOMINANT.filter((t) => t.tk.includes(c.ticker)).length;

/** the two extremes the run pulls furthest apart */
export const SIGNALS: Signal[] = (['buy', 'sell'] as const).map((k) => {
  const s = raw.signals[k];
  return {
    kind: k === 'buy' ? 'positive' : 'negative',
    tag: s.tag,
    ticker: s.tk,
    name: s.name,
    why: s.why,
    pts: s.pts,
    prov: s.prov,
  };
});

/** the latest dated quarter any company reports (a sanity cross-check against DATA_ASOF) */
const quarters = COMPANIES.map((c) => c.q).sort();
export const latestQuarterLabel = quarters.length ? quarters[quarters.length - 1] : DATA_ASOF;

// ── Keystone: one pair traced end-to-end to make the routing visible ──────────
// Same battleground (PD-1/VEGF bispecifics), two company shapes, two engines.
// Routing is the REAL deterministic output of router.classify_with_reason (WS6).
export interface TracedName {
  ticker: string;
  name: string;
  kind: 'largecap' | 'biotech';
  engine: string;
  engineDesc: string;
  /** verbatim reason string from the real router */
  classifyReason: string;
  decompose: string;
  score: string;
  provenance: string;
  provenanceNote?: string;
}

export const KEYSTONE_INTRO =
  'The routing is the differentiator: one deterministic classifier sends each company to the engine that fits how it should be valued. Two names in the same race, PD-1/VEGF bispecifics, going through it.';

export const KEYSTONE: TracedName[] = [
  {
    ticker: 'MRK', name: 'Merck & Co.', kind: 'largecap',
    engine: 'LOE / earnings / comps engine',
    engineDesc: 'A revenue-generating major is valued on earnings, franchise durability, loss-of-exclusivity timing and peer multiples.',
    classifyReason: 'matched curated large-cap profile MRK in largecap_kb',
    decompose: 'Franchise mix scored A to E: a large core-growth base (Keytruda, Winrevair) against a single dominant mature/LOE-exposed asset, Keytruda at about half of total revenue with a 2028 US cliff.',
    score: 'Momentum on reported revenue · valuation on normalised forward earnings · catalyst: subcutaneous Keytruda Qlex plus Cidara/Verona M&A building a post-2028 bridge.',
    provenance: 'Reported figures from the quarter shown on the MRK card; see VERIFY.md in the WS6 knowledge base.',
    provenanceNote: 'reported figures',
  },
  {
    ticker: 'SMMT', name: 'Summit Therapeutics', kind: 'biotech',
    engine: 'asset-NPV engine (feeds rNPV modelling)',
    engineDesc: 'A pre-commercial, pipeline-dominant company has no earnings to value, so it routes to asset-level analysis that decomposes the pipeline and extracts the inputs an rNPV model needs.',
    classifyReason: 'pipeline-dominant / pre-commercial profile (no forward guidance, no material group sales, no commercial therapeutic areas)',
    decompose: 'Value concentrates in one late-stage asset: ivonescimab, a PD-1/VEGF bispecific, the same modality the majors are crowding into.',
    score: 'Not scored on earnings or a P/E. The engine surfaces the rNPV inputs instead: probability of success, addressable market, and readout timing on the pivotal programme.',
    provenance: 'Classification is real deterministic router output. Asset-level valuation inputs (PoS, peak sales, readout dates) are what this engine extracts and are not asserted here.',
    provenanceNote: 'routing verified; asset figures not asserted',
  },
];
