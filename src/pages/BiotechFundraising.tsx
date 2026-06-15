import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { RefreshCw, ExternalLink, Archive, ChevronDown, TrendingUp, FlaskConical, Inbox } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import ProjectPageLayout from '../components/ProjectPageLayout';
import { Pill } from '../components/Pill';
import {
  StatCard, StatGrid, EmptyState, SkeletonList, Reveal,
  Toolbar, ToolbarGroup, ToolbarSpacer, SegmentedChips, useChartTheme,
} from '../components/ui';
import { getProjectBySlug, formatYearRange } from '../data/projects';

const API = 'https://biotech-fundraise-tracker-production.up.railway.app';

// ── Types ──────────────────────────────────────────────────────────────────────

interface Deal {
  id: number;
  title: string;
  source: string;
  link: string;
  published: string | null;
  company: string | null;
  round_type: string | null;
  amount_usd_m: number | null;
  amount_text: string | null;
  currency: string | null;
  asset_name: string | null;
  target: string | null;
  indication: string | null;
  therapeutic_area: string | null;
  lead_investor: string | null;
  geography: string | null;
  source_type: string | null;
  summary: string | null;
  created_at: string;
}

interface Signal {
  id: number;
  nct_id: string;
  title: string;
  sponsor: string | null;
  asset_name: string | null;
  target: string | null;
  indication: string | null;
  therapeutic_area: string | null;
  phase: string | null;
  geography: string | null;
  first_posted: string | null;
  summary: string | null;
}

interface Stats {
  total_deals: number;
  deals_30d: number;
  by_round: Record<string, number>;
  top_therapeutic_areas: Record<string, number>;
  by_source: Record<string, number>;
  total_raised_usd_m: number;
  avg_amount_usd_m: number;
  pipeline_signals: number;
}

interface TrendRow {
  month: string;
  round_type: string;
  deal_count: number;
  total_usd_m: number;
}

type MainTab = 'deal-flow' | 'pipeline';

// ── Constants ──────────────────────────────────────────────────────────────────

const ROUND_GROUPS = [
  { id: 'all', label: 'All', types: [] as string[] },
  { id: 'early', label: 'Pre-seed / Seed', types: ['pre-seed', 'seed'] },
  { id: 'series-a', label: 'Series A', types: ['series-a'] },
  { id: 'series-b', label: 'Series B', types: ['series-b'] },
  { id: 'series-c-plus', label: 'Series C+', types: ['series-c', 'series-d', 'series-e', 'series-f', 'series-g'] },
  { id: 'other', label: 'Other', types: ['venture', 'convertible', 'debt', 'grant', 'undisclosed'] },
];

const SOURCE_OPTIONS = [
  { id: 'all', label: 'All sources' },
  { id: 'rss', label: 'News (RSS)' },
  { id: 'form_d', label: 'SEC Form D' },
  { id: 'nih_grant', label: 'NIH Grant' },
];

const SOURCE_BADGE: Record<string, { label: string; cls: string }> = {
  rss:       { label: 'NEWS', cls: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' },
  form_d:    { label: 'FORM D', cls: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' },
  nih_grant: { label: 'NIH GRANT', cls: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300' },
};

const ROUND_COLORS: Record<string, string> = {
  'pre-seed': '#10b981', 'seed': '#34d399', 'series-a': '#3b82f6',
  'series-b': '#8b5cf6', 'series-c': '#a855f7', 'series-d': '#ec4899',
  'venture': '#f59e0b', 'convertible': '#14b8a6', 'debt': '#64748b',
  'grant': '#22c55e', 'undisclosed': '#9ca3af',
};

const ROUND_LABELS: Record<string, string> = {
  'pre-seed': 'Pre-seed', 'seed': 'Seed', 'series-a': 'Series A',
  'series-b': 'Series B', 'series-c': 'Series C', 'series-d': 'Series D',
  'series-e': 'Series E', 'series-f': 'Series F', 'series-g': 'Series G',
  'venture': 'Venture', 'convertible': 'Convertible', 'debt': 'Debt',
  'grant': 'Grant', 'undisclosed': 'Undisclosed',
};

const ROUND_TAG_COLOR: Record<string, string> = {
  'pre-seed': 'emerald', 'seed': 'emerald', 'series-a': 'blue',
  'series-b': 'violet', 'series-c': 'purple', 'series-d': 'red',
  'series-e': 'red', 'series-f': 'red', 'series-g': 'red',
  'venture': 'amber', 'convertible': 'cyan', 'debt': 'zinc',
  'grant': 'green', 'undisclosed': 'zinc',
};

const DAYS_OPTIONS = [
  { label: '30 days', value: 30 },
  { label: '90 days', value: 90 },
  { label: 'All time', value: 365 },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

async function apiFetch(path: string) {
  const res = await fetch(`${API}${path}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function formatPublished(s: string | null): string {
  if (!s) return '';
  const d = new Date(s);
  if (!isNaN(d.getTime())) return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  return s.replace(/[T ]\d{1,2}:\d{2}.*$/, '').trim();
}

function formatAmount(m: number | null): string {
  if (m == null) return '';
  if (m >= 1000) return `$${(m / 1000).toFixed(1)}B`;
  return `$${m % 1 === 0 ? m : m.toFixed(0)}M`;
}

function formatMonthLabel(ym: string): string {
  const [y, m] = ym.split('-');
  return new Date(Number(y), Number(m) - 1).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
}

function pivotTrends(rows: TrendRow[]): Record<string, number | string>[] {
  const byMonth = new Map<string, Record<string, number | string>>();
  for (const row of rows) {
    if (!byMonth.has(row.month)) byMonth.set(row.month, { month: row.month });
    const m = byMonth.get(row.month)!;
    m[row.round_type] = (Number(m[row.round_type] ?? 0)) + row.deal_count;
  }
  return Array.from(byMonth.values()).sort((a, b) => String(a.month).localeCompare(String(b.month)));
}

function allRoundTypesInTrends(rows: TrendRow[]): string[] {
  const seen = new Set(rows.map(r => r.round_type));
  return ['pre-seed', 'seed', 'series-a', 'series-b', 'series-c', 'series-d', 'venture', 'convertible', 'debt', 'grant', 'undisclosed']
    .filter(t => seen.has(t));
}

// ── MultiSelect ────────────────────────────────────────────────────────────────

function MultiSelect({ options, selected, onChange, placeholder }: {
  options: { key: string; label: string }[];
  selected: Set<string>;
  onChange: (next: Set<string>) => void;
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggle = (key: string) => {
    const next = new Set(selected);
    next.has(key) ? next.delete(key) : next.add(key);
    onChange(next);
  };

  const label = selected.size === 0 ? placeholder
    : selected.size === 1 ? (options.find(o => selected.has(o.key))?.label ?? placeholder)
    : `${selected.size} selected`;

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(o => !o)}
        className="text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-2.5 py-1.5 focus:outline-none inline-flex items-center gap-1.5">
        <span>{label}</span>
        <ChevronDown className={`w-3 h-3 opacity-60 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && options.length > 0 && (
        <div className="absolute z-20 mt-1 min-w-[180px] max-h-64 overflow-y-auto rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-lg py-1">
          {selected.size > 0 && (
            <button onClick={() => onChange(new Set())}
              className="w-full text-left px-3 py-1.5 text-xs text-blue-600 dark:text-blue-400 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 border-b border-zinc-100 dark:border-zinc-700 mb-0.5">
              Clear all
            </button>
          )}
          {options.map(o => (
            <label key={o.key} className="flex items-center gap-2 px-3 py-1.5 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 cursor-pointer">
              <input type="checkbox" checked={selected.has(o.key)} onChange={() => toggle(o.key)} className="accent-blue-600" />
              <span>{o.label}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Tag ────────────────────────────────────────────────────────────────────────

function Tag({ label, color = 'zinc' }: { label: string; color?: string }) {
  const cls =
    color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
    : color === 'violet' ? 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300'
    : color === 'purple' ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300'
    : color === 'emerald' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
    : color === 'green' ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300'
    : color === 'amber' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
    : color === 'red' ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'
    : color === 'cyan' ? 'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300'
    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400';
  return <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${cls}`}>{label}</span>;
}

// ── Deal card ─────────────────────────────────────────────────────────────────

function DealCard({ deal }: { deal: Deal }) {
  const isSeed = deal.link?.startsWith('https://seed.');
  const roundColor = ROUND_TAG_COLOR[deal.round_type ?? ''] ?? 'zinc';
  const badge = SOURCE_BADGE[deal.source_type ?? ''];
  const isFormD = deal.source_type === 'form_d';

  return (
    <div className="rounded-2xl ring-1 ring-zinc-200/80 dark:ring-white/10 bg-white/80 dark:bg-zinc-800/80 p-5 space-y-3 hover:ring-zinc-300 dark:hover:ring-white/20 transition-all">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 justify-between">
            <div className="flex-1 min-w-0">
              <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 leading-snug block">
                {deal.company ?? deal.title}
              </span>
              {deal.company && (
                isSeed ? (
                  <span className="text-xs text-zinc-500 dark:text-zinc-500 mt-0.5 block line-clamp-1">{deal.title}</span>
                ) : (
                  <a href={deal.link} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-zinc-500 dark:text-zinc-500 mt-0.5 block line-clamp-1 hover:text-blue-600 dark:hover:text-blue-400">
                    {deal.title}
                  </a>
                )
              )}
            </div>
            <div className="text-right shrink-0">
              {deal.amount_usd_m != null ? (
                <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  {deal.amount_text ?? formatAmount(deal.amount_usd_m)}
                </span>
              ) : (
                <span className="text-sm font-medium text-zinc-400 dark:text-zinc-600">Undisclosed</span>
              )}
              {!isSeed && deal.link && (
                <a href={deal.link} target="_blank" rel="noopener noreferrer"
                  className="block mt-0.5 text-zinc-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors ml-auto w-fit">
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 mt-1 text-xs text-zinc-400 dark:text-zinc-500">
            <span>{deal.source}</span>
            {deal.published && <><span>·</span><span>{formatPublished(deal.published)}</span></>}
          </div>
        </div>
      </div>

      {/* Structured fields — asset / target / indication */}
      <div className="grid grid-cols-1 gap-1 text-xs">
        <FieldRow label="Asset" value={deal.asset_name} />
        <FieldRow label="Target" value={deal.target} />
        <FieldRow label="Indication" value={deal.indication} />
        {isFormD && !deal.asset_name && (
          <p className="text-xs text-zinc-400 dark:text-zinc-500 italic">
            Asset, target and indication not disclosed in SEC Form D filings.
          </p>
        )}
      </div>

      {deal.summary && (
        <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">{deal.summary}</p>
      )}

      {/* Tags row */}
      <div className="flex flex-wrap gap-1.5 items-center">
        {badge && <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded font-bold tracking-wide ${badge.cls}`}>{badge.label}</span>}
        {deal.round_type && <Tag label={ROUND_LABELS[deal.round_type] ?? deal.round_type} color={roundColor} />}
        {deal.therapeutic_area && <Tag label={deal.therapeutic_area} />}
        {deal.geography && <Tag label={deal.geography} />}
      </div>

      {/* Lead investor */}
      <div className="text-xs text-zinc-500 dark:text-zinc-500">
        <span className="font-medium text-zinc-700 dark:text-zinc-300">Lead investor: </span>
        {deal.lead_investor ?? 'Not disclosed'}
      </div>
    </div>
  );
}

function FieldRow({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="flex gap-1.5">
      <span className="font-medium text-zinc-500 dark:text-zinc-400 shrink-0">{label}:</span>
      <span className="text-zinc-700 dark:text-zinc-300">{value}</span>
    </div>
  );
}

// ── Signal card ────────────────────────────────────────────────────────────────

function SignalCard({ signal }: { signal: Signal }) {
  const ctUrl = `https://clinicaltrials.gov/study/${signal.nct_id}`;
  const isSeed = signal.nct_id.startsWith('NCT0SEED');

  return (
    <div className="rounded-2xl ring-1 ring-zinc-200/80 dark:ring-white/10 bg-white/80 dark:bg-zinc-800/80 p-5 space-y-3 hover:ring-zinc-300 dark:hover:ring-white/20 transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] px-1.5 py-0.5 rounded font-bold tracking-wide bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300">
              {signal.phase ?? 'Phase 1'}
            </span>
            {signal.therapeutic_area && <Tag label={signal.therapeutic_area} />}
          </div>
          <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 leading-snug block mt-1.5">
            {signal.sponsor ?? 'Unknown sponsor'}
          </span>
          <div className="flex items-center gap-2 mt-0.5 text-xs text-zinc-400 dark:text-zinc-500">
            {isSeed ? (
              <span>clinicaltrials.gov</span>
            ) : (
              <a href={ctUrl} target="_blank" rel="noopener noreferrer"
                className="hover:text-blue-600 dark:hover:text-blue-400">
                {signal.nct_id}
              </a>
            )}
            {signal.first_posted && <><span>·</span><span>{formatPublished(signal.first_posted)}</span></>}
          </div>
        </div>
        {!isSeed && (
          <a href={ctUrl} target="_blank" rel="noopener noreferrer"
            className="shrink-0 text-zinc-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors">
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </div>

      <div className="grid grid-cols-1 gap-1 text-xs">
        <FieldRow label="Asset" value={signal.asset_name} />
        <FieldRow label="Target" value={signal.target} />
        <FieldRow label="Indication" value={signal.indication} />
        <FieldRow label="Geography" value={signal.geography} />
      </div>

      {signal.summary && (
        <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">{signal.summary}</p>
      )}
    </div>
  );
}

// ── Trends panel ───────────────────────────────────────────────────────────────

function TrendsPanel({ rows }: { rows: TrendRow[] }) {
  const theme = useChartTheme();
  if (!rows.length) return null;
  const chartData = pivotTrends(rows);
  const roundTypes = allRoundTypesInTrends(rows);
  return (
    <div className="rounded-2xl ring-1 ring-zinc-200/80 dark:ring-white/10 bg-white/80 dark:bg-zinc-800/80 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Deal activity by month</h3>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={chartData} margin={{ top: 0, right: 0, left: -24, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} vertical={false} />
          <XAxis dataKey="month" tickFormatter={formatMonthLabel} tick={{ fontSize: 11, fill: theme.axis }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: theme.axis }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip
            contentStyle={theme.tooltip.contentStyle}
            labelStyle={theme.tooltip.labelStyle}
            itemStyle={theme.tooltip.itemStyle}
            cursor={theme.tooltip.cursor}
            formatter={(v: number, name: string) => [v, ROUND_LABELS[name] ?? name]}
            labelFormatter={(l: string) => `Month: ${formatMonthLabel(l)}`}
          />
          <Legend formatter={(v: string) => ROUND_LABELS[v] ?? v} wrapperStyle={{ fontSize: '11px' }} />
          {roundTypes.map(rt => <Bar key={rt} dataKey={rt} stackId="a" fill={ROUND_COLORS[rt] ?? '#9ca3af'} radius={[2, 2, 0, 0]} />)}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Archived v1 ────────────────────────────────────────────────────────────────

function ArchivedV1() {
  return (
    <div className="rounded-2xl ring-1 ring-zinc-200/80 dark:ring-white/10 bg-zinc-50/80 dark:bg-zinc-800/50 p-6 space-y-5">
      <div className="space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-zinc-500 dark:text-zinc-400 px-2 py-0.5 bg-zinc-100 dark:bg-zinc-700 rounded-full">2025–2026</span>
          <Pill variant="tech">Archived</Pill>
          <Pill variant="tech">n8n</Pill>
        </div>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
          The first version was an n8n workflow ingesting FierceBiotech, Labiotech, and Endpoints News RSS feeds daily, applying a GPT-4o-mini classifier to keep only private therapeutic-asset-centric financings, and shipping a weekly CSV to Google Sheets via Gmail.
        </p>
      </div>
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-widest">Technologies (v1)</h3>
        <div className="flex flex-wrap gap-1.5">
          {['n8n', 'RSS', 'GPT-4o-mini', 'Prompt Engineering', 'Google Sheets'].map(t => <Pill key={t} variant="tech">{t}</Pill>)}
        </div>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function BiotechFundraising() {
  const project = getProjectBySlug('biotech-fundraising');

  const [mainTab, setMainTab] = useState<MainTab>('deal-flow');
  const [deals, setDeals] = useState<Deal[]>([]);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [trends, setTrends] = useState<TrendRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [refreshSecsLeft, setRefreshSecsLeft] = useState(0);
  const [showArchive, setShowArchive] = useState(false);

  // Deal flow filters
  const [roundGroup, setRoundGroup] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [taFilters, setTaFilters] = useState<Set<string>>(new Set());
  const [days, setDays] = useState(90);

  // Pipeline filters
  const [sigTaFilters, setSigTaFilters] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!refreshing) return;
    setRefreshSecsLeft(90);
    const t = setInterval(() => setRefreshSecsLeft(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [refreshing]);

  const loadDeals = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ days: String(days), limit: '200' });
      const [dealData, signalData] = await Promise.all([
        apiFetch(`/fundraises?${params}`),
        apiFetch(`/pipeline-signals?${params}`),
      ]);
      setDeals(dealData.deals ?? []);
      setSignals(signalData.signals ?? []);
    } catch {
      setError('Could not load data from the backend.');
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    apiFetch('/stats').then(setStats).catch(() => null);
    apiFetch('/analytics/trends').then(d => setTrends(d?.data ?? [])).catch(() => null);
  }, []);

  useEffect(() => { loadDeals(); }, [loadDeals]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetch(`${API}/refresh`, { method: 'POST' });
      setTimeout(async () => {
        await Promise.all([loadDeals(), apiFetch('/stats').then(setStats).catch(() => null)]);
        setRefreshing(false);
      }, 90000);
    } catch {
      setRefreshing(false);
    }
  };

  const activeRoundTypes = useMemo(() => ROUND_GROUPS.find(g => g.id === roundGroup)?.types ?? [], [roundGroup]);

  const filteredDeals = useMemo(() => deals.filter(d => {
    if (activeRoundTypes.length > 0 && (!d.round_type || !activeRoundTypes.includes(d.round_type))) return false;
    if (sourceFilter !== 'all' && d.source_type !== sourceFilter) return false;
    if (taFilters.size > 0 && (!d.therapeutic_area || !taFilters.has(d.therapeutic_area))) return false;
    return true;
  }), [deals, activeRoundTypes, sourceFilter, taFilters]);

  const filteredSignals = useMemo(() => signals.filter(s => {
    if (sigTaFilters.size > 0 && (!s.therapeutic_area || !sigTaFilters.has(s.therapeutic_area))) return false;
    return true;
  }), [signals, sigTaFilters]);

  const taOptions = useMemo(() => {
    const s = new Set<string>();
    deals.forEach(d => { if (d.therapeutic_area) s.add(d.therapeutic_area); });
    return Array.from(s).sort().map(v => ({ key: v, label: v }));
  }, [deals]);

  const sigTaOptions = useMemo(() => {
    const s = new Set<string>();
    signals.forEach(sig => { if (sig.therapeutic_area) s.add(sig.therapeutic_area); });
    return Array.from(s).sort().map(v => ({ key: v, label: v }));
  }, [signals]);

  const statCards = [
    { value: stats?.by_source?.rss ?? 0, label: 'News (RSS) deals' },
    { value: stats?.by_source?.form_d ?? 0, label: 'SEC Form D filings' },
    { value: stats?.by_source?.nih_grant ?? 0, label: 'NIH SBIR/STTR grants' },
    { value: stats?.pipeline_signals ?? 0, label: 'Phase 1 pipeline signals' },
  ];

  return (
    <ProjectPageLayout title="Biotech Fundraising Tracker" subtitle="Early-stage deal flow · SEC Form D · NIH SBIR/STTR · ClinicalTrials.gov">
      <div className="space-y-8">

        {/* Pills */}
        {project && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-slate-600 dark:text-zinc-400 px-2.5 py-1 bg-slate-100 dark:bg-zinc-800 rounded">
              {formatYearRange(project.yearStart, project.yearEnd)}
            </span>
            <Pill variant={project.status === 'Live' ? 'status-live' : 'tech'}>{project.status}</Pill>
            {project.themes.map(theme => <Pill key={theme} variant="tech">{theme}</Pill>)}
          </div>
        )}

        <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed text-sm">
          A deal sourcing pipeline for biotech VCs, focused on preclinical and early-stage therapeutic companies.
          Three higher-signal sources are ingested daily: <strong className="text-zinc-700 dark:text-zinc-300">SEC EDGAR Form D</strong> — private placements that never appear in the press (seed rounds from university spinouts, stealth companies);
          <strong className="text-zinc-700 dark:text-zinc-300"> NIH SBIR/STTR grants</strong> — Phase I/II grant awards to small companies, with Claude extracting the asset, target, indication, and TA from each abstract;
          and <strong className="text-zinc-700 dark:text-zinc-300">RSS fundraising news</strong> for later-stage disclosed rounds.
          The Pipeline Signals tab tracks new Phase 1 ClinicalTrials.gov registrations from emerging sponsors — the moment a company crosses the preclinical → clinical threshold.
          Lead investor names are not disclosed in Form D filings.
        </p>

        {/* Stats row */}
        <StatGrid cols={4}>
          {statCards.map(s => (
            <StatCard key={s.label} label={s.label} value={typeof s.value === 'number' ? s.value.toLocaleString() : s.value} />
          ))}
        </StatGrid>

        {/* Main tabs */}
        <SegmentedChips<MainTab>
          value={mainTab}
          onChange={setMainTab}
          options={[
            { value: 'deal-flow', label: 'Deal Flow' },
            { value: 'pipeline', label: 'Pipeline Signals' },
          ]}
        />

        {/* ── DEAL FLOW TAB ── */}
        {mainTab === 'deal-flow' && (
          <div className="space-y-6">
            <TrendsPanel rows={trends} />

            {/* Controls */}
            <Toolbar>
              <ToolbarGroup label="Round">
                <SegmentedChips value={roundGroup} onChange={setRoundGroup}
                  options={ROUND_GROUPS.map(g => ({ value: g.id, label: g.label }))} />
              </ToolbarGroup>
              <ToolbarGroup label="Source">
                <SegmentedChips value={sourceFilter} onChange={setSourceFilter}
                  options={SOURCE_OPTIONS.map(o => ({ value: o.id, label: o.label }))} />
              </ToolbarGroup>
              <ToolbarGroup label="Window">
                <SegmentedChips value={days} onChange={setDays}
                  options={DAYS_OPTIONS.map(o => ({ value: o.value, label: o.label }))} />
              </ToolbarGroup>
              {taOptions.length > 0 && (
                <ToolbarGroup label="Area">
                  <MultiSelect options={taOptions} selected={taFilters} onChange={setTaFilters} placeholder="All therapeutic areas" />
                </ToolbarGroup>
              )}
              <ToolbarSpacer />
              <button onClick={handleRefresh} disabled={refreshing}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-w-[8.5rem] whitespace-nowrap">
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? `Refreshing… ${refreshSecsLeft}s` : 'Refresh feed'}
              </button>
            </Toolbar>

            {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}

            {loading ? (
              <SkeletonList count={5} />
            ) : filteredDeals.length === 0 ? (
              <EmptyState
                icon={<Inbox className="h-5 w-5" />}
                title="No deals found"
                hint="Try a different filter or refresh the feed."
              />
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-zinc-400 dark:text-zinc-600">{filteredDeals.length} deals</p>
                {filteredDeals.map(deal => (
                  <Reveal key={deal.id}>
                    <DealCard deal={deal} />
                  </Reveal>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── PIPELINE SIGNALS TAB ── */}
        {mainTab === 'pipeline' && (
          <div className="space-y-6">
            <div className="rounded-2xl ring-1 ring-zinc-200/80 dark:ring-white/10 bg-white/80 dark:bg-zinc-800/80 px-5 py-4">
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                New Phase 1 registrations on ClinicalTrials.gov from emerging sponsors — filtered to exclude large pharma.
                These are companies that have just crossed the preclinical → clinical threshold.
                Each entry represents an IND, not a financing event.
              </p>
            </div>

            <Toolbar>
              {sigTaOptions.length > 0 && (
                <ToolbarGroup label="Area">
                  <MultiSelect options={sigTaOptions} selected={sigTaFilters} onChange={setSigTaFilters} placeholder="All therapeutic areas" />
                </ToolbarGroup>
              )}
              <ToolbarGroup label="Window">
                <SegmentedChips value={days} onChange={setDays}
                  options={DAYS_OPTIONS.map(o => ({ value: o.value, label: o.label }))} />
              </ToolbarGroup>
            </Toolbar>

            {loading ? (
              <SkeletonList count={4} />
            ) : filteredSignals.length === 0 ? (
              <EmptyState
                icon={<FlaskConical className="h-5 w-5" />}
                title="No pipeline signals"
                hint="Try a different therapeutic area or refresh the feed."
              />
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-zinc-400 dark:text-zinc-600">{filteredSignals.length} signals</p>
                {filteredSignals.map(sig => (
                  <Reveal key={sig.id}>
                    <SignalCard signal={sig} />
                  </Reveal>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Technologies */}
        {project && project.tags.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-widest">Technologies</h2>
            <div className="flex flex-wrap gap-1.5">
              {project.tags.map(tag => <Pill key={tag} variant="tech">{tag}</Pill>)}
            </div>
          </div>
        )}

        {/* Archived v1 */}
        {!showArchive ? (
          <button onClick={() => setShowArchive(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors">
            <Archive className="w-4 h-4" />
            View archived version (v1 — n8n workflow)
          </button>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Archived Version — Biotech Fundraising Tracker (v1)</h2>
              <button onClick={() => setShowArchive(false)} className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors">Hide</button>
            </div>
            <ArchivedV1 />
          </div>
        )}
      </div>
    </ProjectPageLayout>
  );
}
