import { useState } from 'react';
import { ArrowRight, ArrowUpDown } from 'lucide-react';
import { COMPANIES, CONVERGENCE, FINDINGS, FULL_LANDSCAPE_ROUTE, type Company, type Exposure } from '../../data/pharmaLandscape';

/* The two actionable treatments for the Bellwether page: a reader-driven screener
   and ranked signal cards. Both read from the shared pharmaLandscape source. */

const EXP_COLOR: Record<Exposure, string> = { high: '#e5484d', med: '#f5a524', low: '#30a46c' };

// how many of the three most-crowded modalities a company sits in
const CROWDED = CONVERGENCE.slice(0, 3);
const crowdCount = (c: Company) => CROWDED.filter((t) => t.tk.includes(c.ticker)).length;

// ── Screener the reader drives ──────────────────────────────────────────────
type Filter = 'all' | 'rerate' | 'cliff' | 'crowd';
const FILTERS: { key: Filter; label: string; match: (c: Company) => boolean }[] = [
  { key: 'all', label: 'All 13', match: () => true },
  { key: 'rerate', label: 'Cheap + growing', match: (c) => c.pos.g >= 8 && c.pos.pe <= 18 },
  { key: 'cliff', label: 'Cliff risk', match: (c) => c.exp === 'high' && c.era !== '2029-31' && c.pos.g < 6 },
  { key: 'crowd', label: 'Crowded', match: (c) => crowdCount(c) >= 2 },
];
type SortKey = 'g' | 'pe';

export function ActionScreener() {
  const [filter, setFilter] = useState<Filter>('all');
  const [sort, setSort] = useState<SortKey>('g');
  const rows = COMPANIES.filter(FILTERS.find((f) => f.key === filter)!.match)
    .slice()
    .sort((a, b) => (sort === 'g' ? b.pos.g - a.pos.g : a.pos.pe - b.pos.pe));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50 ${
              filter === f.key ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900' : 'bg-zinc-100 text-zinc-600 hover:text-zinc-900 dark:bg-zinc-800 dark:text-zinc-300'
            }`}>{f.label} <span className="opacity-60 tabular-nums">{COMPANIES.filter(f.match).length}</span></button>
        ))}
      </div>
      <div className="rounded-2xl ring-1 ring-zinc-200/80 dark:ring-white/10 overflow-x-auto">
        <table className="w-full text-sm min-w-[420px]">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400 bg-zinc-50/70 dark:bg-white/[0.03]">
              <th className="px-4 py-2.5 font-semibold">Company</th>
              <th className="px-3 py-2.5 font-semibold cursor-pointer" onClick={() => setSort('g')}>
                <span className="inline-flex items-center gap-1">Growth {sort === 'g' && <ArrowUpDown className="w-3 h-3" />}</span>
              </th>
              <th className="px-3 py-2.5 font-semibold cursor-pointer" onClick={() => setSort('pe')}>
                <span className="inline-flex items-center gap-1">Fwd P/E {sort === 'pe' && <ArrowUpDown className="w-3 h-3" />}</span>
              </th>
              <th className="px-3 py-2.5 font-semibold">Cliff</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.ticker} className="border-t border-zinc-100 dark:border-white/5 hover:bg-zinc-50/60 dark:hover:bg-white/[0.02]">
                <td className="px-4 py-2.5"><span className="font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums">{c.ticker}</span> <span className="text-zinc-500 dark:text-zinc-400 text-xs">{c.name}</span></td>
                <td className="px-3 py-2.5 tabular-nums text-zinc-700 dark:text-zinc-300">{c.gr}</td>
                <td className="px-3 py-2.5 tabular-nums text-zinc-700 dark:text-zinc-300">{c.fpe != null ? `~${c.fpe}×` : `~${c.pos.pe}×*`}</td>
                <td className="px-3 py-2.5">
                  <span className="inline-flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                    <span className="inline-block w-2 h-2 rounded-full" style={{ background: EXP_COLOR[c.exp] }} />{c.era}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-zinc-500 dark:text-zinc-500">Filter to a thesis, sort by momentum or valuation. <span className="opacity-70">* estimated multiple.</span> Directional — not investment advice.</p>
    </div>
  );
}

// ── Ranked signal cards ─────────────────────────────────────────────────────
export function ActionSignals() {
  const pos = FINDINGS.find((f) => f.kind === 'positive')!;
  const neg = FINDINGS.find((f) => f.kind === 'negative')!;
  const Card = ({ f, dir }: { f: typeof pos; dir: 'up' | 'down' }) => {
    const up = dir === 'up';
    return (
      <div className={`rounded-2xl ring-1 p-5 ${up ? 'ring-emerald-600/25 bg-emerald-50/60 dark:bg-emerald-500/[0.07]' : 'ring-rose-600/25 bg-rose-50/60 dark:bg-rose-500/[0.07]'}`}>
        <div className={`flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide ${up ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
          <span>{up ? '▲ Strongest signal' : '▼ Weakest signal'}</span>
        </div>
        <h3 className="mt-1 text-xl font-bold text-zinc-900 dark:text-zinc-100">{f.headline} <span className="text-xs font-medium text-zinc-400 tabular-nums">{f.ticker}</span></h3>
        <p className="mt-1.5 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{f.detail}</p>
        <p className="mt-2.5 text-[13px] font-medium text-zinc-800 dark:text-zinc-200">{f.proof}</p>
        <a href={FULL_LANDSCAPE_ROUTE} className="mt-3 inline-flex items-center gap-1 text-xs font-medium opacity-80 hover:opacity-100">Open the read <ArrowRight className="w-3.5 h-3.5" /></a>
      </div>
    );
  };
  return (
    <div className="grid md:grid-cols-2 gap-3">
      <Card f={pos} dir="up" />
      <Card f={neg} dir="down" />
    </div>
  );
}
