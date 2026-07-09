import { ExternalLink, Activity, Globe, Microscope, Droplets, type LucideIcon } from 'lucide-react';
import { getProjectBySlug } from '../data/projects';
import { Pill } from '../components/Pill';
import ProjectPageLayout from '../components/ProjectPageLayout';
import { ProjectLead } from '../components/ProjectLead';
import { Reveal } from '../components/ui';

const APP_URL = 'https://conference-catalyst-monitor-production.up.railway.app';

type StepType = 'auto' | 'agentic';
type DataTag = { label: string; color: 'blue' | 'purple' | 'amber' | 'green' };

interface FlowStep {
  label: string;
  detail: string;
  type: StepType;
  tags: DataTag[];
}

const FLOW: FlowStep[] = [
  {
    label: 'Indications in scope',
    detail: 'You define the coverage list — the indications you actually follow. The monitor mirrors that roster (here, the indications our drug-development analysts cover) and tracks nothing outside it. Focused by design, not a catch-all of every abstract at the meeting.',
    type: 'auto',
    tags: [{ label: 'Your indication list', color: 'purple' }],
  },
  {
    label: 'Anticipated catalysts',
    detail: 'For each in-scope indication, the Phase 2/3 trials with primary completion in the months before each meeting are pulled from ClinicalTrials.gov — the readouts the market is watching for, across ASCO, ESMO, AACR, and ASH.',
    type: 'auto',
    tags: [{ label: 'ClinicalTrials.gov', color: 'blue' }],
  },
  {
    label: 'Asset database',
    detail: 'Each anticipated catalyst becomes a row — drug, sponsor, indication, phase — with the primary-endpoint result and key data surfaced inline, and expandable rows for the full abstract.',
    type: 'auto',
    tags: [{ label: 'Sortable · Expandable', color: 'purple' }],
  },
  {
    label: 'LLM data extraction',
    detail: 'When a meeting releases its programme, the matching abstract is attached to each tracked asset and an LLM pulls the numbers that move the read: whether the primary endpoint was met, plus ORR, mPFS, OS, hazard ratios and p-values — verbatim, no interpretation.',
    type: 'agentic',
    tags: [{ label: 'Primary endpoint + key data', color: 'green' }],
  },
];

const TAG_STYLES: Record<DataTag['color'], string> = {
  blue:   'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
  purple: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300',
  amber:  'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  green:  'bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300',
};

// The onc/heme indications currently in scope — mirrors the drug-development
// analyst roster that feeds the watchlist (see the monitor's indications.py).
const INDICATIONS = [
  'NSCLC', 'SCLC', 'Breast', 'CRC', 'PDAC', 'HCC', 'Prostate', 'Ovarian',
  'Melanoma', 'GBM', 'Urothelial', 'Thyroid', 'AML/MDS', 'Myeloma', 'NHL/DLBCL',
];

const CONFERENCES: {
  Icon: LucideIcon;
  name: string;
  description: string;
  sourceLabel: string;
  sourceUrl: string;
}[] = [
  {
    Icon: Activity,
    name: 'ASCO',
    description: 'American Society of Clinical Oncology Annual Meeting — the largest oncology meeting of the year, broad solid-tumour coverage.',
    sourceLabel: 'meetings.asco.org',
    sourceUrl: 'https://meetings.asco.org/',
  },
  {
    Icon: Globe,
    name: 'ESMO',
    description: 'European Society for Medical Oncology Congress — Europe\'s flagship oncology meeting and a major late-year readout window.',
    sourceLabel: 'esmo.org',
    sourceUrl: 'https://www.esmo.org/meetings/esmo-congress',
  },
  {
    Icon: Microscope,
    name: 'AACR',
    description: 'American Association for Cancer Research Annual Meeting — earlier-stage and translational oncology, including the spring late-breaker track.',
    sourceLabel: 'aacr.org',
    sourceUrl: 'https://www.aacr.org/meeting/aacr-annual-meeting/',
  },
  {
    Icon: Droplets,
    name: 'ASH',
    description: 'American Society of Hematology Annual Meeting — the year-end readout window for hematologic malignancies and rare blood diseases.',
    sourceLabel: 'hematology.org',
    sourceUrl: 'https://www.hematology.org/meetings/annual-meeting',
  },
];

export default function ConferenceCatalyst() {
  const project = getProjectBySlug('conference-catalyst-monitor');

  if (!project) {
    return (
      <ProjectPageLayout title="Project not found">
        <p className="text-slate-600 dark:text-zinc-400">That project doesn't exist.</p>
      </ProjectPageLayout>
    );
  }

  return (
    <ProjectPageLayout title={project.title} subtitle="Readout tracking across major conferences.">
      <div className="space-y-10">

        {/* Status pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-slate-600 dark:text-zinc-400 px-2.5 py-1 bg-slate-100 dark:bg-zinc-800 rounded">
            {project.yearStart}
          </span>
          <Pill variant={project.status === 'Live' ? 'status-live' : 'status-wip'}>{project.status}</Pill>
          {project.themes.map(t => <Pill key={t} variant="tech">{t}</Pill>)}
        </div>

        {/* Description */}
        <ProjectLead headline="Every congress readout in your indications, with the key data surfaced.">
          A focused readout tracker for the four major oncology/hematology congresses (ASCO, ESMO, AACR, ASH). The premise is the opposite of catch-all: tell it the indications you cover, and it tracks the Phase 2/3 trials reading out in exactly those — sourced from ClinicalTrials.gov by primary-completion window. When a meeting releases its programme, the matching abstract is attached and an LLM extracts what actually moves the read: whether the primary endpoint was met, plus the key numbers (ORR, mPFS, OS, hazard ratios). The result is an asset database scoped to your coverage, with the efficacy data surfaced inline — not 8,000 abstracts you have to filter yourself.
        </ProjectLead>

        {/* Indications in scope */}
        <Reveal className="space-y-3">
          <h2 className="text-xs font-semibold text-slate-900 dark:text-zinc-100 uppercase tracking-widest flex items-center gap-2">
            Indications in scope
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300 normal-case tracking-normal">
              {INDICATIONS.length}
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-zinc-500 leading-relaxed">
            The watchlist mirrors the indications our drug-development analysts cover, so every tracked readout maps to a downstream consumer. Swap in a different coverage list and the scope follows.
          </p>
          <div className="flex flex-wrap gap-1.5">
            {INDICATIONS.map(ind => (
              <span key={ind} className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300">
                {ind}
              </span>
            ))}
          </div>
        </Reveal>

        {/* Open app button */}
        <div className="flex flex-wrap gap-3">
          <a
            href={APP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Open App
          </a>
        </div>

        {/* Flow diagram */}
        <Reveal className="space-y-3">
          <h2 className="text-xs font-semibold text-slate-900 dark:text-zinc-100 uppercase tracking-widest">
            How it works
          </h2>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 pb-1">
            <span className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-400 flex-shrink-0" />
              Auto
            </span>
            <span className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 flex-shrink-0" />
              Agentic
            </span>
          </div>

          {/* Flow nodes */}
          <div>
            {FLOW.map((step, i) => {
              const isAgentic = step.type === 'agentic';
              const isLast = i === FLOW.length - 1;
              return (
                <div key={step.label} className="flex gap-3">
                  {/* Left track: dot + connecting line */}
                  <div className="flex flex-col items-center flex-shrink-0 pt-1">
                    <div className={`w-3 h-3 rounded-full flex-shrink-0 ring-2 ring-offset-2 ring-offset-[#fafafa] dark:ring-offset-[#0b0f14] ${
                      isAgentic
                        ? 'bg-indigo-500 ring-indigo-200 dark:ring-indigo-800'
                        : 'bg-blue-400 ring-blue-200 dark:ring-blue-800'
                    }`} />
                    {!isLast && (
                      <div className="w-px flex-1 mt-1 bg-zinc-200 dark:bg-zinc-700 min-h-[1.5rem]" />
                    )}
                  </div>

                  {/* Step card */}
                  <div className={`flex-1 mb-3 rounded-xl border px-4 py-3 ${
                    isAgentic
                      ? 'border-indigo-200 dark:border-indigo-900/40 bg-indigo-50/60 dark:bg-indigo-950/10'
                      : 'border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800'
                  }`}>
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-slate-900 dark:text-zinc-100">{step.label}</p>
                      {isAgentic && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                          ✦ Agentic
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-zinc-500 mt-1 leading-relaxed">{step.detail}</p>
                    {step.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {step.tags.map(tag => (
                          <span key={tag.label} className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${TAG_STYLES[tag.color]}`}>
                            {tag.label}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Reveal>

        {/* Conferences covered */}
        <Reveal className="space-y-3">
          <h2 className="text-xs font-semibold text-slate-900 dark:text-zinc-100 uppercase tracking-widest">Conferences covered</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {CONFERENCES.map(c => (
              <div key={c.name} className="rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-3 flex flex-col transition-colors hover:border-indigo-300 dark:hover:border-indigo-500/40">
                <div className="flex items-center gap-2 mb-1">
                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
                    <c.Icon className="h-4 w-4" />
                  </span>
                  <p className="text-sm font-semibold text-slate-900 dark:text-zinc-100">{c.name}</p>
                </div>
                <p className="text-xs text-slate-500 dark:text-zinc-500 leading-relaxed">{c.description}</p>
                <a
                  href={c.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline self-start"
                >
                  <ExternalLink className="w-3 h-3" />
                  {c.sourceLabel}
                </a>
              </div>
            ))}
          </div>
        </Reveal>

        {/* Technologies */}
        {project.tags.length > 0 && (
          <Reveal className="space-y-3">
            <h2 className="text-xs font-semibold text-slate-900 dark:text-zinc-100 uppercase tracking-widest">Technologies</h2>
            <div className="flex flex-wrap gap-1.5">
              {project.tags.map(tag => <Pill key={tag} variant="tech">{tag}</Pill>)}
            </div>
          </Reveal>
        )}

      </div>
    </ProjectPageLayout>
  );
}
