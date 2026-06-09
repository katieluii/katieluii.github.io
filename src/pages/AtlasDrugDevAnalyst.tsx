import { useState } from 'react';
import {
  Network,
  Newspaper,
  Target,
  FlaskConical,
  Microscope,
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

type CapColor = 'indigo' | 'emerald' | 'amber' | 'rose';

interface Capability {
  id: string;
  icon: React.ElementType;
  color: CapColor;
  name: string;
  tag: string;
  detail: string;
  extras?: React.ReactNode;
}

const COLOR_MAP: Record<CapColor, { ring: string; bg: string; icon: string; chip: string }> = {
  indigo: {
    ring: 'ring-indigo-200/70 dark:ring-indigo-900/40',
    bg: 'bg-indigo-50/40 dark:bg-indigo-950/10',
    icon: 'text-indigo-600 dark:text-indigo-400',
    chip: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
  },
  emerald: {
    ring: 'ring-emerald-200/70 dark:ring-emerald-900/40',
    bg: 'bg-emerald-50/40 dark:bg-emerald-950/10',
    icon: 'text-emerald-600 dark:text-emerald-400',
    chip: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  },
  amber: {
    ring: 'ring-amber-200/70 dark:ring-amber-900/40',
    bg: 'bg-amber-50/40 dark:bg-amber-950/10',
    icon: 'text-amber-600 dark:text-amber-400',
    chip: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  },
  rose: {
    ring: 'ring-rose-200/70 dark:ring-rose-900/40',
    bg: 'bg-rose-50/40 dark:bg-rose-950/10',
    icon: 'text-rose-600 dark:text-rose-400',
    chip: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
  },
};

const NEWS_SOURCES = [
  'FierceBiotech',
  'FiercePharma',
  'Endpoints News',
  'BioPharma Dive',
  'Labiotech',
];

const CAPABILITIES: Capability[] = [
  {
    id: 'landscape',
    icon: Network,
    color: 'indigo',
    name: 'Landscape mapping',
    tag: 'Strategic spine',
    detail:
      'The per-indication strategic map — approved therapies, pipeline, unmet need, efficacy bar, mechanism landscape, competitive dynamics — built from authoritative registries only (ClinicalTrials.gov, FDA, EMA, NCI Thesaurus).',
  },
  {
    id: 'literature',
    icon: FlaskConical,
    color: 'emerald',
    name: 'Literature scouting',
    tag: 'Novelty surveillance',
    detail:
      'Reads PubMed, bioRxiv, and medRxiv for novel assets and mechanisms that registry searches miss. Surfaces early-stage programs before they hit mainstream coverage.',
  },
  {
    id: 'news',
    icon: Newspaper,
    color: 'amber',
    name: 'News-signal monitoring',
    tag: 'Live industry pulse',
    detail:
      'Reads the trade press daily, triages each item for strategic relevance, and converts material events — readouts, deals, label updates — into landscape edits.',
    extras: (
      <div className="pl-14 space-y-3 pt-1">
        <div>
          <p className="text-[10.5px] uppercase tracking-wider font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">
            Sources tracked
          </p>
          <div className="flex flex-wrap gap-1.5">
            {NEWS_SOURCES.map((s) => (
              <span
                key={s}
                className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-white text-zinc-700 ring-1 ring-amber-200 dark:bg-zinc-900/60 dark:text-zinc-300 dark:ring-amber-900/40"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
        <div className="rounded-lg ring-1 ring-zinc-200 dark:ring-zinc-700 bg-zinc-50/60 dark:bg-zinc-900/30 px-3 py-2">
          <div className="flex items-center gap-1.5 mb-1">
            <Network className="w-3 h-3 text-zinc-500 dark:text-zinc-400" />
            <p className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">Connected workstreams</p>
          </div>
          <p className="text-[11.5px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
            Live feeds from the{' '}
            <a
              href="/clinical-news"
              className="text-zinc-700 dark:text-zinc-200 underline decoration-zinc-400 dark:decoration-zinc-600 underline-offset-2 hover:decoration-zinc-700 dark:hover:decoration-zinc-300"
            >
              Clinical Development Monitoring Agent
            </a>{' '}
            (pre-classified clinical events) and the{' '}
            <a
              href="/conference-catalyst"
              className="text-zinc-700 dark:text-zinc-200 underline decoration-zinc-400 dark:decoration-zinc-600 underline-offset-2 hover:decoration-zinc-700 dark:hover:decoration-zinc-300"
            >
              Conference Catalyst Monitor
            </a>{' '}
            (verdicted readouts from ASCO, ESMO, AACR, ASH, and other major congresses) feed straight into the landscape —
            one shared event stream.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 'tpp',
    icon: Target,
    color: 'rose',
    name: 'TPP drafting',
    tag: 'Decision artifact',
    detail:
      'Drafts Target Product Profiles per indication and segment — the efficacy bar against named comparators, the safety bar, the differentiation axes that actually move the answer, the regulatory pathway, and the commercial reality. Built on the live landscape as biology and competitive context.',
  },
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
    detail: 'Outputs your team would normally commission and wait on come back the same day a question is asked.',
  },
  {
    icon: Layers,
    title: 'Specialist depth across the full portfolio',
    detail: 'Every indication held in sync at the depth a dedicated analyst would bring to one.',
  },
  {
    icon: CheckCircle2,
    title: 'Evidence-anchored verdicts',
    detail: 'Strategic questions return a clear answer with citations already organised. Auditable, not a black box.',
  },
  {
    icon: Sparkles,
    title: 'LLM agents where they earn their place',
    detail: 'Structured registries are fetched deterministically. LLM agents do the work registries can\'t — pulling material events from unstructured press, judging strategic relevance, synthesising outputs on demand.',
  },
];

const TECH_ITEMS = ['LLM (multi-agent)', 'Python'];

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
      subtitle="Strategic memory for drug development."
    >
      <div className="space-y-14">
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

        {/* Brand statement */}
        <section className="border-l-2 border-zinc-900 dark:border-zinc-100 pl-5 sm:pl-6 py-1">
          <p className="text-[22px] sm:text-[26px] font-bold text-zinc-900 dark:text-zinc-100 leading-[1.2] tracking-tight">
            Atlas tracks every indication in your scope — approvals, pipeline, data readouts, and regulatory moves — and
            produces deliverables for your teams.
          </p>
          <p className="mt-3 text-[14px] text-zinc-500 dark:text-zinc-400">
            You get a decision, not a reading list.
          </p>
        </section>

        {/* Value props */}
        <section className="space-y-3">
          <h2 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-widest">
            What it changes for your team
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {VALUE_PROPS.map((v) => {
              const Icon = v.icon;
              return (
                <div
                  key={v.title}
                  className="rounded-xl ring-1 ring-zinc-200/80 dark:ring-white/10 bg-white/80 dark:bg-zinc-800/80 p-4 space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                    <p className="text-[14px] font-semibold text-zinc-900 dark:text-zinc-100">{v.title}</p>
                  </div>
                  <p className="text-[12.5px] text-zinc-500 dark:text-zinc-400 leading-relaxed">{v.detail}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Areas of work */}
        <section className="space-y-3">
          <h2 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-widest">
            Areas of work
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-3xl">
            Four streams share one strategic memory — the Emerging Therapeutic Landscape Map (ETLM). Three feed it; one
            consumes it.
          </p>

          <div className="space-y-3 pt-2">
            {CAPABILITIES.map((cap, i) => {
              const c = COLOR_MAP[cap.color];
              const Icon = cap.icon;
              return (
                <div key={cap.id} className={`rounded-2xl ring-1 ${c.ring} ${c.bg} p-5 space-y-3`}>
                  <div className="flex items-start gap-4">
                    <div
                      className={`flex-shrink-0 w-10 h-10 rounded-xl bg-white dark:bg-zinc-900 ring-1 ring-zinc-200/80 dark:ring-white/10 flex items-center justify-center ${c.icon}`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-3 flex-wrap mb-1.5">
                        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                          <span className="text-zinc-400 dark:text-zinc-500 font-normal mr-2">0{i + 1}</span>
                          {cap.name}
                        </h3>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${c.chip}`}>
                          {cap.tag}
                        </span>
                      </div>
                      <p className="text-[13px] text-zinc-600 dark:text-zinc-400 leading-relaxed">{cap.detail}</p>
                    </div>
                  </div>
                  {cap.extras}
                </div>
              );
            })}
          </div>
        </section>

        {/* Knowledge architecture */}
        <section className="space-y-3">
          <h2 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-widest">
            Knowledge architecture
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-3xl">
            One source of truth between the streams that build knowledge and the streams that ship deliverables. Every
            output traces back to it.
          </p>

          <div className="rounded-2xl ring-1 ring-zinc-200/80 dark:ring-white/10 bg-white/80 dark:bg-zinc-800/80 p-6 mt-2">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-6 items-stretch">
              <div className="flex flex-col gap-2">
                <p className="text-[11px] uppercase tracking-wider font-semibold text-zinc-500 dark:text-zinc-400">
                  Knowledge sources
                </p>
                {[
                  {
                    name: 'Literature scouting',
                    detail: 'PubMed · bioRxiv · medRxiv — novelty signal beyond what registry searches return',
                    ring: 'ring-emerald-200/80 dark:ring-emerald-900/40',
                    bg: 'bg-emerald-50/50 dark:bg-emerald-950/10',
                  },
                  {
                    name: 'News-signal monitoring',
                    detail: 'Industry press + live feeds from connected clinical-news and conference workstreams',
                    ring: 'ring-amber-200/80 dark:ring-amber-900/40',
                    bg: 'bg-amber-50/50 dark:bg-amber-950/10',
                  },
                ].map((w) => (
                  <div
                    key={w.name}
                    className={`flex-1 rounded-lg ring-1 ${w.ring} ${w.bg} px-3 py-2`}
                  >
                    <p className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-100">{w.name}</p>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">{w.detail}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-col items-center justify-center gap-3 px-2 min-w-[180px]">
                <div className="hidden lg:block w-px h-12 bg-gradient-to-b from-transparent to-zinc-300 dark:to-zinc-600" />
                <div className="rounded-2xl bg-zinc-900 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 px-5 py-4 text-center shadow-md w-full">
                  <Microscope className="w-5 h-5 mx-auto mb-2 opacity-80" />
                  <p className="text-[10px] uppercase tracking-widest font-semibold opacity-70">Persistent memory</p>
                  <p className="text-base font-bold mt-1">ETLM</p>
                  <p className="text-[11px] opacity-70 mt-1 leading-tight">
                    Emerging Therapeutic Landscape Map · one per indication
                  </p>
                </div>
                <div className="hidden lg:block w-px h-12 bg-gradient-to-t from-transparent to-zinc-300 dark:to-zinc-600" />
              </div>

              <div className="flex flex-col gap-2">
                <p className="text-[11px] uppercase tracking-wider font-semibold text-zinc-500 dark:text-zinc-400">
                  Strategic deliverables
                </p>
                {[
                  {
                    name: 'ETLM',
                    detail:
                      'Competitive baseline · unmet need · efficacy + safety benchmarks · refreshed live with new readouts',
                    ring: 'ring-indigo-200/80 dark:ring-indigo-900/40',
                    bg: 'bg-indigo-50/50 dark:bg-indigo-950/10',
                  },
                  {
                    name: 'Target Product Profile',
                    detail: 'Per indication / segment · efficacy bar against named comparators · differentiation axes that move the answer',
                    ring: 'ring-rose-200/80 dark:ring-rose-900/40',
                    bg: 'bg-rose-50/50 dark:bg-rose-950/10',
                  },
                ].map((c) => (
                  <div
                    key={c.name}
                    className={`flex-1 rounded-lg ring-1 ${c.ring} ${c.bg} px-3 py-2`}
                  >
                    <p className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-100">{c.name}</p>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">{c.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Therapeutic coverage — interactive bubbles */}
        <section className="space-y-3">
          <h2 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-widest">
            Therapeutic coverage
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-3xl">
            Each indication carries its own ETLM, specialist analyst, and calibration anchors. Tap an indication for the
            assets currently setting the bar.
          </p>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-1 text-[11.5px] text-zinc-500 dark:text-zinc-400">
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

          {/* Growth callout */}
          <div className="pt-3 flex items-start gap-2">
            <ArrowRight className="w-3.5 h-3.5 mt-0.5 text-zinc-400 dark:text-zinc-500 flex-shrink-0" />
            <p className="text-[12px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
              <span className="font-semibold text-zinc-700 dark:text-zinc-300">Coverage extends on demand.</span> New
              indications onboard to client scope as priorities evolve. Same architecture, new TA.
            </p>
          </div>
        </section>

        {/* Governance & trust */}
        <section className="space-y-3">
          <h2 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-widest">
            Governance &amp; trust
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-xl ring-1 ring-zinc-200/80 dark:ring-white/10 bg-white/80 dark:bg-zinc-800/80 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Analysts on the judgment calls, not the rote refresh
                </p>
              </div>
              <p className="text-[12px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Routine landscape updates flow in on their own. Material shifts — a class-defining readout, a competitive
                pivot, a regulatory inflection — surface for human review before they land. Your analysts spend their time
                where it changes the answer.
              </p>
            </div>

            <div className="rounded-xl ring-1 ring-zinc-200/80 dark:ring-white/10 bg-white/80 dark:bg-zinc-800/80 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Conflict resolution as a first-class behaviour
                </p>
              </div>
              <p className="text-[12px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                When sources disagree, Atlas runs date-compare → targeted verification → escalation. Newer evidence wins
                on facts; review framing wins on framing. Every patch tagged with its conflict axis.
              </p>
            </div>
          </div>
        </section>

        {/* Technology */}
        <section className="space-y-3">
          <h2 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-widest">
            Technology
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {TECH_ITEMS.map((item) => (
              <Pill key={item} variant="tech">
                {item}
              </Pill>
            ))}
          </div>
        </section>

        {/* Closing — two paths, casual */}
        <section className="border-t border-zinc-200/80 dark:border-white/10 pt-6 space-y-4">
          <p className="text-[13.5px] text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-3xl">
            Want to see what the deliverables actually look like?{' '}
            <a
              href="/atlas-reader"
              className="text-zinc-900 dark:text-zinc-100 underline decoration-zinc-400 dark:decoration-zinc-600 underline-offset-2 hover:decoration-zinc-700 dark:hover:decoration-zinc-300"
            >
              Open the reader →
            </a>{' '}
            for a redacted sample of two landscape maps, five target product profiles, three thematic
            syntheses, and a slice of the ecosystem note.
          </p>
          <p className="text-[13.5px] text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-3xl">
            You might want the outputs — briefs, profiles, verdicts, ready to use. Or your team might want Atlas sitting
            inside your own systems and data. Both are fine. And if you're not sure yet — feel free to{' '}
            <a
              href="mailto:katieluikakiu@gmail.com?subject=Atlas%20—%20enquiry"
              className="text-zinc-900 dark:text-zinc-100 underline decoration-zinc-400 dark:decoration-zinc-600 underline-offset-2 hover:decoration-zinc-700 dark:hover:decoration-zinc-300"
            >
              reach out
            </a>{' '}
            to learn more.
          </p>
        </section>

      </div>
    </ProjectPageLayout>
  );
}
