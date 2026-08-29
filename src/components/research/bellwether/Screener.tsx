import { useMemo, useState, type KeyboardEvent } from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { COMPANIES, DOMINANT, ERAS, crowdCount, landscapeHref, type Company, MCAP_RECORDED } from '../../../data/pharmaLandscape';
import { BASIS_SHORT, BasisTag, ExposureMark, MULT_SHORT } from './ui';

/* ── Screen the field ─────────────────────────────────────────────────────────
   Reader-driven. Filters are named for what they actually test (an analyst reads
   the predicate off the label). Growth and P/E carry a basis tag on every row
   because the source states them on different bases (reported / cc / underlying /
   op; forward / trailing / NTM / est.). Sorting on P/E ranks only the names with a
   clean forward figure; the rest sit below the fold of the sort, unranked.
   Headers are real buttons (keyboard + aria-sort). */

type Filter = 'all' | 'rerate' | 'cliff-live' | 'cliff-open' | 'crowd';
const FILTERS: { key: Filter; label: string; test: string; match: (c: Company) => boolean }[] = [
  { key: 'all', label: 'All', test: 'every name in the universe', match: () => true },
  {
    key: 'rerate',
    label: 'Cheap and growing',
    test: 'revenue growth 8% or more and forward P/E 18× or less',
    match: (c) => c.pos.g >= 8 && c.pos.pe <= 18,
  },
  {
    key: 'cliff-live',
    label: 'On a live cliff',
    test: 'high exposure and the key expiry already eroding',
    match: (c) => c.exp === 'high' && c.era === 'now',
  },
  {
    key: 'cliff-open',
    label: 'Cliff not yet offset',
    test: 'high exposure, expiry now or this cycle, growth under 6%',
    match: (c) => c.exp === 'high' && c.era !== '2029-31' && c.pos.g < 6,
  },
  {
    key: 'crowd',
    label: 'Crowded',
    test: `in two or more of the ${DOMINANT.length} dominant pipeline bets`,
    match: (c) => crowdCount(c) >= 2,
  },
];

type SortKey = 'g' | 'pe';
type Dir = 'desc' | 'asc';

export function Screener() {
  const [filter, setFilter] = useState<Filter>('all');
  const [sort, setSort] = useState<SortKey>('g');
  const [dir, setDir] = useState<Dir>('desc');

  const active = FILTERS.find((f) => f.key === filter)!;
  const rows = useMemo(() => {
    const list = COMPANIES.filter(active.match);
    const ranked = list.filter((c) => sort === 'g' || c.multipleBasis === 'forward');
    const unranked = list.filter((c) => !ranked.includes(c));
    const sgn = dir === 'desc' ? -1 : 1;
    ranked.sort((a, b) => sgn * (sort === 'g' ? a.pos.g - b.pos.g : a.pos.pe - b.pos.pe));
    return { ranked, unranked };
  }, [active, sort, dir]);

  const toggle = (k: SortKey) => {
    if (sort === k) setDir(dir === 'desc' ? 'asc' : 'desc');
    else { setSort(k); setDir(k === 'g' ? 'desc' : 'asc'); }
  };
  const onKey = (e: KeyboardEvent, k: SortKey) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(k); }
  };
  const ariaSort = (k: SortKey) => (sort === k ? (dir === 'asc' ? 'ascending' : 'descending') : 'none') as 'ascending' | 'descending' | 'none';
  const SortIcon = ({ k }: { k: SortKey }) =>
    sort === k ? (dir === 'asc' ? <ArrowUp className="h-3 w-3" aria-hidden /> : <ArrowDown className="h-3 w-3" aria-hidden />) : null;

  const th = 'px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--muted)]';
  const thBtn = 'inline-flex items-center gap-1 rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] hover:text-[var(--ink-strong)]';

  const Row = ({ c, dim }: { c: Company; dim?: boolean }) => (
    <tr className={`border-t border-[var(--hair)] transition-colors hover:bg-[var(--hover)] ${dim ? 'text-[var(--muted)]' : ''}`}>
      <td className="px-3 py-2.5">
        <a href={landscapeHref(c.ticker)} target="_blank" rel="noopener noreferrer" className="group inline-flex items-baseline gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] rounded-sm">
          <span className="font-semibold tracking-[0.03em] text-[var(--ink-strong)] group-hover:text-[var(--accent)]">{c.ticker}</span>
          <span className="hidden text-[12.5px] text-[var(--muted)] sm:inline">{c.name}</span>
        </a>
      </td>
      <td className="whitespace-nowrap px-3 py-2.5 tabular-nums text-[var(--ink)]">
        {c.gr.replace(/\s*\(.*\)$/, '')}
        {c.growthBasis !== 'reported' && <BasisTag title={`stated on a ${c.growthBasis} basis`}>{BASIS_SHORT[c.growthBasis]}</BasisTag>}
        {/\(.*\)/.test(c.gr) && <span className="ml-1.5 text-[12px] text-[var(--muted)]">{c.gr.match(/\(.*\)/)![0]}</span>}
      </td>
      <td className="whitespace-nowrap px-3 py-2.5 tabular-nums text-[var(--ink)]">
        ~{c.pos.pe}×
        {c.multipleBasis !== 'forward' && <BasisTag title={c.ev}>{MULT_SHORT[c.multipleBasis]}</BasisTag>}
      </td>
      {MCAP_RECORDED > 0 && (
        <td className="whitespace-nowrap px-3 py-2.5 tabular-nums text-[var(--ink)]" title={c.mcapDate ? `at ${c.mcapDate} close` : undefined}>
          {c.mcap ? (
            <>{c.mcap}{c.mcapDate && <span className="sr-only"> at {c.mcapDate} close</span>}</>
          ) : (
            <span className="text-[var(--faint)]" aria-label="not recorded">—</span>
          )}
        </td>
      )}
      <td className="whitespace-nowrap px-3 py-2.5 text-[13px]">
        <span className="inline-flex items-center gap-2">
          <ExposureMark exp={c.exp} />
          <span className="text-[var(--muted)]">{ERAS[c.era].yr}</span>
        </span>
      </td>
    </tr>
  );

  return (
    <div>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Screen by thesis">
        {FILTERS.map((f) => {
          const n = COMPANIES.filter(f.match).length;
          const on = filter === f.key;
          return (
            <button
              key={f.key}
              type="button"
              aria-pressed={on}
              title={f.test}
              onClick={() => setFilter(f.key)}
              className={`rounded-full border px-3 py-1.5 text-[13.5px] font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
                on
                  ? 'border-[var(--ink-strong)] bg-[var(--btn-bg)] text-[var(--btn-fg)]'
                  : 'border-[var(--hair)] text-[var(--ink)] hover:bg-[var(--hover)]'
              }`}
            >
              {f.label} <span className={`tabular-nums ${on ? 'opacity-70' : 'text-[var(--muted)]'}`}>{n}</span>
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-[12.5px] text-[var(--muted)]">
        <span className="font-medium text-[var(--ink)]">{active.label}</span>: {active.test}.
      </p>

      <div className="mt-3 overflow-x-auto rounded-2xl border border-[var(--hair)] bg-[var(--surface)]">
        <table className="w-full min-w-[520px] text-[14px]">
          <thead>
            <tr className="bg-[var(--hover)]">
              <th scope="col" className={th}>Company</th>
              <th scope="col" className={th} aria-sort={ariaSort('g')}>
                <button type="button" className={thBtn} onClick={() => toggle('g')} onKeyDown={(e) => onKey(e, 'g')}>
                  Revenue growth <SortIcon k="g" />
                </button>
              </th>
              <th scope="col" className={th} aria-sort={ariaSort('pe')}>
                <button type="button" className={thBtn} onClick={() => toggle('pe')} onKeyDown={(e) => onKey(e, 'pe')}>
                  P/E <SortIcon k="pe" />
                </button>
              </th>
              {MCAP_RECORDED > 0 && <th scope="col" className={th}>Market cap</th>}
              <th scope="col" className={th}>Cliff exposure · key expiry</th>
            </tr>
          </thead>
          <tbody>
            {rows.ranked.map((c) => <Row key={c.ticker} c={c} />)}
            {rows.unranked.length > 0 && (
              <tr className="border-t border-[var(--hair)] bg-[var(--hover)]">
                <td colSpan={MCAP_RECORDED > 0 ? 5 : 4} className="px-3 py-1.5 text-[11.5px] uppercase tracking-[0.06em] text-[var(--muted)]">
                  Not ranked on P/E: no clean forward figure
                </td>
              </tr>
            )}
            {rows.unranked.map((c) => <Row key={c.ticker} c={c} dim />)}
            {rows.ranked.length + rows.unranked.length === 0 && (
              <tr className="border-t border-[var(--hair)]">
                <td colSpan={MCAP_RECORDED > 0 ? 5 : 4} className="px-3 py-6 text-center text-[13.5px] text-[var(--muted)]">
                  No company matches this screen in the current cut. Try a broader thesis.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-[12px] leading-[1.5] text-[var(--faint)]">
        Growth is the company's stated figure for its latest period; a tag marks a non-reported basis (cc = constant
        currency, op = operational). P/E is forward where a clean figure exists; estimated multiples (trailing, NTM or
        single-aggregator, hover the tag for which) are tagged est. and never ranked against forward ones. Open a
        ticker for its numbers, cliff bridge and dated developments.
      </p>
    </div>
  );
}
