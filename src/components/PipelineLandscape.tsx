import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { OBESITY_ASSETS, MECHANISM_COLOURS, type ObesityAsset } from '../data/obesity-assets';
import { TICKER_COLOURS } from '../data/universe';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Study {
  nct_id: string;
  title: string;
  phase: string;
  status: string;
  company: string;
  ticker: string;
  primary_completion: string;
  start_date: string;
  drugs: string[];
}

interface PipelineLandscapeProps {
  pipeline: Study[];
  api: string;
}

interface ObesityTarget {
  ticker: string;
  deal_pressure_badge: 'High' | 'Med' | 'Low';
  deal_pressure_signals: { short_runway: boolean; late_stage: boolean; cheap_vs_peak: boolean };
  strategic_fit_badge: 'High' | 'Med' | 'Low';
  strategic_fit_signals: { obesity_indication: boolean; differentiated: boolean; derisked: boolean };
  runway_months: number | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TIME_START = new Date('2026-05-01');
const TIME_END   = new Date('2027-03-31');
const totalMs    = TIME_END.getTime() - TIME_START.getTime();

const TODAY = new Date('2026-05-17');

const PHASE_ORDER: string[] = ['NDA Submitted', 'Phase 3', 'Phase 2→3', 'Phase 2', 'Phase 1'];

const PHASE_COLOURS: Record<string, string> = {
  'Marketed':      'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  'NDA Submitted': 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  'Phase 3':       'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
  'Phase 2→3':     'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  'Phase 2':       'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  'Phase 1':       'bg-zinc-100 text-zinc-600 dark:bg-zinc-700/60 dark:text-zinc-400',
};

const STATUS_COLOURS: Record<string, string> = {
  RECRUITING:              'text-emerald-600 dark:text-emerald-400',
  ACTIVE_NOT_RECRUITING:   'text-amber-600 dark:text-amber-400',
  NOT_YET_RECRUITING:      'text-blue-600 dark:text-blue-400',
  COMPLETED:               'text-zinc-400 dark:text-zinc-500',
};

const STATUS_LABELS: Record<string, string> = {
  RECRUITING:            'Recruiting',
  ACTIVE_NOT_RECRUITING: 'Active',
  NOT_YET_RECRUITING:    'Not yet open',
  COMPLETED:             'Completed',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function dateToPct(dateStr: string): number {
  const d = new Date(dateStr);
  const pct = (d.getTime() - TIME_START.getTime()) / totalMs * 100;
  return Math.max(2, Math.min(98, pct));
}

function dealPressureColor(badge: string): string {
  if (badge === 'High') return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300';
  if (badge === 'Med')  return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300';
  return 'bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300';
}

function strategicFitColor(badge: string): string {
  if (badge === 'High') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300';
  if (badge === 'Med')  return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300';
  return 'bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300';
}

function ownerTypePill(ownerType: string): string {
  if (ownerType === 'Big pharma in-house')  return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300';
  if (ownerType === 'Big pharma licensed-in') return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300';
  return 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300';
}

function ownerTypeLabel(ownerType: string): string {
  if (ownerType === 'Big pharma in-house')    return 'In-house';
  if (ownerType === 'Big pharma licensed-in') return 'Licensed-in';
  return 'Biotech';
}

/** Returns quarter labels from Q2 2026 through Q4 2028 */
function generateQuarters(): Array<{ label: string; pct: number }> {
  const quarters: Array<{ label: string; pct: number }> = [];
  for (let year = 2026; year <= 2027; year++) {
    const startQ = year === 2026 ? 2 : 1;
    for (let q = startQ; q <= 4; q++) {
      const month = (q - 1) * 3; // Q1=Jan=0, Q2=Apr=3, Q3=Jul=6, Q4=Oct=9
      const date = new Date(year, month, 1);
      if (date >= TIME_START && date <= TIME_END) {
        const pct = (date.getTime() - TIME_START.getTime()) / totalMs * 100;
        quarters.push({ label: `Q${q} ${year}`, pct: Math.max(0, Math.min(100, pct)) });
      }
    }
  }
  return quarters;
}

function readoutInWindow(dateStr: string | undefined, months: number): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const cutoff = new Date(TODAY);
  cutoff.setMonth(cutoff.getMonth() + months);
  return d >= TODAY && d <= cutoff;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Collapsible section wrapper matching M&A Signals pattern */
function CollapsibleSection({
  title,
  defaultOpen = true,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl ring-1 ring-zinc-200/80 dark:ring-white/10 bg-white/80 dark:bg-zinc-800/80 overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors uppercase tracking-widest"
      >
        <span>{title}</span>
        {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>
      {open && (
        <div className="px-4 pb-4 border-t border-zinc-100 dark:border-white/5 pt-3">
          {children}
        </div>
      )}
    </div>
  );
}

// ─── 1. Stage-by-readout timeline ────────────────────────────────────────────

function ReadoutTimeline() {
  const quarters = generateQuarters();

  // Group assets that have nextReadout by phase group
  const phaseGroups: string[] = ['NDA Submitted', 'Phase 3', 'Phase 2', 'Phase 1'];

  // Assets to show in each phase row: those with nextReadout OR those that are Marketed/NDA-Submitted
  function assetsForPhaseRow(phaseGroup: string): ObesityAsset[] {
    if (phaseGroup === 'NDA Submitted') {
      return OBESITY_ASSETS.filter(a =>
        a.phase === 'NDA Submitted' || a.phase === 'Marketed'
      );
    }
    if (phaseGroup === 'Phase 3') {
      return OBESITY_ASSETS.filter(a => a.phase === 'Phase 3' && a.nextReadout);
    }
    if (phaseGroup === 'Phase 2') {
      return OBESITY_ASSETS.filter(a =>
        (a.phase === 'Phase 2' || a.phase === 'Phase 2→3') && a.nextReadout
      );
    }
    if (phaseGroup === 'Phase 1') {
      return OBESITY_ASSETS.filter(a => a.phase === 'Phase 1' && a.nextReadout);
    }
    return [];
  }

  return (
    <CollapsibleSection title="Upcoming Readouts" defaultOpen={true}>
      <div className="space-y-0">
        {/* Quarter axis header */}
        <div className="relative h-6 mb-3">
          <div className="absolute inset-x-0 top-0 ml-[275px] mr-0 h-6">
            {quarters.map(q => (
              <div
                key={q.label}
                className="absolute top-0 -translate-x-1/2"
                style={{ left: `${q.pct}%` }}
              >
                <span className="text-[9px] text-zinc-400 dark:text-zinc-500 whitespace-nowrap">{q.label}</span>
                <div className="absolute left-1/2 top-4 h-2 w-px bg-zinc-200 dark:bg-zinc-700" />
              </div>
            ))}
          </div>
        </div>

        {/* Phase rows */}
        {phaseGroups.map(phaseGroup => {
          const assets = assetsForPhaseRow(phaseGroup);
          if (assets.length === 0) return null;
          return (
            <div key={phaseGroup} className="mb-4">
              {/* Phase group label */}
              <p className="text-[9px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-2 mt-1">
                {phaseGroup === 'NDA Submitted' ? 'MARKETED / REG APPROVAL' : phaseGroup}
              </p>
              {assets.map(asset => {
                const isMarketed    = asset.phase === 'Marketed';
                const isNDAFiled    = asset.phase === 'NDA Submitted';
                const fixedLeft     = isMarketed || isNDAFiled || !asset.nextReadout;
                const outOfWindow   = !fixedLeft && !!asset.nextReadout && new Date(asset.nextReadout) > TIME_END;
                const leftPct       = fixedLeft ? 0 : outOfWindow ? 97 : dateToPct(asset.nextReadout!);
                const dotLabel      = isMarketed ? 'Marketed' : isNDAFiled ? 'FDA review' : null;
                const mechColor     = MECHANISM_COLOURS[asset.mechanism] ?? '#a1a1aa';
                const sponsorLabel  = asset.sponsorName ?? asset.sponsor;
                const readoutYear   = asset.nextReadout ? asset.nextReadout.slice(0, 4) : null;

                return (
                  <div key={asset.id} className="flex items-center h-9">
                    {/* Asset name column: 175px name + gap + ticker */}
                    <div className="flex-shrink-0 w-[275px] pr-3 flex items-center gap-4">
                      <span className="w-[175px] flex-shrink-0 whitespace-nowrap text-[11px] text-zinc-700 dark:text-zinc-300 leading-tight">
                        {asset.name}
                      </span>
                      <span className="flex-shrink-0 whitespace-nowrap text-[9px] font-mono font-semibold text-zinc-400 dark:text-zinc-500">
                        {sponsorLabel}
                      </span>
                    </div>

                    {/* Track */}
                    <div className="flex-1 relative h-full">
                      {/* Baseline grid line */}
                      <div className="absolute inset-y-0 inset-x-0 flex items-center pointer-events-none">
                        <div className="w-full h-px bg-zinc-100 dark:bg-zinc-700/60" />
                      </div>

                      {fixedLeft ? (
                        /* Marketed / NDA-filed: leftmost badge */
                        <div className="absolute left-0 top-1/2 -translate-y-1/2">
                          <span
                            className="text-[9px] font-medium px-1.5 py-0.5 rounded-full"
                            style={{ backgroundColor: mechColor + '33', color: mechColor }}
                          >
                            {dotLabel ?? '—'}
                          </span>
                        </div>
                      ) : (
                        /* Dot positioned at nextReadout (or pinned at right edge if out of window) */
                        <div
                          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 group/dot"
                          style={{ left: `${leftPct}%` }}
                        >
                          {/* Out-of-window: dashed ring dot + year arrow */}
                          {outOfWindow ? (
                            <div className="flex items-center gap-0.5">
                              <div
                                className="w-3 h-3 rounded-full border-2 border-dashed cursor-default"
                                style={{ borderColor: mechColor, backgroundColor: mechColor + '30' }}
                              />
                              <span className="text-[8px] text-zinc-400 whitespace-nowrap">{readoutYear} →</span>
                            </div>
                          ) : (
                            <div
                              className="w-3 h-3 rounded-full ring-2 ring-white dark:ring-zinc-800 cursor-default shadow-sm"
                              style={{ backgroundColor: mechColor }}
                            />
                          )}
                          {/* Hover tooltip */}
                          <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/dot:block z-30 rounded-lg bg-zinc-900 dark:bg-zinc-700 px-2.5 py-2 text-zinc-100 shadow-xl text-xs space-y-0.5 min-w-[240px] max-w-[300px] whitespace-normal">
                            <p className="font-semibold text-zinc-200">{asset.name}</p>
                            <p className="text-zinc-400">{sponsorLabel}</p>
                            <p>{asset.mechanism} · {asset.route}</p>
                            <p>Phase: {asset.phase}</p>
                            <p>Est. readout: {asset.nextReadout}{outOfWindow ? ' (beyond chart window)' : ''}</p>
                            {asset.statusNote && (
                              <p className="text-zinc-300 pt-1 border-t border-white/10 leading-relaxed">
                                {asset.statusNote}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </CollapsibleSection>
  );
}

// ─── 2. Filter bar ────────────────────────────────────────────────────────────

type PhaseFilter      = '' | 'NDA Submitted' | 'Phase 3' | 'Phase 2' | 'Phase 1';
type MechFilter       = '' | string;
type OwnerFilter      = '' | 'Big pharma in-house' | 'Big pharma licensed-in' | 'Independent biotech';
type ReadoutFilter    = '' | '6m' | '12m' | '12m+';

interface Filters {
  phase:   PhaseFilter;
  mech:    MechFilter;
  owner:   OwnerFilter;
  readout: ReadoutFilter;
}

function FilterBar({
  filters,
  setFilters,
}: {
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
}) {
  const chipClass = (active: boolean) =>
    `px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
      active
        ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
    }`;

  const uniqueMechs = [...new Set(OBESITY_ASSETS.map(a => a.mechanism))];

  return (
    <div className="space-y-2">
      {/* Phase filter */}
      <div className="flex flex-wrap gap-1.5">
        {([['', 'All phases'], ['NDA Submitted', 'NDA Submitted'], ['Phase 3', 'Phase 3'], ['Phase 2', 'Phase 2'], ['Phase 1', 'Phase 1']] as [PhaseFilter, string][]).map(([val, label]) => (
          <button key={val} onClick={() => setFilters(f => ({ ...f, phase: val }))} className={chipClass(filters.phase === val)}>
            {label}
          </button>
        ))}
      </div>

      {/* Mechanism filter */}
      <div className="flex flex-wrap gap-1.5">
        <button onClick={() => setFilters(f => ({ ...f, mech: '' }))} className={chipClass(filters.mech === '')}>
          All mechanisms
        </button>
        {uniqueMechs.map(m => (
          <button key={m} onClick={() => setFilters(f => ({ ...f, mech: m }))} className={chipClass(filters.mech === m)}>
            {m}
          </button>
        ))}
      </div>

      {/* Owner filter */}
      <div className="flex flex-wrap gap-1.5">
        {([
          ['', 'All owners'],
          ['Big pharma in-house', 'Big pharma in-house'],
          ['Big pharma licensed-in', 'Big pharma licensed-in'],
          ['Independent biotech', 'Independent biotech'],
        ] as [OwnerFilter, string][]).map(([val, label]) => (
          <button key={val} onClick={() => setFilters(f => ({ ...f, owner: val }))} className={chipClass(filters.owner === val)}>
            {label}
          </button>
        ))}
      </div>

      {/* Readout window filter */}
      <div className="flex flex-wrap gap-1.5">
        {([
          ['', 'All readouts'],
          ['6m', 'Next 6 months'],
          ['12m', 'Next 12 months'],
          ['12m+', '12 months+'],
        ] as [ReadoutFilter, string][]).map(([val, label]) => (
          <button key={val} onClick={() => setFilters(f => ({ ...f, readout: val }))} className={chipClass(filters.readout === val)}>
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── 3. Asset card ────────────────────────────────────────────────────────────

function TrialExpander({ studies }: { studies: Study[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-t border-zinc-100 dark:border-white/5 pt-2 mt-1">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
      >
        {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        {studies.length} trial{studies.length !== 1 ? 's' : ''}
      </button>
      {open && (
        <div className="mt-2 space-y-1.5">
          {studies.map(s => (
            <div key={s.nct_id} className="rounded-lg bg-zinc-50 dark:bg-zinc-700/40 px-3 py-2 space-y-0.5">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className={`text-[10px] font-medium ${STATUS_COLOURS[s.status] ?? 'text-zinc-400'}`}>
                  {STATUS_LABELS[s.status] ?? s.status}
                </span>
                {s.primary_completion && (
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                    Primary: {s.primary_completion.slice(0, 7)}
                  </span>
                )}
                {s.nct_id && (
                  <a
                    href={`https://clinicaltrials.gov/study/${s.nct_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-0.5 text-[10px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                  >
                    {s.nct_id} <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
              </div>
              <p className="text-[10px] text-zinc-600 dark:text-zinc-400 leading-snug">{s.title}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AssetCard({
  asset,
  studies,
  target,
}: {
  asset: ObesityAsset;
  studies: Study[];
  target?: ObesityTarget;
}) {
  const mechColor    = MECHANISM_COLOURS[asset.mechanism] ?? '#a1a1aa';
  const sponsorLabel = asset.sponsorName ?? asset.sponsor;
  const tickerBg     = asset.sponsor === 'KAILERA'
    ? '#6b7280'
    : (TICKER_COLOURS[asset.sponsor] ?? '#6b7280');
  const isBiotech    = asset.ownerType === 'Independent biotech';

  // Phase pill special cases
  const phasePillClass =
    asset.phase === 'Marketed'
      ? PHASE_COLOURS['Marketed']
      : asset.phase === 'NDA Submitted'
      ? PHASE_COLOURS['NDA Submitted']
      : PHASE_COLOURS[asset.phase] ?? 'bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400';
  const phasePillLabel =
    asset.phase === 'NDA Submitted' ? 'NDA Filed' : asset.phase;

  return (
    <div className="rounded-2xl ring-1 ring-zinc-200/80 dark:ring-white/10 bg-white/80 dark:bg-zinc-800/80 p-4 space-y-2.5 flex flex-col">
      {/* Header row */}
      <div className="flex items-start gap-2 flex-wrap">
        {/* Mechanism color dot */}
        <div
          className="mt-0.5 flex-shrink-0 w-2.5 h-2.5 rounded-full"
          style={{ backgroundColor: mechColor }}
        />
        {/* Drug name */}
        <span className="flex-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100 leading-snug">
          {asset.name}
        </span>
        {/* Sponsor badge */}
        <span
          className="flex-shrink-0 text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded-md text-white leading-none"
          style={{ backgroundColor: tickerBg }}
        >
          {sponsorLabel}
        </span>
        {/* Owner type pill */}
        <span className={`flex-shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${ownerTypePill(asset.ownerType)}`}>
          {ownerTypeLabel(asset.ownerType)}
        </span>
      </div>

      {/* Mechanism + route */}
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        {asset.mechanism} · {asset.route}
      </p>

      {/* Phase + readout row */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${phasePillClass}`}>
          {phasePillLabel}
        </span>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          {asset.nextReadout ? `Next readout: ${asset.nextReadout}` : '—'}
        </span>
      </div>

      {/* Deal pressure + strategic fit — Tier 2 biotechs only */}
      {isBiotech && target && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="relative group/dp">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full cursor-default ${dealPressureColor(target.deal_pressure_badge)}`}>
              {target.deal_pressure_badge} pressure
            </span>
            <span className="pointer-events-none absolute left-0 top-full mt-1.5 hidden group-hover/dp:block z-20 rounded-lg bg-zinc-900 dark:bg-zinc-700 px-2.5 py-2 text-zinc-100 shadow-xl text-xs space-y-0.5 min-w-[210px]">
              <span className="block font-semibold text-zinc-300 pb-0.5">Deal pressure</span>
              <span className="block">{target.deal_pressure_signals.short_runway  ? '✓' : '✗'} Runway &lt;24 months</span>
              <span className="block">{target.deal_pressure_signals.late_stage    ? '✓' : '✗'} Phase 2+ (clinical stage)</span>
              <span className="block">{target.deal_pressure_signals.cheap_vs_peak ? '✓' : '✗'} Mkt cap &lt;2× peak sales est.</span>
            </span>
          </span>
          <span className="relative group/sf">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full cursor-default ${strategicFitColor(target.strategic_fit_badge)}`}>
              {target.strategic_fit_badge} fit
            </span>
            <span className="pointer-events-none absolute left-0 top-full mt-1.5 hidden group-hover/sf:block z-20 rounded-lg bg-zinc-900 dark:bg-zinc-700 px-2.5 py-2 text-zinc-100 shadow-xl text-xs space-y-0.5 min-w-[230px]">
              <span className="block font-semibold text-zinc-300 pb-0.5">Strategic fit</span>
              <span className="block">{target.strategic_fit_signals.obesity_indication ? '✓' : '✗'} Obesity / T2DM indication</span>
              <span className="block">{target.strategic_fit_signals.differentiated     ? '✓' : '✗'} Differentiated mechanism</span>
              <span className="block">{target.strategic_fit_signals.derisked           ? '✓' : '✗'} Phase 2 PoC data or Phase 3</span>
            </span>
          </span>
        </div>
      )}

      {/* Likely acquirers — Tier 2 independent biotechs only */}
      {isBiotech && asset.likelyAcquirers && asset.likelyAcquirers.length > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
            Likely acquirers
          </p>
          <div className="flex flex-wrap gap-1">
            {asset.likelyAcquirers.map(a => (
              <span
                key={a.ticker}
                className="relative group/acq text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 cursor-default"
              >
                {a.ticker}
                <span className="pointer-events-none absolute bottom-full left-0 mb-1.5 hidden group-hover/acq:block z-20 whitespace-nowrap rounded-lg bg-zinc-900 dark:bg-zinc-700 px-2.5 py-1.5 text-zinc-100 shadow-xl text-xs">
                  {a.rationale}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Trial expander */}
      {studies.length > 0 && <TrialExpander studies={studies} />}

      {/* Lead asset footnote */}
      {asset.isLeadObesityAsset && (
        <div className="flex items-center gap-1 pt-1 border-t border-zinc-100 dark:border-white/5 mt-auto">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span className="text-[10px] text-zinc-400 dark:text-zinc-500">Lead obesity asset</span>
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function PipelineLandscape({ pipeline, api }: PipelineLandscapeProps) {
  const [targets, setTargets] = useState<ObesityTarget[]>([]);
  const [filters, setFilters] = useState<Filters>({
    phase: '', mech: '', owner: '', readout: '',
  });

  useEffect(() => {
    fetch(`${api}/obesity-targets`)
      .then(r => r.json())
      .then((data: unknown) => {
        if (Array.isArray(data)) setTargets(data as ObesityTarget[]);
      })
      .catch(() => {/* silently ignore — badges just won't render */});
  }, [api]);

  // Build ticker → target map
  const targetMap = new Map<string, ObesityTarget>(targets.map(t => [t.ticker, t]));

  // Filter logic
  const filteredAssets = OBESITY_ASSETS.filter(asset => {
    if (filters.phase) {
      // Phase filter — treat 'Phase 2' as matching 'Phase 2→3' too
      if (filters.phase === 'Phase 2') {
        if (asset.phase !== 'Phase 2' && asset.phase !== 'Phase 2→3') return false;
      } else {
        if (asset.phase !== filters.phase) return false;
      }
    }
    if (filters.mech  && asset.mechanism  !== filters.mech)  return false;
    if (filters.owner && asset.ownerType  !== filters.owner) return false;
    if (filters.readout) {
      if (filters.readout === '6m')  { if (!readoutInWindow(asset.nextReadout, 6))  return false; }
      if (filters.readout === '12m') { if (!readoutInWindow(asset.nextReadout, 12)) return false; }
      if (filters.readout === '12m+') {
        if (!asset.nextReadout) return false;
        const d = new Date(asset.nextReadout);
        const cutoff = new Date(TODAY);
        cutoff.setMonth(cutoff.getMonth() + 12);
        if (d < cutoff) return false;
      }
    }
    return true;
  });

  // Sort filtered assets by PHASE_ORDER then name
  const sorted = [...filteredAssets].sort((a, b) => {
    const aIdx = PHASE_ORDER.indexOf(a.phase);
    const bIdx = PHASE_ORDER.indexOf(b.phase);
    const aOrd = aIdx === -1 ? 99 : aIdx;
    const bOrd = bIdx === -1 ? 99 : bIdx;
    if (aOrd !== bOrd) return aOrd - bOrd;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="space-y-6">
      {/* Section header */}
      <div>
        <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-widest">
          Obesity Drug Pipeline
        </p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          Asset-centric view of the GLP-1/obesity competitive landscape. One card per drug, grouped
          by development stage. Tier 2 biotech assets include M&A scoring from the Signals tab.{' '}
          <span className="italic">Not an exhaustive pipeline — covers the frontrunning assets in the GLP-1/obesity space.</span>
        </p>
      </div>

      {/* 1. Timeline */}
      <ReadoutTimeline />

      {/* 2. Filter bar */}
      <FilterBar filters={filters} setFilters={setFilters} />

      {/* 3. Asset card grid */}
      {sorted.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">No assets match the selected filters.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {sorted.map(asset => (
            <AssetCard
              key={asset.id}
              asset={asset}
              studies={pipeline.filter(s => s.ticker === asset.sponsor)}
              target={targetMap.get(asset.sponsor)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
