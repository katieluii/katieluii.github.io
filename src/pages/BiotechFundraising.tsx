import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  RefreshCw, ExternalLink, Archive, ChevronDown, TrendingUp,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import ProjectPageLayout from '../components/ProjectPageLayout';
import { Pill } from '../components/Pill';
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
  therapeutic_area: string | null;
  lead_investor: string | null;
  summary: string | null;
  created_at: string;
}

interface Stats {
  total_deals: number;
  deals_30d: number;
  by_round: Record<string, number>;
  top_therapeutic_areas: Record<string, number>;
  total_raised_usd_m: number;
  avg_amount_usd_m: number;
}

interface TrendRow {
  month: string;
  round_type: string;
  deal_count: number;
  total_usd_m: number;
}

// ── Constants ──────────────────────────────────────────────────────────────────

const ROUND_GROUPS: { id: string; label: string; types: string[] }[] = [
  { id: 'all', label: 'All', types: [] },
  { id: 'early', label: 'Pre-seed / Seed', types: ['pre-seed', 'seed'] },
  { id: 'series-a', label: 'Series A', types: ['series-a'] },
  { id: 'series-b', label: 'Series B', types: ['series-b'] },
  { id: 'series-c-plus', label: 'Series C+', types: ['series-c', 'series-d', 'series-e', 'series-f', 'series-g'] },
  { id: 'other', label: 'Other', types: ['venture', 'convertible', 'debt', 'grant', 'undisclosed'] },
];

const ROUND_COLORS: Record<string, string> = {
  'pre-seed': '#10b981',
  'seed': '#34d399',
  'series-a': '#3b82f6',
  'series-b': '#8b5cf6',
  'series-c': '#a855f7',
  'series-d': '#ec4899',
  'series-e': '#f43f5e',
  'series-f': '#f43f5e',
  'series-g': '#f43f5e',
  'venture': '#f59e0b',
  'convertible': '#14b8a6',
  'debt': '#64748b',
  'grant': '#22c55e',
  'undisclosed': '#9ca3af',
};

const ROUND_LABELS: Record<string, string> = {
  'pre-seed': 'Pre-seed',
  'seed': 'Seed',
  'series-a': 'Series A',
  'series-b': 'Series B',
  'series-c': 'Series C',
  'series-d': 'Series D',
  'series-e': 'Series E',
  'series-f': 'Series F',
  'series-g': 'Series G',
  'venture': 'Venture',
  'convertible': 'Convertible',
  'debt': 'Debt',
  'grant': 'Grant',
  'undisclosed': 'Undisclosed',
};

const ROUND_TAG_COLOR: Record<string, string> = {
  'pre-seed': 'emerald',
  'seed': 'emerald',
  'series-a': 'blue',
  'series-b': 'violet',
  'series-c': 'purple',
  'series-d': 'red',
  'series-e': 'red',
  'series-f': 'red',
  'series-g': 'red',
  'venture': 'amber',
  'convertible': 'cyan',
  'debt': 'zinc',
  'grant': 'green',
  'undisclosed': 'zinc',
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
  if (!isNaN(d.getTime())) {
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  return s.replace(/[T ]\d{1,2}:\d{2}.*$/, '').trim();
}

function formatAmount(m: number | null): string {
  if (m == null) return '';
  if (m >= 1000) return `$${(m / 1000).toFixed(1)}B`;
  return `$${m % 1 === 0 ? m : m.toFixed(0)}M`;
}

function formatMonthLabel(ym: string): string {
  const [y, m] = ym.split('-');
  const d = new Date(Number(y), Number(m) - 1);
  return d.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
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
  const seen = new Set<string>();
  rows.forEach(r => seen.add(r.round_type));
  const order = ['pre-seed', 'seed', 'series-a', 'series-b', 'series-c', 'series-d', 'series-e', 'venture', 'convertible', 'debt', 'grant', 'undisclosed'];
  return order.filter(t => seen.has(t));
}

// ── MultiSelect ────────────────────────────────────────────────────────────────

function MultiSelect({
  options,
  selected,
  onChange,
  placeholder,
}: {
  options: { key: string; label: string }[];
  selected: Set<string>;
  onChange: (next: Set<string>) => void;
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const toggle = (key: string) => {
    const next = new Set(selected);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    onChange(next);
  };

  const buttonLabel =
    selected.size === 0
      ? placeholder
      : selected.size === 1
      ? (options.find(o => selected.has(o.key))?.label ?? placeholder)
      : `${selected.size} selected`;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 inline-flex items-center gap-1.5"
      >
        <span>{buttonLabel}</span>
        <ChevronDown className={`w-3 h-3 opacity-60 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && options.length > 0 && (
        <div className="absolute z-20 mt-1 min-w-[180px] max-h-64 overflow-y-auto rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-lg py-1">
          {selected.size > 0 && (
            <button
              onClick={() => onChange(new Set())}
              className="w-full text-left px-3 py-1.5 text-xs text-blue-600 dark:text-blue-400 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 border-b border-zinc-100 dark:border-zinc-700 mb-0.5"
            >
              Clear all
            </button>
          )}
          {options.map(o => (
            <label
              key={o.key}
              className="flex items-center gap-2 px-3 py-1.5 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selected.has(o.key)}
                onChange={() => toggle(o.key)}
                className="accent-blue-600"
              />
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
  return (
    <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${cls}`}>
      {label}
    </span>
  );
}

// ── Deal card ─────────────────────────────────────────────────────────────────

function DealCard({ deal }: { deal: Deal }) {
  const isSeed = deal.link?.startsWith('https://seed.');
  const roundColor = ROUND_TAG_COLOR[deal.round_type ?? ''] ?? 'zinc';

  return (
    <div className="rounded-2xl ring-1 ring-zinc-200/80 dark:ring-white/10 bg-white/80 dark:bg-zinc-800/80 p-5 space-y-3 hover:ring-zinc-300 dark:hover:ring-white/20 transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 leading-snug block">
                {deal.company ?? deal.title}
              </span>
              {deal.company && (
                isSeed ? (
                  <span className="text-xs text-zinc-500 dark:text-zinc-500 mt-0.5 block line-clamp-1">{deal.title}</span>
                ) : (
                  <a
                    href={deal.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-zinc-500 dark:text-zinc-500 mt-0.5 block line-clamp-1 hover:text-blue-600 dark:hover:text-blue-400"
                  >
                    {deal.title}
                  </a>
                )
              )}
            </div>
            <div className="text-right shrink-0">
              {deal.amount_usd_m != null && (
                <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  {deal.amount_text ?? formatAmount(deal.amount_usd_m)}
                </span>
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

      {deal.summary && (
        <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">{deal.summary}</p>
      )}

      <div className="flex flex-wrap gap-1.5">
        {deal.round_type && (
          <Tag label={ROUND_LABELS[deal.round_type] ?? deal.round_type} color={roundColor} />
        )}
        {deal.therapeutic_area && <Tag label={deal.therapeutic_area} />}
      </div>

      {deal.lead_investor && (
        <div className="text-xs text-zinc-500 dark:text-zinc-500">
          <span className="font-medium text-zinc-700 dark:text-zinc-300">Lead investor: </span>
          {deal.lead_investor}
        </div>
      )}
    </div>
  );
}

// ── Trends panel ───────────────────────────────────────────────────────────────

function TrendsPanel({ rows }: { rows: TrendRow[] }) {
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
          <XAxis
            dataKey="month"
            tickFormatter={formatMonthLabel}
            tick={{ fontSize: 11, fill: 'currentColor' }}
            className="text-zinc-400 dark:text-zinc-500"
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: 'currentColor' }}
            className="text-zinc-400 dark:text-zinc-500"
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--tooltip-bg, #fff)',
              border: '1px solid var(--tooltip-border, #e4e4e7)',
              borderRadius: '8px',
              fontSize: '12px',
            }}
            formatter={(value: number, name: string) => [value, ROUND_LABELS[name] ?? name]}
            labelFormatter={(label: string) => `Month: ${formatMonthLabel(label)}`}
          />
          <Legend
            formatter={(value: string) => ROUND_LABELS[value] ?? value}
            wrapperStyle={{ fontSize: '11px' }}
          />
          {roundTypes.map(rt => (
            <Bar key={rt} dataKey={rt} stackId="a" fill={ROUND_COLORS[rt] ?? '#9ca3af'} />
          ))}
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
          <span className="text-xs text-zinc-500 dark:text-zinc-400 px-2 py-0.5 bg-zinc-100 dark:bg-zinc-700 rounded-full">
            2025–2026
          </span>
          <Pill variant="tech">Archived</Pill>
          <Pill variant="tech">AI/ML &amp; Automation</Pill>
          <Pill variant="tech">Investing</Pill>
        </div>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
          The first version was an n8n workflow that turned daily biopharma RSS headlines into a continuously
          updated financing ledger — captured into a Google Sheet and shipped weekly as an Excel CSV.
          It ingested daily headlines from FierceBiotech, Labiotech, and Endpoints News, applied an early
          keyword filter, then ran a strict LLM classifier (GPT-4o-mini) to keep only private,
          therapeutic-asset-centric financings. For kept items, it extracted structured fields (company,
          round normalization, amount text + USD estimate, currency, published date) and logged both kept
          and rejected entries with explicit reasons. A final validation/dedupe step appended to Sheets;
          a weekly job pulled the last 7 days, generated a CSV attachment, and emailed it via Gmail.
        </p>
      </div>

      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-widest">Architecture (v1)</h3>
        <ul className="space-y-1.5">
          {[
            "Daily RSS ingestion from FierceBiotech, Labiotech, and Endpoints News",
            "Persistent dedupe key (link + date + title) to keep only new entries",
            "Keyword pre-filter to drop non-fundraising items early",
            "LLM classifier (GPT-4o-mini) keeps only private, therapeutic-asset-centric financings",
            "Explicit rejection of public offerings, M&A, platform/tooling raises — with logged reasons",
            "Structured extraction: company, round normalization, amount text + USD estimate, currency",
            "Validation + dedupe pass flattens results before appending to staging Google Sheet",
            "Weekly job filters last 7 days, generates CSV, and emails via Gmail",
          ].map((b, i) => (
            <li key={i} className="flex gap-2 text-xs text-zinc-600 dark:text-zinc-400">
              <span className="text-zinc-300 dark:text-zinc-600 shrink-0">·</span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-widest">Technologies (v1)</h3>
        <div className="flex flex-wrap gap-1.5">
          {['n8n', 'RSS', 'LLM Classification', 'Prompt Engineering', 'Google Sheets'].map(t => (
            <Pill key={t} variant="tech">{t}</Pill>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function BiotechFundraising() {
  const project = getProjectBySlug('biotech-fundraising');

  const [deals, setDeals] = useState<Deal[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [trends, setTrends] = useState<TrendRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [refreshSecsLeft, setRefreshSecsLeft] = useState(0);
  const [showArchive, setShowArchive] = useState(false);
  const [roundGroup, setRoundGroup] = useState('all');
  const [taFilters, setTaFilters] = useState<Set<string>>(new Set());
  const [days, setDays] = useState(90);

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
      const data = await apiFetch(`/fundraises?${params}`);
      setDeals(data.deals ?? []);
    } catch {
      setError('Could not load deals from the backend.');
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    apiFetch('/stats').then(setStats).catch(() => null);
    apiFetch('/analytics/trends').then(d => setTrends(d?.data ?? [])).catch(() => null);
  }, []);

  useEffect(() => {
    loadDeals();
  }, [loadDeals]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetch(`${API}/refresh`, { method: 'POST' });
      setTimeout(async () => {
        await Promise.all([
          loadDeals(),
          apiFetch('/stats').then(setStats).catch(() => null),
        ]);
        setRefreshing(false);
      }, 90000);
    } catch {
      setRefreshing(false);
    }
  };

  const taOptions = useMemo(() => {
    const s = new Set<string>();
    deals.forEach(d => { if (d.therapeutic_area) s.add(d.therapeutic_area); });
    return Array.from(s).sort().map(v => ({ key: v, label: v }));
  }, [deals]);

  const activeRoundTypes = useMemo(() => {
    const group = ROUND_GROUPS.find(g => g.id === roundGroup);
    return group ? group.types : [];
  }, [roundGroup]);

  const filteredDeals = useMemo(() => {
    return deals.filter(d => {
      if (activeRoundTypes.length > 0) {
        if (!d.round_type || !activeRoundTypes.includes(d.round_type)) return false;
      }
      if (taFilters.size > 0) {
        if (!d.therapeutic_area || !taFilters.has(d.therapeutic_area)) return false;
      }
      return true;
    });
  }, [deals, activeRoundTypes, taFilters]);

  const deals30d = useMemo(() => {
    const cutoff = Date.now() - 30 * 86400000;
    return deals.filter(d => {
      if (!d.published) return false;
      const t = new Date(d.published).getTime();
      return !isNaN(t) && t >= cutoff;
    }).length;
  }, [deals]);

  const totalRaised30d = useMemo(() => {
    const cutoff = Date.now() - 30 * 86400000;
    return deals
      .filter(d => {
        if (!d.published || d.amount_usd_m == null) return false;
        const t = new Date(d.published).getTime();
        return !isNaN(t) && t >= cutoff;
      })
      .reduce((s, d) => s + (d.amount_usd_m ?? 0), 0);
  }, [deals]);

  const statCards = [
    { value: deals30d, label: 'Private rounds captured (30d)' },
    { value: totalRaised30d > 0 ? `$${totalRaised30d >= 1000 ? (totalRaised30d / 1000).toFixed(1) + 'B' : totalRaised30d + 'M'}` : '—', label: 'Total raised (30d, disclosed)' },
    { value: stats?.avg_amount_usd_m ? formatAmount(stats.avg_amount_usd_m) : '—', label: 'Avg round size (all time)' },
  ];

  return (
    <ProjectPageLayout title="Biotech Fundraising Tracker" subtitle="Daily RSS digest · private biotech financing rounds">
      <div className="space-y-8">

        {/* Pills */}
        {project && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-slate-600 dark:text-zinc-400 px-2.5 py-1 bg-slate-100 dark:bg-zinc-800 rounded">
              {formatYearRange(project.yearStart, project.yearEnd)}
            </span>
            <Pill variant={project.status === 'Live' ? 'status-live' : 'tech'}>
              {project.status}
            </Pill>
            {project.themes.map(theme => (
              <Pill key={theme} variant="tech">{theme}</Pill>
            ))}
          </div>
        )}

        <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed text-sm">
          I built this tool to continuously track private biotech fundraising rounds from five daily RSS sources
          — FierceBiotech, FiercePharma, Labiotech, Endpoints News, and BioPharma Dive. Claude Haiku runs a strict
          inclusion filter to keep only private, therapeutic-asset-centric financings: pre-seed through Series G,
          venture rounds, convertible notes, debt financing, and NIH/BARDA grants — explicitly excluding
          public-market transactions (IPOs, shelf offerings), M&A deals, and platform-only raises without a
          drug or biologic asset in development. Each deal is tagged with therapeutic area, round type, disclosed
          amount (normalised to USD), lead investor, and a one-sentence summary.
        </p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {statCards.map(s => (
            <div key={s.label} className="rounded-2xl ring-1 ring-zinc-200/80 dark:ring-white/10 bg-white/80 dark:bg-zinc-800/80 px-4 py-3 text-center">
              <div className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{s.value}</div>
              <div className="text-xs text-zinc-500 dark:text-zinc-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Trends chart */}
        <TrendsPanel rows={trends} />

        {/* Controls */}
        <div className="space-y-3">
          {/* Row 1: Round tabs + refresh */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex gap-1 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex-wrap">
              {ROUND_GROUPS.map(g => (
                <button
                  key={g.id}
                  onClick={() => setRoundGroup(g.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    roundGroup === g.id
                      ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm'
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-w-[8.5rem] whitespace-nowrap"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? `Refreshing… ${refreshSecsLeft}s` : 'Refresh feed'}
            </button>
          </div>

          {/* Row 2: TA filter + days toggle */}
          <div className="flex flex-wrap gap-3 items-center">
            {taOptions.length > 0 && (
              <MultiSelect
                options={taOptions}
                selected={taFilters}
                onChange={setTaFilters}
                placeholder="All therapeutic areas"
              />
            )}
            <div className="flex gap-1 p-1 rounded-lg bg-zinc-100 dark:bg-zinc-800">
              {DAYS_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setDays(opt.value)}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                    days === opt.value
                      ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm'
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Deal feed */}
        {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}

        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="rounded-2xl ring-1 ring-zinc-200/80 dark:ring-white/10 bg-white/80 dark:bg-zinc-800/80 p-5 h-28 animate-pulse" />
            ))}
          </div>
        ) : filteredDeals.length === 0 ? (
          <div className="rounded-2xl ring-1 ring-zinc-200/80 dark:ring-white/10 bg-white/80 dark:bg-zinc-800/80 p-10 text-center">
            <p className="text-sm text-zinc-500 dark:text-zinc-500">No deals found — try a different filter or refresh the feed.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-zinc-400 dark:text-zinc-600">{filteredDeals.length} deals</p>
            {filteredDeals.map(deal => (
              <DealCard key={deal.id} deal={deal} />
            ))}
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

        {/* Archived version */}
        {!showArchive ? (
          <button
            onClick={() => setShowArchive(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors"
          >
            <Archive className="w-4 h-4" />
            View archived version (v1 — n8n workflow)
          </button>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Archived Version — Biotech Fundraising Tracker (v1)</h2>
              <button
                onClick={() => setShowArchive(false)}
                className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
              >
                Hide
              </button>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              The first version used an n8n workflow for daily RSS ingestion, LLM classification, and weekly CSV email delivery.
              It was replaced by the current Python/FastAPI app with a live web UI.
            </p>
            <ArchivedV1 />
          </div>
        )}
      </div>
    </ProjectPageLayout>
  );
}
