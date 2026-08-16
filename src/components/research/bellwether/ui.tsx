import type { ReactNode } from 'react';
import type { Exposure, GrowthBasis, MultipleBasis } from '../../../data/pharmaLandscape';

/* ── Shared Bellwether primitives ─────────────────────────────────────────────
   Patent-cliff exposure is read by SHAPE + a word, never hue alone (the owner is
   red-green colour-blind and the site's own rule says so). Estimated multiples are
   read the same one way everywhere: a dashed outline in charts, "est." in text. */

export const EXP_WORD: Record<Exposure, string> = { high: 'High', med: 'Medium', low: 'Low' };
export const EXP_LONG: Record<Exposure, string> = {
  high: 'High patent-cliff exposure',
  med: 'Medium exposure',
  low: 'Low or well-defended',
};

/** SVG path for the exposure shape centred on (0,0) with radius r.
    high = disc · med = diamond · low = triangle. */
export function expShapePath(exp: Exposure, r: number): string {
  if (exp === 'high') return `M ${-r} 0 a ${r} ${r} 0 1 0 ${2 * r} 0 a ${r} ${r} 0 1 0 ${-2 * r} 0`;
  if (exp === 'med') return `M 0 ${-r * 1.15} L ${r * 1.15} 0 L 0 ${r * 1.15} L ${-r * 1.15} 0 Z`;
  return `M 0 ${-r * 1.2} L ${r * 1.15} ${r * 0.9} L ${-r * 1.15} ${r * 0.9} Z`;
}

/** the mark's ink: exposure sits on the ink/brass/muted scale — a secondary cue only */
export function expInk(exp: Exposure): string {
  return exp === 'high' ? 'var(--ink-strong)' : exp === 'med' ? 'var(--accent-strong)' : 'var(--muted)';
}

/** inline mark for tables and lists (12px), with the word beside it */
export function ExposureMark({ exp, word = true, size = 12 }: { exp: Exposure; word?: boolean; size?: number }) {
  const r = size / 2 - 1.5;
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
      <svg width={size} height={size} viewBox={`${-size / 2} ${-size / 2} ${size} ${size}`} aria-hidden className="shrink-0">
        <path d={expShapePath(exp, r)} fill={expInk(exp)} />
      </svg>
      {word && <span>{EXP_WORD[exp]}</span>}
    </span>
  );
}

export function ExposureLegend({ className = '' }: { className?: string }) {
  return (
    <ul className={`flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] text-[var(--muted)] ${className}`} aria-label="Patent-cliff exposure key">
      {(['high', 'med', 'low'] as Exposure[]).map((e) => (
        <li key={e} className="inline-flex items-center gap-1.5">
          <ExposureMark exp={e} word={false} />
          {EXP_LONG[e]}
        </li>
      ))}
    </ul>
  );
}

export const BASIS_SHORT: Record<GrowthBasis, string> = {
  reported: 'reported',
  'constant currency': 'cc',
  underlying: 'underlying',
  operational: 'op',
};
export const MULT_SHORT: Record<MultipleBasis, string> = {
  forward: 'fwd',
  estimated: 'est.',
};

/** a quiet basis tag next to a figure: how the number is stated */
export function BasisTag({ children, title }: { children: ReactNode; title?: string }) {
  return (
    <span
      title={title}
      className="ml-1.5 inline-block rounded-[4px] border border-[var(--hair)] px-1 py-px align-middle text-[10px] font-medium leading-none tracking-[0.02em] text-[var(--muted)]"
    >
      {children}
    </span>
  );
}

/** ticker chip: one family, weight and tracking do the work */
export function Tk({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span className={`inline-block rounded-[4px] border border-[var(--hair)] bg-[var(--surface)] px-1.5 py-[1px] text-[11.5px] font-semibold uppercase tracking-[0.04em] text-[var(--ink-strong)] ${className}`}>
      {children}
    </span>
  );
}

/** Render source text that may contain <b>…</b> (from the landscape) as real emphasis.
    Only <b> is honoured; everything else is printed literally. */
export function Emph({ text }: { text: string }) {
  const parts = text.split(/(<b>[\s\S]*?<\/b>)/g).filter(Boolean);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith('<b>') ? (
          <strong key={i} className="font-semibold text-[var(--ink-strong)]">{p.slice(3, -4)}</strong>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  );
}

export const btnPrimary =
  'inline-flex items-center gap-2 rounded-full bg-[var(--btn-bg)] px-4 py-2 text-[14px] font-medium text-[var(--btn-fg)] shadow-sm transition-[filter] hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--accent)]';
export const btnQuiet =
  'inline-flex items-center gap-2 rounded-full border border-[var(--hair)] px-4 py-2 text-[14px] font-medium text-[var(--ink-strong)] transition-colors hover:bg-[var(--hover)] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--accent)]';

export function SectionTitle({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
      <h2 className="text-[22px] font-semibold leading-tight tracking-[-0.01em] text-[var(--ink-strong)]">{children}</h2>
      {aside && <span className="text-[12.5px] text-[var(--muted)]">{aside}</span>}
    </div>
  );
}
