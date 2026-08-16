import { KEYSTONE, KEYSTONE_INTRO } from '../../../data/pharmaLandscape';
import { Tk } from './ui';

/* ── How a name is routed ─────────────────────────────────────────────────────
   The page's central claim is that each company goes to the engine that fits how
   it should be valued. This shows it: two names in the same race, the verbatim
   classifier reason for each, and what each engine then does. The biotech trace
   is here to make the fork visible; it is not one of the 13 on the sheet. */

export function Routing() {
  return (
    <div>
      <p className="max-w-2xl text-[15px] leading-[1.6] text-[var(--muted)]">{KEYSTONE_INTRO}</p>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {KEYSTONE.map((k) => (
          <article key={k.ticker} className="rounded-2xl border border-[var(--hair)] bg-[var(--surface)] p-5">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--accent)]">
                {k.kind === 'largecap' ? 'Large-cap · on the sheet' : 'Biotech · shown for the fork'}
              </span>
              <Tk>{k.ticker}</Tk>
            </div>
            <h3 className="mt-2 text-[18px] font-semibold leading-tight text-[var(--ink-strong)]">{k.name}</h3>
            <dl className="mt-3 space-y-3 text-[13.5px] leading-[1.5]">
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--faint)]">Classifier said</dt>
                <dd className="mt-0.5 rounded-md border border-[var(--hair)] bg-[var(--bg)] px-2.5 py-1.5 text-[13px] text-[var(--ink)]">
                  “{k.classifyReason}”
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--faint)]">Routed to</dt>
                <dd className="mt-0.5 text-[var(--ink)]">
                  <span className="font-semibold text-[var(--ink-strong)]">{k.engine}</span>
                  <span className="block text-[var(--muted)]">{k.engineDesc}</span>
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--faint)]">Decomposed as</dt>
                <dd className="mt-0.5 text-[var(--muted)]">{k.decompose}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--faint)]">Read on</dt>
                <dd className="mt-0.5 text-[var(--muted)]">{k.score}</dd>
              </div>
            </dl>
            <p className="mt-4 text-[12px] leading-[1.5] text-[var(--faint)]">
              <span className="font-semibold text-[var(--muted)]">Provenance</span> · {k.provenance}
              {k.provenanceNote && <> · <em>{k.provenanceNote}</em></>}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
