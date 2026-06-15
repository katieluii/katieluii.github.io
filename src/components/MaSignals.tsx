import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Info } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList, Legend,
} from 'recharts';
import { OBESITY_DEALS, type ObesityDeal } from '../data/obesity-deals';
import { SITTING_OUT } from '../data/sitting-out';
import { SkeletonList, Reveal } from './ui';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DataQuality {
  ebitda_source: string;
  net_debt_source: string;
  fcf_source: string;
  warnings: string[];
  ebitda_note?: string;
}

interface FirepowerCompany {
  ticker: string;
  name: string;
  market_cap_b: number;
  total_cash_b: number | null;
  total_debt_b: number | null;
  ebitda_b: number | null;
  net_debt_b: number | null;
  nd_ebitda: number | null;
  fcf_reported_b: number | null;
  fcf_normalized_b: number | null;
  fcf_ebitda_pct: number | null;
  comfortable_b: number | null;
  stretch_b: number | null;
  statement_period_end: string | null;
  filing_currency: string;
  fx_rate: number;
  data_quality: DataQuality;
}

interface FirepowerResponse {
  companies: FirepowerCompany[];
  last_updated: number | null;
  methodology_note: string;
}

interface ObesityTarget {
  ticker: string;
  name: string;
  market_cap_b: number;
  cash_m: number;
  quarterly_burn_m: number;
  monthly_burn_m: number;
  runway_months: number | null;
  runway_source: string;
  runway_report_date: string | null;
  lead_asset: string;
  mechanism: string;
  peak_sales_est_b: number;
  phase: string;
  next_catalyst: string | null;
  deal_pressure_score: number;
  deal_pressure_badge: 'High' | 'Med' | 'Low';
  deal_pressure_signals: {
    short_runway: boolean;
    late_stage: boolean;
    cheap_vs_peak: boolean;
  };
  strategic_fit_score: number;
  strategic_fit_badge: 'High' | 'Med' | 'Low';
  strategic_fit_signals: {
    obesity_indication: boolean;
    differentiated: boolean;
    derisked: boolean;
  };
}

interface MaSignalsProps {
  api: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtB(v: number | null | undefined): string {
  if (v == null) return '—';
  const sign = v < 0 ? '−' : '';
  return `${sign}$${Math.abs(v).toFixed(1)}B`;
}

function fmtM(v: number | null | undefined): string {
  if (v == null) return '—';
  return `$${Math.abs(v).toFixed(0)}M`;
}

function ndEbitdaColor(v: number | null): string {
  if (v == null) return 'text-zinc-500 dark:text-zinc-400';
  if (v <= 2) return 'text-emerald-600 dark:text-emerald-400';
  if (v <= 3) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-500 dark:text-red-400';
}

function fcfPctColor(v: number | null): string {
  if (v == null) return 'text-zinc-500 dark:text-zinc-400';
  if (v >= 80) return 'text-emerald-600 dark:text-emerald-400';
  if (v >= 50) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-500 dark:text-red-400';
}

function runwayColor(months: number | null): string {
  if (months == null) return 'bg-zinc-300 dark:bg-zinc-600';
  if (months > 36) return 'bg-emerald-500';
  if (months >= 18) return 'bg-amber-500';
  return 'bg-red-500';
}

function runwayTextColor(months: number | null): string {
  if (months == null) return 'text-zinc-500 dark:text-zinc-400';
  if (months > 36) return 'text-emerald-600 dark:text-emerald-400';
  if (months >= 18) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-500 dark:text-red-400';
}

function phaseColor(phase: string): string {
  if (phase === 'Phase 3' || phase === 'Phase 2/Phase 3')
    return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300';
  if (phase === 'Phase 2')
    return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300';
  if (phase.startsWith('Phase 1'))
    return 'bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300';
  return 'bg-zinc-100 text-zinc-500 dark:bg-zinc-700 dark:text-zinc-400';
}

function dealPressureColor(badge: string): string {
  if (badge === 'High') return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300';
  if (badge === 'Med') return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300';
  return 'bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300';
}

function strategicFitColor(badge: string): string {
  if (badge === 'High') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300';
  if (badge === 'Med') return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300';
  return 'bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300';
}

// ─── Section 1: Firepower ─────────────────────────────────────────────────────

const COMFORTABLE_COLOR = '#a855f7'; // purple
const STRETCH_COLOR     = '#3b82f6'; // blue

type SortKey = 'market_cap_b' | 'net_debt_b' | 'nd_ebitda' | 'fcf_ebitda_pct' | 'comfortable_b' | 'stretch_b';

function FirepowerSection({ data }: { data: FirepowerResponse }) {
  const [notesOpen, setNotesOpen]   = useState(false);
  const [sortKey, setSortKey]       = useState<SortKey>('stretch_b');
  const [sortDir, setSortDir]       = useState<'asc' | 'desc'>('desc');
  const { companies: rawCompanies, methodology_note } = data;

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  }

  const companies = [...rawCompanies].sort((a, b) => {
    const av = (a[sortKey] ?? -Infinity) as number;
    const bv = (b[sortKey] ?? -Infinity) as number;
    return sortDir === 'asc' ? av - bv : bv - av;
  });

  const chartData = companies.map(c => ({
    ticker: c.ticker,
    comfortable_b: c.comfortable_b ?? 0,
    stretch_b: c.stretch_b ?? 0,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const ticker = payload[0]?.payload?.ticker;
    const co = companies.find(c => c.ticker === ticker);
    if (!co) return null;
    return (
      <div className="bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-100 shadow-xl space-y-1 min-w-[200px]">
        <p className="font-semibold text-zinc-200">{co.name} ({co.ticker})</p>
        <p>Comfortable (3× Net Debt/EBITDA): <span className="text-purple-300 font-medium">{fmtB(co.comfortable_b)}</span></p>
        <p>Stretch (5× Net Debt/EBITDA): <span className="text-blue-300 font-medium">{fmtB(co.stretch_b)}</span></p>
        <p>Net Debt/EBITDA: <span className="text-zinc-300">{co.nd_ebitda != null ? `${co.nd_ebitda.toFixed(1)}x` : 'N/M'}</span></p>
      </div>
    );
  };

  const sortThClass = 'text-right py-2.5 px-3 font-medium cursor-pointer select-none hover:text-zinc-600 dark:hover:text-zinc-300';
  const arrow = (key: SortKey) => sortKey === key ? (sortDir === 'desc' ? ' ↓' : ' ↑') : '';

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-widest">
          Big Pharma M&A Firepower
        </p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          Capacity to lever the balance sheet for acquisitions. Comfortable = 3× Net Debt/EBITDA; Stretch = 5×.
        </p>
      </div>

      {/* Grouped side-by-side bar chart */}
      <div className="rounded-2xl ring-1 ring-zinc-200/80 dark:ring-white/10 bg-white/80 dark:bg-zinc-800/80 p-4">
        <ResponsiveContainer width="100%" height={420}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 4, right: 72, bottom: 4, left: 0 }}
            barCategoryGap="30%"
            barGap={3}
          >
            <XAxis
              type="number"
              domain={[0, 'auto']}
              tick={{ fontSize: 10, fill: '#a1a1aa' }}
              tickFormatter={v => `$${v}B`}
            />
            <YAxis
              type="category"
              dataKey="ticker"
              width={52}
              tick={{ fontSize: 11, fill: '#a1a1aa', fontFamily: 'monospace' }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
            <Legend
              verticalAlign="top"
              align="left"
              iconType="square"
              iconSize={10}
              wrapperStyle={{ fontSize: 11, paddingBottom: 8, color: '#a1a1aa' }}
              formatter={(value: string) =>
                value === 'comfortable_b'
                  ? 'Comfortable (3× Net Debt/EBITDA)'
                  : 'Stretch (5× Net Debt/EBITDA)'
              }
            />
            <Bar
              dataKey="comfortable_b"
              name="comfortable_b"
              fill={COMFORTABLE_COLOR}
              isAnimationActive={false}
              radius={[0, 3, 3, 0]}
            >
              <LabelList
                dataKey="comfortable_b"
                position="right"
                formatter={(v: number) => v > 0 ? `$${v.toFixed(0)}B` : ''}
                style={{ fontSize: 9, fill: '#a1a1aa' }}
              />
            </Bar>
            <Bar
              dataKey="stretch_b"
              name="stretch_b"
              fill={STRETCH_COLOR}
              isAnimationActive={false}
              radius={[0, 3, 3, 0]}
            >
              <LabelList
                dataKey="stretch_b"
                position="right"
                formatter={(v: number) => v > 0 ? `$${v.toFixed(0)}B` : ''}
                style={{ fontSize: 9, fill: '#a1a1aa' }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Notes (collapsible) */}
      <div className="rounded-xl ring-1 ring-zinc-200/80 dark:ring-white/10 bg-zinc-50 dark:bg-zinc-800/60 overflow-hidden">
        <button
          onClick={() => setNotesOpen(v => !v)}
          className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
        >
          <span>Notes</span>
          {notesOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
        {notesOpen && (
          <div className="px-4 pb-3 text-xs text-zinc-600 dark:text-zinc-400 border-t border-zinc-200/60 dark:border-white/5 pt-2.5 leading-relaxed">
            Firepower = how much additional debt a company can raise before crossing a Net Debt/EBITDA
            threshold. Comfortable = 3× (investment-grade safe); Stretch = 5× (some pharma companies like
            AstraZeneca and Takeda have historically operated here). This is the capacity metric ratings
            agencies use, not net cash position.
          </div>
        )}
      </div>

      {/* Compact table */}
      <div className="rounded-2xl ring-1 ring-zinc-200/80 dark:ring-white/10 bg-white/80 dark:bg-zinc-800/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-zinc-400 dark:text-zinc-500 border-b border-zinc-100 dark:border-white/5">
                <th className="text-left py-2.5 px-4 font-medium">Company</th>
                <th className={sortThClass} onClick={() => toggleSort('market_cap_b')}>Mkt Cap{arrow('market_cap_b')}</th>
                <th className={sortThClass} onClick={() => toggleSort('net_debt_b')}>Net Debt{arrow('net_debt_b')}</th>
                <th className={sortThClass} onClick={() => toggleSort('nd_ebitda')}>Net Debt/EBITDA{arrow('nd_ebitda')}</th>
                <th className={sortThClass} onClick={() => toggleSort('fcf_ebitda_pct')}>FCF/EBITDA{arrow('fcf_ebitda_pct')}</th>
                <th className={sortThClass} onClick={() => toggleSort('comfortable_b')}>Comfortable (3×){arrow('comfortable_b')}</th>
                <th className="text-right py-2.5 px-4 font-medium cursor-pointer select-none hover:text-zinc-600 dark:hover:text-zinc-300" onClick={() => toggleSort('stretch_b')}>Stretch (5×){arrow('stretch_b')}</th>
              </tr>
            </thead>
            <tbody>
              {companies.map(co => (
                <tr
                  key={co.ticker}
                  className="border-b border-zinc-50 odd:bg-zinc-50/40 hover:bg-indigo-50/50 dark:border-white/[0.03] dark:odd:bg-white/[0.015] dark:hover:bg-indigo-500/10 transition-colors"
                >
                  <td className="py-2 px-4">
                    <span className="font-mono text-zinc-400 dark:text-zinc-500 mr-1.5">{co.ticker}</span>
                    <span className="text-zinc-700 dark:text-zinc-300">{co.name}</span>
                  </td>
                  <td className="py-2 px-3 text-right text-zinc-600 dark:text-zinc-400">{fmtB(co.market_cap_b)}</td>
                  {/* Net Debt with CSS hover tooltip showing Cash / Debt breakdown */}
                  <td className="py-2 px-3 text-right text-zinc-600 dark:text-zinc-400">
                    <span className="relative group/nd inline-block cursor-default">
                      {fmtB(co.net_debt_b)}
                      <span className="pointer-events-none absolute bottom-full right-0 mb-1.5 hidden group-hover/nd:block z-20 whitespace-nowrap rounded-lg bg-zinc-900 dark:bg-zinc-700 px-2.5 py-1.5 text-zinc-100 shadow-xl text-xs leading-snug">
                        Cash: {fmtB(co.total_cash_b)}<br />Debt: {fmtB(co.total_debt_b)}
                      </span>
                    </span>
                  </td>
                  <td className={`py-2 px-3 text-right font-medium ${ndEbitdaColor(co.nd_ebitda)}`}>
                    {co.nd_ebitda != null ? `${co.nd_ebitda.toFixed(1)}x` : 'N/M'}
                  </td>
                  <td className={`py-2 px-3 text-right font-medium ${fcfPctColor(co.fcf_ebitda_pct)}`}>
                    {co.fcf_ebitda_pct != null ? `${co.fcf_ebitda_pct}%` : 'N/M'}
                  </td>
                  <td className="py-2 px-3 text-right font-semibold text-purple-600 dark:text-purple-400">{fmtB(co.comfortable_b)}</td>
                  <td className="py-2 px-4 text-right font-semibold text-blue-600 dark:text-blue-400">{fmtB(co.stretch_b)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footnote */}
      <p className="text-xs text-zinc-400 dark:text-zinc-500 leading-relaxed">
        {methodology_note}
      </p>
    </div>
  );
}

// ─── Section 2: Obesity Biotech Targets ───────────────────────────────────────

function TargetsSection({ targets }: { targets: ObesityTarget[] }) {
  const MAX_RUNWAY = 60;

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-widest">
          Obesity Biotech Targets
        </p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-2xl leading-relaxed">
          Potential acquisition or licensing targets, scored on two axes.{' '}
          <span className="text-zinc-600 dark:text-zinc-300">Deal pressure</span> measures forced-seller
          dynamics (runway, stage, valuation).{' '}
          <span className="text-zinc-600 dark:text-zinc-300">Strategic fit</span> measures asset
          attractiveness to big pharma (mechanism, indication, de-risking). A target can be high on one
          and low on the other — e.g. a well-capitalised biotech with a differentiated Phase 2 asset has
          low deal pressure but high strategic fit, suggesting a premium-priced licensing deal is more
          likely than a distressed sale.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {targets.map(t => {
          const runwayPct = t.runway_months != null
            ? Math.min(100, (t.runway_months / MAX_RUNWAY) * 100)
            : 0;
          const dp = t.deal_pressure_signals;
          const sf = t.strategic_fit_signals;
          const isMgmtGuidance = t.runway_source === 'management_guidance';

          return (
            <div
              key={t.ticker}
              className="rounded-2xl ring-1 ring-zinc-200/80 dark:ring-white/10 bg-white/80 dark:bg-zinc-800/80 p-4 space-y-3"
            >
              {/* Header row */}
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300">
                    {t.ticker}
                  </span>
                  <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">{t.name}</span>
                </div>
                {/* Two badges: Deal pressure + Strategic fit */}
                <div className="flex items-center gap-1.5">
                  <span className="relative group/dp">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full cursor-default ${dealPressureColor(t.deal_pressure_badge)}`}>
                      {t.deal_pressure_badge} pressure
                    </span>
                    <span className="pointer-events-none absolute right-0 top-full mt-1.5 hidden group-hover/dp:block z-20 rounded-lg bg-zinc-900 dark:bg-zinc-700 px-2.5 py-2 text-zinc-100 shadow-xl text-xs space-y-0.5 min-w-[210px]">
                      <span className="block font-semibold text-zinc-300 pb-0.5">Deal pressure</span>
                      <span className="block">{dp.short_runway  ? '✓' : '✗'} Runway &lt;24 months</span>
                      <span className="block">{dp.late_stage    ? '✓' : '✗'} Phase 2+ (clinical stage)</span>
                      <span className="block">{dp.cheap_vs_peak ? '✓' : '✗'} Mkt cap &lt;2× peak sales est.</span>
                    </span>
                  </span>
                  <span className="relative group/sf">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full cursor-default ${strategicFitColor(t.strategic_fit_badge)}`}>
                      {t.strategic_fit_badge} fit
                    </span>
                    <span className="pointer-events-none absolute right-0 top-full mt-1.5 hidden group-hover/sf:block z-20 rounded-lg bg-zinc-900 dark:bg-zinc-700 px-2.5 py-2 text-zinc-100 shadow-xl text-xs space-y-0.5 min-w-[230px]">
                      <span className="block font-semibold text-zinc-300 pb-0.5">Strategic fit</span>
                      <span className="block">{sf.obesity_indication ? '✓' : '✗'} Obesity / T2DM indication</span>
                      <span className="block">{sf.differentiated     ? '✓' : '✗'} Differentiated mechanism</span>
                      <span className="block">{sf.derisked           ? '✓' : '✗'} Phase 2 PoC data or Phase 3</span>
                    </span>
                  </span>
                </div>
              </div>

              {/* Lead asset */}
              <div>
                <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">{t.lead_asset}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">{t.mechanism}</p>
              </div>

              {/* Phase + catalyst */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${phaseColor(t.phase)}`}>
                  {t.phase}
                </span>
                {t.next_catalyst && (
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    Next catalyst: {t.next_catalyst}
                  </span>
                )}
              </div>

              {/* Runway bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-500 dark:text-zinc-400">
                    Cash runway
                    {isMgmtGuidance && (
                      <span className="ml-1 text-zinc-400 dark:text-zinc-500">(mgmt guidance)</span>
                    )}
                  </span>
                  <span className={`font-medium ${runwayTextColor(t.runway_months)}`}>
                    {t.runway_months != null ? `${t.runway_months} months` : '—'}
                  </span>
                </div>
                <div className="relative h-2 bg-zinc-100 dark:bg-zinc-700 rounded-full overflow-visible">
                  <div
                    className={`h-full rounded-full transition-all ${runwayColor(t.runway_months)}`}
                    style={{ width: `${runwayPct}%` }}
                  />
                  <span className="absolute top-3 text-zinc-300 dark:text-zinc-600 text-[9px]"
                    style={{ left: `${(18 / MAX_RUNWAY) * 100}%` }}>18m</span>
                  <span className="absolute top-3 text-zinc-300 dark:text-zinc-600 text-[9px]"
                    style={{ left: `${(36 / MAX_RUNWAY) * 100}%` }}>36m</span>
                </div>
                <div className="pt-3 grid grid-cols-3 gap-1 text-xs">
                  <div>
                    <p className="text-zinc-400 dark:text-zinc-500">Cash</p>
                    <p className="text-zinc-700 dark:text-zinc-300 font-medium">{fmtM(t.cash_m)}</p>
                  </div>
                  <div>
                    <p className="text-zinc-400 dark:text-zinc-500">Monthly burn</p>
                    <p className="text-zinc-700 dark:text-zinc-300 font-medium">
                      {t.monthly_burn_m > 0 ? `$${t.monthly_burn_m.toFixed(0)}M` : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-zinc-400 dark:text-zinc-500">Ann. burn rate</p>
                    <p className="text-zinc-700 dark:text-zinc-300 font-medium">
                      {t.quarterly_burn_m > 0 ? `$${(t.quarterly_burn_m * 4).toFixed(0)}M` : '—'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Valuation row */}
              <div className="flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400 pt-0.5 border-t border-zinc-100 dark:border-white/5">
                <span>Mkt cap <span className="text-zinc-700 dark:text-zinc-300 font-medium">${t.market_cap_b.toFixed(2)}B</span></span>
                <span>Peak sales est. <span className="text-zinc-700 dark:text-zinc-300 font-medium">${t.peak_sales_est_b}B</span></span>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-zinc-400 dark:text-zinc-500 leading-relaxed">
        Cash runway from management guidance where available (as of most recent quarterly report),
        otherwise computed from balance sheet cash ÷ forward burn (1.5× TTM FCF). Bar scaled to
        60 months; markers at 18m and 36m. Peak sales estimates are analyst consensus figures used
        for relative valuation scoring only.
      </p>
    </div>
  );
}

// ─── Section 3: Deal History ──────────────────────────────────────────────────

function DealHistory() {
  const years = [2023, 2024, 2025];

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-widest">
          Obesity Deal History 2023–25
        </p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          Obesity and metabolic deals. Solid border = M&A; dashed border = Licensing.
          Emerald = obesity; amber = metabolic/adjacent.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {years.map(year => {
          const deals = OBESITY_DEALS.filter((d: ObesityDeal) => d.year === year);
          return (
            <div key={year} className="flex flex-col gap-2">
              {/* Year header */}
              <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide text-center pb-1.5 border-b border-zinc-100 dark:border-white/5">
                {year}
              </p>
              {/* Deal cards */}
              {deals.map((deal: ObesityDeal, i: number) => {
                const borderColor = deal.scope === 'obesity'
                  ? 'border-emerald-400 dark:border-emerald-500'
                  : 'border-amber-400 dark:border-amber-500';
                const borderStyle = deal.type === 'Licensing' ? 'border-dashed' : 'border-solid';
                return (
                  <div
                    key={i}
                    className={`rounded-xl border-2 ${borderColor} ${borderStyle} bg-white/80 dark:bg-zinc-800/80 p-3 space-y-1.5 flex flex-col`}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 leading-snug flex-1">
                        {deal.acquirer}
                        <span className="text-zinc-400 dark:text-zinc-500 mx-0.5">→</span>
                        {deal.target}
                      </p>
                      {deal.valueNote && (
                        <span className="relative group/note flex-shrink-0 mt-0.5">
                          <Info className="w-3 h-3 text-zinc-400 dark:text-zinc-500 cursor-default" />
                          <span className="pointer-events-none absolute right-0 top-full mt-1.5 hidden group-hover/note:block z-20 w-56 rounded-lg bg-zinc-900 dark:bg-zinc-700 px-2.5 py-1.5 text-zinc-100 shadow-xl text-xs leading-snug">
                            {deal.valueNote}
                          </span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 leading-snug">
                      {deal.value}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-snug flex-1">
                      {deal.asset}
                    </p>
                    <div className="flex items-center gap-1.5 pt-0.5">
                      <span className="text-xs px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400">
                        {deal.type}
                      </span>
                      <span className="text-xs text-zinc-400 dark:text-zinc-500">{deal.quarter}</span>
                    </div>
                  </div>
                );
              })}
              {/* Placeholder if no deals in year */}
              {deals.length === 0 && (
                <p className="text-xs text-zinc-400 dark:text-zinc-500 text-center py-4">—</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Section 4: Not Active in Obesity ────────────────────────────────────────

function AbsentFromObesity() {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-widest">
          Large Pharma Not Active in Obesity
        </p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          No active GLP-1 or obesity programme. Public statements noted where available.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {SITTING_OUT.map(co => (
          <div
            key={co.ticker}
            className={`rounded-xl bg-white/80 dark:bg-zinc-800/80 ring-1 ring-zinc-200/80 dark:ring-white/10 px-4 py-3 space-y-2 border-l-4 ${
              co.hasPublicStatement
                ? 'border-zinc-400 dark:border-zinc-500'
                : 'border-zinc-200 dark:border-zinc-700'
            }`}
          >
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs text-zinc-400 dark:text-zinc-500">{co.ticker}</span>
              <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">{co.name}</span>
              {co.hasPublicStatement && (
                <span className="text-xs px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400">
                  public statement
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">{co.rationale}</p>
            {co.quote && (
              <div className="border-t border-zinc-100 dark:border-white/5 pt-2 space-y-0.5">
                <p className="text-xs italic text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  "{co.quote}"
                </p>
                {co.quoteSource && (
                  <p className="text-xs text-zinc-400 dark:text-zinc-500">— {co.quoteSource}</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function MaSignals({ api }: MaSignalsProps) {
  const [firepower, setFirepower] = useState<FirepowerResponse | null>(null);
  const [targets, setTargets]     = useState<ObesityTarget[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch(`${api}/firepower`).then(r => r.json()),
      fetch(`${api}/obesity-targets`).then(r => r.json()),
    ])
      .then(([fp, tgts]) => {
        setFirepower(fp);
        setTargets(Array.isArray(tgts) ? tgts : []);
      })
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false));
  }, [api]);

  if (loading) {
    return <SkeletonList count={4} />;
  }
  if (error) {
    return <p className="text-sm text-red-500">Failed to load M&A data: {error}</p>;
  }

  const divider = 'border-t border-zinc-200/70 dark:border-white/10 pt-12';

  return (
    <div className="space-y-12">
      {firepower && firepower.companies.length > 0 && (
        <Reveal>
          <FirepowerSection data={firepower} />
        </Reveal>
      )}
      {targets.length > 0 && (
        <Reveal className={divider}>
          <TargetsSection targets={targets} />
        </Reveal>
      )}
      <Reveal className={divider}>
        <DealHistory />
      </Reveal>
      <Reveal className={divider}>
        <AbsentFromObesity />
      </Reveal>
    </div>
  );
}
