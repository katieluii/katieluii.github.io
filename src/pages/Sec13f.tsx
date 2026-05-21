import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronUp,
  ChevronDown,
  Search,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { Pill } from '../components/Pill';
import { getProjectBySlug, formatYearRange } from '../data/projects';

type SortOrder = 'asc' | 'desc';

type SortColumn =
  | 'fund_name'
  | 'cik'
  | 'as_of_quarter'
  | 'n_stocks'
  | 'top1_share_pct'
  | 'top3_share_pct'
  | 'hhi'
  | 'effective_n'
  | 'concentration_flag'
  | 'total_value'
  | null;

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

const fmtNum = (v: number | null | undefined, digits = 1) =>
  isNum(v) ? v.toFixed(digits) : '—';

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

function badgeClasses(flag?: string | null) {
  const f = (flag || '').toLowerCase();
  if (f === 'high') return 'bg-red-100 text-red-700';
  if (f === 'medium') return 'bg-amber-100 text-amber-700';
  if (f === 'low') return 'bg-emerald-100 text-emerald-700';
  return 'bg-slate-100 text-slate-700';
}

export function Sec13f() {
  const navigate = useNavigate();
  const project = getProjectBySlug('sec-13f-tracker');

  const [data, setData] = useState<StockRow[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string>('Unknown');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<SortColumn>('n_stocks');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
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

  const sortedData = useMemo(() => {
    const rows = [...filteredData];
    if (!sortColumn) return rows;

    rows.sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];

      // numbers
      if (isNum(aVal) && isNum(bVal)) {
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      }

      // treat null/undefined as empty
      const aStr = String(aVal ?? '').toLowerCase();
      const bStr = String(bVal ?? '').toLowerCase();

      return sortOrder === 'asc'
        ? aStr.localeCompare(bStr)
        : bStr.localeCompare(aStr);
    });

    return rows;
  }, [filteredData, sortColumn, sortOrder]);

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortOrder('desc');
    }
  };

  const SortHeader = ({
    label,
    column,
  }: {
    label: string;
    column: Exclude<SortColumn, null>;
  }) => (
    <button
      type="button"
      onClick={() => handleSort(column)}
      className="flex items-center gap-1 font-semibold hover:text-slate-700 transition-colors"
    >
      {label}
      {sortColumn === column &&
        (sortOrder === 'asc' ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        ))}
    </button>
  );

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
              <h1 className="text-3xl font-bold text-slate-900 dark:text-zinc-100">
                SEC 13F Fund Analysis
              </h1>
              <p className="mt-2 text-sm text-slate-600 dark:text-zinc-400">
                Source: SEC EDGAR 13F-HR filings
              </p>
            </div>

            <button
              onClick={fetchData}
              className="shrink-0 inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 text-sm text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-white/10"
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
          <p className="text-slate-700 dark:text-zinc-300 leading-relaxed">
            A live SEC 13F Fund Analysis dashboard that pulls the latest filing
            per fund from the SEC EDGAR database and converts raw holdings into
            a fast, searchable, and comparable view of each fund's
            diversification and top exposures.
          </p>
          <p className="text-slate-700 dark:text-zinc-300 leading-relaxed">
            Toggle to rank funds by various parameters, including by
            concentration metrics (Largest holding %, Top 3 holdings %, and
            HHI), and RAG tags for flagging concentration risk — useful for
            quickly spotting hidden single-name exposure, crowding, investment
            research, risk monitoring, and strategic fund profiling.
          </p>
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
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-300">
            Error loading data: {error}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-sm text-slate-600 dark:text-zinc-400">
              Last updated (UTC):{' '}
              <span className="font-semibold text-slate-900 dark:text-zinc-100">
                {lastUpdated}
              </span>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400 dark:text-zinc-500" />
              <input
                type="text"
                placeholder="Search by fund name, CIK, or top holding..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-white/10 rounded-lg focus:outline-none focus:border-slate-400 dark:focus:border-zinc-500 text-sm bg-white dark:bg-white/5 text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500"
              />
            </div>

            {sortedData.length === 0 ? (
              <div className="text-center py-12 text-slate-500 dark:text-zinc-400">
                No data found
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 dark:border-white/10 rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10">
                    <tr>
                      <th className="px-4 py-3 text-left text-slate-700 dark:text-zinc-300">
                        <SortHeader label="Fund Name" column="fund_name" />
                      </th>
                      <th className="px-4 py-3 text-left text-slate-700 dark:text-zinc-300">
                        <SortHeader label="Quarter" column="as_of_quarter" />
                      </th>

                      <th className="px-4 py-3 text-right text-slate-700 dark:text-zinc-300">
                        <SortHeader label="Stocks" column="n_stocks" />
                      </th>

                      <th className="px-4 py-3 text-right text-slate-700 dark:text-zinc-300">
                        <SortHeader
                          label="Largest holding %"
                          column="top1_share_pct"
                        />
                      </th>
                      <th className="px-4 py-3 text-right text-slate-700 dark:text-zinc-300">
                        <SortHeader label="Top 3 %" column="top3_share_pct" />
                      </th>

                      <th className="px-4 py-3 text-right text-slate-700 dark:text-zinc-300">
                        <SortHeader label="HHI" column="hhi" />
                      </th>

                      <th className="px-4 py-3 text-center text-slate-700 dark:text-zinc-300">
                        <SortHeader label="Conc." column="concentration_flag" />
                      </th>

                      <th className="px-4 py-3 text-left text-slate-700 dark:text-zinc-300">
                        Top1 Holding
                      </th>
                      <th className="px-4 py-3 text-right text-slate-700 dark:text-zinc-300">
                        <SortHeader label="Total Value" column="total_value" />
                      </th>
                      <th className="px-4 py-3 text-left text-slate-700 dark:text-zinc-300">
                        Links
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {sortedData.map((row, idx) => (
                      <tr
                        key={`${row.cik ?? 'cik'}-${idx}`}
                        className="border-b border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                      >
                        <td className="px-4 py-3 font-medium text-slate-900 dark:text-zinc-100">
                          {row.fund_name ?? '—'}
                        </td>

                        <td className="px-4 py-3 text-slate-600 dark:text-zinc-400">
                          {row.as_of_quarter ?? '—'}
                        </td>

                        <td
                          className="px-4 py-3 text-right
                         text-slate-900 dark:text-zinc-100"
                        >
                          {fmtInt(row.n_stocks)}
                        </td>

                        <td className="px-4 py-3 text-right text-slate-900 dark:text-zinc-100">
                          {fmtPct(row.top1_share_pct)}
                        </td>

                        <td className="px-4 py-3 text-right text-slate-600 dark:text-zinc-400">
                          {fmtPct(row.top3_share_pct)}
                        </td>

                        <td className="px-4 py-3 text-right text-slate-900 dark:text-zinc-100">
                          {isNum(row.hhi) ? row.hhi.toFixed(4) : '—'}
                        </td>

                        <td className="px-4 py-3 text-center">
                          {row.concentration_flag ? (
                            <span
                              className={`px-2 py-1 text-xs font-semibold rounded ${badgeClasses(
                                row.concentration_flag
                              )}`}
                            >
                              {row.concentration_flag}
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>

                        <td className="px-4 py-3 text-slate-600 dark:text-zinc-400 text-xs">
                          {row.top1_name ?? '—'}
                        </td>

                        <td className="px-4 py-3 text-right text-slate-700 dark:text-zinc-300 font-semibold">
                          {fmtMoneyShort(row.total_value)}
                        </td>

                        <td className="px-4 py-3 text-slate-600 dark:text-zinc-400 text-xs">
                          {row.index_url ? (
                            <a
                              className="inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-zinc-100"
                              href={row.index_url}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Index <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-slate-400 dark:text-zinc-500">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="text-xs text-slate-500 dark:text-zinc-400">
              Showing {sortedData.length} of {data.length} funds
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
