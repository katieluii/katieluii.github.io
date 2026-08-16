import { ArrowUpRight } from 'lucide-react';
import { SIGNALS, DATA_ASOF, landscapeHref } from '../../../data/pharmaLandscape';
import { Emph, Tk } from './ui';

/* ── The two extremes ─────────────────────────────────────────────────────────
   The read pulls two names furthest apart this quarter. Direction is carried by
   the word and the arrow glyph, never by hue; each card lists the three points
   the score rests on and names the prints behind them, and its link opens the
   full landscape ON that company (deep link), not on the masthead. */

export function Signals() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {SIGNALS.map((s) => {
        const up = s.kind === 'positive';
        return (
          <article key={s.ticker} className="flex flex-col rounded-2xl border border-[var(--hair)] bg-[var(--surface)] p-5">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--accent)]">
                {up ? '▲ ' : '▼ '}
                {s.tag}
              </span>
              <Tk>{s.ticker}</Tk>
            </div>
            <h3 className="mt-2 text-[22px] font-semibold leading-tight tracking-[-0.01em] text-[var(--ink-strong)]">{s.name}</h3>
            <p className="mt-1.5 text-[15px] leading-[1.5] text-[var(--ink)]">{s.why}</p>
            <ul className="mt-3 space-y-2 text-[14px] leading-[1.5] text-[var(--muted)]">
              {s.pts.map((p, i) => (
                <li key={i} className="flex gap-2">
                  <span aria-hidden className="mt-[9px] h-px w-3 shrink-0 bg-[var(--accent-strong)]" />
                  <span><Emph text={p} /></span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-[12px] leading-[1.5] text-[var(--faint)]">
              <span className="font-semibold text-[var(--muted)]">Provenance</span> · {s.prov}
            </p>
            <a
              href={landscapeHref(s.ticker)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex w-fit items-center gap-1 text-[13.5px] font-medium text-[var(--ink-strong)] underline decoration-[var(--hair)] underline-offset-[3px] hover:decoration-[var(--accent)]"
            >
              Open {s.ticker} in the full landscape
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
            </a>
          </article>
        );
      })}
      <p className="md:col-span-2 text-[12.5px] text-[var(--muted)]">
        The two extremes of the {DATA_ASOF} read, shown to illustrate what the score weighs: earnings momentum,
        valuation against growth, and the freshest dated catalyst. Illustrative and directional; not investment advice.
      </p>
    </div>
  );
}
