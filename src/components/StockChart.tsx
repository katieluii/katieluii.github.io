import { useState, useMemo } from 'react';
import {
  ComposedChart, Line, Area, XAxis, YAxis, Tooltip,
  ReferenceLine, ResponsiveContainer, Legend, CartesianGrid,
} from 'recharts';
import { ACQUIRERS, TARGETS, TICKER_COLOURS } from '../data/universe';
import { OBESITY_DEALS } from '../data/obesity-deals';

// ---- types ------------------------------------------------------------------

interface PricePoint {
  date: string;
  close: number;
  sma50: number | null;
  sma200: number | null;
  normalized: number;
  volume: number;
}

interface TickerMeta { name: string }

interface TickerData {
  meta: TickerMeta;
  prices: PricePoint[];
}

interface ForecastPoint { date: string; value: number; lower: number; upper: number }

interface Catalyst { date: string; label: string; status: string }

interface StockChartProps {
  data: Record<string, TickerData>;
  catalysts: Record<string, Catalyst[]>;
  forecasts: Record<string, { forecast: ForecastPoint[] }>;
}

// ---- helpers ----------------------------------------------------------------

function fmtDate(d: string) { return d.slice(0, 7); } // YYYY-MM
function fmtPrice(v: number) { return `$${v.toFixed(2)}`; }

// Keep last N data points to avoid rendering thousands of tick marks
function downsample<T>(arr: T[], maxPoints: number): T[] {
  if (arr.length <= maxPoints) return arr;
  const step = Math.ceil(arr.length / maxPoints);
  return arr.filter((_, i) => i % step === 0 || i === arr.length - 1);
}

// ---- custom tooltip ---------------------------------------------------------

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl ring-1 ring-zinc-200/80 dark:ring-white/10 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm p-3 text-xs space-y-1 shadow-lg">
      <p className="font-semibold text-zinc-500 dark:text-zinc-400">{label}</p>
      {payload.map((p: any) => (
        p.value != null && (
          <p key={p.dataKey} style={{ color: p.color }}>
            {p.name}: {typeof p.value === 'number' ? p.value.toFixed(2) : p.value}
          </p>
        )
      ))}
    </div>
  );
}

// ---- main component ---------------------------------------------------------

const ACQUIRER_ORDER = ACQUIRERS.map(c => c.ticker);
const TARGET_ORDER = TARGETS.map(c => c.ticker).sort();

const DEAL_TICKER: Record<string, string> = {
  'Eli Lilly': 'LLY', 'Roche': 'RHHBY',
  'Novo Holdings': 'NVO', 'Pfizer': 'PFE',
};
const QTR_MONTH: Record<string, string> = { Q1: '02', Q2: '05', Q3: '08', Q4: '11' };

export function StockChart({ data, catalysts, forecasts }: StockChartProps) {
  const [selected, setSelected] = useState<string>('LLY');
  const [view, setView] = useState<'detail' | 'compare'>('detail');
  const [tierFilter, setTierFilter] = useState<'all' | 'acquirers' | 'targets'>('all');
  const [normalizeCompare, setNormalizeCompare] = useState<boolean>(true);

  const chipClass = (active: boolean) =>
    `px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
      active
        ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
    }`;

  // ---- tier-filtered ticker list -------------------------------------------

  const filteredTickers = useMemo(() => {
    const ordered = tierFilter === 'acquirers' ? ACQUIRER_ORDER
                  : tierFilter === 'targets'   ? TARGET_ORDER
                  : [...ACQUIRER_ORDER, ...TARGET_ORDER];
    return ordered.filter(t => data[t]);
  }, [tierFilter, data]);

  const availableTickers = filteredTickers;

  // Auto-select first available ticker when filter changes and selected is no longer visible
  useMemo(() => {
    if (!filteredTickers.includes(selected) && filteredTickers.length > 0) {
      setSelected(filteredTickers[0]);
    }
  }, [filteredTickers, selected]);

  // ---- detail chart data ---------------------------------------------------

  const detailData = useMemo(() => {
    const ticker = data[selected];
    if (!ticker) return [];
    const hist = ticker.prices.map(p => ({
      date: p.date,
      close: p.close,
      sma50: p.sma50,
      sma200: p.sma200,
    }));
    const fc = forecasts[selected]?.forecast ?? [];
    const fcPoints = fc.map(f => ({
      date: f.date,
      forecast: f.value,
      lower: f.lower,
      upper: f.upper,
    }));
    return downsample([...hist, ...fcPoints], 400);
  }, [data, forecasts, selected]);

  // ---- comparison chart data -----------------------------------------------

  const compareData = useMemo(() => {
    const allDates = [
      ...new Set(
        Object.values(data).flatMap(d => d.prices.map(p => p.date))
      ),
    ].sort();
    const recent = allDates.slice(-504); // last ~2 years
    const pricesByDate: Record<string, Record<string, number>> = {};
    for (const ticker of availableTickers) {
      if (!data[ticker]) continue;
      for (const p of data[ticker].prices) {
        if (!pricesByDate[p.date]) pricesByDate[p.date] = {};
        pricesByDate[p.date][ticker] = normalizeCompare ? p.normalized : p.close;
      }
    }
    return downsample(
      recent.map(date => ({ date, ...pricesByDate[date] })),
      400
    );
  }, [data, availableTickers, normalizeCompare]);

  // ---- catalyst lines for detail view --------------------------------------

  const activeCatalysts = useMemo(() => {
    const cats = catalysts[selected] ?? [];
    const dates = new Set(detailData.map(p => p.date));
    return cats.filter(c => dates.has(c.date)).slice(0, 6);
  }, [catalysts, selected, detailData]);

  // ---- deal markers for selected acquirer ----------------------------------

  const dealMarkersForSelected = useMemo(() =>
    OBESITY_DEALS
      .filter(d => DEAL_TICKER[d.acquirer] === selected)
      .map(d => ({
        date: `${d.year}-${QTR_MONTH[d.quarter] ?? '06'}-15`,
        label: `${d.acquirer} → ${d.target}`,
        value: d.value,
        type: d.type,
        asset: d.asset,
      })),
  [selected]);

  // ---- render --------------------------------------------------------------

  return (
    <div className="space-y-4">
      {/* section header */}
      <div>
        <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-widest">
          Stock Performance
        </p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          3-year price history with SMA-50/200 and 30-day ARIMA forecast. Acquirers in cool tones, targets in warm tones. ▲ markers = M&A deals by that company.
        </p>
      </div>

      {/* tier filter */}
      <div className="flex gap-1.5">
        {(['all', 'acquirers', 'targets'] as const).map(tier => (
          <button key={tier} onClick={() => setTierFilter(tier)} className={chipClass(tierFilter === tier)}>
            {tier === 'all' ? 'All' : tier.charAt(0).toUpperCase() + tier.slice(1)}
          </button>
        ))}
      </div>

      {/* view toggle */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2">
          <button onClick={() => setView('detail')} className={chipClass(view === 'detail')}>Detail</button>
          <button onClick={() => setView('compare')} className={chipClass(view === 'compare')}>Compare all</button>
          {view === 'compare' && (
            <button onClick={() => setNormalizeCompare(v => !v)} className={chipClass(normalizeCompare)}>
              Normalize to 100
            </button>
          )}
        </div>
        {view === 'detail' && (
          <div className="flex flex-wrap gap-1.5">
            {availableTickers.map(t => {
              const isTarget = TARGETS.some(c => c.ticker === t);
              return (
                <button
                  key={t}
                  onClick={() => setSelected(t)}
                  className={
                    selected === t
                      ? 'px-2.5 py-0.5 rounded-full text-xs font-semibold transition-colors text-white'
                      : `px-2.5 py-0.5 rounded-full text-xs font-semibold transition-colors ring-1 ${
                          isTarget
                            ? 'ring-orange-300 dark:ring-orange-700 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                            : 'ring-zinc-200 dark:ring-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                        }`
                  }
                  style={selected === t ? { backgroundColor: TICKER_COLOURS[t] } : {}}
                >
                  {t}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* chart */}
      <div className="rounded-2xl ring-1 ring-zinc-200/80 dark:ring-white/10 bg-white/80 dark:bg-zinc-800/80 p-4">
        {view === 'detail' ? (
          <>
            <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
              {data[selected]?.meta.name} — 3yr price + SMAs + 30d forecast
            </p>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={detailData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(120,120,120,0.1)" />
                <XAxis
                  dataKey="date"
                  tickFormatter={fmtDate}
                  tick={{ fontSize: 10, fill: '#9ca3af' }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tickFormatter={fmtPrice}
                  tick={{ fontSize: 10, fill: '#9ca3af' }}
                  width={58}
                  domain={['auto', 'auto']}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />

                {/* confidence band */}
                <Area
                  dataKey="upper"
                  stroke="none"
                  fill="#10b981"
                  fillOpacity={0.1}
                  name="80% CI upper"
                  legendType="none"
                />
                <Area
                  dataKey="lower"
                  stroke="none"
                  fill="#ffffff"
                  fillOpacity={1}
                  name="80% CI lower"
                  legendType="none"
                />

                <Line
                  dataKey="close"
                  stroke={TICKER_COLOURS[selected] ?? '#6366f1'}
                  strokeWidth={1.5}
                  dot={false}
                  name="Close"
                  connectNulls
                />
                <Line
                  dataKey="sma50"
                  stroke="#f59e0b"
                  strokeWidth={1}
                  dot={false}
                  name="SMA 50"
                  strokeDasharray="4 2"
                  connectNulls
                />
                <Line
                  dataKey="sma200"
                  stroke="#6b7280"
                  strokeWidth={1}
                  dot={false}
                  name="SMA 200"
                  strokeDasharray="6 3"
                  connectNulls
                />
                <Line
                  dataKey="forecast"
                  stroke="#10b981"
                  strokeWidth={1.5}
                  dot={false}
                  name="Forecast"
                  strokeDasharray="4 4"
                  connectNulls
                />

                {/* catalyst reference lines */}
                {activeCatalysts.map(c => (
                  <ReferenceLine
                    key={c.date + c.label}
                    x={c.date}
                    stroke="#6366f1"
                    strokeWidth={1}
                    strokeDasharray="3 3"
                    label={{ value: '●', position: 'top', fontSize: 8, fill: '#6366f1' }}
                  />
                ))}

                {/* deal marker reference lines */}
                {dealMarkersForSelected.map(m => (
                  <ReferenceLine
                    key={m.date + m.label}
                    x={m.date}
                    stroke="#f59e0b"
                    strokeWidth={1}
                    strokeDasharray="4 2"
                    label={{ value: '▲', position: 'top', fontSize: 8, fill: '#f59e0b' }}
                  />
                ))}
              </ComposedChart>
            </ResponsiveContainer>

            {/* catalyst legend */}
            {activeCatalysts.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {activeCatalysts.map(c => (
                  <span
                    key={c.date + c.label}
                    className="inline-flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-700/50 px-2 py-0.5 rounded-full"
                  >
                    <span className="text-indigo-500">●</span>
                    {c.date.slice(0, 7)} · {c.label}
                  </span>
                ))}
              </div>
            )}

            {/* deal marker legend */}
            {dealMarkersForSelected.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {dealMarkersForSelected.map(m => (
                  <span key={m.date + m.label} className="inline-flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full">
                    <span className="text-amber-500">▲</span>
                    {m.date.slice(0, 7)} · {m.label} · {m.value}
                  </span>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
              {normalizeCompare ? 'Indexed performance (base = 100 at 3yr start)' : 'Absolute price ($)'}
            </p>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={compareData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(120,120,120,0.1)" />
                <XAxis
                  dataKey="date"
                  tickFormatter={fmtDate}
                  tick={{ fontSize: 10, fill: '#9ca3af' }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tickFormatter={normalizeCompare ? (v: number) => v.toFixed(0) : (v: number) => `$${v}`}
                  tick={{ fontSize: 10, fill: '#9ca3af' }}
                  width={42}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {availableTickers.map(t => (
                  <Line
                    key={t}
                    dataKey={t}
                    stroke={TICKER_COLOURS[t]}
                    strokeWidth={1.5}
                    dot={false}
                    name={t}
                    connectNulls
                  />
                ))}
              </ComposedChart>
            </ResponsiveContainer>
          </>
        )}
      </div>
    </div>
  );
}
