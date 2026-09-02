import { useNavigate, Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { suite, type SuiteProduct, type SuiteStatus } from '../data/suite';
import { useReveal } from '../hooks/useReveal';

/* ── Home: the suite as a ledger ────────────────────────────────────────────────
   Seven identical rows on one lettered rail. Uniformity is structural: every row
   has the same slots (letter · name + role · job · audience · status), the same
   rhythm, and the status pills share one vertical line. The names really are
   A→G, so the letters are wayfinding, printed once each. All colours are tokens
   (src/index.css) so the dark toggle needs no per-class overrides here. */

function isExternal(href: string) {
  return /^https?:\/\//.test(href);
}

/* status = text + dot SHAPE (filled / hollow / dashed). Same border on all three
   so status reads as a state, not a ranking. Hue never carries it. */
export function StatusPill({ status }: { status: SuiteStatus }) {
  const dot =
    status === 'Live'
      ? 'bg-[var(--accent-strong)]'
      : status === 'Preview'
        ? 'border-[1.5px] border-[var(--accent)]'
        : 'border-[1.5px] border-dashed border-[var(--accent)]';
  return (
    <span
      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-[var(--hair)] px-2 py-[3px] text-[11.5px] font-medium text-[var(--ink)]"
    >
      <span aria-hidden className={`inline-block h-2 w-2 rounded-full ${dot}`} />
      {status}
    </span>
  );
}

function Row({ product }: { product: SuiteProduct }) {
  const navigate = useNavigate();
  const external = isExternal(product.href);
  const open = () => {
    if (external) window.open(product.href, '_blank', 'noopener,noreferrer');
    else navigate(product.href);
  };
  const nameClass =
    'text-[19px] font-semibold leading-none tracking-[-0.01em] text-[var(--ink-strong)] rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]';

  return (
    <li
      id={`suite-${product.letter.toLowerCase()}`}
      onClick={open}
      className="group relative grid cursor-pointer grid-cols-[3.25rem_minmax(0,1fr)] items-start gap-x-3 py-5 pr-2 scroll-mt-24 transition-colors hover:bg-[var(--hover)] sm:grid-cols-[3.25rem_minmax(0,1fr)_auto] sm:pr-3"
    >
      {/* rail station: the letter sits on the hairline, ground-coloured so it interrupts it */}
      <div className="relative flex justify-center">
        <span
          aria-hidden
          className="relative z-10 -mt-[2px] bg-[var(--bg)] px-1 text-[28px] font-medium leading-none tracking-tight text-[var(--accent)] transition-colors group-hover:bg-transparent"
        >
          {product.letter}
        </span>
      </div>

      <div className="min-w-0">
        <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
          <h3>
            {external ? (
              <a href={product.href} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className={nameClass}>
                {product.name}
              </a>
            ) : (
              <Link to={product.href} onClick={(e) => e.stopPropagation()} className={nameClass}>
                {product.name}
              </Link>
            )}
          </h3>
          <span className="text-[14px] text-[var(--muted)]">{product.role}</span>
        </div>
        <p className="mt-2 text-[14px] leading-[1.55] text-[var(--ink)] line-clamp-5 sm:line-clamp-3">{product.job}</p>
        <p className="mt-1.5 text-[12.5px] text-[var(--faint)]">For {product.audience}</p>
      </div>

      <div className="col-start-2 mt-3 flex items-center gap-2 sm:col-start-auto sm:mt-0 sm:pt-[3px]">
        <StatusPill status={product.status} />
        <ArrowUpRight
          aria-hidden
          className="h-4 w-4 text-[var(--faint)] transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[var(--accent)]"
        />
      </div>
    </li>
  );
}

export function SuiteLedger() {
  const ref = useReveal<HTMLUListElement>();
  return (
    <div className="relative">
      {/* the rail: one continuous hairline behind the seven letters */}
      <div aria-hidden className="absolute bottom-3 left-[1.625rem] top-3 w-px bg-[var(--hair)]" />
      <ul ref={ref} className="stagger relative divide-y divide-[var(--hair)]">
        {suite.map((p) => (
          <Row key={p.letter} product={p} />
        ))}
      </ul>
    </div>
  );
}
