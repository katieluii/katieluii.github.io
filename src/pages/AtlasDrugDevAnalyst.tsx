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
import ProjectLead from '../components/ProjectLead';
import { Pill } from '../components/Pill';
import { getProjectBySlug } from '../data/projects';
import { Reveal } from '../components/shared/craft';
import AtlasDataflow from '../components/atlas/AtlasDataflow';
import { WWM_LIVE } from '../data/atlas/copy';
import { INDICATIONS } from '../data/indications';

interface Capability {
  id: string;
  icon: React.ElementType;
  name: string;
  tag: string;
  detail: string;
  connected?: { label: string; href: string }[];
}

const CAPABILITIES: Capability[] = [
  {
    id: 'landscape',
    icon: Network,
    name: 'Landscape mapping',
    tag: 'Strategic spine',
    detail: 'The per-indication strategic map, built from authoritative registries including ClinicalTrials.gov, FDA, EMA, and NCI Thesaurus.',
  },
  {
    id: 'literature',
    icon: FlaskConical,
    name: 'Literature scouting',
    tag: 'Novelty surveillance',
    detail: 'Reads PubMed, bioRxiv, and medRxiv for novel assets that registry searches miss.',
  },
  {
    id: 'news',
    icon: Newspaper,
    name: 'News-signal monitoring',
    tag: 'Live industry pulse',
    detail: 'Triages trade press for material events such as readouts, deals, and label updates.',
    connected: [
      { label: 'Clinical News', href: '/clinical-news' },
      { label: 'Conference Catalyst', href: '/conference-catalyst' },
    ],
  },
  {
    id: 'tpp',
    icon: Target,
    name: 'TPP drafting',
    tag: 'Design artifact',
    detail: 'Drafts Target Product Profiles covering efficacy, safety, and the criteria that shape the answer.',
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
  { title: 'TPP — 1L injectable, BMI ≥ 30', kind: 'TPP', href: '/atlas-reader/tpp/tpp_obesity_1L_injectable_bmi30_2026-06-05' },
  { title: 'GLP-1 class — competitive supply', kind: 'Thematic synthesis', href: '/atlas-reader/theme/glp1_class_competitive_supply_2026-06-05' },
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
    label: 'Neurology',
    accent: 'text-indigo-600 dark:text-indigo-400',
    bubble:
      'bg-gradient-to-br from-indigo-100 to-indigo-50 ring-indigo-200 text-indigo-800 hover:ring-indigo-300 dark:from-indigo-900/30 dark:to-indigo-950/20 dark:ring-indigo-900/50 dark:text-indigo-200',
    open:
      'bg-gradient-to-br from-indigo-100 to-indigo-50 ring-indigo-300 dark:from-indigo-900/30 dark:to-indigo-950/20 dark:ring-indigo-700/60',
    dot: 'bg-indigo-400 dark:bg-indigo-500',
  },
  immunology: {
    label: 'Immunology',
    accent: 'text-amber-600 dark:text-amber-400',
    bubble:
      'bg-gradient-to-br from-amber-100 to-amber-50 ring-amber-200 text-amber-800 hover:ring-amber-300 dark:from-amber-900/30 dark:to-amber-950/20 dark:ring-amber-900/50 dark:text-amber-200',
    open:
      'bg-gradient-to-br from-amber-100 to-amber-50 ring-amber-300 dark:from-amber-900/30 dark:to-amber-950/20 dark:ring-amber-700/60',
    dot: 'bg-amber-400 dark:bg-amber-500',
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
    title: 'Strategic landscape work, condensed',
    detail: 'A focused ETLM gives teams a clear indication read without starting every landscape from scratch.',
  },
  {
    icon: Layers,
    title: 'One indication map, ready to use',
    detail: 'The indication, its assets, readouts, and benchmarks are shaped into one emerging therapeutic landscape map.',
  },
  {
    icon: CheckCircle2,
    title: 'Source-backed, not asserted',
    detail: 'Claims trace back to primary evidence, so teams can check the answer and follow the source.',
  },
  {
    icon: Sparkles,
    title: 'Reviewed before it ships',
    detail: 'Source review and drafting can be accelerated, but the final map is checked before delivery.',
  },
];

const KNOWLEDGE_FLOW = {
  inputsLabel: 'Knowledge sources',
  outputsLabel: 'Strategic deliverables',
  inputs: [
    {
      name: 'Literature scouting',
      detail: 'PubMed, bioRxiv, medRxiv, novelty signal beyond what registry searches return',
    },
    {
      name: 'News-signal monitoring',
      detail: 'Industry press, plus selected readouts from clinical news and conferences',
    },
  ],
  hub: {
    name: 'ETLM',
    badge: 'Persistent intelligence',
    line: 'Emerging Therapeutic Landscape Map, one per indication',
  },
  outputs: [
    {
      name: 'ETLM',
      detail: 'Competitive baseline, unmet need, efficacy and safety benchmarks',
    },
    {
      name: 'Target Product Profile',
      detail: 'Per indication or segment, efficacy bar against named comparators, and differentiation criteria',
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
              className={`atlas-bubble ${isPopping ? 'popping' : ''} rounded-full ring-1 ${ta.bubble} px-4 py-2 text-[13px] font-semibold shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--bg)]`}
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
          <span className="text-sm text-slate-600 dark:text-zinc-400 px-2.5 py-1 bg-slate-100 dark:bg-zinc-800 rounded">
            {project.yearStart}
          </span>
          <Pill variant="status-live">Live</Pill>
          {project.themes.map((t) => (
            <Pill key={t} variant="tech">
              {t}
            </Pill>
          ))}
        </div>

        {/* Description — shared ProjectLead intro (matches the other project pages) */}
        <div className="mt-8">
          <ProjectLead headline="Know where every indication stands — without reading everything.">
            From the whole landscape — approvals, pipeline, readouts, regulatory moves — to a clear, current view of your
            scope. Curated by an analyst, not an aggregator's pile.
          </ProjectLead>
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

        {/* How it works */}
        <Reveal className="mt-14 border-t border-zinc-200/70 dark:border-white/10 pt-12 space-y-5">
          <h2 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-widest">
            How it works
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-2xl">
            Atlas builds an indication-based ETLM from the sources a drug development team already trusts, including registries,
            regulatory records, conference readouts, company disclosures, and selected literature. Extraction accelerates
            the map; judgment calls go to an analyst before they become canonical.
          </p>

          <div className="rounded-2xl ring-1 ring-zinc-200/80 dark:ring-white/10 bg-white/80 dark:bg-zinc-800/80 p-6">
            <AtlasDataflow
              theme="portfolio"
              hubHref="/atlas-reader"
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
            A flagship slice across four therapeutic areas — Atlas tracks 40+ indications on the same
            architecture, each with its own ETLM and calibration anchors. Tap one for the assets setting the bar.
          </p>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[11.5px] text-zinc-500 dark:text-zinc-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-rose-200 to-rose-100 ring-1 ring-rose-300 dark:from-rose-800 dark:to-rose-900 dark:ring-rose-700" />
              Oncology
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-indigo-200 to-indigo-100 ring-1 ring-indigo-300 dark:from-indigo-800 dark:to-indigo-900 dark:ring-indigo-700" />
              Neurology
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-amber-200 to-amber-100 ring-1 ring-amber-300 dark:from-amber-800 dark:to-amber-900 dark:ring-amber-700" />
              Immunology
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-emerald-200 to-emerald-100 ring-1 ring-emerald-300 dark:from-emerald-800 dark:to-emerald-900 dark:ring-emerald-700" />
              Cardiometabolic
            </span>
          </div>

          <IndicationBubbles />

          <p className="text-[12px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
            <span className="font-semibold text-zinc-700 dark:text-zinc-300">Coverage extends on demand</span>, same
            architecture, any new indication.
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
            The intelligence resolves into deliverables a team can act on: an indication landscape, a
            target product profile, a thematic read. Redacted samples, straight from the reader.
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
            className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13.5px] font-medium bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900 shadow-sm ring-1 ring-zinc-900/10 dark:ring-white/10 hover:-translate-y-0.5 transition-transform"
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
              href="mailto:katie@renascor.xyz?subject=Atlas%20—%20enquiry"
              className="text-[13px] text-zinc-700 dark:text-zinc-300 underline decoration-zinc-400 dark:decoration-zinc-600 underline-offset-2 hover:decoration-zinc-700 dark:hover:decoration-zinc-300"
            >
              Get in touch →
            </a>
          </div>
        </Reveal>

      </div>
    </ProjectPageLayout>
  );
}
