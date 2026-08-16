import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';
import { StatusPill } from './SuiteLedger';
import { suite, type SuiteProduct } from '../data/suite';

/* ── Product page frame on the Renascor tokens ────────────────────────────────
   The home page sets the palette (bone ground, green-deep ink, brass accent, one
   family) and the suite ledger sets the wayfinding (a lettered A→G rail). A product
   page continues both: the same top bar, the rail letter as the first thing on the
   page, the product's role/audience/status exactly as the ledger printed them, and
   a stamp row the page fills with whatever its own freshness contract is.
   All colours are tokens from src/index.css so the dark toggle needs no overrides. */

const navLink = 'text-[13.5px] text-[var(--muted)] transition-colors hover:text-[var(--ink-strong)]';

export function productByLetter(letter: string): SuiteProduct | undefined {
  return suite.find((p) => p.letter === letter);
}

type Props = {
  letter: string;
  /** one line under the name; defaults to the ledger's role */
  tagline?: string;
  /** the freshness / provenance stamps — rendered as a definition list under the masthead */
  stamps?: { label: string; value: ReactNode; title?: string }[];
  children: ReactNode;
  /** container measure for the main column */
  measure?: 'prose' | 'wide';
};

export function SuitePageLayout({ letter, tagline, stamps, children, measure = 'wide' }: Props) {
  const product = productByLetter(letter);
  const width = measure === 'wide' ? 'max-w-4xl' : 'max-w-3xl';

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      <header className="border-b border-[var(--hair)]">
        <div className={`mx-auto flex ${width} items-center justify-between gap-6 px-6 py-5`}>
          <Link to="/" className="text-[17px] font-semibold leading-none tracking-[-0.01em] text-[var(--ink-strong)]">
            Katie Lui
          </Link>
          <nav className="flex items-center gap-5">
            <Link to="/#suite" className={navLink}>Suite</Link>
            <Link to="/projects" className={navLink}>All projects</Link>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <div className={`mx-auto ${width} px-6`}>
        {/* masthead: rail letter · name · role / audience · status */}
        <div className="grid grid-cols-[3.25rem_minmax(0,1fr)] items-start gap-x-3 pt-10 sm:grid-cols-[3.25rem_minmax(0,1fr)_auto]">
          <div className="flex justify-center">
            <span aria-hidden className="-mt-[6px] text-[40px] font-medium leading-none tracking-tight text-[var(--accent)]">
              {letter}
            </span>
            <span className="sr-only">Suite product {letter}</span>
          </div>
          <div className="min-w-0">
            <h1 className="text-[34px] font-semibold leading-none tracking-[-0.022em] text-[var(--ink-strong)] sm:text-[40px]">
              {product?.name ?? letter}
            </h1>
            <p className="mt-2 text-[15px] leading-[1.5] text-[var(--muted)]">
              {tagline ?? product?.role}
              {product?.audience && (
                <>
                  <span className="mx-2 text-[var(--faint)]">·</span>
                  for {product.audience}
                </>
              )}
            </p>
          </div>
          {product && (
            <div className="col-start-2 mt-3 sm:col-start-3 sm:mt-1.5">
              <StatusPill status={product.status} />
            </div>
          )}
        </div>

        {stamps && stamps.length > 0 && (
          <dl className="mt-7 grid grid-cols-2 gap-x-6 gap-y-3 border-y border-[var(--hair)] py-4 sm:grid-cols-4">
            {stamps.map((s) => (
              <div key={s.label} className="min-w-0" title={s.title}>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--faint)]">{s.label}</dt>
                <dd className="mt-0.5 truncate text-[14px] font-medium tabular-nums text-[var(--ink-strong)]">{s.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>

      <main className={`mx-auto ${width} px-6 pb-16`}>{children}</main>

      <footer className="border-t border-[var(--hair)]">
        <div className={`mx-auto flex ${width} flex-col gap-3 px-6 py-8 text-[12.5px] text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between`}>
          <p>© 2026 Katie Lui. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <Link to="/#suite" className="underline decoration-[var(--hair)] underline-offset-[3px] hover:text-[var(--ink-strong)] hover:decoration-[var(--accent)]">The suite</Link>
            <a href="mailto:katie@renascor.xyz" className="underline decoration-[var(--hair)] underline-offset-[3px] hover:text-[var(--ink-strong)] hover:decoration-[var(--accent)]">katie@renascor.xyz</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default SuitePageLayout;
