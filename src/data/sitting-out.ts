export interface SittingOutCompany {
  ticker: string;
  name: string;
  hasPublicStatement: boolean;
  rationale: string;
  quote?: string;
  quoteSource?: string;
}

export const SITTING_OUT: SittingOutCompany[] = [
  {
    ticker: 'SNY',
    name: 'Sanofi',
    hasPublicStatement: true,
    rationale: 'Capital allocation shifted firmly to immunology (Dupixent) and vaccines. Former CEO Paul Hudson (stepped down Feb 2026) signalled Sanofi would not chase first-generation GLP-1 obesity drugs, framing immunology as its strategic equivalent.',
    quote: 'Immunology is effectively our obesity.',
    quoteSource: 'Paul Hudson, former CEO — Citeline/Scrip, Jan 2025',
  },
  {
    ticker: 'NVS',
    name: 'Novartis',
    hasPublicStatement: true,
    rationale: 'CEO Vas Narasimhan has been explicit that entering the GLP-1 obesity race as a late follower is not the right approach. Cardiometabolic strategy focused on Leqvio (inclisiran) rather than GLP-1/GIP. Actively deleveraging post-Sandoz spinoff.',
    quote: 'Coming in late with another one of the orals or injectable GLPs, GIPs, we think is not a prudent approach for us as a company.',
    quoteSource: 'Vas Narasimhan, CEO — Q2 2024 earnings call, July 2024',
  },
  {
    ticker: 'JNJ',
    name: 'Johnson & Johnson',
    hasPublicStatement: false,
    rationale: 'No GLP-1 or obesity programme. Capital recently deployed to cardiovascular (Shockwave) and CNS (Intra-Cellular, $14.6B); management has guided toward smaller bolt-on deals ahead. No metabolic pipeline signals.',
  },
  {
    ticker: 'BMY',
    name: 'Bristol-Myers Squibb',
    hasPublicStatement: false,
    rationale: 'No active obesity or GLP-1 programme. Strategic focus on oncology (Opdivo/Yervoy), cardiovascular (Camzyos/milvexian), and immunology. Has significant firepower but has not signalled any metabolic interest.',
  },
  {
    ticker: 'ABBV',
    name: 'AbbVie',
    hasPublicStatement: false,
    rationale: 'No active obesity programme. Post-Humira capital allocated to immunology (Skyrizi, Rinvoq), aesthetics (Allergan), and neuroscience. High net debt (~$62B) constrains large transformative M&A in the near term.',
  },
  {
    ticker: 'GSK',
    name: 'GSK',
    hasPublicStatement: false,
    rationale: 'No metabolic presence or publicly signalled interest in obesity assets. Vaccine-first strategy (Shingrix, RSV) and HIV (ViiV Healthcare) dominate capital allocation. No GLP-1 or related pipeline.',
  },
];
