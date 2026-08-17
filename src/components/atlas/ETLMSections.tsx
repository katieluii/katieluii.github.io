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
  ExternalLink,
} from 'lucide-react';
import { crossLinks, etlmIndex, tppIndex } from '../../data/atlas/index';
import { themeShortLabel } from '../../data/atlas/taxonomy';
import { listItemText } from '../../data/atlas/presentationProfile';
import { labelText } from '../../data/atlas/labelText';

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
 *  "key: value · key: value" and arrays join their humanized items. Bounded depth
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
 *  defect ("company: Pfizer-Astellas · franchise: …" on the live urothelial
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
      .join(' · ');
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
}: {
  data: unknown[];
  sectionLabel?: string;
  condensed?: boolean;
}) {
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
        <SectionHeader icon={Shield} title={title} subtitle={subtitle} count={data.length} />
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
                      <span className="text-zinc-400 dark:text-zinc-500"> · {modShort}</span>
                    ) : null}
                  </span>
                  <span className="tabular-nums text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                    {tb ?? '—'}
                  </span>
                </li>
              );
            })}
          </ul>
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
        count={data.length}
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
                {String(entry.company ?? '')} · {String(entry.modality ?? '')}
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
    </section>
  );
}

type SortDir = 'asc' | 'desc';
type SortKey = 'asset_name' | 'population' | 'company' | 'modality' | 'target' | 'phase' | 'status' | 'trial_name' | 'estimated_readout';

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

function PipelineAssets({
  data,
  indicationCode,
}: {
  data: unknown[];
  indicationCode: string;
}) {
  const linkedTpps = crossLinks.etlm_to_tpps?.[indicationCode] ?? [];
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const rows = data.filter(isObj);

  const sorted = sortKey
    ? [...rows].sort((a, b) => {
        let av: string | number = '';
        let bv: string | number = '';
        if (sortKey === 'phase') {
          av = PHASE_ORDER[String(a.phase ?? '')] ?? 0;
          bv = PHASE_ORDER[String(b.phase ?? '')] ?? 0;
        } else if (sortKey === 'population') {
          av = String(a.population ?? a.indication_subtype ?? '').toLowerCase();
          bv = String(b.population ?? b.indication_subtype ?? '').toLowerCase();
        } else {
          av = String(a[sortKey] ?? '').toLowerCase();
          bv = String(b[sortKey] ?? '').toLowerCase();
        }
        if (av < bv) return sortDir === 'asc' ? -1 : 1;
        if (av > bv) return sortDir === 'asc' ? 1 : -1;
        return 0;
      })
    : rows;

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
        subtitle="Phase 2/3 programs and key catalysts"
        count={rows.length}
      />
      <div className="overflow-x-auto rounded-xl ring-1 ring-zinc-200 dark:ring-white/10">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr>
              <SortTh col="asset_name" label="Asset" />
              <SortTh col="population" label="Population" />
              <SortTh col="company" label="Company" className="hidden sm:table-cell" />
              <SortTh col="modality" label="Modality" className="hidden md:table-cell" />
              <SortTh col="target" label="Target" className="hidden md:table-cell" />
              <SortTh col="phase" label="Phase" />
              <SortTh col="status" label="Status" className="hidden lg:table-cell" />
              <SortTh col="trial_name" label="Trial" className="hidden lg:table-cell" />
              <th className="px-3 py-2 text-left text-[10px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-white/10 whitespace-nowrap">
                NCT
              </th>
              <SortTh col="estimated_readout" label="Readout" className="hidden sm:table-cell" />
            </tr>
          </thead>
          <tbody>
            {shown.map((entry, i) => {
              const phase = String(entry.phase ?? '—');
              return (
                <tr
                  key={i}
                  className={`border-b border-zinc-100 dark:border-white/5 hover:bg-zinc-50/80 dark:hover:bg-white/5 ${i % 2 === 1 ? 'bg-zinc-50/40 dark:bg-white/[0.02]' : ''}`}
                >
                  <td className="px-3 py-2.5 align-top">
                    <div className="font-medium text-zinc-900 dark:text-zinc-100">
                      {String(entry.asset_name ?? entry.drug_name ?? '—')}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 align-top text-zinc-600 dark:text-zinc-400 max-w-[180px]">
                    {String(entry.population ?? entry.indication_subtype ?? '—')}
                  </td>
                  <td className="px-3 py-2.5 align-top text-zinc-600 dark:text-zinc-400 hidden sm:table-cell">
                    {String(entry.company ?? entry.sponsor ?? '—')}
                  </td>
                  <td className="px-3 py-2.5 align-top text-zinc-600 dark:text-zinc-400 hidden md:table-cell max-w-[180px]">
                    <span title={String(entry.modality ?? '')}>
                      {String(entry.modality ?? '—').slice(0, 40)}{String(entry.modality ?? '').length > 40 ? '…' : ''}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 align-top text-zinc-600 dark:text-zinc-400 hidden md:table-cell">
                    {String(entry.target ?? '—')}
                  </td>
                  <td className="px-3 py-2.5 align-top">
                    <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full ring-1 ${phasePill(phase)}`}>
                      {phase}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 align-top text-zinc-500 dark:text-zinc-400 hidden lg:table-cell whitespace-nowrap">
                    {humanizeEnum(entry.status)}
                  </td>
                  <td className="px-3 py-2.5 align-top text-zinc-600 dark:text-zinc-400 hidden lg:table-cell">
                    {String(entry.trial_name ?? '—')}
                  </td>
                  <td className="px-3 py-2.5 align-top">
                    <NctLink nct={entry.nct ? String(entry.nct) : undefined} />
                  </td>
                  <td className="px-3 py-2.5 align-top text-zinc-500 dark:text-zinc-400 hidden sm:table-cell whitespace-nowrap">
                    {String(entry.estimated_readout ?? '—')}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <ShowMore hiddenCount={hiddenCount} expanded={expanded} onClick={toggle} />
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
              {i < linkedTpps.length - 1 ? ' · ' : ''}
            </span>
          ))}
        </div>
      )}
    </section>
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
              {i < linkedThemes.length - 1 ? ' · ' : ''}
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
              // live page read "company: Pfizer-Astellas · franchise: …". Same keys
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
          // printed "Unmet needs · 11". An empty grid under a non-zero count is
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
                {String(entry.company ?? entry.sponsor ?? '')} ·{' '}
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
              {[s.company, s.modality].filter(Boolean).map(String).join(' · ')}
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
      className="sticky top-0 z-20 -mx-6 mb-8 border-b border-zinc-200 bg-white/85 px-6 py-1.5 backdrop-blur dark:border-white/10 dark:bg-zinc-950/80"
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
    return bits.length ? bits.join(' · ') : 'Incidence, staging & survival context';
  }

  if (key.startsWith('approved_therapies')) {
    const rows = asList(val);
    const soc = rows.find(
      (r) => /soc.?anchor/i.test(String(r.benchmark_status ?? '')) || r.is_soc === true,
    );
    const socName = soc ? firstStr(soc, ['drug_name', 'asset_name', 'name', 'regimen']) : null;
    return socName
      ? `${rows.length} agents · SOC anchor: ${socName}`
      : `${rows.length} approved agent${rows.length === 1 ? '' : 's'}`;
  }

  if (key === 'pipeline_assets') {
    const rows = asList(val);
    const ph3 = rows.filter((r) => /(^|[^0-9])3([^0-9]|$)|III/.test(String(r.phase ?? ''))).length;
    return `${rows.length} pipeline asset${rows.length === 1 ? '' : 's'}${
      ph3 ? ` · ${ph3} in Phase 3` : ''
    }`;
  }

  if (key === 'recent_conference_readouts') {
    const rows = asList(val);
    // Arrays are recency-ordered in these drafts, so [0] is the freshest.
    const label = rows[0]
      ? firstStr(rows[0], ['trial', 'trial_name', 'asset', 'drug_name', 'title', 'venue'])
      : null;
    return label
      ? `${rows.length} readouts · latest: ${label}`
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
      ? `${rows.length} unmet needs · e.g. ${top}`
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
};

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
}: {
  rows: SummaryRow[];
  open: Record<string, boolean>;
  onRow: (key: string) => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
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
          <span className="text-zinc-300 dark:text-zinc-600">·</span>
          <button
            onClick={onCollapseAll}
            className="font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            Collapse all
          </button>
        </div>
      </div>
      <ul className="divide-y divide-zinc-200/70 dark:divide-white/5">
        {rows.map(({ key, icon: Icon, title, count, headline }) => {
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
                    <span className="ml-1 font-normal text-zinc-400 dark:text-zinc-500">{count}</span>
                  ) : null}
                </span>
                <span className="flex-1 text-xs leading-relaxed text-zinc-600 dark:text-zinc-300">
                  {headline}
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
  if (key === 'approved_therapies_novel' && Array.isArray(val))
    return <ApprovedTherapies data={val} sectionLabel="Novel Approved Therapies" />;
  if (key === 'approved_therapies_legacy' && Array.isArray(val))
    return <ApprovedTherapies data={val} sectionLabel="Legacy Approved Therapies" condensed />;
  if (key === 'approved_therapies' && Array.isArray(val)) {
    // Flat array is a subset once an indication splits novel/legacy — suppress it.
    const hasSplit =
      Array.isArray(etlm.approved_therapies_novel) ||
      Array.isArray(etlm.approved_therapies_legacy);
    if (hasSplit) return null;
    return <ApprovedTherapies data={val} />;
  }
  if (key === 'pipeline_assets' && Array.isArray(val))
    return <PipelineAssets data={val} indicationCode={indicationCode} />;
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

  const orderedKeys = [
    ...SECTION_ORDER.filter((k) => k in etlm),
    ...Object.keys(etlm).filter(
      (k) => !SKIP_KEYS.has(k) && !SECTION_ORDER.includes(k),
    ),
  ];

  const rendered = orderedKeys
    .filter((k) => !SKIP_KEYS.has(k))
    .map((key) => ({ key, node: renderSection(key, etlm, indicationCode) }))
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
    count: Array.isArray(etlm[key]) ? (etlm[key] as unknown[]).length : undefined,
  }));

  const summaryRows: SummaryRow[] = rendered.map(({ key }) => ({
    key,
    icon: iconFor(key),
    title: navLabel(key),
    count: Array.isArray(etlm[key]) ? (etlm[key] as unknown[]).length : undefined,
    headline: sectionHeadline(key, etlm),
  }));

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
                TPP · {tppLabel(slug)}
              </Link>
            ))}
            {linkedThemes.map((slug) => (
              <Link
                key={slug}
                to={`/atlas-reader/theme/${slug}`}
                className="text-xs px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 ring-1 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30 hover:ring-amber-600/40"
              >
                Theme · {themeShortLabel(slug)}
              </Link>
            ))}
          </div>
        </section>
      )}

      <ExecSummary
        rows={summaryRows}
        open={open}
        onRow={onRow}
        onExpandAll={() => setAll(true)}
        onCollapseAll={() => setAll(false)}
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
