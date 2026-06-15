import { useState } from 'react';
import {
  Network,
  Newspaper,
  Target,
  FlaskConical,
  ShieldCheck,
  GitBranch,
  Gauge,
  Layers,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  X,
} from 'lucide-react';
import ProjectPageLayout from '../components/ProjectPageLayout';
import { Pill } from '../components/Pill';
import { getProjectBySlug } from '../data/projects';
import { Reveal, emphasize } from '../components/shared/craft';
import AtlasDataflow from '../components/atlas/AtlasDataflow';
import { WWM_LIVE } from '../data/atlas/copy';

interface Capability {
  id: string;
  icon: React.ElementType;
  name: string;
  tag: string;
  detail: string;
  connected?: { label: string; href: string }[];
}

// the four streams — three feed the ETLM, one ships from it (lean one-liners)
const CAPABILITIES: Capability[] = [
  {
    id: 'landscape',
    icon: Network,
    name: 'Landscape mapping',
    tag: 'Strategic spine',
    detail: 'The per-indication strategic map, built from authoritative registries only — ClinicalTrials.gov, FDA, EMA, NCI Thesaurus.',
  },
  {
    id: 'literature',
    icon: FlaskConical,
    name: 'Literature scouting',
    tag: 'Novelty surveillance',
    detail: 'Reads PubMed, bioRxiv, and medRxiv for the novel assets registry searches miss.',
  },
  {
    id: 'news',
    icon: Newspaper,
    name: 'News-signal monitoring',
    tag: 'Live industry pulse',
    detail: 'Triages the trade press daily, turning material events — readouts, deals, label updates — into landscape edits.',
    connected: [
      { label: 'Clinical News', href: '/clinical-news' },
      { label: 'Conference Catalyst', href: '/conference-catalyst' },
    ],
  },
  {
    id: 'tpp',
    icon: Target,
    name: 'TPP drafting',
    tag: 'Decision artifact',
    detail: 'Drafts Target Product Profiles — the efficacy bar, the safety bar, and the axes that move the answer.',
  },
];

// governance lines (open text, no cards)
const GOVERNANCE = [
  {
    icon: ShieldCheck,
    title: 'Analysts on the judgment calls, not the rote refresh',
    detail: 'Routine updates land on their own; material shifts surface for human review before they go in.',
  },
  {
    icon: GitBranch,
    title: 'Conflict resolution as a first-class behaviour',
    detail: 'When sources disagree: date-compare → verify → escalate. Newer evidence wins on facts; every patch tagged.',
  },
];

// real samples in the reader — slugs verified against src/data/atlas/
const SELECTED_WORK = [
  { title: 'Obesity competitive landscape', kind: 'ETLM', href: '/atlas-reader/etlm/obesity' },
  { title: '1L injectable, BMI ≥ 30', kind: 'Target Product Profile', href: '/atlas-reader/tpp/tpp_obesity_1L_injectable_bmi30_2026-06-05' },
  { title: 'GLP-1 class — competitive supply', kind: 'Thematic synthesis', href: '/atlas-reader/theme/glp1_class_competitive_supply_2026-06-05' },
];

interface Indication {
  code: string;
  full?: string;
  ta: 'oncology' | 'neuro' | 'cardiometabolic';
  assets: { name: string; meta: string }[];
}

const INDICATIONS: Indication[] = [
  {
    code: 'NSCLC',
    full: 'Non-small cell lung cancer',
    ta: 'oncology',
    assets: [
      { name: 'Tagrisso (osimertinib)', meta: 'EGFR TKI · 1L / adjuvant standard' },
      { name: 'Keytruda (pembrolizumab)', meta: 'PD-1 · 1L mono + combo' },
      { name: 'Rybrevant (amivantamab)', meta: 'EGFR × MET bispecific · 1L EGFR+' },
    ],
  },
  {
    code: 'Breast',
    full: 'Breast cancer',
    ta: 'oncology',
    assets: [
      { name: 'Enhertu (T-DXd)', meta: 'HER2 ADC · HER2+ / HER2-low' },
      { name: 'Verzenio (abemaciclib)', meta: 'CDK4/6i · HR+ adjuvant + 1L mBC' },
      { name: 'Dato-DXd (datopotamab)', meta: 'TROP2 ADC · post-CDK4/6 HR+' },
    ],
  },
  {
    code: 'CRC',
    full: 'Colorectal cancer',
    ta: 'oncology',
    assets: [
      { name: 'Keytruda (pembrolizumab)', meta: 'PD-1 · MSI-H 1L mCRC' },
      { name: 'Avastin (bevacizumab) + chemo', meta: 'VEGF combo · 1L mCRC standard' },
      { name: 'Braftovi + Erbitux', meta: 'BRAF + EGFR · BRAF V600E mCRC' },
    ],
  },
  {
    code: 'PDAC',
    full: 'Pancreatic ductal adenocarcinoma',
    ta: 'oncology',
    assets: [
      { name: 'FOLFIRINOX', meta: 'Chemo · 1L fit pts standard' },
      { name: 'Nab-paclitaxel + gemcitabine', meta: 'Chemo · 1L unfit standard' },
      { name: 'Daraxonrasib', meta: 'RAS pan-inhibitor · RASolute 302 Ph3 paradigm shift' },
    ],
  },
  {
    code: 'HCC',
    full: 'Hepatocellular carcinoma',
    ta: 'oncology',
    assets: [
      { name: 'Tecentriq + Avastin', meta: 'PD-L1 + VEGF · 1L unresectable standard' },
      { name: 'Imjudo + Imfinzi', meta: 'CTLA-4 + PD-L1 · 1L STRIDE regimen' },
      { name: 'Lenvima (lenvatinib)', meta: 'Multikinase TKI · 1L TKI standard' },
    ],
  },
  {
    code: 'Prostate',
    full: 'Prostate cancer (mCRPC / mHSPC)',
    ta: 'oncology',
    assets: [
      { name: 'Pluvicto', meta: 'Lu-177-PSMA · post-ARSI mCRPC' },
      { name: 'Xtandi (enzalutamide)', meta: 'AR inhibitor · mHSPC + mCRPC' },
      { name: 'Zytiga (abiraterone)', meta: 'CYP17 + AR · mHSPC + mCRPC' },
    ],
  },
  {
    code: 'Ovarian',
    full: 'Epithelial ovarian cancer',
    ta: 'oncology',
    assets: [
      { name: 'Lynparza (olaparib)', meta: 'PARP inhibitor · HRD+ maintenance' },
      { name: 'Bevacizumab maintenance', meta: 'VEGF · 1L maintenance' },
      { name: 'Elahere (mirvetuximab)', meta: 'FRα ADC · PROC FRα-high' },
    ],
  },
  {
    code: 'Melanoma',
    ta: 'oncology',
    assets: [
      { name: 'Opdualag (nivo + rela)', meta: 'PD-1 + LAG-3 · 1L unresectable' },
      { name: 'Keytruda (pembrolizumab)', meta: 'PD-1 · 1L + adjuvant' },
      { name: 'Tafinlar + Mekinist', meta: 'BRAF + MEK · BRAF V600 mut' },
    ],
  },
  {
    code: 'Urothelial',
    full: 'Urothelial (bladder) cancer',
    ta: 'oncology',
    assets: [
      { name: 'Padcev + Keytruda', meta: 'Nectin-4 ADC + PD-1 · 1L mUC standard' },
      { name: 'Imfinzi (durvalumab)', meta: 'PD-L1 · MIBC perioperative NIAGARA' },
      { name: 'TAR-200', meta: 'Intravesical gemcitabine · NMIBC BCG-unresponsive · PDUFA Q3 2026' },
    ],
  },
  {
    code: 'SCLC',
    full: 'Small cell lung cancer',
    ta: 'oncology',
    assets: [
      { name: 'Imdelltra (tarlatamab)', meta: 'DLL3 BiTE · 2L+ ES-SCLC' },
      { name: 'Tecentriq + chemo', meta: 'PD-L1 + EP · 1L ES-SCLC' },
      { name: 'Zepzelca (lurbinectedin)', meta: 'RNA-Pol II inhibitor · 2L' },
    ],
  },
  {
    code: 'Thyroid',
    full: 'Thyroid cancer (DTC / MTC / ATC)',
    ta: 'oncology',
    assets: [
      { name: 'Retsevmo (selpercatinib)', meta: 'RET inhibitor · LIBRETTO-432 adjuvant readout' },
      { name: 'Lenvima (lenvatinib)', meta: 'Multikinase TKI · RAI-refractory DTC' },
      { name: 'Cabometyx (cabozantinib)', meta: 'Multikinase TKI · DTC + MTC' },
    ],
  },
  {
    code: 'GBM',
    full: 'Glioblastoma',
    ta: 'oncology',
    assets: [
      { name: 'Temozolomide + RT (Stupp)', meta: '1L SoC since 2005 — bar still unmoved' },
      { name: 'Optune (TTFields)', meta: 'Tumor-treating fields · 1L + recurrent' },
      { name: 'Avastin (bevacizumab)', meta: 'VEGF · recurrent GBM' },
    ],
  },
  {
    code: 'MM',
    full: 'Multiple myeloma',
    ta: 'oncology',
    assets: [
      { name: 'Carvykti (cilta-cel)', meta: 'BCMA CAR-T · 2L+ moving to 1L' },
      { name: 'Tecvayli (teclistamab)', meta: 'BCMA bispecific · RRMM' },
      { name: 'Talvey (talquetamab)', meta: 'GPRC5D bispecific · RRMM' },
    ],
  },
  {
    code: 'NHL / DLBCL',
    full: 'Non-Hodgkin lymphoma · DLBCL focus',
    ta: 'oncology',
    assets: [
      { name: 'Polivy (pola-R-CHP)', meta: 'CD79b ADC · 1L DLBCL' },
      { name: 'Yescarta (axi-cel)', meta: 'CD19 CAR-T · 2L+ rrLBCL' },
      { name: 'Epkinly (epcoritamab)', meta: 'CD20 × CD3 bispecific · 3L+' },
    ],
  },
  {
    code: 'AML / MDS',
    full: 'Acute myeloid leukemia + myelodysplastic syndromes',
    ta: 'oncology',
    assets: [
      { name: 'Venclexta + azacitidine', meta: 'BCL-2 + HMA · 1L unfit AML standard' },
      { name: 'Vidaza (azacitidine)', meta: 'HMA · MDS + low-int AML' },
      { name: 'Xospata (gilteritinib)', meta: 'FLT3 inhibitor · FLT3-mut RR AML' },
    ],
  },
  {
    code: "Parkinson's",
    full: "Parkinson's disease",
    ta: 'neuro',
    assets: [
      { name: 'Levodopa + carbidopa', meta: 'Dopaminergic SoC · 60-year anchor' },
      { name: 'Tavapadon', meta: 'D1/D5 partial agonist · TEMPO Ph3' },
      { name: 'Bemdaneprocel', meta: 'iPSC-derived dopaminergic cell therapy · Ph2' },
    ],
  },
  {
    code: 'Obesity',
    ta: 'cardiometabolic',
    assets: [
      { name: 'Zepbound (tirzepatide)', meta: 'GLP-1 + GIP · TBWL -22.5% bar' },
      { name: 'Wegovy (semaglutide)', meta: 'GLP-1 · SELECT MACE benefit' },
      { name: 'Retatrutide', meta: 'GLP-1 + GIP + glucagon triple · TBWL ~24% pending' },
    ],
  },
];

const TA_STYLES = {
  oncology: {
    label: 'Oncology',
    accent: 'text-rose-600 dark:text-rose-400',
    bubble:
      'bg-gradient-to-br from-rose-100 to-rose-50 ring-rose-200 text-rose-800 hover:ring-rose-300 dark:from-rose-900/30 dark:to-rose-950/20 dark:ring-rose-900/50 dark:text-rose-200',
    open:
      'bg-gradient-to-br from-rose-100 to-rose-50 ring-rose-300 dark:from-rose-900/30 dark:to-rose-950/20 dark:ring-rose-700/60',
    dot: 'bg-rose-400 dark:bg-rose-500',
  },
  neuro: {
    label: 'Neurodegeneration',
    accent: 'text-indigo-600 dark:text-indigo-400',
    bubble:
      'bg-gradient-to-br from-indigo-100 to-indigo-50 ring-indigo-200 text-indigo-800 hover:ring-indigo-300 dark:from-indigo-900/30 dark:to-indigo-950/20 dark:ring-indigo-900/50 dark:text-indigo-200',
    open:
      'bg-gradient-to-br from-indigo-100 to-indigo-50 ring-indigo-300 dark:from-indigo-900/30 dark:to-indigo-950/20 dark:ring-indigo-700/60',
    dot: 'bg-indigo-400 dark:bg-indigo-500',
  },
  cardiometabolic: {
    label: 'Cardiometabolic',
    accent: 'text-emerald-600 dark:text-emerald-400',
    bubble:
      'bg-gradient-to-br from-emerald-100 to-emerald-50 ring-emerald-200 text-emerald-800 hover:ring-emerald-300 dark:from-emerald-900/30 dark:to-emerald-950/20 dark:ring-emerald-900/50 dark:text-emerald-200',
    open:
      'bg-gradient-to-br from-emerald-100 to-emerald-50 ring-emerald-300 dark:from-emerald-900/30 dark:to-emerald-950/20 dark:ring-emerald-700/60',
    dot: 'bg-emerald-400 dark:bg-emerald-500',
  },
} as const;

const VALUE_PROPS = [
  {
    icon: Gauge,
    title: 'Strategic outputs in hours, not weeks',
    detail: "Work you'd normally commission comes back the day you ask.",
  },
  {
    icon: Layers,
    title: 'Specialist depth across the full portfolio',
    detail: 'Every indication held at the depth a dedicated analyst gives one.',
  },
  {
    icon: CheckCircle2,
    title: 'Evidence-anchored verdicts',
    detail: 'A clear answer with citations already organised. Auditable, not a black box.',
  },
  {
    icon: Sparkles,
    title: 'LLM agents where they earn their place',
    detail: "Registries fetched deterministically; agents do what registries can't.",
  },
];

// the Atlas page's own framing of the knowledge flow (restored original wording) — fed to the
// shared <AtlasDataflow/> as content overrides so we keep the upgraded diagram but the original copy
const KNOWLEDGE_FLOW = {
  inputsLabel: 'Knowledge sources',
  outputsLabel: 'Strategic deliverables',
  inputs: [
    {
      name: 'Literature scouting',
      detail: 'PubMed · bioRxiv · medRxiv — novelty signal beyond what registry searches return',
    },
    {
      name: 'News-signal monitoring',
      detail: 'Industry press + live feeds from connected clinical-news and conference workstreams',
    },
  ],
  hub: {
    name: 'ETLM',
    badge: 'Persistent intelligence',
    line: 'Emerging Therapeutic Landscape Map · one per indication',
  },
  outputs: [
    {
      name: 'ETLM',
      detail: 'Competitive baseline · unmet need · efficacy + safety benchmarks · refreshed live with new readouts',
    },
    {
      name: 'Target Product Profile',
      detail: 'Per indication / segment · efficacy bar against named comparators · differentiation axes that move the answer',
    },
  ],
};

// ── Animation styles (scoped via id selector) ──────────────────────────────────
const BUBBLE_STYLE = `
  @keyframes atlas-float {
    0%, 100% { transform: translateY(0) rotate(0deg); }
    33%      { transform: translateY(-3px) rotate(-0.7deg); }
    66%      { transform: translateY(2px) rotate(0.7deg); }
  }
  @keyframes atlas-wobble {
    0%, 100% { transform: scale(1.08) rotate(0deg); }
    20%      { transform: scale(1.08) rotate(-4deg); }
    40%      { transform: scale(1.08) rotate(3deg); }
    60%      { transform: scale(1.08) rotate(-2deg); }
    80%      { transform: scale(1.08) rotate(2deg); }
  }
  @keyframes atlas-pop {
    0%   { transform: scale(1); opacity: 1; }
    40%  { transform: scale(1.35); opacity: 0.9; }
    70%  { transform: scale(0.6); opacity: 0.2; }
    100% { transform: scale(0); opacity: 0; }
  }
  @keyframes atlas-bloom {
    0%   { transform: scale(0.85); opacity: 0; }
    60%  { transform: scale(1.02); opacity: 1; }
    100% { transform: scale(1); opacity: 1; }
  }
  .atlas-bubble {
    animation: atlas-float 5.5s ease-in-out infinite;
    transition: box-shadow 200ms ease, transform 200ms ease;
    will-change: transform;
  }
  .atlas-bubble:hover {
    animation: atlas-wobble 0.7s ease-in-out infinite;
    animation-delay: 0s !important;
  }
  .atlas-bubble.popping {
    animation: atlas-pop 360ms ease-in forwards;
  }
  .atlas-bloom { animation: atlas-bloom 320ms ease-out both; }
  @media (prefers-reduced-motion: reduce) {
    .atlas-bubble { animation: none; }
    .atlas-bubble:hover { animation: none; transform: scale(1.04); }
    .atlas-bubble.popping { animation: none; opacity: 0; transform: scale(0); }
    .atlas-bloom { animation: none; }
  }
`;

// Stagger floating offsets so bubbles drift independently
function bubbleDelay(i: number) {
  const delays = [0, 0.4, 0.9, 1.3, 1.7, 2.1, 2.5, 3.0, 0.2, 0.6, 1.1, 1.5, 1.9, 2.3, 2.7, 0.8, 1.6];
  return `${delays[i % delays.length]}s`;
}

function IndicationBubbles() {
  const [openCode, setOpenCode] = useState<string | null>(null);
  const [poppingCode, setPoppingCode] = useState<string | null>(null);

  const handleClick = (code: string) => {
    if (openCode === code) {
      setOpenCode(null);
      return;
    }
    setPoppingCode(code);
    window.setTimeout(() => {
      setOpenCode(code);
      setPoppingCode(null);
    }, 320);
  };

  return (
    <>
      <style>{BUBBLE_STYLE}</style>
      <div className="flex flex-wrap gap-2.5 items-start justify-start pt-2">
        {INDICATIONS.map((ind, i) => {
          const ta = TA_STYLES[ind.ta];
          const isOpen = openCode === ind.code;
          const isPopping = poppingCode === ind.code;

          if (isOpen) {
            return (
              <div
                key={ind.code}
                className={`atlas-bloom rounded-2xl ring-1 ${ta.open} px-4 py-3 w-full sm:w-[min(380px,100%)] shadow-sm`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className={`text-[14px] font-semibold ${ta.accent}`}>{ind.code}</p>
                    {ind.full && (
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">{ind.full}</p>
                    )}
                  </div>
                  <button
                    onClick={() => setOpenCode(null)}
                    aria-label="Close"
                    className="text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-200 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-[10px] uppercase tracking-wider font-semibold text-zinc-500 dark:text-zinc-400 mt-3 mb-1.5">
                  Top assets in scope
                </p>
                <ul className="space-y-1.5">
                  {ind.assets.map((a) => (
                    <li
                      key={a.name}
                      className="flex items-start gap-2 text-[12.5px] text-zinc-700 dark:text-zinc-300"
                    >
                      <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${ta.dot}`} />
                      <span>
                        <span className="font-semibold">{a.name}</span>
                        <span className="text-zinc-500 dark:text-zinc-400"> — {a.meta}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          }

          return (
            <button
              key={ind.code}
              onClick={() => handleClick(ind.code)}
              className={`atlas-bubble ${isPopping ? 'popping' : ''} rounded-full ring-1 ${ta.bubble} px-4 py-2 text-[13px] font-semibold shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#fafafa] dark:focus:ring-offset-[#0b0f14]`}
              style={{ animationDelay: bubbleDelay(i) }}
              aria-label={`Open ${ind.code} top assets`}
            >
              {ind.code}
            </button>
          );
        })}
      </div>
    </>
  );
}

export default function AtlasDrugDevAnalyst() {
  const project = getProjectBySlug('atlas-drug-dev-analyst');

  if (!project) {
    return (
      <ProjectPageLayout title="Project not found">
        <p className="text-zinc-600 dark:text-zinc-400">That project doesn't exist.</p>
      </ProjectPageLayout>
    );
  }

  return (
    <ProjectPageLayout
      title="Atlas"
      subtitle="Strategic intelligence for drug development."
    >
      <div>
        {/* Status pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-zinc-500 dark:text-zinc-400 px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 rounded">
            {project.yearStart}
          </span>
          <Pill variant="status-live">Live</Pill>
          {project.themes.map((t) => (
            <Pill key={t} variant="tech">
              {t}
            </Pill>
          ))}
        </div>

        {/* Hero — the thesis */}
        <div className="mt-8 max-w-2xl">
          <p className="rise text-[26px] sm:text-[34px] font-bold text-zinc-900 dark:text-zinc-100 leading-[1.12] tracking-tight">
            {emphasize('You get a *decision*, not a reading list.')}
          </p>
          <p className="rise mt-4 text-[15px] sm:text-[16px] text-zinc-500 dark:text-zinc-400 leading-relaxed" style={{ animationDelay: '120ms' }}>
            Atlas holds every indication in your scope — approvals, pipeline, readouts, regulatory moves — and turns them
            into the deliverables your teams act on.
          </p>
        </div>

        {/* What it changes — open text, no cards */}
        <Reveal className="mt-14 border-t border-zinc-200/70 dark:border-white/10 pt-12 space-y-6">
          <h2 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-widest">
            What it changes for your team
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-6">
            {VALUE_PROPS.map((v) => {
              const Icon = v.icon;
              return (
                <div key={v.title} className="flex gap-3">
                  <Icon className="w-[18px] h-[18px] mt-0.5 text-zinc-400 dark:text-zinc-500 shrink-0" />
                  <div>
                    <p className="text-[14px] font-semibold text-zinc-900 dark:text-zinc-100">{v.title}</p>
                    <p className="mt-1 text-[13px] text-zinc-500 dark:text-zinc-400 leading-relaxed">{v.detail}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Reveal>

        {/* How it works — the living-memory dataflow + the four streams */}
        <Reveal className="mt-14 border-t border-zinc-200/70 dark:border-white/10 pt-12 space-y-5">
          <h2 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-widest">
            How it works
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-2xl">
            Four streams feed one living memory — the ETLM. Three build it; one ships from it.
          </p>

          <div className="rounded-2xl ring-1 ring-zinc-200/80 dark:ring-white/10 bg-white/80 dark:bg-zinc-800/80 p-6">
            <AtlasDataflow
              theme="portfolio"
              inputsLabel={KNOWLEDGE_FLOW.inputsLabel}
              outputsLabel={KNOWLEDGE_FLOW.outputsLabel}
              inputs={KNOWLEDGE_FLOW.inputs}
              outputs={KNOWLEDGE_FLOW.outputs}
              hub={KNOWLEDGE_FLOW.hub}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-5 pt-1">
            {CAPABILITIES.map((cap) => {
              const Icon = cap.icon;
              return (
                <div key={cap.id} className="flex gap-3">
                  <Icon className="w-[18px] h-[18px] mt-0.5 text-zinc-400 dark:text-zinc-500 shrink-0" />
                  <div className="min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <p className="text-[14px] font-semibold text-zinc-900 dark:text-zinc-100">{cap.name}</p>
                      <span className="text-[10px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500">{cap.tag}</span>
                    </div>
                    <p className="mt-1 text-[13px] text-zinc-500 dark:text-zinc-400 leading-relaxed">{cap.detail}</p>
                    {cap.connected && (
                      <p className="mt-1.5 text-[12px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                        Feeds from{' '}
                        <a href={cap.connected[0].href} className="text-zinc-700 dark:text-zinc-200 underline decoration-zinc-400 dark:decoration-zinc-600 underline-offset-2 hover:decoration-zinc-700 dark:hover:decoration-zinc-300">
                          {cap.connected[0].label}
                        </a>{' '}
                        and{' '}
                        <a href={cap.connected[1].href} className="text-zinc-700 dark:text-zinc-200 underline decoration-zinc-400 dark:decoration-zinc-600 underline-offset-2 hover:decoration-zinc-700 dark:hover:decoration-zinc-300">
                          {cap.connected[1].label}
                        </a>.
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Reveal>

        {/* Therapeutic coverage — interactive bubbles (signature element) */}
        <Reveal className="mt-14 border-t border-zinc-200/70 dark:border-white/10 pt-12 space-y-4">
          <h2 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-widest">
            Therapeutic coverage
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-2xl">
            Each indication carries its own ETLM and calibration anchors. Tap one for the assets setting the bar.
          </p>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[11.5px] text-zinc-500 dark:text-zinc-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-rose-200 to-rose-100 ring-1 ring-rose-300 dark:from-rose-800 dark:to-rose-900 dark:ring-rose-700" />
              Oncology
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-indigo-200 to-indigo-100 ring-1 ring-indigo-300 dark:from-indigo-800 dark:to-indigo-900 dark:ring-indigo-700" />
              Neurodegeneration
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-emerald-200 to-emerald-100 ring-1 ring-emerald-300 dark:from-emerald-800 dark:to-emerald-900 dark:ring-emerald-700" />
              Cardiometabolic
            </span>
          </div>

          <IndicationBubbles />

          <p className="text-[12px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
            <span className="font-semibold text-zinc-700 dark:text-zinc-300">Coverage extends on demand</span> — same
            architecture, new TA.
          </p>
        </Reveal>

        {/* Governance & trust — open text */}
        <Reveal className="mt-14 border-t border-zinc-200/70 dark:border-white/10 pt-12 space-y-6">
          <h2 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-widest">
            Governance &amp; trust
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-6">
            {GOVERNANCE.map((g) => {
              const Icon = g.icon;
              return (
                <div key={g.title} className="flex gap-3">
                  <Icon className="w-[18px] h-[18px] mt-0.5 text-zinc-400 dark:text-zinc-500 shrink-0" />
                  <div>
                    <p className="text-[14px] font-semibold text-zinc-900 dark:text-zinc-100">{g.title}</p>
                    <p className="mt-1 text-[13px] text-zinc-500 dark:text-zinc-400 leading-relaxed">{g.detail}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Reveal>

        {/* Selected work — named samples from the reader */}
        <Reveal className="mt-14 border-t border-zinc-200/70 dark:border-white/10 pt-12 space-y-4">
          <h2 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-widest">
            Selected work
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-2xl">
            Redacted samples, straight from the reader.
          </p>
          <div className="border-y border-zinc-200/70 dark:border-white/10 divide-y divide-zinc-200/70 dark:divide-white/10">
            {SELECTED_WORK.map((w) => (
              <a key={w.href} href={w.href} className="group flex items-center justify-between gap-4 py-3">
                <span className="min-w-0">
                  <span className="text-[14px] font-semibold text-zinc-900 dark:text-zinc-100">{w.title}</span>
                  <span className="ml-2 text-[12px] text-zinc-500 dark:text-zinc-400">{w.kind}</span>
                </span>
                <ArrowRight className="w-4 h-4 text-zinc-400 dark:text-zinc-500 group-hover:translate-x-0.5 transition-transform shrink-0" />
              </a>
            ))}
          </div>
          <a
            href="/atlas-reader"
            className="inline-flex items-center gap-1 text-[13px] text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
          >
            Browse all deliverables
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </Reveal>

        {/* Close */}
        <Reveal className="mt-14 border-t border-zinc-200/70 dark:border-white/10 pt-12 space-y-4">
          <p className="text-[15px] sm:text-[16px] text-zinc-700 dark:text-zinc-300 leading-relaxed max-w-2xl">
            Want the outputs ready to use, or Atlas inside your own systems? Either works.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <a
              href="/atlas-reader"
              className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13.5px] font-medium bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900 shadow-sm ring-1 ring-zinc-900/10 dark:ring-white/10 hover:-translate-y-0.5 transition-transform"
            >
              See sample deliverables
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
            {WWM_LIVE && (
              <a
                href="/work-with-me/teams"
                className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13.5px] font-medium text-zinc-700 dark:text-zinc-300 ring-1 ring-zinc-300 dark:ring-zinc-700 hover:ring-zinc-400 dark:hover:ring-zinc-500 transition-colors"
              >
                Work with me
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            )}
            <a
              href="mailto:katieluikakiu@gmail.com?subject=Atlas%20—%20enquiry"
              className="text-[13px] text-zinc-700 dark:text-zinc-300 underline decoration-zinc-400 dark:decoration-zinc-600 underline-offset-2 hover:decoration-zinc-700 dark:hover:decoration-zinc-300"
            >
              Get in touch →
            </a>
          </div>
          <p className="text-[12px] text-zinc-400 dark:text-zinc-500 pt-2">LLM (multi-agent) · Python</p>
        </Reveal>

      </div>
    </ProjectPageLayout>
  );
}
