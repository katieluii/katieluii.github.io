import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronUp, ChevronDown, Search, ExternalLink, Database, SearchX } from 'lucide-react';
import { Pill } from '../components/Pill';
import { ProjectLead } from '../components/ProjectLead';
import {
  DataTable,
  type Column,
  SeverityChip,
  severityFromFlag,
  EmptyState,
  StatCard,
  StatGrid,
  Skeleton,
  Rise,
} from '../components/ui';
import { getProjectBySlug, formatYearRange } from '../data/projects';

interface StockRow {
  cik?: string | null;
  fund_name?: string | null;

  filing_date?: string | null;
  period_of_report?: string | null; // "06-30-2024"
  as_of_quarter?: string | null; // "2024Q2"

  form?: string | null;
  accession?: string | null;

  index_url?: string | null;
  primary_doc_url?: string | null;
  infotable_xml_url?: string | null;

  n_stocks?: number | null;
  total_value?: number | null;

  top1_share?: number | null; // 0–1
  top3_share?: number | null; // 0–1
  top10_share?: number | null; // 0–1

  top1_share_pct?: number | null; // already percent number e.g. 5.6
  top3_share_pct?: number | null;
  top10_share_pct?: number | null;

  hhi?: number | null;
  effective_n?: number | null;

  top10_value?: number | null;

  top1_name?: string | null;
  top1_value?: number | null;
  top3_names?: string | null;

  concentration_flag?: string | null;
  flag_reason?: string | null;

  status?: string | null;

  [key: string]: any;
}

interface DataResponse {
  generated_at_utc?: string;
  rows?: StockRow[];
}

const isNum = (v: unknown): v is number =>
  typeof v === 'number' && Number.isFinite(v);

const fmtPct = (v: number | null | undefined, digits = 1) =>
  isNum(v) ? `${v.toFixed(digits)}%` : '—';

const fmtInt = (v: number | null | undefined) =>
  isNum(v) ? `${Math.round(v)}` : '—';

const fmtMoneyShort = (v: number | null | undefined) => {
  if (!isNum(v)) return '—';
  const abs = Math.abs(v);
  if (abs >= 1e12) return `$${(v / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `$${(v / 1e6).toFixed(2)}M`;
  return `$${v.toFixed(0)}`;
};

const median = (nums: number[]) => {
  if (!nums.length) return null;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
};

export function Sec13f() {
  const navigate = useNavigate();
  const project = getProjectBySlug('sec-13f-tracker');

  const [data, setData] = useState<StockRow[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string>('Unknown');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [footnotesOpen, setFootnotesOpen] = useState(false);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      setError(null);

      // Ensure we bypass any caching layer during iteration
      const response = await fetch(
        `/data/stock_conc_latest.json?ts=${Date.now()}`
      );
      if (!response.ok)
        throw new Error(`Failed to fetch data (${response.status})`);

      const json = (await response.json()) as DataResponse;

      setData(Array.isArray(json.rows) ? json.rows : []);
      setLastUpdated(json.generated_at_utc || 'Unknown');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  const filteredData = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return data;

    return data.filter((row) => {
      const fundName = String(row.fund_name ?? '').toLowerCase();
      const cik = String(row.cik ?? '').toLowerCase();
      const top1 = String(row.top1_name ?? '').toLowerCase();
      return fundName.includes(q) || cik.includes(q) || top1.includes(q);
    });
  }, [data, searchTerm]);

  const stats = useMemo(() => {
    const quarters = data.map((r) => r.as_of_quarter).filter(Boolean) as string[];
    const latestQuarter = quarters.length ? [...quarters].sort().reverse()[0] : '—';
    const medHhi = median(data.map((r) => r.hhi).filter(isNum) as number[]);
    return { funds: data.length, latestQuarter, medHhi };
  }, [data]);

  const columns: Column<StockRow>[] = [
    {
      key: 'fund_name',
      header: 'Fund',
      sortable: true,
      primary: true,
      render: (r) => (
        <span className="font-semibold text-zinc-900 dark:text-zinc-100">{r.fund_name ?? '—'}</span>
      ),
    },
    { key: 'as_of_quarter', header: 'Quarter', sortable: true, hideBelowLg: true, render: (r) => r.as_of_quarter ?? '—' },
    { key: 'n_stocks', header: 'Stocks', numeric: true, sortable: true, render: (r) => fmtInt(r.n_stocks) },
    { key: 'top1_share_pct', header: 'Largest %', numeric: true, sortable: true, render: (r) => fmtPct(r.top1_share_pct) },
    { key: 'top3_share_pct', header: 'Top 3 %', numeric: true, sortable: true, hideBelowLg: true, render: (r) => fmtPct(r.top3_share_pct) },
    { key: 'hhi', header: 'HHI', numeric: true, sortable: true, render: (r) => (isNum(r.hhi) ? r.hhi.toFixed(4) : '—') },
    {
      key: 'concentration_flag',
      header: 'Conc.',
      align: 'center',
      sortable: true,
      render: (r) =>
        r.concentration_flag ? (
          <SeverityChip severity={severityFromFlag(r.concentration_flag)}>{r.concentration_flag}</SeverityChip>
        ) : (
          '—'
        ),
    },
    { key: 'top1_name', header: 'Top holding', hideBelowLg: true, render: (r) => r.top1_name ?? '—' },
    { key: 'total_value', header: 'Total Value', numeric: true, sortable: true, render: (r) => fmtMoneyShort(r.total_value) },
    {
      key: 'links',
      header: 'Links',
      render: (r) =>
        r.index_url ? (
          <a
            className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
            href={r.index_url}
            target="_blank"
            rel="noreferrer"
          >
            Index <ExternalLink className="h-3 w-3" />
          </a>
        ) : (
          <span className="text-zinc-400 dark:text-zinc-500">—</span>
        ),
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-[#0b0f14]">
      <header className="bg-white dark:bg-[#0b0f14] border-b border-slate-200 dark:border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button
            onClick={() => navigate('/')}
            className="text-sm font-medium text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 mb-4 transition-colors"
          >
            ← Back to home
          </button>

          <div className="flex items-start justify-between gap-4">
            <div>
              <Rise as="h1" index={0} className="text-3xl font-bold text-slate-900 dark:text-zinc-100">
                SEC 13F Fund Analysis
              </Rise>
              <Rise as="p" index={1} className="mt-2 text-sm text-slate-600 dark:text-zinc-400">
                Source: SEC EDGAR 13F-HR filings
              </Rise>
            </div>

            <button
              onClick={fetchData}
              className="shrink-0 inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 text-sm text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-white/10 transition-colors"
              title="Refresh data"
            >
              Refresh
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {project && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-slate-600 dark:text-zinc-400 px-2.5 py-1 bg-slate-100 dark:bg-zinc-800 rounded">
              {formatYearRange(project.yearStart, project.yearEnd)}
            </span>
            <Pill variant={project.status === 'Live' ? 'status-live' : project.status === 'WIP' ? 'status-wip' : 'tech'}>
              {project.status}
            </Pill>
            {project.themes.map(theme => (
              <Pill key={theme} variant="tech">{theme}</Pill>
            ))}
          </div>
        )}

        <div className="space-y-3">
          <ProjectLead headline="Turn raw 13F filings into a fund's real exposures — ranked and comparable.">
            <p>
              A live SEC 13F Fund Analysis dashboard that pulls the latest filing
              per fund from the SEC EDGAR database and converts raw holdings into
              a fast, searchable, and comparable view of each fund's
              diversification and top exposures.
            </p>
            <p>
              Toggle to rank funds by various parameters, including by
              concentration metrics (Largest holding %, Top 3 holdings %, and
              HHI), and RAG tags for flagging concentration risk — useful for
              quickly spotting hidden single-name exposure, crowding, investment
              research, risk monitoring, and strategic fund profiling.
            </p>
          </ProjectLead>
          <p className="text-sm text-slate-500 dark:text-zinc-400">
            What should I build next? Send in your thoughts via email.
          </p>
        </div>

        <div className="rounded-xl ring-1 ring-zinc-200/80 dark:ring-white/10 bg-zinc-50 dark:bg-zinc-800/60 overflow-hidden">
          <button
            onClick={() => setFootnotesOpen(!footnotesOpen)}
            className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
          >
            <span>Notes</span>
            {footnotesOpen ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>

          {footnotesOpen && (
            <div className="px-4 pb-3 pt-2.5 border-t border-zinc-200/60 dark:border-white/5 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              <ol className="list-decimal list-inside space-y-2.5">
                <li>
                  <span className="font-medium">Weights:</span> Each holding's
                  share of the fund's total reported 13F value.{' '}
                  <code className="bg-zinc-100 dark:bg-zinc-700 px-1.5 py-0.5 rounded">
                    w<sub>i</sub> = value<sub>i</sub> / Σvalue<sub>j</sub>
                  </code>
                </li>
                <li>
                  <span className="font-medium">Largest holding (%):</span>{' '}
                  Share of the portfolio in the single largest position.{' '}
                  <code className="bg-zinc-100 dark:bg-zinc-700 px-1.5 py-0.5 rounded">
                    100 × max(w<sub>i</sub>)
                  </code>
                </li>
                <li>
                  <span className="font-medium">Top 3 holdings (%):</span>{' '}
                  Combined share of the three largest positions.{' '}
                  <code className="bg-zinc-100 dark:bg-zinc-700 px-1.5 py-0.5 rounded">
                    100 × Σ<sub>k=1..3</sub> w<sub>(k)</sub>
                  </code>{' '}
                  where{' '}
                  <code className="bg-zinc-100 dark:bg-zinc-700 px-1.5 py-0.5 rounded">
                    w<sub>(k)</sub>
                  </code>{' '}
                  are the three largest weights
                </li>
                <li>
                  <span className="font-medium">HHI:</span>{' '}
                  Herfindahl–Hirschman Index, sum of squared weights; higher =
                  more concentrated.{' '}
                  <code className="bg-zinc-100 dark:bg-zinc-700 px-1.5 py-0.5 rounded">
                    Σw<sub>i</sub><sup>2</sup>
                  </code>
                </li>
              </ol>
              <p className="mt-2.5 text-zinc-400 dark:text-zinc-500">
                Metrics are computed from the latest available 13F filing and
                reflect disclosed long holdings only (not shorts, derivatives,
                or non-13F assets).
              </p>
            </div>
          )}
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="space-y-6">
            <StatGrid cols={3}>
              <Skeleton className="h-[5.5rem]" />
              <Skeleton className="h-[5.5rem]" />
              <Skeleton className="h-[5.5rem]" />
            </StatGrid>
            <Skeleton className="h-10 w-full max-w-md" />
            <Skeleton className="h-80 w-full rounded-2xl" />
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-300">
            Error loading data: {error}
          </div>
        ) : (
          <div className="space-y-6">
            <StatGrid cols={3}>
              <StatCard label="Funds tracked" value={stats.funds.toLocaleString()} icon={<Database className="h-3.5 w-3.5" />} hint="latest filing per fund" />
              <StatCard label="Latest quarter" value={stats.latestQuarter} hint="most recent filing window" />
              <StatCard label="Median HHI" value={isNum(stats.medHhi) ? stats.medHhi.toFixed(3) : '—'} hint="concentration index" />
            </StatGrid>

            <div className="text-sm text-slate-600 dark:text-zinc-400">
              Last updated (UTC):{' '}
              <span className="font-semibold text-slate-900 dark:text-zinc-100">
                {lastUpdated}
              </span>
            </div>

            <div className="relative max-w-md">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400 dark:text-zinc-500" />
              <input
                type="text"
                placeholder="Search by fund name, CIK, or top holding..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 dark:focus:border-indigo-500 text-sm bg-white dark:bg-white/5 text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 transition-shadow"
              />
            </div>

            {filteredData.length === 0 ? (
              <EmptyState
                icon={<SearchX className="h-5 w-5" />}
                title="No funds match your search"
                hint="Try a different fund name, CIK, or top-holding ticker."
              />
            ) : (
              <DataTable
                columns={columns}
                rows={filteredData}
                rowKey={(r, i) => `${r.cik ?? 'cik'}-${i}`}
                defaultSort={{ key: 'n_stocks', order: 'desc' }}
              />
            )}

            <div className="text-xs text-slate-500 dark:text-zinc-400">
              Showing {filteredData.length} of {data.length} funds
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-slate-200 dark:border-white/10 bg-white dark:bg-[#0b0f14] mt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
          <p className="text-sm text-slate-500 dark:text-zinc-400">
            © 2026 Katie Lui. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
