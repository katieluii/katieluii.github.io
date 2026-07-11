// Single reusable data source for the AI-Native Pharma Equity Research case study.
// Ported from the WS6 large-pharma engine's Q1 2026 reviewed sample run
// (earnings-agent/largecap_kb/landscape.html). The React case-study surface reads
// from HERE; the full-landscape artifact (landscape.html) remains the full-product
// source of truth until Phase 2 unifies them onto this module.
//
// Provenance discipline (surfaced in the UI): every value is one of
//   'reported'   — taken from a company disclosure / filing on the dated quarter
//   'consensus'  — sell-side consensus (stance / targets)
//   'estimated'  — a modelled or estimated multiple where no clean forward figure exists
//   'model'      — a conclusion the system generated (thesis / bull / bear / signal)

export const DATA_ASOF = 'Q1 2026';
export const SAMPLE_RUN_LABEL = 'Q1 2026 reviewed sample run';
export const LAST_REVIEWED = 'Jul 2026';

export type Exposure = 'high' | 'med' | 'low';
export type EraKey = 'now' | '2026-28' | '2029-31';

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
  /** forward P/E used on the precise valuation ladder; null = no clean forward figure (shown estimated on positioning only) */
  fpe: number | null;
  ev: string;
  yld: string | null;
  stance: string;
  thesis: string;
  bull: string;
  bear: string;
  /** [date, event] dated developments */
  dev: [string, string][];
  /** A–E franchise mix: [core growth, lifecycle protection, future value driver, mature/LOE-exposed, watchlist] */
  ph: [number, number, number, number, number];
  /** positioning: revenue growth % (g) and forward P/E (pe); est=true when the multiple is estimated */
  pos: { g: number; pe: number; est?: boolean };
}

export const ERAS: Record<EraKey, { yr: string; cap: string }> = {
  now: { yr: '2023–2025', cap: 'Active erosion now' },
  '2026-28': { yr: '2026–2028', cap: 'Cliff approaching' },
  '2029-31': { yr: '2029–2031+', cap: 'Later this decade' },
};

export const COMPANIES: Company[] = [
  {
    ticker: 'LLY', name: 'Eli Lilly', ccy: 'USD', loeAsset: 'Tirzepatide (Mounjaro/Zepbound)', era: '2029-31', exp: 'med',
    q: 'Q1 2026', qdate: '30 Apr 2026', rev: '$19.8B', gr: '+56%', fpe: 33, ev: 'fwd P/E ~33× · EV/EBIT ~43×', yld: null,
    stance: 'Consensus Buy; avg target ~$1,270',
    thesis: 'GLP-1 dominance — now extended to oral orforglipron — driving historic growth; the debate is diversification and US pricing before early-2030s cliffs.',
    bull: 'Oral orforglipron is now approved and launching, extending the obesity franchise beyond injectables and widening the lead over Novo after CagriSema’s miss.',
    bear: 'US MFN/TrumpRx concessions compress GLP-1 net prices, and a ~33× forward multiple leaves little room for any volume or reimbursement disappointment.',
    dev: [['Apr 2026', 'FDA approved oral orforglipron (Foundayo) — first oral GLP-1 with no food/water restriction (~12.4% loss)'], ['Nov 2025', 'MFN / TrumpRx pricing deal — orforglipron pill to ~$346/mo'], ['Q1 2026', 'Mounjaro $8.7B (+125%), Zepbound $4.2B; FY26 guide raised to $82–85B rev, $35.50–37.00 EPS']],
    ph: [4, 0, 3, 1, 0], pos: { g: 56, pe: 33 },
  },
  {
    ticker: 'JNJ', name: 'Johnson & Johnson', ccy: 'USD', loeAsset: 'Stelara (ustekinumab)', era: 'now', exp: 'high',
    q: 'Q1 2026', qdate: '14 Apr 2026', rev: '$24.1B', gr: '+9.9%', fpe: 17.9, ev: 'fwd P/E ~17.9×', yld: null,
    stance: 'Buy/Hold split; targets ~$210–238',
    thesis: 'Healthcare’s only Pharma+MedTech giant proving it can “grow through” the Stelara cliff — against a reopened talc overhang.',
    bull: 'Drug-cycle strength (Darzalex, Tremfya, Rybrevant, Caplyta) plus a MedTech recovery drove a raised FY outlook despite Stelara.',
    bear: 'The Stelara cliff is biting harder and the talc overhang reverted to open-ended tort litigation after the bankruptcy was thrown out — widening the tail risk.',
    dev: [['Q1 2026', 'Rev +9.9% (Innovative Medicine +11%, MedTech +8%); FY26 guide raised, dividend +3.1%'], ['Dec 2025', 'Record $1.5B Baltimore talc verdict; ~68,000 MDL claims after the bankruptcy path was dismissed'], ['2026', 'Stelara erosion accelerating — 8 US biosimilars + a 66% IRA Medicare price cut now live']],
    ph: [8, 0, 1, 1, 1], pos: { g: 9.9, pe: 17.9 },
  },
  {
    ticker: 'ABBV', name: 'AbbVie', ccy: 'USD', loeAsset: 'Humira (adalimumab)', era: 'now', exp: 'high',
    q: 'Q1 2026', qdate: '29 Apr 2026', rev: '$15.0B', gr: '+12.4%', fpe: 14.4, ev: 'fwd P/E ~14× (growth premium)', yld: '~3.0%',
    stance: '~33 Buy / 9 Hold; target ~$229',
    thesis: 'The template for a successful cliff transition — Skyrizi+Rinvoq now more than offset Humira; the debate shifts to their own end-of-decade LOE.',
    bull: 'Skyrizi/Rinvoq now drive sector-leading double-digit growth with margins inflecting; Apogee plus obesity/neuroscience optionality extend the runway past Humira.',
    bear: 'The valuation prices in sustained execution — any Skyrizi/Rinvoq deceleration or pipeline miss leaves little margin for error.',
    dev: [['Q1 2026', 'Skyrizi ~$4.5B (+~30%) + Rinvoq ~$2.1B (+~20%) more than offset Humira −40%; FY26 guide raised'], ['Jun 2026', 'Apogee acquisition (long-acting IL-13) to extend immunology leadership'], ['2026', 'Early obesity data for amylin ABBV-295 (~10% at 12 wks); tavapadon Parkinson’s approval ~Q3']],
    ph: [5, 0, 4, 3, 1], pos: { g: 12.4, pe: 14.4 },
  },
  {
    ticker: 'NVS', name: 'Novartis', ccy: 'USD', loeAsset: 'Entresto (sacubitril/valsartan)', era: 'now', exp: 'high',
    q: 'Q1 2026', qdate: '28 Apr 2026', rev: '$13.1B', gr: '−1% (−5% cc)', fpe: 16.4, ev: 'fwd P/E ~16.4×', yld: null,
    stance: 'Strongly Buy-tilted; targets ~$154–170',
    thesis: 'Pure-play innovative medicines now in its Entresto-cliff trough year — can the growth cohort + Avidity re-accelerate once generics lap?',
    bull: '2026 is a guided trough — once Entresto laps, the Kisqali/Pluvicto/Scemblix/Leqvio/Kesimpta cohort plus Avidity should re-accelerate growth, backed by a large buyback.',
    bear: 'Q1 missed on both sales and EPS with core income guided to decline — the growth brands haven’t yet proven they can fully cover Entresto/Promacta/Tasigna erosion.',
    dev: [['Q1 2026', 'Entresto −42% (−46% cc) on US generics; Q1 missed (rev −5% cc, core EPS −13%)'], ['2026', '~$12B Avidity (RNA/neuromuscular) acquisition to rebuild the pipeline; ~$1.6B Q1 buyback (~$3.9B cumulative on the $10B program)'], ['FY2026', 'Guidance: low-single-digit sales growth, low-single-digit core-operating-income decline (analysts frame 2026 as the trough)']],
    ph: [7, 0, 1, 1, 1], pos: { g: -1, pe: 16.4 },
  },
  {
    ticker: 'AZN', name: 'AstraZeneca', ccy: 'USD', loeAsset: 'Tagrisso + oncology cohort', era: '2026-28', exp: 'med',
    q: 'Q1 2026', qdate: '29 Apr 2026', rev: '$15.3B', gr: '+8%', fpe: 17.9, ev: 'fwd P/E ~17.9×', yld: null,
    stance: 'Buy/Strong Buy; targets ~$205–235',
    thesis: 'Diversified pharma toward an $80bn 2030 target on pipeline breadth — can depth offset oncology concentration and a US regulatory wobble?',
    bull: 'Deep late-stage oncology + rare-disease engine driving double-digit core EPS, now adding an obesity/cardiometabolic leg via the CSPC deal.',
    bear: 'The camizestrant ODAC 3–6 vote + PDUFA extension is a real US regulatory setback for a key growth asset, and a revenue-reporting-basis question dents transparency.',
    dev: [['Q1 2026', 'Rev +8%; Oncology $6.8B (+16%), core EPS $2.58 beat; core gross margin 83%'], ['Apr 2026', 'Camizestrant (SERENA-6): FDA ODAC voted 6–3 against + PDUFA extended, though EU CHMP positive'], ['May 2026', '$1.2B-upfront CSPC obesity/T2D deal (up to ~$5.3B); Datroway (TROP2 ADC) approved 1L TNBC (immunotherapy-ineligible subset)']],
    ph: [7, 0, 4, 2, 1], pos: { g: 8, pe: 17.9 },
  },
  {
    ticker: 'MRK', name: 'Merck & Co.', ccy: 'USD', loeAsset: 'Keytruda (pembrolizumab)', era: '2026-28', exp: 'high',
    q: 'Q1 2026', qdate: '30 Apr 2026', rev: '$16.3B', gr: '+5%', fpe: 14.4, ev: 'fwd P/E ~14.4× · ~3.1% yield', yld: '~3.1%',
    stance: 'Lean-bullish; avg target ~$127',
    thesis: 'The industry’s largest cliff: Keytruda >50% of revenue, US LOE 2028 — can Qlex + 20+ drivers + M&A replace it in time?',
    bull: 'Cheap ~14× multiple, Keytruda still growing double-digits, and Qlex subcutaneous + Winrevair + M&A (Verona, Cidara) build a credible post-2028 bridge.',
    bear: 'The 2028 Keytruda cliff (~half of revenue) remains the dominant risk — “a huge, huge amount to replace” with as-yet-unproven pipeline.',
    dev: [['Q1 2026', 'Keytruda $8.03B (+12%), incl. subcutaneous Keytruda Qlex; Winrevair $525M (+88%)'], ['Jan 2026', 'Closed Cidara (~$9.2B, long-acting flu antiviral); Verona / Ohtuvayre closed Oct 2025'], ['FY2026', 'Guidance raised — revenue $65.8–67.0B, adjusted EPS $5.04–5.16']],
    ph: [6, 1, 1, 1, 1], pos: { g: 5, pe: 14.4 },
  },
  {
    ticker: 'PFE', name: 'Pfizer', ccy: 'USD', loeAsset: 'Ibrance + small-molecule portfolio', era: '2026-28', exp: 'high',
    q: 'Q1 2026', qdate: '5 May 2026', rev: '$14.5B', gr: '+2% op (+7% ex-COVID)', fpe: 9, ev: 'fwd P/E ~9× · ~6% yield', yld: '~6.0%',
    stance: 'ICICI Buy; target ~$29',
    thesis: 'Post-COVID turnaround now betting on obesity (Metsera) and ADCs — can new platforms offset the 2026–30 cliff before COVID fades?',
    bull: 'Metsera re-establishes an obesity platform (monthly dosing), the ex-COVID base is growing +7%, and a ~9× forward P/E with a ~6% yield is deep value.',
    bear: 'Obesity re-entry is early and unproven (a Phase 2 disappointment already hit shares), MFN/TrumpRx pressures the base, and the 2028 Eliquis cliff still looms.',
    dev: [['Nov 2025', 'Closed Metsera (up to ~$10B; won vs Novo) — re-enters obesity with monthly injectable incretins'], ['Sep 2025', 'MFN pricing deal + 3-yr tariff exemption; TrumpRx participation'], ['Jun 2026', 'Seagen-derived ADC (sigvotatug vedotin) missed OS in late-stage NSCLC — a knock to the thesis (Q1 ex-COVID base +7%)']],
    ph: [7, 1, 3, 4, 1], pos: { g: 2, pe: 9 },
  },
  {
    ticker: 'BMY', name: 'Bristol-Myers Squibb', ccy: 'USD', loeAsset: 'Eliquis · Opdivo (Revlimid done)', era: '2026-28', exp: 'high',
    q: 'Q1 2026', qdate: 'late Apr 2026', rev: '$11.5B', gr: '+1%', fpe: 8.7, ev: 'fwd P/E ~8.7× · ~4.4% yield', yld: '~4.4%',
    stance: 'Hold-leaning; target ~$61–63',
    thesis: 'Sequential LOE of its biggest drivers — and in Q1 2026 the Growth Portfolio finally crossed above the Legacy bucket.',
    bull: 'The Growth Portfolio now out-earns Legacy, and with H2 2026 milvexian (FXIa) readouts plus a single-digit P/E and a ~4.4% yield the market may be over-discounting the bridge.',
    bear: 'The 2027–2029 Eliquis/Opdivo cliff — the largest growth gap in big pharma — still dwarfs the growth engine, and no guidance raise signals the offset isn’t yet proven.',
    dev: [['Q1 2026', 'Growth Portfolio ($6.23B) crossed above Legacy ($5.28B) — the pivotal bridge milestone'], ['Q1 2026', 'Cobenfy ~$56M (+107%) in its launch indication (adjunctive-schizophrenia ARISE trial missed in 2025)'], ['H2 2026', 'Milvexian (FXIa) pivotal readouts — LIBREXIA-AF / -STROKE — define the trajectory']],
    ph: [8, 1, 0, 4, 1], pos: { g: 1, pe: 8.7 },
  },
  {
    ticker: 'RHHBY', name: 'Roche', ccy: 'CHF', loeAsset: 'Avastin / Herceptin / Rituxan', era: 'now', exp: 'high',
    q: 'Q1 2026', qdate: '23 Apr 2026', rev: 'CHF 14.7B (group)', gr: '+6% cc (group; pharma +7%)', fpe: null, ev: 'P/E ~20× trailing (fwd n/a) · ADR target ~$56', yld: null,
    stance: 'Mixed; ~12% implied upside',
    thesis: 'The only integrated pharma+diagnostics player — and it has just assembled a credible top-3 obesity + MASH portfolio to bridge the cliff.',
    bull: 'Roche has assembled a credible top-3 obesity + MASH cardiometabolic portfolio (CT-388, petrelintide, pegozafermin) — a genuinely new growth narrative.',
    bear: 'FX translation drag, China diagnostics pricing and a still-real biosimilar/LOE step-down persist while the obesity bets remain unproven at Phase 3.',
    dev: [['Q4 2025', 'Closed 89bio (~$2.4B) — pegozafermin (FGF21) Ph3 MASH, pivotal readout expected H1 2027'], ['Jan–Mar 2026', 'Obesity Ph2 wins — CT-388 (54% obesity resolution) + petrelintide; Ph3 CT-388 started Q1'], ['2024–25', 'TIGIT (tiragolumab) program scrapped after SKYSCRAPER failures — a now-settled negative']],
    ph: [7, 0, 5, 2, 1], pos: { g: 6, pe: 20, est: true },
  },
  {
    ticker: 'NVO', name: 'Novo Nordisk', ccy: 'DKK', loeAsset: 'Semaglutide (patents into 2030s)', era: '2029-31', exp: 'low',
    q: 'Q1 2026', qdate: '6 May 2026', rev: 'DKK', gr: '−4% cc underlying', fpe: null, ev: 'NTM P/E ~13× (vs ~28× 3-yr avg) · Hold, ~DKK310', yld: null,
    stance: 'Mixed consensus (Hold-to-Buy)',
    thesis: 'Dominant GLP-1 franchise now on the defensive — CagriSema lost its head-to-head to Zepbound, flipping the case from momentum to share defence vs Lilly.',
    bull: 'Massive, still-expanding market — oral Wegovy uptake plus Alzheimer’s / MASH / CV indication expansion — on a de-rated ~13× multiple.',
    bear: 'CagriSema’s head-to-head miss, negative guided growth, US price cuts and Lilly’s oral lead have turned Novo into a share-loser story with a Hold consensus.',
    dev: [['Feb 2026', 'CagriSema FAILED REDEFINE-4 head-to-head vs Zepbound (−20% vs −24%); stock −16%'], ['Jan 2026', 'Oral Wegovy launched in the US (~$354M in Q1); amycretin renamed zenagamtide, entering late-stage'], ['FY2026', 'Guidance still negative (−4% to −12% cc); underlying sales ex one-off fell ~4%']],
    ph: [3, 2, 6, 2, 1], pos: { g: -4, pe: 13, est: true },
  },
  {
    ticker: 'BIIB', name: 'Biogen', ccy: 'USD', loeAsset: 'Tysabri · Tecfidera (biosimilar/generic)', era: 'now', exp: 'high',
    q: 'Q1 2026', qdate: '29 Apr 2026', rev: '$2.48B', gr: '+2%', fpe: 12.5, ev: 'fwd P/E ~12–13× (trailing ~17×)', yld: null,
    stance: 'Buy; target ~$220',
    thesis: 'Polarized transformation — now buying growth (Apellis) to outrun MS erosion while a deep Ph3 stack and a contested Leqembi decide the re-rating.',
    bull: 'Apellis adds ophthalmology + rare-disease revenue, Leqembi subcutaneous/China broadens the ramp, and a deep 2026–27 Ph3 stack could re-rate a low-teens multiple.',
    bear: 'MS decline still sets the top-line down mid-single-digits, Leqembi uptake stays slow, and growth is being bought with ~$2B debt + IPR&D dilution rather than earned.',
    dev: [['May 2026', 'Completed Apellis (~$5.6B) — adds SYFOVRE (geographic atrophy) + EMPAVELI (rare disease)'], ['Mar 2026', 'High-dose SPINRAZA FDA-approved — defends the SMA franchise vs Roche’s Evrysdi'], ['FY2026', 'Guide cut to $14.25–15.25 (~$1 IPR&D dilution); revenue guided to a mid-single-digit decline']],
    ph: [3, 1, 2, 4, 0], pos: { g: 2, pe: 12.5 },
  },
  {
    ticker: 'SNY', name: 'Sanofi', ccy: 'EUR', loeAsset: 'Dupixent (2031)', era: '2029-31', exp: 'high',
    q: 'Q1 2026', qdate: '23 Apr 2026', rev: '€10.5B', gr: '+13.6% cc', fpe: null, ev: '~9× FY26E P/E (est.) · ADR target ~$56–60', yld: null,
    stance: 'Buy/Hold, no sells',
    thesis: 'Immunology-driven transformation on Dupixent — building an innovation-led launch cohort to diversify before the 2031 cliff.',
    bull: 'Dupixent +31% plus a maturing launch cohort (amlitelimab Ph3 progress, Blueprint/Dynavax) diversifies the growth base ahead of the 2031 cliff.',
    bear: 'The thesis still hinges on replacing Dupixent’s ~40% revenue concentration before 2031 — the launches are progressing but not yet proven at scale.',
    dev: [['Q1 2026', 'Dupixent €4.17B (+31% cc); new launches €1.2B (+50%), ~14% of pharma-segment sales; business EPS +14%'], ['Jan 2026', 'Amlitelimab Ph3 in atopic dermatitis — COAST 1 & SHORE positive, COAST 2 mixed; submissions H2 2026'], ['2025–26', 'Blueprint + Dynavax acquisitions now contributing to the launch cohort']],
    ph: [3, 0, 2, 0, 0], pos: { g: 13.6, pe: 9, est: true },
  },
  {
    ticker: 'GSK', name: 'GSK', ccy: 'GBP', loeAsset: 'Upcoming key expiries (unspecified)', era: '2026-28', exp: 'med',
    q: 'Q1 2026', qdate: '29 Apr 2026', rev: '£7.6B', gr: '+5%', fpe: 11, ev: 'fwd P/E ~11× (cheapest of the EU majors)', yld: null,
    stance: 'Hold; target ~$57',
    thesis: 'Post-Haleon focused biopharma under a new product-centric CEO; Specialty Medicines (+14%) is the growth engine, still on a deep peer discount.',
    bull: 'A new product-centric CEO plus a validated specialty engine (Blenrep back on market, Specialty +14%) on a low-double-digit P/E leaves clear re-rating room.',
    bear: 'General Medicines drag, a Hold consensus, and execution/continuity risk through the leadership handover keep it a show-me story.',
    dev: [['Jan 2026', 'Luke Miels became CEO (product-centric strategy); Emma Walmsley departed'], ['Q4 2025', 'Blenrep (myeloma ADC) FDA-approved — a comeback after its 2022 withdrawal; 5/5 FDA approvals in 2025'], ['Q1 2026', 'Specialty Medicines +14% now the primary growth engine; core EPS +9%']],
    ph: [5, 0, 1, 1, 1], pos: { g: 5, pe: 11 },
  },
];

export interface ConvergenceTheme {
  name: string;
  n: number;
  tk: string[];
  desc: string;
}

export const CONVERGENCE: ConvergenceTheme[] = [
  { name: 'Obesity & incretins', n: 6, tk: ['LLY', 'NVO', 'RHHBY', 'PFE', 'AZN', 'ABBV'], desc: 'Leadership decisively shifted to Lilly — oral orforglipron was approved (Apr 2026) while Novo’s CagriSema lost its head-to-head to Zepbound (Feb 2026). Roche has emerged as a credible #3 (CT-388, petrelintide); Pfizer re-entered via Metsera. Amylin is the next battleground.' },
  { name: 'ADCs & radiopharmaceuticals', n: 7, tk: ['MRK', 'AZN', 'BMY', 'NVS', 'JNJ', 'PFE', 'GSK'], desc: 'Targeted oncology payloads — Datroway (TROP2) was approved in 1L TNBC (2026) and radioligand deals keep coming (Pluvicto ~$2B FY2025, +42%). Not all wins: a Seagen-derived Pfizer ADC missed OS in NSCLC.' },
  { name: 'PD-1/PD-L1 × VEGF bispecifics', n: 4, tk: ['BMY', 'PFE', 'MRK', 'SNY'], desc: 'The newest IO pile-on — capital keeps pouring in (Pfizer paid $1.25B for SSGJ-707; BMS’s ~$11B BNT327), but the decisive Western Phase 3 overall-survival proof is still pending. The pile-on partly rests on faith.' },
  { name: 'Next-gen immunology (I&I)', n: 6, tk: ['SNY', 'NVS', 'BIIB', 'MRK', 'LLY', 'ABBV'], desc: 'Long-acting biologics, oral IL-17/integrin, TL1A, BTK and in-vivo cell therapy across derm, IBD, lupus and kidney disease. Sanofi’s amlitelimab and Biogen’s felzartamab posted Ph3/Ph3-program progress in 2026.' },
  { name: 'Cardiovascular — Lp(a) / FXI / anti-inflammatory', n: 1, tk: ['NVS'], desc: 'Distinctly a Novartis lane — pelacarsen (Lp(a)), abelacimab (FXI), pacibekitug (IL-6) target residual CV risk, alongside a ~$12B Avidity deal to rebuild the pipeline.' },
];

// Top-of-page findings (the 3 the case study foregrounds). Each links into the full landscape.
export interface Finding {
  key: string;
  kind: 'positive' | 'negative' | 'structural';
  label: string;
  headline: string;
  detail: string;
  proof: string;
  ticker?: string;
}

export const FINDINGS: Finding[] = [
  {
    key: 'abbv', kind: 'positive', ticker: 'ABBV', label: 'Strongest risk-adjusted positioning',
    headline: 'AbbVie',
    detail: 'The one name that has already navigated its cliff and re-accelerated: Humira’s loss of exclusivity is fully in the numbers, yet Skyrizi + Rinvoq drove sector-leading growth.',
    proof: '+12.4% Q1 revenue growth with the Humira cliff already absorbed — still growing, and trading well below Lilly’s ~33× premium multiple.',
  },
  {
    key: 'nvo', kind: 'negative', ticker: 'NVO', label: 'Largest negative revision',
    headline: 'Novo Nordisk',
    detail: 'A dominant franchise flipped to defence: CagriSema lost its head-to-head to Lilly’s Zepbound, and guidance turned to shrinking underlying sales.',
    proof: 'FY2026 guided to −4% to −12% underlying, and the stock de-rated to ~13× forward as sentiment turned cautious.',
  },
  {
    key: 'concentration', kind: 'structural', label: 'Sector concentration risk',
    headline: 'Three crowded bets',
    detail: 'Aggregating every named pipeline asset across the 13, the field converges hard: obesity/incretins, ADCs & radiopharmaceuticals, and PD-(L)1/VEGF bispecifics each pull in a large share of the majors.',
    proof: '6, 7 and 4 of 13 companies respectively — crowding concentrates the same risk across the sector.',
  },
];

// Headline metrics for the hero (deliberately NOT "2 engines").
export const HERO_METRICS = [
  { value: '13', label: 'companies normalised into one comparable view' },
  { value: '9', label: 'carrying material patent-cliff exposure' },
  { value: '3', label: 'dominant areas of pipeline crowding' },
];

// Derived counts (kept honest against COMPANIES so the hero can’t drift from the data).
export const highExposureCount = COMPANIES.filter((c) => c.exp === 'high').length; // 9
export const onLadderCount = COMPANIES.filter((c) => c.fpe !== null).length; // 10
export const offLadder = COMPANIES.filter((c) => c.fpe === null).map((c) => c.ticker); // RHHBY, NVO, SNY

// ── Keystone: one pair traced end-to-end to make the routing visible ────────
// Same battleground (PD-1/VEGF bispecifics), two company shapes, two engines.
// Routing is the REAL deterministic output of router.classify_with_reason.
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
  /** whether the provenance figures are reported facts or need sourcing */
  provenanceNote?: string;
}

export const KEYSTONE_INTRO =
  'The differentiator is the routing: the same deterministic classifier sends each company to the engine that fits how it should actually be valued. Here are two names in the same race — PD-1/VEGF bispecifics — going through it.';

export const KEYSTONE: TracedName[] = [
  {
    ticker: 'MRK', name: 'Merck & Co.', kind: 'largecap',
    engine: 'LOE / earnings / comps engine',
    engineDesc: 'A revenue-generating major is valued on earnings, franchise durability, loss-of-exclusivity timing and peer multiples.',
    classifyReason: 'matched curated large-cap profile MRK in largecap_kb',
    decompose: 'Franchise mix scored A–E: a large core-growth base (Keytruda, Winrevair) against a single dominant mature/LOE-exposed asset — Keytruda at ~half of total revenue with a 2028 US cliff.',
    score: 'Momentum +5% Q1 revenue · valuation cheap on normalised forward earnings · catalyst: subcutaneous Keytruda Qlex + Cidara/Verona M&A building a post-2028 bridge.',
    provenance: 'Q1 2026 results (30 Apr 2026); Keytruda $8.03B (+12%); FY26 guidance $65.8–67.0B.',
    provenanceNote: 'reported figures — see VERIFY.md',
  },
  {
    ticker: 'SMMT', name: 'Summit Therapeutics', kind: 'biotech',
    engine: 'asset-NPV engine (feeds rNPV modelling)',
    engineDesc: 'A pre-commercial, pipeline-dominant company has no earnings to value — so it routes to asset-level analysis that decomposes the pipeline and extracts the inputs an rNPV model needs.',
    classifyReason: 'pipeline-dominant / pre-commercial profile (no forward guidance, no material group sales, no commercial therapeutic areas)',
    decompose: 'Value concentrates in one late-stage asset: ivonescimab, a PD-1/VEGF bispecific — the same modality the majors are crowding into.',
    score: 'Not scored on earnings or a P/E — the engine surfaces the rNPV inputs instead: probability of success, addressable market, and readout timing on the pivotal programme.',
    provenance: 'Classification is real deterministic router output. Asset-level valuation inputs (PoS, peak sales, readout dates) are what this engine extracts and are not asserted here.',
    provenanceNote: 'routing verified; asset figures require sourcing',
  },
];

export const FULL_LANDSCAPE_ROUTE = '/demos/pharma-landscape.html';
