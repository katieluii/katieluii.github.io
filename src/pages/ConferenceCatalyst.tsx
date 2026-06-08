import { ExternalLink } from 'lucide-react';
import { getProjectBySlug } from '../data/projects';
import { Pill } from '../components/Pill';
import ProjectPageLayout from '../components/ProjectPageLayout';

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
    label: 'Conferences in scope',
    detail: 'Four major oncology/hematology congresses — ASCO, ESMO, AACR, and ASH — each tracked from their public programme indices.',
    type: 'auto',
    tags: [{ label: 'ASCO · ESMO · AACR · ASH', color: 'blue' }],
  },
  {
    label: 'Anticipated catalysts',
    detail: 'Phase 2/3 trials with primary completion in the months leading up to each meeting are pulled from ClinicalTrials.gov — these are the assets the market is watching for at the conference.',
    type: 'auto',
    tags: [{ label: 'ClinicalTrials.gov', color: 'blue' }],
  },
  {
    label: 'Asset database',
    detail: 'Each anticipated catalyst becomes a row in the asset database, with sortable columns (drug, sponsor, indication, phase, endpoint result, key data) and expandable rows for full abstract and extraction details.',
    type: 'auto',
    tags: [{ label: 'Sortable · Expandable', color: 'purple' }],
  },
  {
    label: 'LLM data extraction',
    detail: 'Once a conference releases its programme, the matching abstract is attached to each anticipated asset and an LLM extracts the primary endpoint result and the key numerical data points (ORR, mPFS, OS, response rates, hazard ratios).',
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

const CONFERENCES = [
  {
    icon: '🎗️',
    name: 'ASCO',
    description: 'American Society of Clinical Oncology Annual Meeting — the largest oncology meeting of the year, broad solid-tumour coverage.',
    sourceLabel: 'meetings.asco.org',
    sourceUrl: 'https://meetings.asco.org/',
  },
  {
    icon: '🇪🇺',
    name: 'ESMO',
    description: 'European Society for Medical Oncology Congress — Europe\'s flagship oncology meeting and a major late-year readout window.',
    sourceLabel: 'esmo.org',
    sourceUrl: 'https://www.esmo.org/meetings/esmo-congress',
  },
  {
    icon: '🔬',
    name: 'AACR',
    description: 'American Association for Cancer Research Annual Meeting — earlier-stage and translational oncology, including the spring late-breaker track.',
    sourceLabel: 'aacr.org',
    sourceUrl: 'https://www.aacr.org/meeting/aacr-annual-meeting/',
  },
  {
    icon: '🩸',
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
    <ProjectPageLayout title={project.title} subtitle="Conference catalyst monitoring · LLM data extraction">
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
        <p className="text-slate-700 dark:text-zinc-300 leading-relaxed">
          A catalyst monitor for the four major oncology/hematology congresses (ASCO, ESMO, AACR, ASH). Anticipated readouts are sourced from ClinicalTrials.gov; conference abstracts are pulled from each meeting's public index (linked below). An LLM extracts the primary endpoint result and key numerical data points per asset. The frontend renders an asset database with sortable columns (drug, sponsor, indication, phase, endpoint result, key data) and expandable rows for full abstract and extraction details.
        </p>

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
        <div className="space-y-3">
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
        </div>

        {/* Conferences covered */}
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-slate-900 dark:text-zinc-100 uppercase tracking-widest">Conferences covered</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {CONFERENCES.map(c => (
              <div key={c.name} className="rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-3 flex flex-col">
                <p className="text-sm font-semibold text-slate-900 dark:text-zinc-100 mb-1">{c.icon} {c.name}</p>
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
        </div>

        {/* Technologies */}
        {project.tags.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xs font-semibold text-slate-900 dark:text-zinc-100 uppercase tracking-widest">Technologies</h2>
            <div className="flex flex-wrap gap-1.5">
              {project.tags.map(tag => <Pill key={tag} variant="tech">{tag}</Pill>)}
            </div>
          </div>
        )}

      </div>
    </ProjectPageLayout>
  );
}
