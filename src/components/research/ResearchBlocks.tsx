import type { ReactNode } from 'react';
import { ArrowRight, GitBranch, ShieldCheck } from 'lucide-react';
import { FINDINGS, KEYSTONE, KEYSTONE_INTRO, FULL_LANDSCAPE_ROUTE, type Finding, type TracedName } from '../../data/pharmaLandscape';

/* Case-study building blocks for the pharma equity-research page.
   All read from the shared pharmaLandscape source. */

const KIND_STYLE = {
  positive: 'text-emerald-700 dark:text-emerald-400 ring-emerald-600/20 bg-emerald-50/60 dark:bg-emerald-500/[0.07]',
  negative: 'text-rose-700 dark:text-rose-400 ring-rose-600/20 bg-rose-50/60 dark:bg-rose-500/[0.07]',
  structural: 'text-indigo-700 dark:text-indigo-400 ring-indigo-600/20 bg-indigo-50/60 dark:bg-indigo-500/[0.07]',
} as const;

export function KeyFindingCard({ f }: { f: Finding }) {
  return (
    <a href={FULL_LANDSCAPE_ROUTE}
      className={`group block rounded-2xl ring-1 p-5 transition-all hover:-translate-y-0.5 hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50 ${KIND_STYLE[f.kind]}`}>
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-[10.5px] font-semibold uppercase tracking-wide">{f.label}</span>
      </div>
      <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 leading-tight">{f.headline}</h3>
      <p className="mt-1.5 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{f.detail}</p>
      <p className="mt-2.5 text-[13px] font-medium text-zinc-800 dark:text-zinc-200">{f.proof}</p>
      <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium opacity-80 group-hover:opacity-100">
        See the supporting analysis <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
      </span>
    </a>
  );
}

export function KeyFindings() {
  return (
    <div className="grid md:grid-cols-3 gap-3">
      {FINDINGS.map((f) => <KeyFindingCard key={f.key} f={f} />)}
    </div>
  );
}

// ── Keystone: routing made visible ──────────────────────────────────────────
function TraceRow({ step, children }: { step: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[5.5rem_1fr] gap-3 py-2 border-t border-zinc-200/70 dark:border-white/10 first:border-t-0">
      <span className="text-[10.5px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500 pt-0.5">{step}</span>
      <div className="text-[13px] text-zinc-700 dark:text-zinc-300 leading-relaxed">{children}</div>
    </div>
  );
}

function TraceColumn({ t }: { t: TracedName }) {
  const accent = t.kind === 'largecap' ? 'text-sky-700 dark:text-sky-400' : 'text-violet-700 dark:text-violet-400';
  const ring = t.kind === 'largecap' ? 'ring-sky-600/20' : 'ring-violet-600/20';
  return (
    <div className={`rounded-2xl ring-1 ${ring} bg-white/70 dark:bg-zinc-900/40 p-5`}>
      <div className="flex items-baseline gap-2">
        <span className="font-bold text-zinc-900 dark:text-zinc-100">{t.name}</span>
        <span className="text-xs text-zinc-400 tabular-nums">{t.ticker}</span>
      </div>
      <p className={`mt-0.5 text-xs font-semibold ${accent}`}>{t.kind === 'largecap' ? 'Large-cap' : 'Clinical-stage biotech'}</p>
      <div className="mt-3">
        <TraceRow step="Classify"><span className="text-zinc-500 dark:text-zinc-400">router →</span> <span className="font-medium">{t.kind}</span> <span className="text-zinc-500 dark:text-zinc-400">— {t.classifyReason}</span></TraceRow>
        <TraceRow step="Route"><span className={`font-semibold ${accent}`}>{t.engine}</span><br /><span className="text-zinc-500 dark:text-zinc-400">{t.engineDesc}</span></TraceRow>
        <TraceRow step="Decompose">{t.decompose}</TraceRow>
        <TraceRow step="Score">{t.score}</TraceRow>
        <TraceRow step="Provenance"><span className="text-zinc-600 dark:text-zinc-400">{t.provenance}</span>{t.provenanceNote && <span className="ml-1 text-[10.5px] font-medium text-zinc-400 dark:text-zinc-500">({t.provenanceNote})</span>}</TraceRow>
      </div>
    </div>
  );
}

export function TracedNameKeystone() {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1.5">
        <GitBranch className="w-4 h-4 text-teal-600 dark:text-teal-400" />
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">The routing, traced end-to-end</h2>
      </div>
      <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-2xl mb-4">{KEYSTONE_INTRO}</p>
      <div className="grid md:grid-cols-2 gap-3">
        {KEYSTONE.map((t) => <TraceColumn key={t.ticker} t={t} />)}
      </div>
    </div>
  );
}

// ── Compact workflow strip ──────────────────────────────────────────────────
const WORKFLOW: { step: string; hard: string }[] = [
  { step: 'Classify', hard: 'company routing' },
  { step: 'Extract', hard: 'catalyst + fact capture' },
  { step: 'Model', hard: 'valuation-engine routing' },
  { step: 'Compare', hard: 'cross-company normalisation' },
  { step: 'Cite', hard: 'provenance + freshness' },
];

export function WorkflowStrip() {
  return (
    <div className="rounded-2xl ring-1 ring-zinc-200/80 dark:ring-white/10 bg-zinc-50/60 dark:bg-white/[0.02] p-4 sm:p-5">
      <div className="flex flex-wrap items-stretch gap-y-3">
        {WORKFLOW.map((w, i) => (
          <div key={w.step} className="flex items-center">
            <div className="text-center px-1">
              <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{w.step}</div>
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 max-w-[7.5rem]">{w.hard}</div>
            </div>
            {i < WORKFLOW.length - 1 && <ArrowRight className="w-4 h-4 text-zinc-300 dark:text-zinc-600 mx-1 sm:mx-2 shrink-0" />}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Provenance as a named feature ───────────────────────────────────────────
export function ProvenanceCallout() {
  return (
    <div className="rounded-2xl ring-1 ring-teal-600/20 bg-teal-50/50 dark:bg-teal-500/[0.06] p-5 flex gap-4">
      <ShieldCheck className="w-6 h-6 text-teal-600 dark:text-teal-400 shrink-0" />
      <div>
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Every claim traces to a dated source</h3>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-2xl">
          Each number and event carries a provenance tag — the reported quarter, filing or readout it came from — and the system
          keeps sourced facts separate from the conclusions it generates. Valuation inputs are marked as reported, consensus, or estimated.
        </p>
      </div>
    </div>
  );
}

// ── Validation & limitations ────────────────────────────────────────────────
export function MethodologySummary({ asOf, offLadder }: { asOf: string; offLadder: string[] }) {
  const rows: { k: string; v: ReactNode }[] = [
    { k: 'Data cut-off', v: `${asOf} — the latest quarter reported across all 13 names. A fixed, reviewed sample run, not a live feed.` },
    { k: 'Sources', v: 'Company IR + filings first, then reputable financial press and broker consensus. Multiples span different brokers, dates and currencies, so they read as directional, not precise comparables.' },
    { k: 'Freshness', v: 'A scheduled sweep re-checks valuation and catalysts; the page shows a "last reviewed" date distinct from the data quarter, so a refresh can never imply newer data than the underlying disclosures.' },
    { k: 'Human review', v: 'Model-generated conclusions (theses, signals) are reviewed before publication; unreviewed or low-confidence calls stay internal.' },
    { k: 'Fact vs conclusion', v: 'Reported figures, calculated metrics, and model-generated conclusions are visually distinct — the system does not present its own inference as a sourced fact.' },
    { k: 'Known limitations', v: `${offLadder.join(', ')} carry no clean forward P/E and are excluded from the precise valuation ladder (shown as estimated on positioning). Directional and educational — not investment advice.` },
  ];
  return (
    <dl className="rounded-2xl ring-1 ring-zinc-200/80 dark:ring-white/10 divide-y divide-zinc-200/70 dark:divide-white/10">
      {rows.map((r) => (
        <div key={r.k} className="grid sm:grid-cols-[8.5rem_1fr] gap-1 sm:gap-4 px-5 py-3">
          <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 pt-0.5">{r.k}</dt>
          <dd className="text-[13px] text-zinc-600 dark:text-zinc-400 leading-relaxed">{r.v}</dd>
        </div>
      ))}
    </dl>
  );
}
