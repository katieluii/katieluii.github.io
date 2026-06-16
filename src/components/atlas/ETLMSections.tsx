import { useState } from 'react';
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

function Epidemiology({ data }: { data: Record<string, unknown> }) {
  const stats: Array<[string, unknown]> = [
    ['Global incidence (annual)', data['global_incidence_annual']],
    ['US incidence (annual)', data['us_incidence_annual']],
    ['5-yr survival', data['5yr_survival_pct'] ? `${data['5yr_survival_pct']}%` : null],
    ['Median age at dx', data['median_age_at_diagnosis']],
    ['Global prevalence', data['global_prevalence']],
  ];
  const segments = data['key_genomic_segments'];

  return (
    <section className="mb-10">
      <SectionHeader icon={Users} title="Epidemiology" />
      <Card>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {stats.map(([k, v]) =>
            v !== null && v !== undefined ? (
              <KV
                key={k}
                label={k}
                value={typeof v === 'number' ? v.toLocaleString() : String(v)}
              />
            ) : null,
          )}
        </div>
        {Array.isArray(segments) && segments.length > 0 && (
          <div className="mt-5 pt-4 border-t border-zinc-200 dark:border-white/10">
            <div className="text-[10px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
              Key genomic / clinical segments
            </div>
            <ul className="text-xs text-zinc-700 dark:text-zinc-300 space-y-1 list-disc pl-4">
              {segments.map((s, i) => (
                <li key={i}>{String(s)}</li>
              ))}
            </ul>
          </div>
        )}
      </Card>
    </section>
  );
}

function ApprovedTherapies({ data, sectionLabel }: { data: unknown[]; sectionLabel?: string }) {
  const title = sectionLabel ?? 'Approved therapies';
  const subtitle = sectionLabel === 'Legacy Approved Therapies'
    ? 'Pre-incretin era; largely displaced in general obesity'
    : sectionLabel === 'Novel Approved Therapies'
    ? 'Current standard-of-care and active agents'
    : 'The standard-of-care anchor';
  return (
    <section className="mb-10">
      <SectionHeader
        icon={Shield}
        title={title}
        subtitle={subtitle}
        count={data.length}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {data.map((entry, i) => {
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
                          <span className="text-zinc-500 dark:text-zinc-400">{k.replace(/_/g, ' ')}:</span>{' '}
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
                            <span className="text-zinc-500 dark:text-zinc-400">{k.replace(/_/g, ' ')}:</span>{' '}
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
                            <span className="text-zinc-500 dark:text-zinc-400">{k.replace(/_/g, ' ')}:</span>{' '}
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
    </section>
  );
}

type SortDir = 'asc' | 'desc';
type SortKey = 'asset_name' | 'company' | 'modality' | 'target' | 'phase' | 'status' | 'trial_name' | 'estimated_readout';

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
        } else {
          av = String(a[sortKey] ?? '').toLowerCase();
          bv = String(b[sortKey] ?? '').toLowerCase();
        }
        if (av < bv) return sortDir === 'asc' ? -1 : 1;
        if (av > bv) return sortDir === 'asc' ? 1 : -1;
        return 0;
      })
    : rows;

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
            {sorted.map((entry, i) => {
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
                    {entry.indication_subtype ? (
                      <div className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                        {String(entry.indication_subtype)}
                      </div>
                    ) : null}
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
                    {String(entry.status ?? '—')}
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
  const schemaLabel = schemaKey
    .replace(/^efficacy_benchmarks_/, '')
    .replace(/_/g, ' ');

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
                {line.replace(/_/g, ' ')}
              </div>
              <div className="space-y-1.5">
                {Object.entries(val).map(([k, v]) => {
                  if (k === 'source') return null;
                  return (
                    <div key={k} className="flex justify-between text-xs gap-3">
                      <span className="text-zinc-500 dark:text-zinc-400">
                        {k.replace(/_/g, ' ')}
                      </span>
                      <span className="text-zinc-800 dark:text-zinc-200 font-medium text-right">
                        {typeof v === 'object'
                          ? JSON.stringify(v).slice(0, 80)
                          : String(v)}
                      </span>
                    </div>
                  );
                })}
                {val.source ? (
                  <div className="text-[10px] text-zinc-400 dark:text-zinc-500 pt-1 italic">
                    {String(val.source)}
                  </div>
                ) : null}
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
      <div className="space-y-3">
        {data.map((entry, i) => {
          if (!isObj(entry)) return null;
          const eff = isObj(entry.efficacy_benchmark) ? entry.efficacy_benchmark : {};
          const approved = Array.isArray(entry.approved_assets) ? entry.approved_assets : [];
          return (
            <Card key={i}>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {String(entry.target ?? '—')}
                  </div>
                  <div className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
                    {String(entry.drug_class ?? '')}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 text-[10px]">
                  {typeof entry.pipeline_count_ph2 === 'number' && (
                    <span className="text-zinc-500 dark:text-zinc-400">
                      Ph2: <span className="font-semibold">{entry.pipeline_count_ph2}</span>
                    </span>
                  )}
                  {typeof entry.pipeline_count_ph3 === 'number' && (
                    <span className="text-zinc-500 dark:text-zinc-400">
                      Ph3: <span className="font-semibold">{entry.pipeline_count_ph3}</span>
                    </span>
                  )}
                </div>
              </div>
              {approved.length > 0 && (
                <div className="mb-2 text-xs">
                  <span className="text-zinc-500 dark:text-zinc-400">Approved: </span>
                  <span className="text-zinc-800 dark:text-zinc-200">
                    {approved.map(String).join(', ')}
                  </span>
                </div>
              )}
              {entry.leading_pipeline_asset ? (
                <div className="text-xs mb-2">
                  <span className="text-zinc-500 dark:text-zinc-400">Leading pipeline: </span>
                  <span className="text-zinc-800 dark:text-zinc-200">
                    {String(entry.leading_pipeline_asset)}
                  </span>
                </div>
              ) : null}
              {Object.keys(eff).length > 0 && (
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs mb-2">
                  {Object.entries(eff).map(([k, v]) => (
                    <span key={k}>
                      <span className="text-zinc-500 dark:text-zinc-400">{k}:</span>{' '}
                      <span className="font-medium">{String(v)}</span>
                    </span>
                  ))}
                </div>
              )}
              {entry.key_resistance_mechanism ? (
                <div className="text-xs text-zinc-600 dark:text-zinc-400 italic">
                  Resistance: {String(entry.key_resistance_mechanism)}
                </div>
              ) : null}
            </Card>
          );
        })}
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
          {data.map((entry, i) => {
            if (!isObj(entry)) return null;
            return (
              <Card key={i} accent="ring-rose-200/60 dark:ring-rose-500/20">
                <div className="flex items-baseline justify-between gap-2 mb-1.5">
                  <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {String(entry.drug ?? entry.asset ?? '—')}
                  </div>
                  <span className="text-[10px] uppercase tracking-wider text-rose-700 dark:text-rose-400">
                    {String(entry.conference ?? '')}
                  </span>
                </div>
                {entry.trial ? (
                  <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">
                    Trial: <span className="font-medium">{String(entry.trial)}</span>
                  </div>
                ) : null}
                <div className="text-xs text-zinc-700 dark:text-zinc-300 mb-2">
                  {String(entry.finding ?? '')}
                </div>
                {entry.source ? (
                  <div className="text-[10px] text-zinc-400 dark:text-zinc-500 italic">
                    {String(entry.source)}
                  </div>
                ) : null}
              </Card>
            );
          })}
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
              {key.replace(/_/g, ' ')}
            </div>
            {Array.isArray(val) ? (
              <ul className="text-xs text-zinc-700 dark:text-zinc-300 space-y-1 list-disc pl-4">
                {val.slice(0, 8).map((v, i) => (
                  <li key={i}>{typeof v === 'object' ? JSON.stringify(v) : String(v)}</li>
                ))}
              </ul>
            ) : isObj(val) ? (
              <div className="space-y-1.5">
                {Object.entries(val).map(([k, v]) => (
                  <div key={k} className="text-xs">
                    <span className="text-zinc-500 dark:text-zinc-400">
                      {k.replace(/_/g, ' ')}:
                    </span>{' '}
                    <span className="text-zinc-800 dark:text-zinc-200">
                      {typeof v === 'object'
                        ? Array.isArray(v)
                          ? (v as unknown[]).map(String).join(', ')
                          : JSON.stringify(v).slice(0, 200)
                        : String(v)}
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
                  {categoryKey.replace(/_/g, ' ')}
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
                  {categoryKey.replace(/_/g, ' ')}
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
                {categoryKey.replace(/_/g, ' ')}
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
                        {subKey.replace(/_/g, ' ')}
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
                              {subVal.signals.map((s, i) => <li key={i}>{String(s)}</li>)}
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
                            {k.replace(/_/g, ' ')}
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
  'unmet_needs',
  'regulatory_landscape',
  'preclinical_watchlist',
  'novel_targets',
];

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

  return (
    <div>
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

      {orderedKeys.map((key) => {
        if (SKIP_KEYS.has(key)) return null;
        const val = etlm[key];

        if (key === 'epidemiology' && isObj(val)) {
          return <Epidemiology key={key} data={val} />;
        }
        if (key === 'approved_therapies_novel' && Array.isArray(val)) {
          return <ApprovedTherapies key={key} data={val} sectionLabel="Novel Approved Therapies" />;
        }
        if (key === 'approved_therapies_legacy' && Array.isArray(val)) {
          return <ApprovedTherapies key={key} data={val} sectionLabel="Legacy Approved Therapies" />;
        }
        if (key === 'approved_therapies' && Array.isArray(val)) {
          return <ApprovedTherapies key={key} data={val} />;
        }
        if (key === 'pipeline_assets' && Array.isArray(val)) {
          return (
            <PipelineAssets key={key} data={val} indicationCode={indicationCode} />
          );
        }
        if (key === 'recent_conference_readouts' && Array.isArray(val)) {
          return <RecentConferenceReadouts key={key} data={val} />;
        }
        if (key.startsWith('efficacy_benchmarks_') && isObj(val)) {
          return <EfficacyBenchmarks key={key} data={val} schemaKey={key} />;
        }
        if (key === 'mechanism_landscape' && Array.isArray(val)) {
          return (
            <MechanismLandscape key={key} data={val} indicationCode={indicationCode} />
          );
        }
        if (key === 'competitive_dynamics' && isObj(val)) {
          return <CompetitiveDynamics key={key} data={val} />;
        }
        if (key === 'unmet_needs' && Array.isArray(val)) {
          return <UnmetNeeds key={key} data={val} />;
        }
        if (key === 'regulatory_landscape' && isObj(val)) {
          return <RegulatoryLandscape key={key} data={val} />;
        }
        if (key === 'preclinical_watchlist' && Array.isArray(val)) {
          return <PreclinicalWatchlist key={key} data={val} />;
        }
        if (key === 'novel_targets' && Array.isArray(val)) {
          return <NovelTargets key={key} data={val} />;
        }

        return (
          <section key={key} className="mb-10">
            <SectionHeader icon={PillIcon} title={key.replace(/_/g, ' ')} />
            <Card>
              <pre className="text-[10px] text-zinc-600 dark:text-zinc-400 overflow-x-auto">
                {JSON.stringify(val, null, 2).slice(0, 600)}
              </pre>
            </Card>
          </section>
        );
      })}

      {meta && (
        <footer className="mt-12 pt-6 border-t border-zinc-200 dark:border-white/10 text-xs text-zinc-400 dark:text-zinc-500">
          ETLM — {meta.indication} ({meta.indication_code}). Redacted preview only.
        </footer>
      )}
    </div>
  );
}

export default ETLMSections;
