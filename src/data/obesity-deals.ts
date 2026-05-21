export interface ObesityDeal {
  year: number;
  quarter: string;
  acquirer: string;
  target: string;
  type: 'M&A' | 'Licensing';
  value: string;
  asset: string;
  scope: 'obesity' | 'metabolic';
  valueNote?: string;
}

export const OBESITY_DEALS: ObesityDeal[] = [
  // 2023
  {
    year: 2023, quarter: 'Q3',
    acquirer: 'Eli Lilly', target: 'Versanis Bio',
    type: 'M&A', value: 'Up to $1.9B',
    asset: 'Bimagrumab (anti-activin/myostatin)',
    scope: 'obesity',
  },
  {
    year: 2023, quarter: 'Q4',
    acquirer: 'Roche', target: 'Carmot Therapeutics',
    type: 'M&A', value: '$3.1B ($2.7B + $400M milestones)',
    asset: 'CT-388 / CT-996 (GLP-1/GIP dual + oral GLP-1)',
    scope: 'obesity',
  },
  // 2024
  {
    year: 2024, quarter: 'Q2',
    acquirer: 'Kailera Therapeutics', target: 'Jiangsu Hengrui',
    type: 'Licensing', value: 'Up to ~$6B',
    asset: 'HRS9531 / KAI-9531 (Dual GLP-1/GIP)',
    scope: 'obesity',
    valueNote: '$110M upfront + equity stake; $6B headline is back-loaded sales milestones',
  },
  // 2025
  {
    year: 2025, quarter: 'Q1',
    acquirer: 'Roche', target: 'Zealand Pharma',
    type: 'Licensing', value: '$5.3B ($1.65B upfront + milestones)',
    asset: 'Petrelintide (long-acting amylin analog)',
    scope: 'obesity',
  },
  {
    year: 2025, quarter: 'Q2',
    acquirer: 'Novo Holdings', target: 'Catalent',
    type: 'M&A', value: '$16.5B',
    asset: 'GLP-1 manufacturing capacity',
    scope: 'obesity',
  },
  {
    year: 2025, quarter: 'Q3',
    acquirer: 'Roche', target: '89bio',
    type: 'M&A', value: '~$3.5B ($2.4B + CVR)',
    asset: 'Pegozafermin (FGF21 analog, MASH)',
    scope: 'metabolic',
  },
  {
    year: 2025, quarter: 'Q4',
    acquirer: 'Pfizer', target: 'Metsera',
    type: 'M&A', value: '~$10B ($7B + CVRs)',
    asset: 'MET-097i (once-monthly GLP-1) + MET-233i (amylin)',
    scope: 'obesity',
  },
];
