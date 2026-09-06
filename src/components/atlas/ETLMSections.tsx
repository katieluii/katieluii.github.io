import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Pill as PillIcon,
  TestTube,
  Gauge,
  Network,
  Calendar,
  Swords,
  AlertTriangle,
  Shield,
  Users,
  EyeOff,
  ExternalLink,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { crossLinks, etlmIndex, tppIndex } from '../../data/atlas/index';
import { themeShortLabel } from '../../data/atlas/taxonomy';
import { listItemText } from '../../data/atlas/presentationProfile';
import { labelText } from '../../data/atlas/labelText';
import {
  filterAssetGroups,
  groupPipelineAssets,
  TRIAL_STATUS_ORDER,
  trialStatusLabel,
  visibleTrials,
  type AssetGroup,
  type NormalizedTrialStatus,
} from '../../data/atlas/pipelineAssets';

const tppLabel = (slug: string) =>
  tppIndex.find((t) => t.slug === slug)?.segment ??
  slug.replace(/^tpp_/, '').replace(/_\d{4}-\d{2}-\d{2}$/, '').replace(/_/g, ' ');

type Props = {
  etlm: Record<string, unknown>;
  indicationCode: string;
};

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
  count,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle?: string;
  count?: number;
}) {
  return (
    <div className="flex items-end justify-between mb-4">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Icon className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{title}</h2>
        </div>
        {subtitle && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400 ml-6">{subtitle}</p>
        )}
      </div>
      {typeof count === 'number' && (
        <span className="text-xs text-zinc-400 dark:text-zinc-500">{count} entries</span>
      )}
    </div>
  );
}

function Card({ children, accent }: { children: React.ReactNode; accent?: string }) {
  const accentClass = accent ?? 'ring-zinc-200 dark:ring-white/10';
  return (
    <div className={`rounded-xl ring-1 ${accentClass} bg-white/60 dark:bg-white/5 p-4`}>
      {children}
    </div>
  );
}

/** Cap a long list to `cap` items with a Show all / Show less toggle, so the
 *  public landscape map stays skimmable. Applied pipeline-wide (every ETLM). */
function useShowMore<T>(items: T[], cap: number) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? items : items.slice(0, cap);
  const hiddenCount = items.length - shown.length;
  return { shown, hiddenCount, expanded, toggle: () => setExpanded((v) => !v) };
}

function ShowMore({
  hiddenCount,
  expanded,
  onClick,
}: {
  hiddenCount: number;
  expanded: boolean;
  onClick: () => void;
}) {
  if (hiddenCount <= 0 && !expanded) return null;
  return (
    <button
      onClick={onClick}
      className="mt-3 text-xs font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
    >
      {expanded ? '− Show less' : `+ Show all (${hiddenCount} more)`}
    </button>
  );
}

function KV({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div className="flex flex-col">
      <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
        {label}
      </span>
      <span className="text-xs text-zinc-800 dark:text-zinc-200 mt-0.5">{value}</span>
    </div>
  );
}

function NctLink({ nct }: { nct?: string | null }) {
  if (!nct || typeof nct !== 'string') return null;
  return (
    <a
      href={`https://clinicaltrials.gov/study/${nct}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 underline decoration-dotted underline-offset-4 hover:text-indigo-700"
    >
      {nct}
      <ExternalLink className="w-3 h-3" />
    </a>
  );
}

function isObj(v: unknown): v is Record<string, unknown> {
  return Boolean(v) && typeof v === 'object' && !Array.isArray(v);
}

/** Humanize an enum/status string: ACTIVE_NOT_RECRUITING -> "Active not recruiting".
 *  Leaves free text (anything with lowercase letters) intact apart from underscores. */
function humanizeEnum(s: unknown): string {
  if (s === null || s === undefined) return '—';
  const str = String(s).trim();
  if (!str) return '—';
  const spaced = str.replace(/_/g, ' ');
  if (/[a-z]/.test(str)) return spaced; // already mixed/lowercase free text
  const lower = spaced.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

/** Render a LABELLED key→value readout as skimmable text — never raw JSON. A
 *  public landscape map must never dump `{...}`, so objects become
 *  "key: value , key: value" and arrays join their humanized items. Bounded depth
 *  so a deep object can't explode.
 *
 *  The labels are load-bearing HERE and only here: this renders a keyed detail
 *  panel where each key names a distinct fact that its value does not restate.
 *  Strip them and obesity's `generational_framing` turns two labelled drug lists
 *  (`frontrunner_injectables` / `frontrunner_orals`) into one undifferentiated
 *  run of names, and `basis_by_parameter`'s per-axis assessments (efficacy /
 *  safety_tolerability / convenience_route) lose the axis they assess.
 *
 *  DO NOT use this for an element of a bulleted list. There every bullet repeats
 *  the same keys, so the keys are schema plumbing and rendering them is the
 *  defect ("company: Pfizer-Astellas , franchise: …" on the live urothelial
 *  page). listItemText() owns that role. */
function humanizeValue(v: unknown, depth = 0): string {
  if (v === null || v === undefined) return '—';
  if (Array.isArray(v)) return v.map((x) => humanizeValue(x, depth + 1)).filter(Boolean).join(', ');
  if (isObj(v)) {
    if (depth >= 2) return Object.values(v).map((x) => humanizeValue(x, depth + 1)).filter(Boolean).join(', ');
    return Object.entries(v)
      // labelText, not humanizeEnum: this is the last place a KEY became a
      // user-visible label through a different formatter, so a detail readout
      // rendered its keys in a different case from every heading on the page.
      .map(([k, val]) => `${labelText(k)}: ${humanizeValue(val, depth + 1)}`)
      .join(' , ');
  }
  return String(v);
}

/** Renders an ETLM `sources` array (`{label, url, type, quoted_metric}`) as a row
 *  of links; entries without a usable url fall back to plain label text. */
function SourceLinks({ sources, className }: { sources: unknown; className?: string }) {
  if (!Array.isArray(sources)) return null;
  const items = sources.filter(isObj);
  if (items.length === 0) return null;
  return (
    <div
      className={
        className ??
        'flex flex-wrap gap-x-3 gap-y-1 pt-1 text-[10px] text-zinc-400 dark:text-zinc-500'
      }
    >
      {items.map((s, i) => {
        const label = s.label ? String(s.label) : s.url ? String(s.url) : 'source';
        const url = typeof s.url === 'string' && s.url.trim() ? s.url.trim() : null;
        return url ? (
          <a
            key={i}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 underline decoration-dotted underline-offset-4 hover:text-indigo-700"
          >
            {label}
            <ExternalLink className="w-3 h-3" />
          </a>
        ) : (
          <span key={i} className="italic">
            {label}
          </span>
        );
      })}
    </div>
  );
}

/** Keys inside an efficacy_benchmark object that are NOT scalar metrics
 *  (provenance, prose notes, oncology placeholders kept null for non-onc). */
const BENCH_SKIP_KEY = /(^source$|^sources$|_source$|_note$|^data_pending$|^ws13)/i;

/** Returns the displayable scalar metric pairs from a benchmark object,
 *  dropping nulls, source/note keys, and nested objects. */
function benchmarkEntries(obj: unknown): Array<[string, unknown]> {
  if (!isObj(obj)) return [];
  return Object.entries(obj).filter(
    ([k, v]) =>
      v !== null &&
      v !== undefined &&
      v !== '' &&
      typeof v !== 'object' &&
      !BENCH_SKIP_KEY.test(k),
  );
}

/** Long prose notes that some benchmark objects carry alongside metrics. */
function benchmarkNotes(obj: unknown): string[] {
  if (!isObj(obj)) return [];
  return Object.entries(obj)
    .filter(([k, v]) => /_note$|^data_pending$|^ws13/i.test(k) && typeof v === 'string' && v)
    .map(([, v]) => String(v));
}

/** TRUE row count for a section on a capped PREVIEW payload; null when this
 *  payload is not a preview, or when the section has no recorded total.
 *
 *  A preview ships only the first `detail_rows_shown` rows of the sections it
 *  keeps, so `etlm[key].length` is the CAP — 3 for every section — and a footer
 *  built from it would read "3 of 3" and hide the single fact it exists to
 *  state. `section_counts` carries the real totals (urothelial: 23 approved
 *  therapies, 44 pipeline assets) and is the only correct source here.
 *
 *  Returns null unless `detail_available === false`. That is what keeps the
 *  featured indications (obesity / mm / nsclc — no such key) byte-identical:
 *  every caller falls back to the array length it already used. */
function previewSectionTotal(etlm: Record<string, unknown>, key: string): number | null {
  if (etlm.detail_available !== false) return null;
  const counts = etlm.section_counts;
  if (!isObj(counts)) return null;
  const n = counts[key];
  return typeof n === 'number' && Number.isFinite(n) ? n : null;
}

/** Footer under the last visible row of a section that DID ship rows on a
 *  preview. Deliberately not a Card and not a table row — a dashed hairline
 *  rule plus small muted text, so it reads as a note ABOUT the list rather than
 *  the last item IN it.
 *
 *  The numbers are the true totals from section_counts and are stated plainly:
 *  nothing here is withheld, so nothing here is blurred. Renders nothing when
 *  there is no preview total (featured pages) or when the section shipped
 *  whole. */
function PreviewRowsFooter({ shown, total }: { shown: number; total: number | null }) {
  if (total === null || !(total > shown)) return null;
  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-1.5 gap-y-1 border-t border-dashed border-zinc-300 pt-2 text-[11px] text-zinc-500 dark:border-white/15 dark:text-zinc-400">
      <EyeOff className="h-3 w-3" aria-hidden="true" />
      <span className="font-medium text-zinc-700 dark:text-zinc-300">Preview coverage</span>
      <span>{shown} shown</span>
      <span aria-hidden="true">·</span>
      <span>{total} total</span>
      <span aria-hidden="true">·</span>
      <span>{total - shown} withheld</span>
    </div>
  );
}

function Epidemiology({ data }: { data: Record<string, unknown> }) {
  // Scalar stats: numbers/strings that aren't provenance (*_source) keys.
  const stats = Object.entries(data).filter(
    ([k, v]) =>
      v !== null &&
      v !== undefined &&
      v !== '' &&
      (typeof v === 'number' || typeof v === 'string') &&
      !/_source$/.test(k),
  );
  // Array fields render as bulleted lists (subpopulations, genomic segments, …).
  const lists = Object.entries(data).filter(
    ([, v]) => Array.isArray(v) && v.length > 0,
  ) as Array<[string, unknown[]]>;
  // Provenance strings shown as muted footnotes.
  const provenance = Object.entries(data)
    .filter(([k, v]) => /_source$/.test(k) && typeof v === 'string' && v)
    .map(([, v]) => String(v));

  // Don't render an empty section.
  if (stats.length === 0 && lists.length === 0) return null;

  return (
    <section className="mb-10">
      <SectionHeader icon={Users} title="Epidemiology" />
      <Card>
        {stats.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {stats.map(([k, v]) => (
              <KV
                key={k}
                label={labelText(k)}
                value={typeof v === 'number' ? v.toLocaleString() : String(v)}
              />
            ))}
          </div>
        )}
        {lists.map(([k, arr]) => (
          <div
            key={k}
            className="mt-5 pt-4 border-t border-zinc-200 dark:border-white/10 first:mt-0 first:border-0 first:pt-0"
          >
            <div className="text-[10px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
              {labelText(k)}
            </div>
            <ul className="text-xs text-zinc-700 dark:text-zinc-300 space-y-1 list-disc pl-4">
              {arr.map((s, i) => (
                <li key={i}>{listItemText(s)}</li>
              ))}
            </ul>
          </div>
        ))}
        {provenance.length > 0 && (
          <div className="mt-4 pt-3 border-t border-zinc-200 dark:border-white/10 space-y-0.5 text-[10px] text-zinc-400 dark:text-zinc-500">
            {provenance.map((p, i) => (
              <div key={i}>{p}</div>
            ))}
          </div>
        )}
      </Card>
    </section>
  );
}

/** Latest-timepoint total-body-weight-loss % from a custom_efficacy object. */
function tbwlSummary(custEff: unknown): string | null {
  if (!isObj(custEff)) return null;
  const keys = Object.keys(custEff).filter(
    (k) => /tbwl/i.test(k) && typeof custEff[k] === 'number',
  );
  if (keys.length === 0) return null;
  keys.sort((a, b) => {
    const wa = a.match(/(\d+)(?!.*\d)/);
    const wb = b.match(/(\d+)(?!.*\d)/);
    return (wb ? Number(wb[1]) : 0) - (wa ? Number(wa[1]) : 0);
  });
  return `${custEff[keys[0]]}% TBWL`;
}

function ApprovedTherapies({
  data,
  sectionLabel,
  condensed,
  totalRows,
}: {
  data: unknown[];
  sectionLabel?: string;
  condensed?: boolean;
  /** True section total on a capped preview (from section_counts). null /
   *  undefined on a full-detail payload, where the shipped array IS the whole
   *  section and the header count stays exactly what it was. */
  totalRows?: number | null;
}) {
  const headerCount = totalRows ?? data.length;
  const title = sectionLabel ?? 'Approved therapies';
  const subtitle = sectionLabel === 'Legacy Approved Therapies'
    ? 'Pre-incretin era; largely displaced — class-level summary only'
    : sectionLabel === 'Novel Approved Therapies'
    ? 'Current standard-of-care and active agents'
    : 'The standard-of-care anchor';

  const cards = data.filter(isObj);
  const { shown, hiddenCount, expanded, toggle } = useShowMore(cards, 8);

  // Condensed mode: one line per agent (no per-drug efficacy / safety / trial
  // cards) — legacy agents don't warrant equal granularity to active agents.
  if (condensed) {
    return (
      <section className="mb-10">
        <SectionHeader icon={Shield} title={title} subtitle={subtitle} count={headerCount} />
        <Card>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3 max-w-[72ch] leading-relaxed">
            Pre-incretin oral agents. Efficacy ceiling ~3–8% total body-weight loss versus 15–23%
            for the incretin class — commercially displaced. Retained relevance: low-cost generics,
            payer step-therapy, and contraindication / adolescent niches.
          </p>
          <ul className="text-xs">
            {data.filter(isObj).map((entry, i) => {
              const tb = tbwlSummary(entry.custom_efficacy);
              const modShort = String(entry.modality ?? '').replace(/\s*\(.*$/, '');
              return (
                <li
                  key={i}
                  className="flex justify-between gap-3 border-b border-zinc-100 dark:border-white/5 py-1.5 last:border-0"
                >
                  <span className="text-zinc-700 dark:text-zinc-300">
                    {String(entry.brand ?? entry.drug_name ?? '—')}
                    {entry.drug_name && entry.brand ? (
                      <span className="text-zinc-400 dark:text-zinc-500"> ({String(entry.drug_name)})</span>
                    ) : null}
                    {modShort ? (
                      <span className="text-zinc-400 dark:text-zinc-500"> , {modShort}</span>
                    ) : null}
                  </span>
                  <span className="tabular-nums text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                    {tb ?? '—'}
                  </span>
                </li>
              );
            })}
          </ul>
          <PreviewRowsFooter shown={data.filter(isObj).length} total={totalRows ?? null} />
        </Card>
      </section>
    );
  }

  return (
    <section className="mb-10">
      <SectionHeader
        icon={Shield}
        title={title}
        subtitle={subtitle}
        count={headerCount}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {shown.map((entry, i) => {
          if (!isObj(entry)) return null;
          const eff = isObj(entry.key_efficacy) ? entry.key_efficacy : {};
          return (
            <Card key={i} accent="ring-emerald-200/60 dark:ring-emerald-500/20">
              <div className="flex items-baseline justify-between gap-2 mb-2">
                <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {String(entry.brand ?? entry.drug_name ?? entry.asset_name ?? '—')}
                  {entry.drug_name && entry.brand ? (
                    <span className="ml-2 text-xs font-normal text-zinc-500 dark:text-zinc-400">
                      ({String(entry.drug_name)})
                    </span>
                  ) : null}
                </div>
                <span className="text-[10px] uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  Approved
                </span>
              </div>
              <div className="text-xs text-zinc-600 dark:text-zinc-400 mb-3">
                {String(entry.company ?? '')} , {String(entry.modality ?? '')}
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <KV label="Target" value={entry.target ? String(entry.target) : null} />
                <KV
                  label="Indication / line"
                  value={entry.indication_line ? String(entry.indication_line) : null}
                />
                <KV
                  label="FDA approved"
                  value={entry.fda_approval_date ? String(entry.fda_approval_date) : null}
                />
                <KV
                  label="EMA approved"
                  value={entry.ema_approval_date ? String(entry.ema_approval_date) : null}
                />
              </div>
              {Object.entries(eff).filter(([, v]) => v != null).length > 0 && (
                <div className="border-t border-zinc-200 dark:border-white/10 pt-3 mb-2">
                  <div className="text-[10px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                    Key efficacy ({entry.trial ? String(entry.trial) : 'pivotal trial'})
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-800 dark:text-zinc-200">
                    {Object.entries(eff)
                      .filter(([, v]) => v != null)
                      .map(([k, v]) => (
                        <span key={k}>
                          <span className="text-zinc-500 dark:text-zinc-400">{labelText(k)}:</span>{' '}
                          <span className="font-medium">{String(v)}</span>
                        </span>
                      ))}
                  </div>
                </div>
              )}
              {isObj(entry.custom_efficacy) &&
                Object.entries(entry.custom_efficacy).filter(([, v]) => v != null).length > 0 && (
                  <div className="border-t border-zinc-200 dark:border-white/10 pt-3 mb-2">
                    <div className="text-[10px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                      Efficacy ({entry.trial ? String(entry.trial) : 'pivotal trial'})
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-800 dark:text-zinc-200">
                      {Object.entries(entry.custom_efficacy as Record<string, unknown>)
                        .filter(([, v]) => v != null)
                        .map(([k, v]) => (
                          <span key={k}>
                            <span className="text-zinc-500 dark:text-zinc-400">{labelText(k)}:</span>{' '}
                            <span className="font-medium">{String(v)}</span>
                          </span>
                        ))}
                    </div>
                  </div>
                )}
              {isObj(entry.custom_safety) &&
                Object.entries(entry.custom_safety).filter(([, v]) => v != null).length > 0 && (
                  <div className="border-t border-zinc-200 dark:border-white/10 pt-3 mb-2">
                    <div className="text-[10px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                      Safety — GI
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-800 dark:text-zinc-200">
                      {Object.entries(entry.custom_safety as Record<string, unknown>)
                        .filter(([, v]) => v != null)
                        .map(([k, v]) => (
                          <span key={k}>
                            <span className="text-zinc-500 dark:text-zinc-400">{labelText(k)}:</span>{' '}
                            <span className="font-medium">{String(v)}</span>
                          </span>
                        ))}
                    </div>
                  </div>
                )}
              {entry.nct ? <NctLink nct={String(entry.nct)} /> : null}
            </Card>
          );
        })}
      </div>
      <ShowMore hiddenCount={hiddenCount} expanded={expanded} onClick={toggle} />
      <PreviewRowsFooter shown={shown.length} total={totalRows ?? null} />
    </section>
  );
}

type SortDir = 'asc' | 'desc';
type SortKey = 'assetName' | 'population' | 'company' | 'modality' | 'target' | 'phase' | 'status';

const PHASE_ORDER: Record<string, number> = {
  'Phase 1': 1, 'Phase 1/2': 2, 'Phase 2': 3, 'Phase 2/3': 4, 'Phase 3': 5, 'NDA/BLA': 6, 'Approved': 7,
};

function phasePill(phase: string) {
  const p = phase.toLowerCase();
  if (p.includes('approved') || p.includes('nda') || p.includes('bla'))
    return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 ring-emerald-600/20 dark:ring-emerald-500/30';
  if (p.includes('3'))
    return 'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300 ring-violet-600/20 dark:ring-violet-500/30';
  if (p.includes('2'))
    return 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300 ring-indigo-600/20 dark:ring-indigo-500/30';
  return 'bg-zinc-100 text-zinc-600 dark:bg-white/10 dark:text-zinc-300 ring-zinc-300/50 dark:ring-white/10';
}

function compactPhaseLabel(phase: string): string {
  return phase.replace(/^Phase\s*/i, 'Ph').replace(/\s*\/\s*/g, '/');
}

function statusPill(status: NormalizedTrialStatus) {
  if (status === 'RECRUITING' || status === 'ENROLLING_BY_INVITATION')
    return 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30';
  if (status === 'ACTIVE_NOT_RECRUITING' || status === 'NOT_YET_RECRUITING')
    return 'bg-sky-50 text-sky-700 ring-sky-600/20 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-500/30';
  if (status === 'COMPLETED')
    return 'bg-indigo-50 text-indigo-700 ring-indigo-600/20 dark:bg-indigo-500/10 dark:text-indigo-300 dark:ring-indigo-500/30';
  if (status === 'CONFLICTING' || status.startsWith('UNKNOWN'))
    return 'bg-amber-50 text-amber-800 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30';
  return 'bg-zinc-100 text-zinc-600 ring-zinc-300/50 dark:bg-white/10 dark:text-zinc-300 dark:ring-white/10';
}

function PipelineAssets({
  data,
  indicationCode,
  totalRows,
}: {
  data: unknown[];
  indicationCode: string;
  /** True section total on a capped preview (from section_counts). null /
   *  undefined on a full-detail payload — header count is then unchanged. */
  totalRows?: number | null;
}) {
  const linkedTpps = crossLinks.etlm_to_tpps?.[indicationCode] ?? [];
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [selectedStatuses, setSelectedStatuses] = useState<NormalizedTrialStatus[]>([]);
  const [expandedAssets, setExpandedAssets] = useState<Set<string>>(new Set());
  const [showAllChildTrials, setShowAllChildTrials] = useState<Set<string>>(new Set());

  const rows = data.filter(isObj);
  const assetGroups = groupPipelineAssets(rows, indicationCode);
  const selectedStatusSet = new Set(selectedStatuses);
  const filteredGroups = filterAssetGroups(assetGroups, selectedStatusSet);
  const filteredTrialCount = filteredGroups.reduce(
    (sum, group) => sum + visibleTrials(group, selectedStatusSet).length,
    0,
  );
  const availableStatuses = TRIAL_STATUS_ORDER.filter((status) =>
    assetGroups.some((group) => group.statuses.includes(status)),
  );

  const sorted = sortKey
    ? [...filteredGroups].sort((a, b) => {
        let av: string | number = '';
        let bv: string | number = '';
        if (sortKey === 'phase') {
          av = PHASE_ORDER[a.phase] ?? 0;
          bv = PHASE_ORDER[b.phase] ?? 0;
        } else if (sortKey === 'status') {
          av = a.statuses.join('|');
          bv = b.statuses.join('|');
        } else {
          av = a[sortKey].toLowerCase();
          bv = b[sortKey].toLowerCase();
        }
        if (av < bv) return sortDir === 'asc' ? -1 : 1;
        if (av > bv) return sortDir === 'asc' ? 1 : -1;
        return 0;
      })
    : filteredGroups;

  const { shown, hiddenCount, expanded, toggle } = useShowMore(sorted, 12);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      if (sortDir === 'asc') setSortDir('desc');
      else { setSortKey(null); setSortDir('asc'); }
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  function toggleStatus(status: NormalizedTrialStatus) {
    setSelectedStatuses((current) =>
      current.includes(status)
        ? current.filter((item) => item !== status)
        : [...current, status],
    );
    setShowAllChildTrials(new Set());
  }

  function toggleAsset(assetId: string) {
    setExpandedAssets((current) => {
      const next = new Set(current);
      if (next.has(assetId)) next.delete(assetId);
      else next.add(assetId);
      return next;
    });
  }

  function toggleAllChildTrials(assetId: string) {
    setShowAllChildTrials((current) => {
      const next = new Set(current);
      if (next.has(assetId)) next.delete(assetId);
      else next.add(assetId);
      return next;
    });
  }

  function SortTh({ col, label, className }: { col: SortKey; label: string; className?: string }) {
    const active = sortKey === col;
    return (
      <th
        onClick={() => handleSort(col)}
        className={`px-3 py-2 text-left text-[10px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-white/10 cursor-pointer select-none whitespace-nowrap hover:text-zinc-800 dark:hover:text-zinc-200 ${className ?? ''}`}
      >
        {label}
        {active ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''}
      </th>
    );
  }

  return (
    <section className="mb-10">
      <SectionHeader
        icon={TestTube}
        title="Pipeline assets"
        subtitle="Clinical-stage assets across all trial recruitment statuses"
        count={assetGroups.length}
      />
      <div className="mb-3 rounded-xl border border-zinc-200 bg-zinc-50/60 p-3 dark:border-white/10 dark:bg-white/[0.03]">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-zinc-600 dark:text-zinc-300">
            {totalRows !== null && totalRows !== undefined ? (
              <>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {filteredGroups.length} preview {filteredGroups.length === 1 ? 'asset' : 'assets'}
                </span>{' '}
                · {filteredTrialCount} of {totalRows} asset–trial records shown
              </>
            ) : (
              <>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {filteredGroups.length} of {assetGroups.length} assets
                </span>{' '}
                · {rows.length} asset–trial records loaded
              </>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5" aria-label="Filter assets by trial recruitment status">
          <button
            type="button"
            aria-pressed={selectedStatuses.length === 0}
            onClick={() => {
              setSelectedStatuses([]);
              setShowAllChildTrials(new Set());
            }}
            className={`rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 transition-colors ${
              selectedStatuses.length === 0
                ? 'bg-zinc-900 text-white ring-zinc-900 dark:bg-white dark:text-zinc-900 dark:ring-white'
                : 'bg-white text-zinc-600 ring-zinc-200 hover:text-zinc-900 dark:bg-white/5 dark:text-zinc-300 dark:ring-white/10'
            }`}
          >
            All statuses
          </button>
          {availableStatuses.map((status) => {
            const active = selectedStatuses.includes(status);
            const count = assetGroups.filter((group) => group.statuses.includes(status)).length;
            return (
              <button
                key={status}
                type="button"
                aria-pressed={active}
                onClick={() => toggleStatus(status)}
                className={`rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 transition-colors ${
                  active
                    ? statusPill(status)
                    : 'bg-white text-zinc-600 ring-zinc-200 hover:text-zinc-900 dark:bg-white/5 dark:text-zinc-300 dark:ring-white/10'
                }`}
              >
                {trialStatusLabel(status)} {count}
              </button>
            );
          })}
        </div>
      </div>
      <div className="overflow-x-auto rounded-xl ring-1 ring-zinc-200 dark:ring-white/10">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr>
              <SortTh col="assetName" label="Asset" />
              <SortTh col="population" label="Population" />
              <SortTh col="company" label="Company / sponsor" className="hidden sm:table-cell" />
              <SortTh col="modality" label="Modality" className="hidden md:table-cell" />
              <SortTh col="target" label="Target" className="hidden md:table-cell" />
              <SortTh col="phase" label="Phase" />
              <SortTh col="status" label="Trial status" className="hidden lg:table-cell" />
              <th className="px-3 py-2 text-right text-[10px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-white/10 whitespace-nowrap">
                Trials
              </th>
            </tr>
          </thead>
          <tbody>
            {shown.map((group, i) => {
              const phase = group.phase;
              const isExpanded = expandedAssets.has(group.id);
              const detailId = `asset-trials-${group.id.replace(/[^a-zA-Z0-9_-]/g, '-')}`;
              const matchingTrials = visibleTrials(group, selectedStatusSet);
              const detailTrials = showAllChildTrials.has(group.id) ? group.trials : matchingTrials;
              return (
                <AssetPipelineRows
                  key={group.id}
                  group={group}
                  index={i}
                  phase={phase}
                  isExpanded={isExpanded}
                  detailId={detailId}
                  detailTrials={detailTrials}
                  matchingTrialCount={matchingTrials.length}
                  filtered={selectedStatuses.length > 0}
                  showingAllChildTrials={showAllChildTrials.has(group.id)}
                  onToggle={() => toggleAsset(group.id)}
                  onToggleAllTrials={() => toggleAllChildTrials(group.id)}
                />
              );
            })}
          </tbody>
        </table>
      </div>
      <ShowMore hiddenCount={hiddenCount} expanded={expanded} onClick={toggle} />
      <PreviewRowsFooter
        shown={shown.reduce((count, group) => count + group.trials.length, 0)}
        total={totalRows ?? null}
      />
      {linkedTpps.length > 0 && (
        <div className="mt-4 text-xs text-zinc-500 dark:text-zinc-400">
          Related TPPs in this preview:{' '}
          {linkedTpps.map((slug, i) => (
            <span key={slug}>
              <Link
                to={`/atlas-reader/tpp/${slug}`}
                className="text-rose-600 dark:text-rose-400 underline decoration-dotted underline-offset-4"
              >
                {tppLabel(slug)}
              </Link>
              {i < linkedTpps.length - 1 ? ' , ' : ''}
            </span>
          ))}
        </div>
      )}
    </section>
  );
}

function AssetPipelineRows({
  group,
  index,
  phase,
  isExpanded,
  detailId,
  detailTrials,
  matchingTrialCount,
  filtered,
  showingAllChildTrials,
  onToggle,
  onToggleAllTrials,
}: {
  group: AssetGroup;
  index: number;
  phase: string;
  isExpanded: boolean;
  detailId: string;
  detailTrials: AssetGroup['trials'];
  matchingTrialCount: number;
  filtered: boolean;
  showingAllChildTrials: boolean;
  onToggle: () => void;
  onToggleAllTrials: () => void;
}) {
  return (
    <>
      <tr
        className={`border-b border-zinc-100 dark:border-white/5 hover:bg-zinc-50/80 dark:hover:bg-white/5 ${index % 2 === 1 ? 'bg-zinc-50/40 dark:bg-white/[0.02]' : ''}`}
      >
        <td className="px-3 py-2.5 align-top">
          <button
            type="button"
            aria-expanded={isExpanded}
            aria-controls={detailId}
            onClick={onToggle}
            className="flex max-w-[240px] items-start gap-1.5 text-left font-medium text-zinc-900 hover:text-indigo-700 dark:text-zinc-100 dark:hover:text-indigo-300"
          >
            {isExpanded ? <ChevronDown className="mt-0.5 h-3.5 w-3.5 shrink-0" /> : <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0" />}
            <span>
              {group.assetName}
              {!group.governed && (
                <span className="mt-1 flex items-center gap-1 text-[10px] font-normal text-amber-700 dark:text-amber-300">
                  <AlertTriangle className="h-3 w-3" /> Identity pending
                </span>
              )}
            </span>
          </button>
        </td>
        <td className="max-w-[180px] px-3 py-2.5 align-top text-zinc-600 dark:text-zinc-400">{group.population}</td>
        <td className="hidden px-3 py-2.5 align-top text-zinc-600 dark:text-zinc-400 sm:table-cell">{group.company}</td>
        <td className="hidden max-w-[180px] px-3 py-2.5 align-top text-zinc-600 dark:text-zinc-400 md:table-cell">
          <span title={group.modality}>{group.modality.slice(0, 40)}{group.modality.length > 40 ? '…' : ''}</span>
        </td>
        <td className="hidden px-3 py-2.5 align-top text-zinc-600 dark:text-zinc-400 md:table-cell">{group.target}</td>
        <td className="px-3 py-2.5 align-top">
          <span
            title={phase}
            className={`inline-block rounded-full px-2 py-0.5 text-[10px] ring-1 ${phasePill(phase)}`}
          >
            {compactPhaseLabel(phase)}
          </span>
        </td>
        <td className="hidden px-3 py-2.5 align-top lg:table-cell">
          <div className="flex max-w-[260px] flex-wrap gap-1">
            {group.statuses.map((status) => (
              <span key={status} className={`rounded-full px-2 py-0.5 text-[10px] ring-1 ${statusPill(status)}`}>
                {trialStatusLabel(status)}
              </span>
            ))}
          </div>
        </td>
        <td className="px-3 py-2.5 text-right align-top text-zinc-600 dark:text-zinc-300">{group.trials.length}</td>
      </tr>
      {isExpanded && (
        <tr id={detailId} className="border-b border-zinc-200 bg-zinc-50/80 dark:border-white/10 dark:bg-white/[0.04]">
          <td colSpan={8} className="px-4 py-3">
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Underlying trials · {detailTrials.length} shown
              </p>
              {filtered && matchingTrialCount < group.trials.length && (
                <button type="button" onClick={onToggleAllTrials} className="text-[11px] font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400">
                  {showingAllChildTrials ? 'Show matching trials' : `Show all ${group.trials.length} trials`}
                </button>
              )}
            </div>
            <div className="grid gap-2 lg:grid-cols-2">
              {detailTrials.map((trial) => (
                <div key={trial.relationId} className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-white/10 dark:bg-zinc-950/40">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] ring-1 ${statusPill(trial.normalizedStatus)}`}>
                      {trialStatusLabel(trial.normalizedStatus)}
                    </span>
                    <span className="text-xs font-medium text-zinc-900 dark:text-zinc-100">{String(trial.row.trial_name ?? 'Unnamed trial')}</span>
                  </div>
                  <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[11px] text-zinc-600 dark:text-zinc-300">
                    <dt className="text-zinc-400">Registry</dt><dd><NctLink nct={trial.row.nct ? String(trial.row.nct) : undefined} /></dd>
                    <dt className="text-zinc-400">Population</dt><dd>{String(trial.row.population ?? trial.row.indication_subtype ?? '—')}</dd>
                    <dt className="text-zinc-400">Phase</dt><dd>{String(trial.row.phase ?? '—')}</dd>
                    <dt className="text-zinc-400">Readout</dt><dd>{String(trial.row.estimated_readout ?? '—')}</dd>
                    <dt className="text-zinc-400">Source</dt><dd>{String(trial.row.source ?? '—')}</dd>
                    {trial.rawStatus !== trialStatusLabel(trial.normalizedStatus) && (
                      <><dt className="text-zinc-400">Raw status</dt><dd>{trial.rawStatus ?? 'Missing'}</dd></>
                    )}
                  </dl>
                </div>
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function EfficacyBenchmarks({
  data,
  schemaKey,
}: {
  data: Record<string, unknown>;
  schemaKey: string;
}) {
  // Reads inside a sentence ("Organised by line"), so the leading connective
  // must stay lowercase — labelText's STOPWORDS guard handles that.
  const schemaLabel = labelText(schemaKey.replace(/^efficacy_benchmarks_/, ''));

  return (
    <section className="mb-10">
      <SectionHeader
        icon={Gauge}
        title="Efficacy benchmarks"
        subtitle={`Organised ${schemaLabel}`}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {Object.entries(data).map(([line, val]) => {
          if (!isObj(val)) return null;
          return (
            <Card key={line}>
              <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                {labelText(line)}
              </div>
              <div className="space-y-1.5">
                {benchmarkEntries(val).map(([k, v]) => (
                  <div key={k} className="flex justify-between text-xs gap-3">
                    <span className="text-zinc-500 dark:text-zinc-400">
                      {labelText(k)}
                    </span>
                    <span className="text-zinc-800 dark:text-zinc-200 font-medium text-right">
                      {String(v)}
                    </span>
                  </div>
                ))}
                {benchmarkNotes(val).map((note, ni) => (
                  <div
                    key={`note-${ni}`}
                    className="text-[10px] text-zinc-500 dark:text-zinc-400 pt-1 italic leading-relaxed"
                  >
                    {note}
                  </div>
                ))}
                {val.source && typeof val.source === 'string' ? (
                  <div className="text-[10px] text-zinc-400 dark:text-zinc-500 pt-1 italic">
                    {String(val.source)}
                  </div>
                ) : null}
                <SourceLinks sources={val.sources} />
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

function MechanismLandscape({
  data,
  indicationCode,
}: {
  data: unknown[];
  indicationCode: string;
}) {
  const linkedThemes = crossLinks.etlm_to_themes?.[indicationCode] ?? [];

  return (
    <section className="mb-10">
      <SectionHeader
        icon={Network}
        title="Mechanism landscape"
        subtitle="Targets and drug classes mapped to assets"
        count={data.length}
      />
      <div className="overflow-x-auto rounded-xl ring-1 ring-zinc-200 dark:ring-white/10">
        <table className="w-full text-left text-xs">
          <thead className="bg-zinc-50 dark:bg-white/5 text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            <tr>
              <th className="px-3 py-2.5 font-medium">Target / Class</th>
              <th className="px-3 py-2.5 font-medium">Approved</th>
              <th className="px-3 py-2.5 font-medium whitespace-nowrap">Pipeline</th>
              <th className="px-3 py-2.5 font-medium">Lead candidate</th>
              <th className="px-3 py-2.5 font-medium">Headline efficacy</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-white/10">
            {data.map((entry, i) => {
              if (!isObj(entry)) return null;
              const approved = Array.isArray(entry.approved_assets) ? entry.approved_assets : [];
              const custom = benchmarkEntries(entry.custom_efficacy_benchmark);
              const benchPairs =
                custom.length > 0 ? custom : benchmarkEntries(entry.efficacy_benchmark);
              return (
                <tr key={i} className="align-top">
                  <td className="px-3 py-2.5">
                    <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {String(entry.target ?? '—')}
                    </div>
                    {entry.drug_class ? (
                      <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                        {String(entry.drug_class)}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-3 py-2.5 text-zinc-700 dark:text-zinc-300">
                    {approved.length > 0 ? approved.map(String).join(', ') : '—'}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <div className="flex flex-col gap-1 text-[10px] text-zinc-500 dark:text-zinc-400">
                      {typeof entry.pipeline_count_ph2 === 'number' && (
                        <span>
                          Ph2{' '}
                          <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                            {entry.pipeline_count_ph2}
                          </span>
                        </span>
                      )}
                      {typeof entry.pipeline_count_ph3 === 'number' && (
                        <span>
                          Ph3{' '}
                          <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                            {entry.pipeline_count_ph3}
                          </span>
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-zinc-700 dark:text-zinc-300">
                    {entry.leading_pipeline_asset ? String(entry.leading_pipeline_asset) : '—'}
                  </td>
                  <td className="px-3 py-2.5">
                    {benchPairs.length > 0 ? (
                      <div className="flex flex-col gap-0.5">
                        {benchPairs.map(([k, v]) => (
                          <span key={k} className="text-zinc-700 dark:text-zinc-300">
                            <span className="text-zinc-500 dark:text-zinc-400">
                              {labelText(k)}:
                            </span>{' '}
                            <span className="font-medium text-zinc-800 dark:text-zinc-200">
                              {String(v)}
                            </span>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-zinc-400 dark:text-zinc-500">—</span>
                    )}
                    {entry.key_resistance_mechanism ? (
                      <div className="text-[10px] text-zinc-500 dark:text-zinc-400 italic mt-1">
                        Resistance: {String(entry.key_resistance_mechanism)}
                      </div>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {linkedThemes.length > 0 && (
        <div className="mt-4 text-xs text-zinc-500 dark:text-zinc-400">
          Related thematic syntheses:{' '}
          {linkedThemes.map((slug, i) => (
            <span key={slug}>
              <Link
                to={`/atlas-reader/theme/${slug}`}
                className="text-amber-600 dark:text-amber-400 underline decoration-dotted underline-offset-4"
              >
                {themeShortLabel(slug)}
              </Link>
              {i < linkedThemes.length - 1 ? ' , ' : ''}
            </span>
          ))}
        </div>
      )}
    </section>
  );
}

function RecentConferenceReadouts({ data }: { data: unknown[] }) {
  const { shown, hiddenCount, expanded, toggle } = useShowMore(data, 8);
  return (
    <section className="mb-10">
      <SectionHeader
        icon={Calendar}
        title="Recent conference readouts"
        subtitle="Recent data presented at major congresses"
        count={data.length}
      />
      {data.length === 0 ? (
        <Card>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 italic">
            No conference readouts captured yet. WS8 Conference Catalyst Monitor wiring
            (ASCO / ESMO / AACR / ASH → ETLM) lands in the next batch — this section will
            populate automatically once new readouts are extracted.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {shown.map((entry, i) => {
            if (!isObj(entry)) return null;
            const relevanceKey = Object.keys(entry).find((k) => /_relevance$/.test(k));
            const relevance = relevanceKey ? entry[relevanceKey] : null;
            const keyReadouts = Array.isArray(entry.key_readouts) ? entry.key_readouts : [];
            const stillMissing = Array.isArray(entry.data_still_missing)
              ? entry.data_still_missing
              : [];
            const verdict = entry.conference_verdict ?? entry.finding;
            const heading = entry.conference ?? entry.drug ?? entry.asset ?? '—';
            return (
              <Card key={i} accent="ring-rose-200/60 dark:ring-rose-500/20">
                <div className="flex items-baseline justify-between gap-2 mb-1.5">
                  <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {String(heading)}
                  </div>
                  {relevance ? (
                    <span className="text-[10px] uppercase tracking-wider text-rose-700 dark:text-rose-400">
                      {humanizeEnum(relevance)} relevance
                    </span>
                  ) : null}
                </div>
                {entry.dates ? (
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mb-2">
                    {String(entry.dates)}
                  </div>
                ) : null}
                {entry.trial ? (
                  <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">
                    Trial: <span className="font-medium">{String(entry.trial)}</span>
                  </div>
                ) : null}
                {keyReadouts.length > 0 && (
                  <ul className="text-xs text-zinc-700 dark:text-zinc-300 space-y-1 list-disc pl-4 mb-2">
                    {keyReadouts.map((r, ri) => (
                      <li key={ri}>{String(r)}</li>
                    ))}
                  </ul>
                )}
                {verdict ? (
                  <div className="text-xs text-zinc-700 dark:text-zinc-300 mb-2 leading-relaxed">
                    {String(verdict)}
                  </div>
                ) : null}
                {stillMissing.length > 0 && (
                  <div className="mb-2">
                    <div className="text-[10px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                      Still missing
                    </div>
                    <ul className="text-[11px] text-zinc-500 dark:text-zinc-400 space-y-0.5 list-disc pl-4">
                      {stillMissing.map((m, mi) => (
                        <li key={mi}>{String(m)}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {entry.next_catalyst_window_note ? (
                  <div className="text-[11px] text-zinc-600 dark:text-zinc-400 italic mb-1">
                    Next catalyst: {String(entry.next_catalyst_window_note)}
                  </div>
                ) : null}
                {entry.source && typeof entry.source === 'string' ? (
                  <div className="text-[10px] text-zinc-400 dark:text-zinc-500 italic">
                    {String(entry.source)}
                  </div>
                ) : null}
                <SourceLinks sources={entry.sources} />
              </Card>
            );
          })}
          <ShowMore hiddenCount={hiddenCount} expanded={expanded} onClick={toggle} />
        </div>
      )}
    </section>
  );
}

function CompetitiveDynamics({ data }: { data: Record<string, unknown> }) {
  return (
    <section className="mb-10">
      <SectionHeader
        icon={Swords}
        title="Competitive dynamics"
        subtitle="Crowded targets, white space, patent expiries"
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {Object.entries(data).map(([key, val]) => (
          <Card key={key}>
            <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
              {labelText(key)}
            </div>
            {Array.isArray(val) ? (
              // Bullets of PEER items: listItemText, not humanizeValue. Analysts
              // write these lists as prose strings in most ETLMs and as structured
              // objects in others (urothelial dominant_companies = {company,
              // franchise}, notable_patent_expiries = {drug, expiry}; obesity
              // supply_and_manufacturing = {event, date, detail,
              // competitive_implication}) — both shapes are correct analyst output.
              // humanizeValue prefixed every field name onto every bullet, so the
              // live page read "company: Pfizer-Astellas , franchise: …". Same keys
              // on every bullet = plumbing; only the values are content.
              // Format before the cap so an unrenderable element can't spend one
              // of the 8 visible slots on an empty bullet.
              <ul className="text-xs text-zinc-700 dark:text-zinc-300 space-y-1 list-disc pl-4">
                {val
                  .map((v) => listItemText(v))
                  .filter(Boolean)
                  .slice(0, 8)
                  .map((text, i) => (
                    <li key={i}>{text}</li>
                  ))}
              </ul>
            ) : isObj(val) ? (
              <div className="space-y-1.5">
                {Object.entries(val).map(([k, v]) => (
                  <div key={k} className="text-xs">
                    <span className="text-zinc-500 dark:text-zinc-400">
                      {labelText(k)}:
                    </span>{' '}
                    <span className="text-zinc-800 dark:text-zinc-200">
                      {humanizeValue(v)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-zinc-700 dark:text-zinc-300">{String(val)}</div>
            )}
          </Card>
        ))}
      </div>
    </section>
  );
}

function UnmetNeeds({ data }: { data: unknown[] }) {
  const severityColor: Record<string, string> = {
    critical: 'ring-rose-300/50 dark:ring-rose-500/30',
    high: 'ring-amber-300/50 dark:ring-amber-500/30',
    moderate: 'ring-zinc-200 dark:ring-white/10',
    low: 'ring-zinc-200 dark:ring-white/10',
  };

  return (
    <section className="mb-10">
      <SectionHeader
        icon={AlertTriangle}
        title="Unmet needs"
        subtitle="Where the bar still isn't being cleared"
        count={data.length}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {data.map((entry, i) => {
          // A string-shaped need is valid analyst output and must render. This
          // early-returned null, so obesity's 11 needs, nhl_dlbcl's 12 and crc's
          // 10 — 33 in all — displayed nothing while the header above still
          // printed "Unmet needs , 11". An empty grid under a non-zero count is
          // worse than no section: it reads as a broken page, not a sparse one.
          // nsclc/mm/urothelial write dicts, which is why it went unseen.
          if (typeof entry === 'string' && entry.trim()) {
            return (
              <Card key={i} accent={severityColor.moderate}>
                <div className="text-sm text-zinc-800 dark:text-zinc-200">{entry}</div>
              </Card>
            );
          }
          if (!isObj(entry)) return null;
          const sev = String(entry.severity ?? '').toLowerCase();
          const accent = severityColor[sev] ?? severityColor.moderate;
          return (
            <Card key={i} accent={accent}>
              <div className="flex items-baseline justify-between gap-2 mb-2">
                <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {String(entry.need ?? '—')}
                </div>
                {entry.severity ? (
                  <span className="text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    {String(entry.severity)}
                  </span>
                ) : null}
              </div>
              {entry.patient_fraction ? (
                <div className="text-xs text-zinc-600 dark:text-zinc-400 mb-2">
                  {String(entry.patient_fraction)}
                </div>
              ) : null}
              {entry.leading_approaches ? (
                <div className="text-xs">
                  <span className="text-zinc-500 dark:text-zinc-400">Leading approaches: </span>
                  <span className="text-zinc-800 dark:text-zinc-200">
                    {String(entry.leading_approaches)}
                  </span>
                </div>
              ) : null}
            </Card>
          );
        })}
      </div>
    </section>
  );
}

const REG_SKIP_KEYS = new Set([
  'section_status', 'schema_version', 'section_created',
  'katie_directives', 'ratified_by_katie',
]);

function isTemplateOnly(val: Record<string, unknown>): boolean {
  return Object.keys(val).every((k) => k === '_template_note');
}

function RegulatoryLandscape({ data }: { data: Record<string, unknown> }) {
  const entries = Object.entries(data).filter(([key, val]) => {
    if (REG_SKIP_KEYS.has(key)) return false;
    if (isObj(val) && isTemplateOnly(val)) return false;
    return true;
  });

  if (entries.length === 0) return null;

  return (
    <section className="mb-10">
      <SectionHeader
        icon={Shield}
        title="Regulatory landscape"
        subtitle="Pathway risks, legislative signals, label scope"
      />
      <div className="space-y-3">
        {entries.map(([categoryKey, categoryVal]) => {
          // Array of milestone / event objects
          if (Array.isArray(categoryVal)) {
            return (
              <Card key={categoryKey}>
                <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">
                  {labelText(categoryKey)}
                </div>
                <div className="space-y-2">
                  {(categoryVal as unknown[]).map((item, i) => {
                    if (!isObj(item)) return <div key={i} className="text-xs text-zinc-700 dark:text-zinc-300">{String(item)}</div>;
                    return (
                      <div key={i} className="rounded-lg ring-1 ring-zinc-200/60 dark:ring-white/10 bg-zinc-50/60 dark:bg-white/[0.02] p-3 text-xs">
                        {item.date ? (
                          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 block mb-1">{String(item.date)}</span>
                        ) : null}
                        <span className="text-zinc-800 dark:text-zinc-200">
                          {String(item.milestone ?? item.summary ?? item.event ?? '')}
                        </span>
                        {item.commercial_implication ? (
                          <div className="mt-1.5 text-zinc-500 dark:text-zinc-400 italic">{String(item.commercial_implication)}</div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </Card>
            );
          }

          // Simple string / primitive
          if (!isObj(categoryVal)) {
            return (
              <Card key={categoryKey}>
                <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
                  {labelText(categoryKey)}
                </div>
                <div className="text-xs text-zinc-700 dark:text-zinc-300">{String(categoryVal)}</div>
              </Card>
            );
          }

          const subEntries = Object.entries(categoryVal).filter(([k]) => k !== '_template_note');
          const hasNestedObjects = subEntries.some(([, v]) => isObj(v));

          return (
            <Card key={categoryKey}>
              <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">
                {labelText(categoryKey)}
              </div>
              {hasNestedObjects ? (
                // Nested signal objects (e.g. safety_class_signals > neuropsychiatric > {signal, status, as_of})
                <div className="space-y-3">
                  {subEntries.map(([subKey, subVal]) => (
                    <div
                      key={subKey}
                      className="rounded-lg ring-1 ring-zinc-200/60 dark:ring-white/10 bg-zinc-50/60 dark:bg-white/[0.02] p-3"
                    >
                      <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 mb-1.5">
                        {labelText(subKey)}
                      </div>
                      {isObj(subVal) ? (
                        <div className="space-y-1.5">
                          {(subVal.signal ?? subVal.summary) ? (
                            <div className="text-xs text-zinc-700 dark:text-zinc-300">
                              {String(subVal.signal ?? subVal.summary)}
                            </div>
                          ) : null}
                          {subVal.status ? (
                            <div className="text-xs text-zinc-600 dark:text-zinc-400">
                              <span className="text-zinc-500 dark:text-zinc-400">Status: </span>
                              {String(subVal.status)}
                            </div>
                          ) : null}
                          {subVal.context ? (
                            <div className="text-xs text-zinc-600 dark:text-zinc-400 italic">{String(subVal.context)}</div>
                          ) : null}
                          {subVal.as_of ? (
                            <div className="text-[10px] text-zinc-400 dark:text-zinc-500">As of: {String(subVal.as_of)}</div>
                          ) : null}
                          {Array.isArray(subVal.signals) && subVal.signals.length > 0 && (
                            <ul className="text-xs text-zinc-700 dark:text-zinc-300 list-disc pl-4 space-y-0.5">
                              {subVal.signals.map((s, i) => <li key={i}>{listItemText(s)}</li>)}
                            </ul>
                          )}
                        </div>
                      ) : (
                        <div className="text-xs text-zinc-700 dark:text-zinc-300">{String(subVal)}</div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                // Flat object — show date + main text fields (e.g. pbm_coverage_glp1_us_2026)
                <div className="space-y-2 text-xs">
                  {subEntries
                    .filter(([k]) => !['source_event_ids', 'cross_reference'].includes(k))
                    .map(([k, v]) =>
                      k === 'date' || k === 'as_of' ? (
                        <span key={k} className="text-[10px] text-zinc-400 dark:text-zinc-500 block">{String(v)}</span>
                      ) : (
                        <div key={k}>
                          <div className="text-[10px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-0.5">
                            {labelText(k)}
                          </div>
                          <div className="text-zinc-700 dark:text-zinc-300">{String(v)}</div>
                        </div>
                      )
                    )}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </section>
  );
}

function PreclinicalWatchlist({ data }: { data: unknown[] }) {
  return (
    <section className="mb-10">
      <SectionHeader
        icon={TestTube}
        title="Preclinical watchlist"
        subtitle="Programs to watch ahead of clinical entry"
        count={data.length}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {data.map((entry, i) => {
          if (!isObj(entry)) return null;
          return (
            <Card key={i}>
              <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
                {String(entry.asset_name ?? entry.drug_name ?? '—')}
              </div>
              <div className="text-xs text-zinc-600 dark:text-zinc-400 mb-2">
                {String(entry.company ?? entry.sponsor ?? '')} ,{' '}
                {String(entry.modality ?? '')}
              </div>
              {entry.rationale ? (
                <div className="text-xs text-zinc-700 dark:text-zinc-300">
                  {String(entry.rationale)}
                </div>
              ) : null}
            </Card>
          );
        })}
      </div>
    </section>
  );
}

function NovelTargets({ data }: { data: unknown[] }) {
  return (
    <section className="mb-10">
      <SectionHeader
        icon={TestTube}
        title="Novel targets"
        subtitle="Emerging biology and design principles from recent literature"
        count={data.length}
      />
      <div className="space-y-3">
        {data.map((entry, i) => {
          if (!isObj(entry)) return null;
          return (
            <Card key={i}>
              <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
                {String(entry.target ?? '—')}
              </div>
              {entry.probe_compound ? (
                <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">
                  Probe: {String(entry.probe_compound)}
                </div>
              ) : null}
              {entry.MoA_class ? (
                <div className="text-xs text-zinc-700 dark:text-zinc-300 mb-2">{String(entry.MoA_class)}</div>
              ) : null}
              {entry.evidence_summary ? (
                <div className="text-xs text-zinc-600 dark:text-zinc-400 mb-3">{String(entry.evidence_summary)}</div>
              ) : null}
              <div className="flex flex-wrap gap-4 mb-2">
                {entry.stage ? <KV label="Stage" value={String(entry.stage)} /> : null}
                {entry.source_year ? <KV label="Year" value={String(entry.source_year)} /> : null}
              </div>
              {(entry.asset_note ?? entry.design_principle) ? (
                <div className="text-xs text-zinc-500 dark:text-zinc-400 italic">
                  {String(entry.asset_note ?? entry.design_principle)}
                </div>
              ) : null}
            </Card>
          );
        })}
      </div>
    </section>
  );
}

/** Early watchlist signals — annotation only (not a placed benchmark or pipeline
 *  asset). Kept public but rendered as clean cards; internal analyst-governance
 *  tails ("Per governing call …", "(Katie NOTE call)") are stripped from display. */
function EmergingSignals({ data }: { data: unknown[] }) {
  const items = data.filter(isObj);
  if (items.length === 0) return null;
  const cleanCaveat = (s: string) =>
    s.replace(/[.;]?\s*Per (?:governing call|Katie)\b.*$/i, '').trim();
  return (
    <section className="mb-10">
      <SectionHeader
        icon={AlertTriangle}
        title="Emerging signals"
        subtitle="On the watchlist — annotation only; not yet a placed benchmark or pipeline asset"
        count={items.length}
      />
      <div className="space-y-3">
        {items.map((s, i) => (
          <Card key={i} accent="ring-amber-200/60 dark:ring-amber-500/20">
            <div className="flex items-baseline justify-between gap-2 mb-1">
              <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {String(s.asset ?? s.drug_name ?? '—')}
              </div>
              {s.status ? (
                <span className="text-[10px] uppercase tracking-wider text-amber-700 dark:text-amber-400">
                  {humanizeEnum(s.status)}
                </span>
              ) : null}
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">
              {[s.company, s.modality].filter(Boolean).map(String).join(' , ')}
            </div>
            {s.indication_subtype ? (
              <div className="mb-2">
                <span className="inline-block text-[10px] px-2 py-0.5 rounded-full ring-1 bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30">
                  {String(s.indication_subtype)}
                </span>
              </div>
            ) : null}
            {s.data ? (
              <div className="text-xs text-zinc-700 dark:text-zinc-300 mb-2">{String(s.data)}</div>
            ) : null}
            {s.caveat ? (
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400 italic leading-relaxed">
                {cleanCaveat(String(s.caveat))}
              </div>
            ) : null}
          </Card>
        ))}
      </div>
    </section>
  );
}

const SKIP_KEYS = new Set([
  'analyst_session_id',
  'human_approved',
  'pm_qc_passed',
  'indication',
  'indication_code',
  'last_updated',
  'icd10',
  'nci_thesaurus_id',
  'mesh_uid',
  'mesh_uid_source',
  'therapeutic_area',
  'confidence_notes',
  'schema_adaptation_note',
  'data_gaps',
  'analyst_notes',
  // `allogeneic_cell_therapy_pipeline` is suppressed: its unique asset is folded
  // into `pipeline_assets`, so it needs no standalone section. (`emerging_signals`
  // IS shown — it has a dedicated renderer below.)
  'allogeneic_cell_therapy_pipeline',
  // Preview-bundle envelope, not sections. `section_counts` drives the WITHHELD
  // blocks below and the `detail_*` trio drives the redaction copy; none of them
  // is a section, so none reaches the section list (and none trips the DEV
  // "no renderer" warning). All four are absent from the featured ETLMs
  // (obesity / mm / nsclc), so skipping them cannot move a featured page.
  'section_counts',
  'detail_available',
  'detail_rows_shown',
  'detail_note',
]);

const SECTION_ORDER = [
  'epidemiology',
  'approved_therapies_novel',
  'approved_therapies_legacy',
  'approved_therapies',
  'pipeline_assets',
  'recent_conference_readouts',
  'efficacy_benchmarks_by_line',
  'efficacy_benchmarks_by_class_and_indication',
  'efficacy_benchmarks_by_stage',
  'mechanism_landscape',
  'competitive_dynamics',
  'emerging_signals',
  'unmet_needs',
  'regulatory_landscape',
  'preclinical_watchlist',
  'novel_targets',
];

/** Short nav labels — the in-page jump rail reads as a map legend. */
const SECTION_LABEL: Record<string, string> = {
  epidemiology: 'Epidemiology',
  approved_therapies_novel: 'Novel approved',
  approved_therapies_legacy: 'Legacy',
  approved_therapies: 'Approved',
  pipeline_assets: 'Pipeline',
  recent_conference_readouts: 'Readouts',
  mechanism_landscape: 'Mechanisms',
  competitive_dynamics: 'Competitive',
  emerging_signals: 'Emerging signals',
  unmet_needs: 'Unmet needs',
  regulatory_landscape: 'Regulatory',
  preclinical_watchlist: 'Preclinical',
  novel_targets: 'Novel targets',
};

const sectionId = (key: string) => `sec-${key.replace(/_/g, '-')}`;

function navLabel(key: string): string {
  if (key.startsWith('efficacy_benchmarks_')) return 'Benchmarks';
  return SECTION_LABEL[key] ?? labelText(key);
}

type NavItem = { id: string; label: string; count?: number };

/** Sticky scroll-spy rail: jump to any section, see where you are. Keeps the
 *  full report a single scroll (no tabs hiding content) while taming its length. */
function ReportNav({ items, onJump }: { items: NavItem[]; onJump?: (id: string) => void }) {
  const [active, setActive] = useState<string>(items[0]?.id ?? '');

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: '-100px 0px -65% 0px', threshold: 0 },
    );
    items.forEach((it) => {
      const el = document.getElementById(it.id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, [items]);

  const jump = (id: string) => {
    onJump?.(id); // expand the (possibly collapsed) target before scrolling
    const el = document.getElementById(id);
    if (!el) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    if (window.history.replaceState) window.history.replaceState(null, '', `#${id}`);
    setActive(id);
  };

  if (items.length < 2) return null;

  return (
    <nav
      aria-label="Sections"
      className="sticky top-0 z-20 mb-8 rounded-xl border border-zinc-200 bg-white/85 px-4 py-1.5 backdrop-blur dark:border-white/10 dark:bg-zinc-950/80"
    >
      {/* py-1 gives the pill ring vertical room — an overflow-x scroll box clips
          overflow-y, which was cutting off the top/bottom of the ring outline. */}
      <div className="flex gap-1.5 overflow-x-auto py-1">
        {items.map((it) => {
          const on = active === it.id;
          return (
            <button
              key={it.id}
              onClick={() => jump(it.id)}
              aria-current={on ? 'true' : undefined}
              className={`whitespace-nowrap rounded-full px-3 py-1 text-xs ring-1 transition-colors ${
                on
                  ? 'bg-zinc-900 text-zinc-50 ring-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:ring-zinc-100'
                  : 'text-zinc-600 ring-zinc-200 hover:ring-zinc-400 dark:text-zinc-400 dark:ring-white/10 dark:hover:ring-white/30'
              }`}
            >
              {it.label}
              {typeof it.count === 'number' ? (
                <span className="ml-1 opacity-60">{it.count}</span>
              ) : null}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

const SECTION_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  epidemiology: Users,
  approved_therapies_novel: Shield,
  approved_therapies_legacy: Shield,
  approved_therapies: Shield,
  pipeline_assets: TestTube,
  recent_conference_readouts: Calendar,
  mechanism_landscape: Network,
  competitive_dynamics: Swords,
  emerging_signals: AlertTriangle,
  unmet_needs: AlertTriangle,
  regulatory_landscape: Shield,
  preclinical_watchlist: TestTube,
  novel_targets: TestTube,
};

function iconFor(key: string): React.ComponentType<{ className?: string }> {
  if (key.startsWith('efficacy_benchmarks_')) return Gauge;
  return SECTION_ICON[key] ?? PillIcon;
}

// --- Withheld sections (capped PREVIEW bundles only) -------------------------
//
// A preview ETLM (`detail_available === false`) ships the rows of two or three
// sections and `section_counts` for ALL of them. Every renderer above keys off
// the presence of its source array, so the sections whose rows were withheld
// used to render nothing at all: urothelial's report silently collapsed from
// nine sections to three and read as a broken page rather than a deliberate
// preview. The block below gives those sections a body — heading, blurred
// synthetic skeleton, and the true count in plain words.

/** Full section headings, mirroring what each renderer above prints. A withheld
 *  section has no renderer to ask, so it reads them from here and keeps the
 *  page's rhythm: same icon, same heading, same subtitle, only the rows gone.
 *  labelText() is the fallback for an unmapped key. */
const SECTION_TITLE: Record<string, string> = {
  epidemiology: 'Epidemiology',
  approved_therapies: 'Approved therapies',
  approved_therapies_novel: 'Novel Approved Therapies',
  approved_therapies_legacy: 'Legacy Approved Therapies',
  pipeline_assets: 'Pipeline assets',
  recent_conference_readouts: 'Recent conference readouts',
  mechanism_landscape: 'Mechanism landscape',
  competitive_dynamics: 'Competitive dynamics',
  emerging_signals: 'Emerging signals',
  unmet_needs: 'Unmet needs',
  regulatory_landscape: 'Regulatory landscape',
  preclinical_watchlist: 'Preclinical watchlist',
  novel_targets: 'Novel targets',
};

/** Subtitles, copied from the renderers above for the same reason. */
const SECTION_SUBTITLE: Record<string, string> = {
  approved_therapies: 'The standard-of-care anchor',
  approved_therapies_novel: 'Current standard-of-care and active agents',
  approved_therapies_legacy: 'Pre-incretin era; largely displaced — class-level summary only',
  pipeline_assets: 'Phase 2/3 programs and key catalysts',
  recent_conference_readouts: 'Recent data presented at major congresses',
  mechanism_landscape: 'Targets and drug classes mapped to assets',
  competitive_dynamics: 'Crowded targets, white space, patent expiries',
  emerging_signals:
    'On the watchlist — annotation only; not yet a placed benchmark or pipeline asset',
  unmet_needs: "Where the bar still isn't being cleared",
  regulatory_landscape: 'Pathway risks, legislative signals, label scope',
  preclinical_watchlist: 'Programs to watch ahead of clinical entry',
  novel_targets: 'Emerging biology and design principles from recent literature',
};

function sectionTitle(key: string): string {
  if (key.startsWith('efficacy_benchmarks_')) return 'Efficacy benchmarks';
  return SECTION_TITLE[key] ?? labelText(key);
}

function sectionSubtitle(key: string): string | undefined {
  // Same construction EfficacyBenchmarks uses, so the two read identically.
  if (key.startsWith('efficacy_benchmarks_'))
    return `Organised ${labelText(key.replace(/^efficacy_benchmarks_/, ''))}`;
  return SECTION_SUBTITLE[key];
}

/** What a withheld section's rows ARE, so a bare total reads as
 *  "12 targets / drug classes" rather than "12 rows". [singular, plural]. */
const WITHHELD_UNIT: Record<string, [string, string]> = {
  epidemiology: ['epidemiology field', 'epidemiology fields'],
  approved_therapies: ['approved therapy', 'approved therapies'],
  approved_therapies_novel: ['approved therapy', 'approved therapies'],
  approved_therapies_legacy: ['legacy agent', 'legacy agents'],
  pipeline_assets: ['pipeline asset', 'pipeline assets'],
  recent_conference_readouts: ['conference readout', 'conference readouts'],
  mechanism_landscape: ['target / drug class', 'targets / drug classes'],
  competitive_dynamics: ['competitive dimension', 'competitive dimensions'],
  emerging_signals: ['emerging signal', 'emerging signals'],
  unmet_needs: ['unmet need', 'unmet needs'],
  regulatory_landscape: ['regulatory entry', 'regulatory entries'],
  preclinical_watchlist: ['preclinical asset', 'preclinical assets'],
  novel_targets: ['novel target', 'novel targets'],
};

function withheldUnit(key: string, n: number): string {
  // The benchmark schema key names the axis its groups sit on.
  if (key.startsWith('efficacy_benchmarks_')) {
    if (/_by_line$/.test(key)) return n === 1 ? 'line of therapy' : 'lines of therapy';
    if (/_by_stage$/.test(key)) return n === 1 ? 'stage' : 'stages';
    return n === 1 ? 'benchmark group' : 'benchmark groups';
  }
  const pair: [string, string] = WITHHELD_UNIT[key] ?? ['row', 'rows'];
  return n === 1 ? pair[0] : pair[1];
}

/** Sections whose real renderer is a TABLE — their skeleton mimics a table so the
 *  withheld block still reads like the section it stands in for. */
const SKELETON_TABLE = new Set(['pipeline_assets', 'mechanism_landscape']);

/** A purely decorative redaction skeleton: grey bars, nothing else.
 *
 *  There is nothing here to leak — the withheld rows are not in the bundle at all
 *  — and nothing here may be MISTAKEN for clinical data either, so it is
 *  deliberately shape-only: no drug names, no numbers, no NCT-shaped strings, no
 *  text of any kind. Widths are inline styles, not Tailwind classes, so the
 *  shapes never depend on what the class scanner happened to emit.
 *
 *  aria-hidden: the blur is a visual effect and carries no meaning. Everything it
 *  stands for is stated as real text in the paragraph beneath it.
 *
 *  Deliberately NOT animated. A pulse/shimmer reads as "loading", and this
 *  content is not arriving. */
function RedactedSkeleton({ variant }: { variant: 'table' | 'cards' }) {
  const bar = 'rounded-full bg-zinc-400/45 dark:bg-zinc-400/25';
  // Fixed shapes: the skeleton must not encode the row count. The count is stated
  // in words below, where a screen reader and a colour-blind reader both get it.
  if (variant === 'table') {
    const head = ['22%', '14%', '18%', '12%', '10%'];
    const rows = [
      ['30%', '16%', '20%', '10%', '12%'],
      ['24%', '20%', '14%', '14%', '9%'],
      ['34%', '12%', '22%', '11%', '13%'],
      ['20%', '18%', '17%', '13%', '8%'],
    ];
    return (
      <div aria-hidden className="pointer-events-none select-none opacity-70 blur-[3px]">
        <div className="flex gap-3 border-b border-zinc-300/70 pb-2 dark:border-white/10">
          {head.map((w, i) => (
            <div key={i} className={`h-1.5 ${bar}`} style={{ width: w }} />
          ))}
        </div>
        <div className="space-y-3 pt-3">
          {rows.map((row, r) => (
            <div key={r} className="flex gap-3">
              {row.map((w, i) => (
                <div key={i} className={`h-2.5 ${bar}`} style={{ width: w }} />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }
  const cards = [
    ['48%', '96%', '72%'],
    ['38%', '88%', '64%'],
    ['54%', '92%', '78%'],
    ['42%', '84%', '58%'],
  ];
  return (
    <div
      aria-hidden
      className="pointer-events-none grid select-none grid-cols-1 gap-3 opacity-70 blur-[3px] md:grid-cols-2"
    >
      {cards.map((card, i) => (
        <div key={i} className="rounded-lg bg-zinc-200/50 p-3 dark:bg-white/[0.04]">
          <div className={`mb-2.5 h-2.5 ${bar}`} style={{ width: card[0] }} />
          <div className={`mb-1.5 h-2 ${bar}`} style={{ width: card[1] }} />
          <div className={`h-2 ${bar}`} style={{ width: card[2] }} />
        </div>
      ))}
    </div>
  );
}

/** A section the preview bundle carries a COUNT for but no rows.
 *
 *  Three parts, in order: the real SectionHeader (same icon / heading / subtitle
 *  as the shipped version, and the TRUE total on the right), the blurred
 *  synthetic skeleton, then a plain-text statement of what is withheld and how
 *  much. Reading order matters — the reader meets the section, sees it is
 *  redacted, then learns the size of what is missing.
 *
 *  Status is carried by a dashed border AND the words "Withheld from this
 *  preview", never by hue alone. That also keeps it distinct from a section that
 *  is merely EMPTY (a plain solid-ringed Card with an italic note, as
 *  RecentConferenceReadouts renders at length 0) and from a loading state (no
 *  animation) and from an error (no alert styling, no red).
 *
 *  Every fact is in the text; the blur decorates. */
function WithheldSection({ sectionKey, count }: { sectionKey: string; count: number }) {
  const Icon = iconFor(sectionKey);
  return (
    <section className="mb-10">
      <SectionHeader
        icon={Icon}
        title={sectionTitle(sectionKey)}
        subtitle={sectionSubtitle(sectionKey)}
        count={count}
      />
      <div className="rounded-xl border border-dashed border-zinc-400/80 bg-zinc-50/70 p-4 dark:border-white/25 dark:bg-white/[0.02]">
        <div className="mb-3 flex items-center gap-1.5">
          <EyeOff className="h-3 w-3 text-zinc-500 dark:text-zinc-400" aria-hidden="true" />
          <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
            Withheld from this preview
          </span>
        </div>
        <RedactedSkeleton variant={SKELETON_TABLE.has(sectionKey) ? 'table' : 'cards'} />
        <p className="mt-4 max-w-[72ch] border-t border-dashed border-zinc-300 pt-3 text-xs leading-relaxed text-zinc-600 dark:border-white/15 dark:text-zinc-300">
          This section holds{' '}
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">
            {count} {withheldUnit(sectionKey, count)}
          </span>{' '}
          in the full landscape map. None of them are in this preview — the shapes
          above are a blurred placeholder, not data. Available on request.
        </p>
      </div>
    </section>
  );
}

/** `section_counts` from a preview bundle, narrowed to finite numbers.
 *  Number.isFinite rather than truthiness, so a genuine 0 survives the filter
 *  (and is then excluded on its own merits, below) and a NaN cannot pass as a
 *  count. */
function previewSectionCounts(etlm: Record<string, unknown>): Record<string, number> {
  const raw = etlm.section_counts;
  if (!isObj(raw)) return {};
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (typeof v === 'number' && Number.isFinite(v)) out[k] = v;
  }
  return out;
}

function asList(v: unknown): Record<string, unknown>[] {
  return Array.isArray(v) ? v.filter(isObj) : [];
}

function firstStr(o: Record<string, unknown>, keys: string[]): string | null {
  for (const k of keys) {
    const val = o[k];
    if (typeof val === 'string' && val.trim()) return val.trim();
    if (typeof val === 'number') return String(val);
  }
  return null;
}

/** Best-effort one-line headline for a section, derived from its own data — the
 *  ETLM JSON carries no curated summary field, so the "At a glance" exec summary
 *  computes each line from the section's own shape. Defensive: unknown shapes
 *  fall back to a static descriptor, never throw, never dump JSON. Same code
 *  runs for every indication (released or not). */
function sectionHeadline(key: string, etlm: Record<string, unknown>): string {
  const val = etlm[key];

  if (key === 'epidemiology' && isObj(val)) {
    const bits: string[] = [];
    const push = (s: string) => {
      if (bits.length < 2 && s) bits.push(s);
    };
    const inc = val.us_incidence_annual ?? val.global_incidence_annual;
    if (typeof inc === 'number') push(`~${inc.toLocaleString('en-US')} cases/yr`);
    const prev = val.us_prevalence_pct_adults ?? val.global_prevalence_pct_adults_obese;
    if (bits.length < 2 && typeof prev === 'number') push(`${prev}% adult prevalence`);
    const surv = val['5yr_survival_pct'];
    if (typeof surv === 'number') push(`5-yr survival ${surv}%`);
    // Fallback: first labeled numeric fields if the known keys are absent.
    if (bits.length === 0) {
      for (const [k, v] of Object.entries(val)) {
        if (bits.length >= 2) break;
        if ((typeof v === 'string' || typeof v === 'number') && /\d/.test(String(v))) {
          let t = String(v).replace(/\s+/g, ' ').trim();
          if (t.length > 44) t = `${t.slice(0, 44).replace(/\s+\S*$/, '')}…`;
          push(`${labelText(k)}: ${t}`);
        }
      }
    }
    return bits.length ? bits.join(' , ') : 'Incidence, staging & survival context';
  }

  if (key.startsWith('approved_therapies')) {
    const rows = asList(val);
    const soc = rows.find(
      (r) => /soc.?anchor/i.test(String(r.benchmark_status ?? '')) || r.is_soc === true,
    );
    const socName = soc ? firstStr(soc, ['drug_name', 'asset_name', 'name', 'regimen']) : null;
    return socName
      ? `${rows.length} agents , SOC anchor: ${socName}`
      : `${rows.length} approved agent${rows.length === 1 ? '' : 's'}`;
  }

  if (key === 'pipeline_assets') {
    const rows = asList(val);
    const ph3 = rows.filter((r) => /(^|[^0-9])3([^0-9]|$)|III/.test(String(r.phase ?? ''))).length;
    return `${rows.length} pipeline asset${rows.length === 1 ? '' : 's'}${
      ph3 ? ` , ${ph3} in Phase 3` : ''
    }`;
  }

  if (key === 'recent_conference_readouts') {
    const rows = asList(val);
    // Arrays are recency-ordered in these drafts, so [0] is the freshest.
    const label = rows[0]
      ? firstStr(rows[0], ['trial', 'trial_name', 'asset', 'drug_name', 'title', 'venue'])
      : null;
    return label
      ? `${rows.length} readouts , latest: ${label}`
      : `${rows.length} conference readout${rows.length === 1 ? '' : 's'}`;
  }

  if (key.startsWith('efficacy_benchmarks_')) {
    const n = isObj(val) ? Object.keys(val).length : Array.isArray(val) ? val.length : 0;
    return n
      ? `Efficacy benchmarks across ${n} line${n === 1 ? '' : 's'} of therapy`
      : 'Efficacy benchmarks by line of therapy';
  }

  if (key === 'mechanism_landscape') {
    const n = Array.isArray(val) ? val.length : 0;
    return `${n} target${n === 1 ? '' : 's'} / drug classes mapped to assets`;
  }

  if (key === 'competitive_dynamics') {
    const n = isObj(val) ? Object.keys(val).length : 0;
    return n
      ? `${n} competitive dimension${n === 1 ? '' : 's'}: crowded targets, white space, LoE`
      : 'Crowded targets, white space & patent expiries';
  }

  if (key === 'unmet_needs') {
    const rows = asList(val);
    const top = rows[0] ? firstStr(rows[0], ['need', 'title', 'label', 'gap']) : null;
    return top
      ? `${rows.length} unmet needs , e.g. ${top}`
      : `${rows.length} unmet need${rows.length === 1 ? '' : 's'}`;
  }

  if (key === 'regulatory_landscape') return 'Pathway risks, designations & label scope';

  if (key === 'preclinical_watchlist') {
    const n = Array.isArray(val) ? val.length : 0;
    return `${n} preclinical asset${n === 1 ? '' : 's'} on watch`;
  }

  if (key === 'novel_targets') {
    const n = Array.isArray(val) ? val.length : 0;
    return `${n} novel target${n === 1 ? '' : 's'}`;
  }

  if (key === 'emerging_signals') {
    const rows = asList(val);
    const first = rows[0]
      ? firstStr(rows[0], ['asset', 'drug_name', 'company', 'indication_subtype'])
      : null;
    return first
      ? `Watchlist${rows.length > 1 ? ` (${rows.length})` : ''}: ${first}`
      : 'Early watchlist signals';
  }

  const n = Array.isArray(val) ? val.length : isObj(val) ? Object.keys(val).length : 0;
  return n ? `${n} item${n === 1 ? '' : 's'}` : navLabel(key);
}

type SummaryRow = {
  key: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  count?: number;
  headline: string;
  /** Clinical values stay blurred on previews; structural coverage copy does not. */
  redactHeadline?: boolean;
};

/** Blur every numeric token in a string, for a redacted (summary-only) report.
 *
 *  On a capped page the derived headlines count the rows that SHIPPED, not the rows
 *  that exist — so every section announced "3": "3 approved agents", "3 pipeline
 *  assets , 3 in Phase 3", "benchmarks across 3 lines of therapy". For an indication
 *  with 23 approved agents and 44 pipeline assets that is not merely repetitive, it
 *  is wrong, and it advertises the cap in the clumsiest possible way.
 *
 *  Blurring the digits keeps the sentence shape ("N approved agents , SOC anchor: X")
 *  and the genuinely informative half — the SOC anchor, the latest readout, the
 *  leading unmet need — while the quantity reads as deliberately withheld. Nothing
 *  secret is hidden here: the shipped number IS the cap, and the true totals travel
 *  openly in section_counts. This is about not stating a misleading figure.
 */
function blurNumbers(text: string, redact: boolean): React.ReactNode {
  if (!redact) return text;
  const parts = text.split(/(\d[\d,.]*\s*%?)/g);
  return parts.map((part, i) =>
    /^\d/.test(part) ? (
      // The blur is decorative and must not be the only signal: a screen reader was
      // being handed the capped figure as plain text and announcing "3 approved
      // agents" as fact. The digits are now aria-hidden and an sr-only phrase carries
      // the truth instead. `title` was doing this job and cannot — it is not reliably
      // announced on a bare span, and find-in-page still matched the hidden number.
      <span key={i}>
        <span aria-hidden="true" className="select-none blur-[4px] opacity-70">
          {part}
        </span>
        <span className="sr-only">a withheld number of</span>
      </span>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

/** Page-level preview notice. Sits directly above "At a glance", so the reader
 *  meets the cap before the first section rather than inferring it from three
 *  short lists; each shipped section then restates it with its own true total in
 *  PreviewRowsFooter.
 *
 *  It deliberately does NOT reprint `detail_note` — the summary page's "Summary
 *  view" box already carries that sentence, and a reader arriving from it would
 *  otherwise read the same words twice. This says the one thing that box does
 *  not: how many rows of each shipped section are actually on this page. */
function PreviewCapNotice({ etlm }: { etlm: Record<string, unknown> }) {
  const counts = previewSectionCounts(etlm);
  const approvedKeys = [
    'approved_therapies_novel',
    'approved_therapies_legacy',
    'approved_therapies',
  ].filter((key) => Array.isArray(etlm[key]));
  const approvedShown = approvedKeys.reduce(
    (sum, key) => sum + (etlm[key] as unknown[]).length,
    0,
  );
  const approvedTotal = approvedKeys.reduce((sum, key) => sum + (counts[key] ?? 0), 0);
  const pipelineShown = Array.isArray(etlm.pipeline_assets) ? etlm.pipeline_assets.length : 0;
  const pipelineTotal = counts.pipeline_assets ?? 0;
  return (
    <section className="mb-6 rounded-xl border border-amber-300/70 bg-amber-50/60 px-4 py-3 dark:border-amber-500/30 dark:bg-amber-500/5">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-700 dark:text-zinc-300">
        <EyeOff className="h-3.5 w-3.5 text-amber-700 dark:text-amber-400" aria-hidden="true" />
        <span className="font-semibold text-zinc-900 dark:text-zinc-100">Preview coverage</span>
        {approvedTotal > 0 && (
          <span>{approvedShown} of {approvedTotal} approved therapies shown</span>
        )}
        {approvedTotal > 0 && pipelineTotal > 0 && <span aria-hidden="true">·</span>}
        {pipelineTotal > 0 && (
          <span>{pipelineShown} of {pipelineTotal} pipeline asset–trial records shown</span>
        )}
      </div>
      <p className="mt-1 pl-6 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
        Other populated sections show their full-map totals while withholding all source rows.
      </p>
    </section>
  );
}

/** "At a glance" — the report's landing view. One row per section (heading +
 *  count + derived headline); a click expands that section and scrolls to it,
 *  or collapses it if already open. Expand/Collapse-all toggle the whole map.
 *  Lets the reader see every section's so-what without scrolling the full map. */
function ExecSummary({
  rows,
  open,
  onRow,
  onExpandAll,
  onCollapseAll,
  redact = false,
}: {
  rows: SummaryRow[];
  open: Record<string, boolean>;
  onRow: (key: string) => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  redact?: boolean;
}) {
  if (rows.length === 0) return null;
  return (
    <section className="mb-10 rounded-xl ring-1 ring-zinc-200 dark:ring-white/10 bg-zinc-50/60 dark:bg-white/[0.02] p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          At a glance
        </h2>
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={onExpandAll}
            className="font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            Expand all
          </button>
          <span className="text-zinc-300 dark:text-zinc-600">,</span>
          <button
            onClick={onCollapseAll}
            className="font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            Collapse all
          </button>
        </div>
      </div>
      <ul className="divide-y divide-zinc-200/70 dark:divide-white/5">
        {rows.map(({ key, icon: Icon, title, count, headline, redactHeadline = true }) => {
          const on = !!open[key];
          return (
            <li key={key}>
              <button
                onClick={() => onRow(key)}
                aria-expanded={on}
                className="group flex w-full items-start gap-3 py-2.5 text-left"
              >
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400 group-hover:text-zinc-600 dark:text-zinc-500 dark:group-hover:text-zinc-300" />
                <span className="w-32 shrink-0 text-xs font-semibold text-zinc-900 dark:text-zinc-100 sm:w-44">
                  {title}
                  {typeof count === 'number' ? (
                    <span className="ml-1 font-normal text-zinc-400 dark:text-zinc-500">
                      {count}
                    </span>
                  ) : null}
                </span>
                <span className="flex-1 text-xs leading-relaxed text-zinc-600 dark:text-zinc-300">
                  {blurNumbers(String(headline ?? ''), redact && redactHeadline)}
                </span>
                <span className="shrink-0 text-xs text-zinc-400 transition-colors group-hover:text-zinc-600 dark:text-zinc-500 dark:group-hover:text-zinc-300">
                  {on ? '▾' : '▸'}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** Render one section by key, or null if it should be suppressed. */
function renderSection(
  key: string,
  etlm: Record<string, unknown>,
  indicationCode: string,
): React.ReactNode {
  const val = etlm[key];
  if (key === 'epidemiology' && isObj(val)) return <Epidemiology data={val} />;
  // `totalRows` is null on every full-detail payload (previewSectionTotal short-
  // circuits on `detail_available !== false`), so the featured indications render
  // exactly as before; only a capped preview gets a real total.
  if (key === 'approved_therapies_novel' && Array.isArray(val))
    return (
      <ApprovedTherapies
        data={val}
        sectionLabel="Novel Approved Therapies"
        totalRows={previewSectionTotal(etlm, key)}
      />
    );
  if (key === 'approved_therapies_legacy' && Array.isArray(val))
    return (
      <ApprovedTherapies
        data={val}
        sectionLabel="Legacy Approved Therapies"
        condensed
        totalRows={previewSectionTotal(etlm, key)}
      />
    );
  if (key === 'approved_therapies' && Array.isArray(val)) {
    // Flat array is a subset once an indication splits novel/legacy — suppress it.
    const hasSplit =
      Array.isArray(etlm.approved_therapies_novel) ||
      Array.isArray(etlm.approved_therapies_legacy);
    if (hasSplit) return null;
    return <ApprovedTherapies data={val} totalRows={previewSectionTotal(etlm, key)} />;
  }
  if (key === 'pipeline_assets' && Array.isArray(val))
    return (
      <PipelineAssets
        data={val}
        indicationCode={indicationCode}
        totalRows={previewSectionTotal(etlm, key)}
      />
    );
  if (key === 'recent_conference_readouts' && Array.isArray(val))
    return <RecentConferenceReadouts data={val} />;
  if (key.startsWith('efficacy_benchmarks_') && isObj(val))
    return <EfficacyBenchmarks data={val} schemaKey={key} />;
  if (key === 'mechanism_landscape' && Array.isArray(val))
    return <MechanismLandscape data={val} indicationCode={indicationCode} />;
  if (key === 'competitive_dynamics' && isObj(val)) return <CompetitiveDynamics data={val} />;
  if (key === 'unmet_needs' && Array.isArray(val)) return <UnmetNeeds data={val} />;
  if (key === 'regulatory_landscape' && isObj(val)) return <RegulatoryLandscape data={val} />;
  if (key === 'preclinical_watchlist' && Array.isArray(val)) return <PreclinicalWatchlist data={val} />;
  if (key === 'novel_targets' && Array.isArray(val)) return <NovelTargets data={val} />;
  if (key === 'emerging_signals' && Array.isArray(val)) return <EmergingSignals data={val} />;
  // No dedicated renderer → suppress. A public landscape map must NEVER dump raw
  // JSON. Any section worth showing gets a real renderer above (and add it to
  // SECTION_LABEL for a Title-Case nav label); everything else is hidden.
  if (import.meta.env?.DEV) {
    // eslint-disable-next-line no-console
    console.warn(`[ETLMSections] no renderer for section "${key}" — suppressed from public report`);
  }
  return null;
}

export function ETLMSections({ etlm, indicationCode }: Props) {
  const meta = etlmIndex.find((e) => e.indication_code === indicationCode);
  const linkedTpps = crossLinks.etlm_to_tpps?.[indicationCode] ?? [];
  const linkedThemes = crossLinks.etlm_to_themes?.[indicationCode] ?? [];

  // A PREVIEW bundle (detail_available === false) ships the rows of only a couple
  // of sections but `section_counts` for every section, withheld ones included.
  // So the section list is driven by section_counts AS WELL AS by the present
  // arrays: a section with a count but no rows still appears, in its normal
  // SECTION_ORDER position with its normal heading and icon, as an explicitly
  // redacted block rather than vanishing.
  //
  // Featured ETLMs (obesity / mm / nsclc) carry no `detail_available` key, so
  // `withheldCounts` is {} for them and every line below reduces to exactly the
  // expression it replaced.
  const withheldCounts = etlm.detail_available === false ? previewSectionCounts(etlm) : {};

  const sectionKeys = [
    ...Object.keys(etlm),
    ...Object.keys(withheldCounts).filter((k) => !(k in etlm)),
  ];

  const orderedKeys = [
    ...SECTION_ORDER.filter((k) => sectionKeys.includes(k)),
    ...sectionKeys.filter(
      (k) => !SKIP_KEYS.has(k) && !SECTION_ORDER.includes(k),
    ),
  ];

  const rendered = orderedKeys
    .filter((k) => !SKIP_KEYS.has(k))
    .map((key) => {
      const withheldCount = withheldCounts[key];
      // Resolve a withheld key BEFORE renderSection: the key is absent from
      // `etlm`, so renderSection would return null and log a DEV "no renderer"
      // warning that is wrong here — there IS a renderer, there is no data.
      // `> 0` is an explicit comparison, not truthiness: a section whose true
      // count is 0 has nothing to withhold and stays absent, exactly as on a
      // featured page.
      if (!(key in etlm) && typeof withheldCount === 'number' && withheldCount > 0) {
        return {
          key,
          node: <WithheldSection sectionKey={key} count={withheldCount} />,
          withheld: true,
        };
      }
      return { key, node: renderSection(key, etlm, indicationCode), withheld: false };
    })
    .filter((r) => r.node !== null);

  // Parent owns collapse state so the exec summary and the nav rail can drive it.
  // Every section starts collapsed — the report leads with the "At a glance" map.
  const [open, setOpen] = useState<Record<string, boolean>>({});

  const setAll = (val: boolean) =>
    setOpen(Object.fromEntries(rendered.map((r) => [r.key, val])));

  const scrollToKey = (key: string) => {
    // Wait for the just-opened section to mount before scrolling to it.
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        const el = document.getElementById(sectionId(key));
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        el?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      }),
    );
  };

  // Exec-summary row / nav pill click: toggle if open, else open + scroll to it.
  const onRow = (key: string) => {
    if (open[key]) {
      setOpen((o) => ({ ...o, [key]: false }));
    } else {
      setOpen((o) => ({ ...o, [key]: true }));
      scrollToKey(key);
    }
  };

  const idToKey: Record<string, string> = Object.fromEntries(
    rendered.map((r) => [sectionId(r.key), r.key]),
  );

  const navItems: NavItem[] = rendered.map(({ key }) => ({
    id: sectionId(key),
    label: navLabel(key),
    count:
      etlm.detail_available === false && typeof withheldCounts[key] === 'number'
        ? withheldCounts[key]
        : Array.isArray(etlm[key])
          ? (etlm[key] as unknown[]).length
          : undefined,
  }));

  const summaryRows: SummaryRow[] = rendered.map(({ key, withheld }) => {
    const shown = Array.isArray(etlm[key]) ? (etlm[key] as unknown[]).length : undefined;
    const total =
      etlm.detail_available === false && typeof withheldCounts[key] === 'number'
        ? withheldCounts[key]
        : shown;
    const isApproved = key.startsWith('approved_therapies');
    const isPipeline = key === 'pipeline_assets';
    const structuralPreview = etlm.detail_available === false && (isApproved || isPipeline);

    let headline = withheld ? 'Withheld from this preview' : sectionHeadline(key, etlm);
    if (structuralPreview && typeof total === 'number' && typeof shown === 'number') {
      headline = isPipeline
        ? `${total} asset–trial records in the full map · ${shown} shown`
        : `${total} approved therapies in the full map · ${shown} shown`;
    }

    return {
      key,
      icon: iconFor(key),
      title: navLabel(key),
      count: total,
      headline,
      redactHeadline: !structuralPreview,
    };
  });

  return (
    <div>
      <ReportNav
        items={navItems}
        onJump={(id) => {
          const key = idToKey[id];
          if (key) setOpen((o) => ({ ...o, [key]: true }));
        }}
      />
      {(linkedTpps.length > 0 || linkedThemes.length > 0) && (
        <section className="mb-10 rounded-xl ring-1 ring-zinc-200 dark:ring-white/10 bg-zinc-50/60 dark:bg-white/[0.02] p-4">
          <div className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
            Related deliverables in this preview
          </div>
          <div className="flex flex-wrap gap-2">
            {linkedTpps.map((slug) => (
              <Link
                key={slug}
                to={`/atlas-reader/tpp/${slug}`}
                className="text-xs px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 ring-1 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/30 hover:ring-rose-600/40"
              >
                TPP , {tppLabel(slug)}
              </Link>
            ))}
            {linkedThemes.map((slug) => (
              <Link
                key={slug}
                to={`/atlas-reader/theme/${slug}`}
                className="text-xs px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 ring-1 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30 hover:ring-amber-600/40"
              >
                Theme , {themeShortLabel(slug)}
              </Link>
            ))}
          </div>
        </section>
      )}

      {etlm.detail_available === false && (
        <PreviewCapNotice etlm={etlm} />
      )}

      <ExecSummary
        rows={summaryRows}
        open={open}
        onRow={onRow}
        onExpandAll={() => setAll(true)}
        onCollapseAll={() => setAll(false)}
        redact={etlm.detail_available === false}
      />

      {rendered.map(({ key, node }) => (
        <div key={key} id={sectionId(key)} className="scroll-mt-28">
          {open[key] ? node : null}
        </div>
      ))}

      {meta && (
        <footer className="mt-12 pt-6 border-t border-zinc-200 dark:border-white/10 text-xs text-zinc-400 dark:text-zinc-500">
          ETLM — {meta.indication} ({meta.indication_code}). Redacted preview only.
        </footer>
      )}
    </div>
  );
}

export default ETLMSections;
