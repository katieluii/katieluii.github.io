/* Shared FLAGSHIP indication set — the single source consumed by both the Atlas
   project page (interactive coloured bubbles) and the Work-With-Me pages
   (editorial coverage grid), so the two can't drift. A curated set across four
   therapeutic areas chosen to show breadth, not to enumerate the full active
   roster (40+ indications each carry their own ETLM). Benchmark assets are the
   standard of care in each setting (current as of mid-2026). */

export type TherapeuticArea = 'oncology' | 'neuro' | 'immunology' | 'cardiometabolic';

export interface Indication {
  code: string;
  full?: string;
  ta: TherapeuticArea;
  assets: { name: string; meta: string }[];
}

/* TA display labels + canonical render order. Presentation (colours/classes)
   stays page-local — Atlas styles its bubbles, WWM stays single-accent. */
export const TA_META: { key: TherapeuticArea; label: string }[] = [
  { key: 'oncology', label: 'Oncology' },
  { key: 'neuro', label: 'Neurology' },
  { key: 'immunology', label: 'Immunology' },
  { key: 'cardiometabolic', label: 'Cardiometabolic' },
];

export const INDICATIONS: Indication[] = [
  // ── Oncology ──
  {
    code: 'NSCLC',
    full: 'Non-small cell lung cancer',
    ta: 'oncology',
    assets: [
      { name: 'Tagrisso (osimertinib)', meta: 'EGFR TKI , 1L / adjuvant standard' },
      { name: 'Keytruda (pembrolizumab)', meta: 'PD-1 , 1L mono + combo' },
      { name: 'Rybrevant (amivantamab)', meta: 'EGFR × MET bispecific , 1L EGFR+' },
    ],
  },
  {
    code: 'Breast',
    full: 'Breast cancer',
    ta: 'oncology',
    assets: [
      { name: 'Enhertu (T-DXd)', meta: 'HER2 ADC , HER2+ / HER2-low' },
      { name: 'Verzenio (abemaciclib)', meta: 'CDK4/6i , HR+ adjuvant + 1L mBC' },
      { name: 'Dato-DXd (datopotamab)', meta: 'TROP2 ADC , post-CDK4/6 HR+' },
    ],
  },
  {
    code: 'CRC',
    full: 'Colorectal cancer',
    ta: 'oncology',
    assets: [
      { name: 'Keytruda (pembrolizumab)', meta: 'PD-1 , MSI-H 1L mCRC' },
      { name: 'Avastin (bevacizumab) + chemo', meta: 'VEGF combo , 1L mCRC standard' },
      { name: 'Braftovi + Erbitux', meta: 'BRAF + EGFR , BRAF V600E mCRC' },
    ],
  },
  {
    code: 'Prostate',
    full: 'Prostate cancer (mCRPC / mHSPC)',
    ta: 'oncology',
    assets: [
      { name: 'Pluvicto', meta: 'Lu-177-PSMA , post-ARSI mCRPC' },
      { name: 'Xtandi (enzalutamide)', meta: 'AR inhibitor , mHSPC + mCRPC' },
      { name: 'Zytiga (abiraterone)', meta: 'CYP17 + AR , mHSPC + mCRPC' },
    ],
  },
  {
    code: 'Melanoma',
    ta: 'oncology',
    assets: [
      { name: 'Opdualag (nivo + rela)', meta: 'PD-1 + LAG-3 , 1L unresectable' },
      { name: 'Keytruda (pembrolizumab)', meta: 'PD-1 , 1L + adjuvant' },
      { name: 'Tafinlar + Mekinist', meta: 'BRAF + MEK , BRAF V600 mut' },
    ],
  },
  {
    code: 'SCLC',
    full: 'Small cell lung cancer',
    ta: 'oncology',
    assets: [
      { name: 'Imdelltra (tarlatamab)', meta: 'DLL3 BiTE , 2L+ ES-SCLC' },
      { name: 'Tecentriq + chemo', meta: 'PD-L1 + EP , 1L ES-SCLC' },
      { name: 'Zepzelca (lurbinectedin)', meta: 'RNA-Pol II inhibitor , 2L' },
    ],
  },
  {
    code: 'MM',
    full: 'Multiple myeloma',
    ta: 'oncology',
    assets: [
      { name: 'Carvykti (cilta-cel)', meta: 'BCMA CAR-T , 2L+ moving to 1L' },
      { name: 'Tecvayli (teclistamab)', meta: 'BCMA bispecific , RRMM' },
      { name: 'Talvey (talquetamab)', meta: 'GPRC5D bispecific , RRMM' },
    ],
  },
  {
    code: 'NHL / DLBCL',
    full: 'Non-Hodgkin lymphoma , DLBCL focus',
    ta: 'oncology',
    assets: [
      { name: 'Polivy (pola-R-CHP)', meta: 'CD79b ADC , 1L DLBCL' },
      { name: 'Yescarta (axi-cel)', meta: 'CD19 CAR-T , 2L+ rrLBCL' },
      { name: 'Epkinly (epcoritamab)', meta: 'CD20 × CD3 bispecific , 3L+' },
    ],
  },
  // ── Neurology ──
  {
    code: "Parkinson's",
    full: "Parkinson's disease",
    ta: 'neuro',
    assets: [
      { name: 'Levodopa + carbidopa', meta: 'Dopaminergic SoC , 60-year anchor' },
      { name: 'Tavapadon', meta: 'D1/D5 partial agonist , TEMPO Ph3' },
      { name: 'Bemdaneprocel', meta: 'iPSC-derived dopaminergic cell therapy , Ph2' },
    ],
  },
  {
    code: 'Alzheimer’s',
    full: "Alzheimer's disease",
    ta: 'neuro',
    assets: [
      { name: 'Leqembi (lecanemab)', meta: 'Anti-amyloid mAb , early AD, first to slow decline' },
      { name: 'Kisunla (donanemab)', meta: 'Anti-amyloid mAb , early symptomatic AD' },
      { name: 'Aricept (donepezil)', meta: 'Cholinesterase inhibitor , symptomatic anchor' },
    ],
  },
  {
    code: 'MS',
    full: 'Multiple sclerosis',
    ta: 'neuro',
    assets: [
      { name: 'Ocrevus (ocrelizumab)', meta: 'Anti-CD20 , RMS + PPMS standard' },
      { name: 'Kesimpta (ofatumumab)', meta: 'Anti-CD20 SC , relapsing MS' },
      { name: 'Tysabri (natalizumab)', meta: 'α4-integrin , highly active RMS' },
    ],
  },
  {
    code: 'ALS',
    full: 'Amyotrophic lateral sclerosis',
    ta: 'neuro',
    assets: [
      { name: 'Riluzole', meta: 'Glutamate modulator , 1995 survival anchor' },
      { name: 'Radicava (edaravone)', meta: 'Free-radical scavenger , functional decline' },
      { name: 'Qalsody (tofersen)', meta: 'SOD1 antisense , SOD1-ALS' },
    ],
  },
  // ── Immunology ──
  {
    code: 'RA',
    full: 'Rheumatoid arthritis',
    ta: 'immunology',
    assets: [
      { name: 'Humira (adalimumab)', meta: 'TNF inhibitor , biologic anchor' },
      { name: 'Rinvoq (upadacitinib)', meta: 'JAK1 inhibitor , oral advanced' },
      { name: 'Actemra (tocilizumab)', meta: 'IL-6R , post-TNF / combo' },
    ],
  },
  {
    code: 'Psoriasis',
    ta: 'immunology',
    assets: [
      { name: 'Skyrizi (risankizumab)', meta: 'IL-23 , highest PASI bar' },
      { name: 'Bimzelx (bimekizumab)', meta: 'IL-17A/F , PASI 100 leader' },
      { name: 'Sotyktu (deucravacitinib)', meta: 'TYK2 , oral moderate-severe' },
    ],
  },
  {
    code: 'UC',
    full: 'Ulcerative colitis',
    ta: 'immunology',
    assets: [
      { name: 'Entyvio (vedolizumab)', meta: 'α4β7 gut-selective , 1L biologic' },
      { name: 'Rinvoq (upadacitinib)', meta: 'JAK1 , oral advanced' },
      { name: 'Stelara (ustekinumab)', meta: 'IL-12/23 , moderate-severe' },
    ],
  },
  {
    code: 'SLE',
    full: 'Systemic lupus erythematosus',
    ta: 'immunology',
    assets: [
      { name: 'Benlysta (belimumab)', meta: 'BLyS inhibitor , SLE + lupus nephritis' },
      { name: 'Saphnelo (anifrolumab)', meta: 'Type-I IFNAR , moderate-severe SLE' },
      { name: 'MMF + corticosteroids', meta: 'Immunosuppression , anchor of care' },
    ],
  },
  {
    code: 'Atopic derm.',
    full: 'Atopic dermatitis',
    ta: 'immunology',
    assets: [
      { name: 'Dupixent (dupilumab)', meta: 'IL-4Rα , biologic anchor' },
      { name: 'Rinvoq (upadacitinib)', meta: 'JAK1 , oral moderate-severe' },
      { name: 'Adbry (tralokinumab)', meta: 'IL-13 , biologic alternative' },
    ],
  },
  // ── Cardiometabolic ──
  {
    code: 'Obesity',
    ta: 'cardiometabolic',
    assets: [
      { name: 'Zepbound (tirzepatide)', meta: 'GLP-1 + GIP , TBWL -22.5% bar' },
      { name: 'Wegovy (semaglutide)', meta: 'GLP-1 , SELECT MACE benefit' },
      { name: 'Retatrutide', meta: 'GLP-1 + GIP + glucagon triple , TBWL ~24% pending' },
    ],
  },
  {
    code: 'MASH',
    full: 'Metabolic dysfunction-associated steatohepatitis',
    ta: 'cardiometabolic',
    assets: [
      { name: 'Rezdiffra (resmetirom)', meta: 'THR-β agonist , first approved MASH' },
      { name: 'Semaglutide (GLP-1)', meta: 'ESSENCE Ph3 , fibrosis benefit' },
      { name: 'Lifestyle / standard care', meta: 'Fibrosis-stage anchor' },
    ],
  },
  {
    code: 'T1D',
    full: 'Type 1 diabetes',
    ta: 'cardiometabolic',
    assets: [
      { name: 'Tzield (teplizumab)', meta: 'Anti-CD3 , delays Stage-3 onset' },
      { name: 'Insulin (analog + AID)', meta: 'Standard of care anchor' },
      { name: 'Automated insulin delivery', meta: 'Closed-loop systems , standard' },
    ],
  },
];
