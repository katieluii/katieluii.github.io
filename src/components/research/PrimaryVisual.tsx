import { useState } from 'react';
import { COMPANIES, CONVERGENCE, ERAS, offLadder, type Company, type EraKey, type Exposure } from '../../data/pharmaLandscape';

/* One primary interactive product view for the case study — tabbed so it reads as an
   application, not a long document. Native SVG (no iframe). Reads from the shared
   pharmaLandscape source. Positioning / Patent cliffs / Pipeline / Theses. */

const EXP_COLOR: Record<Exposure, string> = { high: '#e5484d', med: '#f5a524', low: '#30a46c' };
const EXP_LABEL: Record<Exposure, string> = { high: 'High LOE exposure', med: 'Medium', low: 'Low / well-defended' };

type Tab = 'positioning' | 'cliffs' | 'pipeline' | 'theses';
const TABS: { key: Tab; label: string }[] = [
  { key: 'positioning', label: 'Positioning' },
  { key: 'cliffs', label: 'Patent cliffs' },
  { key: 'pipeline', label: 'Pipeline crowding' },
  { key: 'theses', label: 'Company theses' },
];

// ── scatter geometry ────────────────────────────────────────────────────────
const W = 800, H = 460, L = 62, R = 26, T = 22, B = 46;
const X_MIN = 6, X_MAX = 36, Y_MIN = -10, Y_MAX = 60;
const xScale = (pe: number) => L + ((pe - X_MIN) / (X_MAX - X_MIN)) * (W - L - R);
const yScale = (g: number) => (H - B) - ((g - Y_MIN) / (Y_MAX - Y_MIN)) * (H - B - T);

function Positioning() {
  const [hover, setHover] = useState<string | null>(null);
  const xTicks = [10, 15, 20, 25, 30, 35];
  const yTicks = [0, 20, 40, 60];
  const active = COMPANIES.find((c) => c.ticker === hover);

  return (
    <div>
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} role="img"
          aria-label="Positioning: forward P/E versus revenue growth for 13 large-cap pharma companies"
          className="w-full min-w-[480px] text-zinc-400 dark:text-zinc-500">
          {/* axes */}
          <line x1={L} y1={T} x2={L} y2={H - B} stroke="currentColor" strokeWidth={1} />
          <line x1={L} y1={H - B} x2={W - R} y2={H - B} stroke="currentColor" strokeWidth={1} />
          {/* peer-median P/E line */}
          <line x1={xScale(15)} y1={T} x2={xScale(15)} y2={H - B} stroke="currentColor" strokeWidth={1} strokeDasharray="4 4" opacity={0.5} />
          <text x={xScale(15)} y={T - 6} textAnchor="middle" fontSize={11} fill="currentColor">~15× peer median</text>
          {/* x ticks */}
          {xTicks.map((t) => (
            <g key={`x${t}`}>
              <line x1={xScale(t)} y1={H - B} x2={xScale(t)} y2={H - B + 4} stroke="currentColor" />
              <text x={xScale(t)} y={H - B + 17} textAnchor="middle" fontSize={11} fill="currentColor">{t}×</text>
            </g>
          ))}
          {/* y ticks + zero-growth gridline */}
          {yTicks.map((t) => (
            <g key={`y${t}`}>
              <line x1={L - 4} y1={yScale(t)} x2={L} y2={yScale(t)} stroke="currentColor" />
              <text x={L - 8} y={yScale(t) + 4} textAnchor="end" fontSize={11} fill="currentColor">{t}%</text>
              {t === 0 && <line x1={L} y1={yScale(0)} x2={W - R} y2={yScale(0)} stroke="currentColor" strokeDasharray="2 4" opacity={0.4} />}
            </g>
          ))}
          <text x={(L + W - R) / 2} y={H - 6} textAnchor="middle" fontSize={11.5} fill="currentColor">Forward P/E — hollow points are estimated</text>
          <text transform={`translate(16 ${(T + H - B) / 2}) rotate(-90)`} textAnchor="middle" fontSize={11.5} fill="currentColor">Revenue growth</text>
          {/* points */}
          {COMPANIES.map((c) => {
            const cx = xScale(c.pos.pe), cy = yScale(c.pos.g);
            const on = hover === c.ticker;
            return (
              <g key={c.ticker}
                tabIndex={0}
                role="button"
                aria-label={`${c.name}: ${c.pos.g}% growth, ${c.pos.pe}× P/E${c.pos.est ? ' (estimated)' : ''}, ${EXP_LABEL[c.exp]}`}
                onMouseEnter={() => setHover(c.ticker)} onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(c.ticker)} onBlur={() => setHover(null)}
                style={{ cursor: 'pointer', outline: 'none' }}>
                <circle cx={cx} cy={cy} r={on ? 9 : 6.5}
                  fill={c.pos.est ? 'transparent' : EXP_COLOR[c.exp]}
                  stroke={EXP_COLOR[c.exp]} strokeWidth={c.pos.est ? 2 : on ? 2 : 1} />
                <text x={cx} y={cy - 12} textAnchor="middle" fontSize={11} fontWeight={on ? 700 : 500}
                  fill="currentColor" className="text-zinc-600 dark:text-zinc-300" style={{ pointerEvents: 'none' }}>{c.ticker}</text>
              </g>
            );
          })}
          {/* tooltip */}
          {active && (() => {
            const cx = xScale(active.pos.pe), cy = yScale(active.pos.g);
            const left = cx > W / 2; const bw = 210, bh = 52;
            const bx = left ? cx - bw - 12 : cx + 12; const by = Math.max(T, cy - bh / 2);
            return (
              <g style={{ pointerEvents: 'none' }}>
                <rect x={bx} y={by} width={bw} height={bh} rx={7} fill="#111827" opacity={0.96} />
                <text x={bx + 12} y={by + 20} fontSize={12.5} fontWeight={700} fill="#fff">{active.name}</text>
                <text x={bx + 12} y={by + 38} fontSize={11.5} fill="#cbd5e1">
                  {active.gr} growth · {active.pos.est ? `~${active.pos.pe}× (est.)` : `${active.pos.pe}× fwd P/E`}
                </text>
              </g>
            );
          })()}
        </svg>
      </div>
      <Legend />
      <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">
        The market pays up only for growth it believes in — Lilly sits alone top-right; the cliff names cluster cheap and flat.
        {offLadder.length > 0 && <> {offLadder.join(', ')} carry no clean forward P/E, so they appear as estimated (hollow) points and are excluded from the precise valuation ladder.</>}
      </p>
    </div>
  );
}

function Legend() {
  return (
    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-zinc-600 dark:text-zinc-400">
      {(['high', 'med', 'low'] as Exposure[]).map((e) => (
        <span key={e} className="inline-flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: EXP_COLOR[e] }} />{EXP_LABEL[e]}
        </span>
      ))}
    </div>
  );
}

function Cliffs() {
  const order: Exposure[] = ['high', 'med', 'low'];
  const eraKeys: EraKey[] = ['now', '2026-28', '2029-31'];
  return (
    <div>
      <div className="grid sm:grid-cols-3 gap-3">
        {eraKeys.map((k) => {
          const names = COMPANIES.filter((c) => c.era === k).sort((a, b) => order.indexOf(a.exp) - order.indexOf(b.exp));
          return (
            <div key={k} className="rounded-xl ring-1 ring-zinc-200/80 dark:ring-white/10 p-4">
              <div className="flex items-baseline justify-between mb-2.5">
                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{ERAS[k].yr}</span>
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400">{ERAS[k].cap}</span>
              </div>
              <ul className="space-y-1.5">
                {names.map((c) => (
                  <li key={c.ticker} className="flex items-center gap-2 text-sm">
                    <span className="inline-block w-2 h-2 rounded-full shrink-0" style={{ background: EXP_COLOR[c.exp] }} />
                    <span className="font-medium text-zinc-800 dark:text-zinc-200 w-12 tabular-nums">{c.ticker}</span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{c.loeAsset}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
      <Legend />
    </div>
  );
}

function Pipeline() {
  const maxN = Math.max(...CONVERGENCE.map((t) => t.n));
  return (
    <div className="space-y-3">
      {CONVERGENCE.map((t) => (
        <div key={t.name} className="rounded-xl ring-1 ring-zinc-200/80 dark:ring-white/10 p-4">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{t.name}</span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400 shrink-0 tabular-nums">{t.n} of 13</span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
            <div className="h-full rounded-full bg-teal-500/80 dark:bg-teal-400/80" style={{ width: `${(t.n / maxN) * 100}%` }} />
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            {t.tk.map((tk) => <span key={tk} className="text-[10.5px] font-medium px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 tabular-nums">{tk}</span>)}
          </div>
        </div>
      ))}
    </div>
  );
}

function Theses() {
  return (
    <div className="space-y-2">
      {COMPANIES.map((c: Company) => (
        <details key={c.ticker} className="group rounded-xl ring-1 ring-zinc-200/80 dark:ring-white/10 px-4 py-3 open:bg-zinc-50/60 dark:open:bg-white/[0.03]">
          <summary className="flex items-center gap-3 cursor-pointer list-none">
            <span className="font-semibold text-zinc-900 dark:text-zinc-100 w-14 tabular-nums text-sm">{c.ticker}</span>
            <span className="text-sm text-zinc-700 dark:text-zinc-300 flex-1">{c.thesis}</span>
            <span className="text-zinc-400 group-open:rotate-90 transition-transform shrink-0" aria-hidden>›</span>
          </summary>
          <div className="mt-2.5 pl-[4.25rem] grid sm:grid-cols-2 gap-3 text-xs">
            <p className="text-emerald-700 dark:text-emerald-400"><span className="font-semibold">Bull:</span> <span className="text-zinc-600 dark:text-zinc-400">{c.bull}</span></p>
            <p className="text-rose-700 dark:text-rose-400"><span className="font-semibold">Bear:</span> <span className="text-zinc-600 dark:text-zinc-400">{c.bear}</span></p>
          </div>
        </details>
      ))}
    </div>
  );
}

export function PrimaryVisual() {
  const [tab, setTab] = useState<Tab>('positioning');
  return (
    <div className="rounded-2xl ring-1 ring-zinc-200/80 dark:ring-white/10 bg-white/70 dark:bg-zinc-900/40 p-4 sm:p-5">
      <div role="tablist" aria-label="Landscape views" className="flex flex-wrap gap-1 mb-4 border-b border-zinc-200/80 dark:border-white/10">
        {TABS.map((t) => (
          <button key={t.key} role="tab" aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-2 text-sm font-medium -mb-px border-b-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50 rounded-t ${
              tab === t.key
                ? 'border-teal-600 text-teal-700 dark:border-teal-400 dark:text-teal-300'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}>
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'positioning' && <Positioning />}
      {tab === 'cliffs' && <Cliffs />}
      {tab === 'pipeline' && <Pipeline />}
      {tab === 'theses' && <Theses />}
    </div>
  );
}

export default PrimaryVisual;
