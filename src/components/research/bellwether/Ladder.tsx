import { useState } from 'react';
import { COMPANIES, onLadder, ladderLo, ladderHi, type Company } from '../../../data/pharmaLandscape';
import { EXP_LONG, ExposureLegend, ExposureMark, MULT_SHORT, expShapePath, expInk, Tk } from './ui';

/* ── The ladder ───────────────────────────────────────────────────────────────
   Bellwether's one claim is "lined up on one comparable view". The hero draws
   that claim once: every name with a clean forward P/E is set on one axis, cheap
   to rich, mark shape = cliff exposure. Names WITHOUT a clean forward multiple
   (trailing, NTM, estimated) are not mixed onto the axis; they sit in their own
   row underneath with the basis they actually carry, so the ladder never ranks
   an estimate against a reported figure. On small screens the same data renders
   as a rank list. */

const W = 800, H = 172, PAD_L = 28, PAD_R = 28, AXIS_Y = 134, LANE = 27;
const X0 = Math.floor(ladderLo - 1), X1 = Math.ceil(ladderHi + 1);
const xOf = (pe: number) => PAD_L + ((pe - X0) / (X1 - X0)) * (W - PAD_L - PAD_R);

/** label lanes: same/near multiples stack upward instead of overprinting */
function lanes(rows: Company[]): Map<string, number> {
  const out = new Map<string, number>();
  const last: number[] = [];
  const MIN = 44; // px in viewBox units between label centres on one lane
  for (const c of [...rows].sort((a, b) => (a.fpe as number) - (b.fpe as number))) {
    const x = xOf(c.fpe as number);
    let lane = 0;
    while (last[lane] !== undefined && x - last[lane] < MIN) lane++;
    last[lane] = x;
    out.set(c.ticker, lane);
  }
  return out;
}

const off = COMPANIES.filter((c) => !onLadder.includes(c));

/** marks that would overprint on the axis (within one mark width) alternate above/below it */
function markOffsets(rows: Company[]): Map<string, number> {
  const out = new Map<string, number>();
  const sorted = [...rows].sort((a, b) => (a.fpe as number) - (b.fpe as number));
  let prevX = -Infinity, k = 0;
  for (const c of sorted) {
    const x = xOf(c.fpe as number);
    if (x - prevX < 13) { k += 1; out.set(c.ticker, k % 2 ? -8 : 8); } else { k = 0; out.set(c.ticker, 0); }
    prevX = x;
  }
  return out;
}

export function Ladder() {
  const [active, setActive] = useState<string | null>(null);
  const laneOf = lanes(onLadder);
  const dyOf = markOffsets(onLadder);
  const ticks: number[] = [];
  for (let t = Math.ceil(X0 / 5) * 5; t <= X1; t += 5) ticks.push(t);
  const cur = COMPANIES.find((c) => c.ticker === active) ?? null;

  return (
    <div>
      {/* wide: the axis */}
      <div className="hidden sm:block">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          role="img"
          aria-label={`Forward P/E ladder: ${onLadder.length} of ${COMPANIES.length} companies on one axis from ${ladderLo}× to ${ladderHi}×`}
        >
          <line x1={PAD_L} y1={AXIS_Y} x2={W - PAD_R} y2={AXIS_Y} stroke="var(--hair)" strokeWidth={1.25} />
          {ticks.map((t) => (
            <g key={t}>
              <line x1={xOf(t)} y1={AXIS_Y - 4} x2={xOf(t)} y2={AXIS_Y + 4} stroke="var(--faint)" />
              <text x={xOf(t)} y={AXIS_Y + 20} textAnchor="middle" fontSize={11} fill="var(--muted)" fontFamily="inherit">{t}×</text>
            </g>
          ))}
          <text x={PAD_L} y={H - 4} fontSize={11} fill="var(--muted)" fontFamily="inherit">cheap</text>
          <text x={W - PAD_R} y={H - 4} fontSize={11} fill="var(--muted)" textAnchor="end" fontFamily="inherit">rich</text>

          {onLadder.map((c, i) => {
            const x = xOf(c.fpe as number);
            const lane = laneOf.get(c.ticker) ?? 0;
            const dy = dyOf.get(c.ticker) ?? 0;
            const ly = AXIS_Y - 28 - lane * LANE;
            const on = active === c.ticker;
            return (
              <g
                key={c.ticker}
                className="rise"
                style={{ animationDelay: `${120 + i * 45}ms`, cursor: 'pointer', outline: 'none' }}
                tabIndex={0}
                role="button"
                aria-label={`${c.name}, ${c.fpe}× forward P/E, ${c.gr} revenue growth, ${EXP_LONG[c.exp]}`}
                onMouseEnter={() => setActive(c.ticker)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(c.ticker)}
                onBlur={() => setActive(null)}
                onClick={() => setActive(on ? null : c.ticker)}
              >
                {(lane > 0 || dy !== 0) && <line x1={x} y1={AXIS_Y + dy - 8} x2={x} y2={ly + 15} stroke="var(--hair)" />}
                <path d={expShapePath(c.exp, on ? 7 : 5.5)} transform={`translate(${x} ${AXIS_Y + dy})`} fill={expInk(c.exp)} />
                <text
                  x={x}
                  y={ly}
                  textAnchor="middle"
                  fontSize={12}
                  fontWeight={on ? 700 : 600}
                  fill={on ? 'var(--accent)' : 'var(--ink-strong)'}
                  fontFamily="inherit"
                  letterSpacing="0.03em"
                >
                  {c.ticker}
                </text>
                <text x={x} y={ly + 11.5} textAnchor="middle" fontSize={10.5} fill="var(--muted)" fontFamily="inherit">{c.fpe}×</text>
                {/* generous hit target */}
                <rect x={x - 22} y={ly - 14} width={44} height={AXIS_Y - ly + 24} fill="transparent" />
              </g>
            );
          })}
        </svg>
        <div className="mt-1 flex min-h-[22px] flex-wrap items-baseline justify-between gap-x-6 gap-y-1 text-[13px]">
          <p className="text-[var(--muted)]" aria-live="polite">
            {cur ? (
              <>
                <span className="font-semibold text-[var(--ink-strong)]">{cur.name}</span>
                <span className="mx-2 text-[var(--faint)]">·</span>
                {cur.gr} revenue growth, {cur.q}
                <span className="mx-2 text-[var(--faint)]">·</span>
                {cur.loeAsset}
              </>
            ) : (
              <>Hover or focus a name for its quarter. Shape is patent-cliff exposure.</>
            )}
          </p>
          <ExposureLegend />
        </div>
      </div>

      {/* narrow: the same order as a rank list */}
      <ol className="sm:hidden divide-y divide-[var(--hair)] rounded-xl border border-[var(--hair)] bg-[var(--surface)]">
        {[...onLadder].sort((a, b) => (a.fpe as number) - (b.fpe as number)).map((c) => (
          <li key={c.ticker} className="flex items-center gap-3 px-3 py-2 text-[14px]">
            <span className="w-[4.6rem] text-[12px] text-[var(--muted)]"><ExposureMark exp={c.exp} /></span>
            <span className="w-14 font-semibold tracking-[0.03em] text-[var(--ink-strong)]">{c.ticker}</span>
            <span className="min-w-0 flex-1 truncate text-[var(--muted)]">{c.name}</span>
            <span className="tabular-nums font-medium text-[var(--ink-strong)]">{c.fpe}×</span>
          </li>
        ))}
      </ol>

      {/* off the ladder: not ranked against the forward figures */}
      {off.length > 0 && (
        <p className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-[13px] text-[var(--muted)]">
          <span>Off the ladder, no clean forward P/E, shown but not ranked:</span>
          {off.map((c) => (
            <span key={c.ticker} className="inline-flex items-center gap-1.5">
              <Tk>{c.ticker}</Tk>
              <span className="tabular-nums">~{c.pos.pe}× {MULT_SHORT[c.multipleBasis]}</span>
            </span>
          ))}
        </p>
      )}
    </div>
  );
}
