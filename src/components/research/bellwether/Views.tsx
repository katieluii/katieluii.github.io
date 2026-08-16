import { useRef, useState, type KeyboardEvent } from 'react';
import { ArrowUpRight } from 'lucide-react';
import {
  COMPANIES, CONVERGENCE, DOMINANT, DOMINANT_MIN, ERAS, UNIVERSE, offLadder, landscapeHref,
  type Company, type EraKey, type Exposure,
} from '../../../data/pharmaLandscape';
import { EXP_LONG, ExposureLegend, ExposureMark, MULT_SHORT, Tk, expInk, expShapePath } from './ui';

/* ── The map: one tabbed view, four cuts ──────────────────────────────────────
   Positioning (P/E × growth) · Patent cliffs (by era) · Pipeline crowding ·
   Company theses (with the latest dated development). Tabs follow the ARIA
   pattern: roving tabindex, arrow keys, tabpanel/aria-controls pairing. Marks:
   shape = exposure, dashed outline = estimated multiple — the same two rules as
   the ladder and the screener. */

type Tab = 'positioning' | 'cliffs' | 'pipeline' | 'theses';
const TABS: { key: Tab; label: string }[] = [
  { key: 'positioning', label: 'Positioning' },
  { key: 'cliffs', label: 'Patent cliffs' },
  { key: 'pipeline', label: 'Pipeline crowding' },
  { key: 'theses', label: 'Company theses' },
];

// ── scatter geometry ─────────────────────────────────────────────────────────
const W = 800, H = 440, L = 58, R = 24, T = 26, B = 46;
const X_MIN = 6, X_MAX = 36, Y_MIN = -10, Y_MAX = 60;
const xScale = (pe: number) => L + ((pe - X_MIN) / (X_MAX - X_MIN)) * (W - L - R);
const yScale = (g: number) => (H - B) - ((g - Y_MIN) / (Y_MAX - Y_MIN)) * (H - B - T);
const median = (xs: number[]) => { const s = [...xs].sort((a, b) => a - b); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const PEER_MEDIAN = median(COMPANIES.filter((c) => c.multipleBasis === 'forward').map((c) => c.pos.pe));

/** greedy label placement: try a few offsets around the mark until the label box clears
    every label already placed (labels are ~11px tall, ~7px per character wide) */
function labelOffsets(): Map<string, { dx: number; dy: number }> {
  const out = new Map<string, { dx: number; dy: number }>();
  const placed: { x0: number; x1: number; y0: number; y1: number }[] = [];
  const cands = [[0, -13], [0, 15], [22, -6], [-22, -6], [0, -26], [0, 27], [26, 8], [-26, 8]];
  const rows = [...COMPANIES].sort((a, b) => a.pos.pe - b.pos.pe);
  for (const c of rows) {
    const cx = xScale(c.pos.pe), cy = yScale(c.pos.g);
    const w = c.ticker.length * 7 + 4, h = 12;
    let pick = cands[0];
    for (const [dx, dy] of cands) {
      const box = { x0: cx + dx - w / 2, x1: cx + dx + w / 2, y0: cy + dy - h, y1: cy + dy + 2 };
      const clear = placed.every((p) => box.x1 < p.x0 || box.x0 > p.x1 || box.y1 < p.y0 || box.y0 > p.y1);
      if (clear) { pick = [dx, dy]; break; }
    }
    placed.push({ x0: cx + pick[0] - w / 2, x1: cx + pick[0] + w / 2, y0: cy + pick[1] - h, y1: cy + pick[1] + 2 });
    out.set(c.ticker, { dx: pick[0], dy: pick[1] });
  }
  return out;
}
const LABEL_AT = labelOffsets();

function Positioning() {
  const [active, setActive] = useState<string | null>(null);
  const cur = COMPANIES.find((c) => c.ticker === active) ?? null;
  const xTicks = [10, 15, 20, 25, 30, 35];
  const yTicks = [0, 20, 40, 60];
  return (
    <div>
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label={`Positioning: P/E versus revenue growth for ${UNIVERSE} large-cap pharma companies`}
          className="w-full min-w-[480px]"
          onClick={(e) => { if (e.target === e.currentTarget) setActive(null); }}
        >
          <line x1={L} y1={T} x2={L} y2={H - B} stroke="var(--hair)" />
          <line x1={L} y1={H - B} x2={W - R} y2={H - B} stroke="var(--hair)" />
          <line x1={xScale(PEER_MEDIAN)} y1={T} x2={xScale(PEER_MEDIAN)} y2={H - B} stroke="var(--faint)" strokeDasharray="4 4" />
          <text x={xScale(PEER_MEDIAN)} y={T - 8} textAnchor="middle" fontSize={11} fill="var(--muted)" fontFamily="inherit">
            {PEER_MEDIAN.toFixed(1)}× forward-P/E median
          </text>
          {xTicks.map((t) => (
            <g key={`x${t}`}>
              <line x1={xScale(t)} y1={H - B} x2={xScale(t)} y2={H - B + 4} stroke="var(--faint)" />
              <text x={xScale(t)} y={H - B + 17} textAnchor="middle" fontSize={11} fill="var(--muted)" fontFamily="inherit">{t}×</text>
            </g>
          ))}
          {yTicks.map((t) => (
            <g key={`y${t}`}>
              <line x1={L - 4} y1={yScale(t)} x2={L} y2={yScale(t)} stroke="var(--faint)" />
              <text x={L - 8} y={yScale(t) + 4} textAnchor="end" fontSize={11} fill="var(--muted)" fontFamily="inherit">{t}%</text>
              {t === 0 && <line x1={L} y1={yScale(0)} x2={W - R} y2={yScale(0)} stroke="var(--hair)" strokeDasharray="2 4" />}
            </g>
          ))}
          <text x={(L + W - R) / 2} y={H - 6} textAnchor="middle" fontSize={11.5} fill="var(--muted)" fontFamily="inherit">
            P/E (dashed outline = estimated, not a clean forward figure)
          </text>
          <text transform={`translate(14 ${(T + H - B) / 2}) rotate(-90)`} textAnchor="middle" fontSize={11.5} fill="var(--muted)" fontFamily="inherit">
            Revenue growth, stated basis
          </text>

          {COMPANIES.map((c) => {
            const cx = xScale(c.pos.pe), cy = yScale(c.pos.g);
            const on = active === c.ticker;
            const est = c.multipleBasis !== 'forward';
            return (
              <g
                key={c.ticker}
                tabIndex={0}
                role="button"
                aria-pressed={on}
                aria-label={`${c.name}: ${c.gr} growth, ${c.pos.pe}× ${MULT_SHORT[c.multipleBasis]} P/E, ${EXP_LONG[c.exp]}`}
                onMouseEnter={() => setActive(c.ticker)}
                onMouseLeave={() => setActive((a) => (a === c.ticker ? null : a))}
                onFocus={() => setActive(c.ticker)}
                onBlur={() => setActive(null)}
                onClick={(e) => { e.stopPropagation(); setActive(on ? null : c.ticker); }}
                style={{ cursor: 'pointer', outline: 'none' }}
              >
                <circle cx={cx} cy={cy} r={16} fill="transparent" />
                <path
                  d={expShapePath(c.exp, on ? 8 : 6.5)}
                  transform={`translate(${cx} ${cy})`}
                  fill={est ? 'var(--bg)' : expInk(c.exp)}
                  stroke={expInk(c.exp)}
                  strokeWidth={est ? 1.75 : on ? 1.5 : 0}
                  strokeDasharray={est ? '3 2' : undefined}
                />
                {(() => { const o = LABEL_AT.get(c.ticker) ?? { dx: 0, dy: -13 }; return (
                  <text x={cx + o.dx} y={cy + o.dy} textAnchor="middle" fontSize={11} fontWeight={on ? 700 : 600} fill={on ? 'var(--accent)' : 'var(--ink-strong)'} fontFamily="inherit" letterSpacing="0.03em" style={{ pointerEvents: 'none' }}>
                    {c.ticker}
                  </text>
                ); })()}
              </g>
            );
          })}
        </svg>
      </div>
      <div className="mt-2 flex min-h-[22px] flex-wrap items-baseline justify-between gap-x-6 gap-y-1 text-[13px]">
        <p className="text-[var(--muted)]" aria-live="polite">
          {cur ? (
            <>
              <span className="font-semibold text-[var(--ink-strong)]">{cur.name}</span>
              <span className="mx-2 text-[var(--faint)]">·</span>
              {cur.gr} · ~{cur.pos.pe}× {MULT_SHORT[cur.multipleBasis]} P/E
              <span className="mx-2 text-[var(--faint)]">·</span>
              {EXP_LONG[cur.exp]}
            </>
          ) : (
            <>Tap, hover or focus a point. The market pays for growth it believes in; the cliff names cluster cheap and flat.</>
          )}
        </p>
        <ExposureLegend />
      </div>
      {offLadder.length > 0 && (
        <p className="mt-1.5 text-[12px] text-[var(--faint)]">
          {offLadder.join(', ')} carry no clean forward P/E and are plotted on the multiple they do state (dashed).
        </p>
      )}
    </div>
  );
}

function Cliffs() {
  const order: Exposure[] = ['high', 'med', 'low'];
  const eraKeys: EraKey[] = ['now', '2026-28', '2029-31'];
  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-3">
        {eraKeys.map((k) => {
          const names = COMPANIES.filter((c) => c.era === k).sort((a, b) => order.indexOf(a.exp) - order.indexOf(b.exp));
          return (
            <div key={k} className="rounded-xl border border-[var(--hair)] bg-[var(--surface)] p-4">
              <div className="mb-2.5 flex items-baseline justify-between gap-2">
                <span className="text-[14px] font-semibold text-[var(--ink-strong)] tabular-nums">{ERAS[k].yr}</span>
                <span className="text-[11px] uppercase tracking-[0.06em] text-[var(--muted)]">{ERAS[k].cap}</span>
              </div>
              <ul className="space-y-2">
                {names.map((c) => (
                  <li key={c.ticker} className="flex items-start gap-2 text-[13.5px]">
                    <span className="mt-[3px]"><ExposureMark exp={c.exp} word={false} /></span>
                    <span className="min-w-0">
                      <span className="font-semibold tracking-[0.03em] text-[var(--ink-strong)]">{c.ticker}</span>
                      <span className="ml-2 text-[12px] text-[var(--muted)]">{EXP_LONG[c.exp].split(' ')[0]}</span>
                      <span className="block text-[12.5px] leading-snug text-[var(--muted)]">{c.loeAsset}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
      <ExposureLegend className="mt-3" />
    </div>
  );
}

function Pipeline() {
  const maxN = Math.max(...CONVERGENCE.map((t) => t.n));
  const ranked = [...CONVERGENCE].sort((a, b) => b.n - a.n);
  return (
    <div>
      <p className="mb-3 text-[13px] text-[var(--muted)]">
        Named pipeline assets aggregated across all {UNIVERSE} profiles. A bet counts as dominant when it draws in at least
        {' '}{DOMINANT_MIN} of {UNIVERSE} names; {DOMINANT.length} do.
      </p>
      <div className="space-y-3">
        {ranked.map((t) => {
          const dominant = DOMINANT.includes(t);
          return (
            <div key={t.name} className="rounded-xl border border-[var(--hair)] bg-[var(--surface)] p-4">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-[14.5px] font-semibold text-[var(--ink-strong)]">
                  {t.name}
                  {dominant && <span className="ml-2 text-[10.5px] font-semibold uppercase tracking-[0.06em] text-[var(--accent)]">dominant</span>}
                </span>
                <span className="shrink-0 text-[12.5px] tabular-nums text-[var(--muted)]">{t.n} of {UNIVERSE}</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--hover)]">
                <div className="h-full rounded-full bg-[var(--accent-strong)]" style={{ width: `${(t.n / maxN) * 100}%` }} />
              </div>
              <p className="mt-2 text-[13px] leading-[1.5] text-[var(--muted)]">{t.desc}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {t.tk.map((tk) => <Tk key={tk}>{tk}</Tk>)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Theses() {
  return (
    <div className="space-y-2">
      {COMPANIES.map((c: Company) => (
        <details key={c.ticker} className="group rounded-xl border border-[var(--hair)] bg-[var(--surface)] px-4 py-3 open:bg-[var(--hover)]">
          <summary className="flex cursor-pointer list-none items-start gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] rounded-sm">
            <span className="w-14 shrink-0 text-[13.5px] font-semibold tracking-[0.03em] text-[var(--ink-strong)]">{c.ticker}</span>
            <span className="flex-1 text-[14px] leading-[1.5] text-[var(--ink)]">{c.thesis}</span>
            <span className="shrink-0 text-[var(--faint)] transition-transform group-open:rotate-90" aria-hidden>›</span>
          </summary>
          <div className="mt-3 grid gap-3 pl-[4.25rem] text-[13px] leading-[1.5] sm:grid-cols-2">
            <p><span className="font-semibold text-[var(--ink-strong)]">Bull</span> <span className="text-[var(--muted)]">{c.bull}</span></p>
            <p><span className="font-semibold text-[var(--ink-strong)]">Bear</span> <span className="text-[var(--muted)]">{c.bear}</span></p>
          </div>
          {c.dev.length > 0 && (
            <ul className="mt-3 space-y-1 pl-[4.25rem] text-[12.5px] leading-[1.5] text-[var(--muted)]">
              {c.dev.slice(0, 3).map(([d, e], i) => (
                <li key={i} className="flex gap-2">
                  <span className="w-[4.5rem] shrink-0 tabular-nums text-[var(--faint)]">{d}</span>
                  <span>{e}</span>
                </li>
              ))}
            </ul>
          )}
          <a href={landscapeHref(c.ticker)} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1 pl-[4.25rem] text-[12.5px] font-medium text-[var(--ink-strong)] underline decoration-[var(--hair)] underline-offset-[3px] hover:decoration-[var(--accent)]">
            Full {c.ticker} read <ArrowUpRight className="h-3 w-3" aria-hidden />
          </a>
        </details>
      ))}
    </div>
  );
}

export function Views() {
  const [tab, setTab] = useState<Tab>('positioning');
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const onKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const n = TABS.length;
    let next: number | null = null;
    if (e.key === 'ArrowRight') next = (i + 1) % n;
    if (e.key === 'ArrowLeft') next = (i - 1 + n) % n;
    if (e.key === 'Home') next = 0;
    if (e.key === 'End') next = n - 1;
    if (next !== null) { e.preventDefault(); setTab(TABS[next].key); tabRefs.current[next]?.focus(); }
  };
  return (
    <div className="rounded-2xl border border-[var(--hair)] bg-[var(--surface)] p-4 sm:p-5">
      <div role="tablist" aria-label="Landscape views" className="mb-4 flex flex-wrap gap-1 border-b border-[var(--hair)]">
        {TABS.map((t, i) => {
          const on = tab === t.key;
          return (
            <button
              key={t.key}
              ref={(el) => { tabRefs.current[i] = el; }}
              id={`bw-tab-${t.key}`}
              role="tab"
              type="button"
              aria-selected={on}
              aria-controls={`bw-panel-${t.key}`}
              tabIndex={on ? 0 : -1}
              onClick={() => setTab(t.key)}
              onKeyDown={(e) => onKey(e, i)}
              className={`-mb-px rounded-t border-b-2 px-3 py-2 text-[14px] font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
                on ? 'border-[var(--accent-strong)] text-[var(--ink-strong)]' : 'border-transparent text-[var(--muted)] hover:text-[var(--ink-strong)]'
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>
      {TABS.map((t) => (
        <div key={t.key} role="tabpanel" id={`bw-panel-${t.key}`} aria-labelledby={`bw-tab-${t.key}`} hidden={tab !== t.key}>
          {tab === t.key && (
            t.key === 'positioning' ? <Positioning /> :
            t.key === 'cliffs' ? <Cliffs /> :
            t.key === 'pipeline' ? <Pipeline /> : <Theses />
          )}
        </div>
      ))}
    </div>
  );
}
