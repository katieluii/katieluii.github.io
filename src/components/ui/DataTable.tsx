import { useMemo, useState, type ReactNode } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

/* Polished, self-sorting data table with a mobile card fallback.
   - sticky header, zebra rows, accent-tinted hover
   - numeric columns right-aligned + tabular-nums
   - below `md`, rows render as stacked label/value cards */

export type Column<T> = {
  key: string;
  header: ReactNode;
  align?: 'left' | 'right' | 'center';
  /** Right-align + tabular-nums. */
  numeric?: boolean;
  sortable?: boolean;
  /** Value used for sorting; defaults to row[key]. */
  sortValue?: (row: T) => number | string | null | undefined;
  render?: (row: T) => ReactNode;
  /** Use this column's value as the card title in the mobile view. */
  primary?: boolean;
  /** Hide this column on the desktop table below the lg breakpoint (still shown in the mobile card). */
  hideBelowLg?: boolean;
};

type Order = 'asc' | 'desc';

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  defaultSort,
  maxHeight = '70vh',
  className = '',
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T, i: number) => string;
  defaultSort?: { key: string; order: Order };
  maxHeight?: string;
  className?: string;
}) {
  const [sortKey, setSortKey] = useState<string | null>(defaultSort?.key ?? null);
  const [order, setOrder] = useState<Order>(defaultSort?.order ?? 'desc');

  const colByKey = useMemo(() => Object.fromEntries(columns.map((c) => [c.key, c])), [columns]);

  const sorted = useMemo(() => {
    if (!sortKey) return rows;
    const col = colByKey[sortKey] as Column<T> | undefined;
    const getVal = (row: T) =>
      col?.sortValue ? col.sortValue(row) : (row as Record<string, unknown>)[sortKey];
    return [...rows].sort((a, b) => {
      const av = getVal(a);
      const bv = getVal(b);
      if (isNum(av) && isNum(bv)) return order === 'asc' ? av - bv : bv - av;
      const as = String(av ?? '').toLowerCase();
      const bs = String(bv ?? '').toLowerCase();
      return order === 'asc' ? as.localeCompare(bs) : bs.localeCompare(as);
    });
  }, [rows, sortKey, order, colByKey]);

  const toggleSort = (key: string) => {
    if (sortKey === key) setOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setOrder('desc');
    }
  };

  const alignClass = (c: Column<T>) =>
    c.align === 'center' ? 'text-center' : c.numeric || c.align === 'right' ? 'text-right' : 'text-left';

  return (
    <div className={className}>
      {/* Desktop / tablet table */}
      <div
        className="hidden overflow-auto rounded-2xl ring-1 ring-zinc-200/80 dark:ring-white/10 md:block"
        style={{ maxHeight }}
      >
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  className={[
                    'sticky top-0 z-10 whitespace-nowrap border-b border-zinc-200 bg-zinc-50/95 px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 backdrop-blur dark:border-white/10 dark:bg-zinc-900/80 dark:text-zinc-400',
                    alignClass(c),
                    c.hideBelowLg ? 'hidden lg:table-cell' : '',
                  ].join(' ')}
                >
                  {c.sortable ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(c.key)}
                      className={[
                        'inline-flex items-center gap-1 transition-colors hover:text-zinc-800 dark:hover:text-zinc-200',
                        c.numeric || c.align === 'right' ? 'flex-row-reverse' : '',
                        sortKey === c.key ? 'text-zinc-800 dark:text-zinc-200' : '',
                      ].join(' ')}
                    >
                      {c.header}
                      {sortKey === c.key ? (
                        order === 'asc' ? (
                          <ChevronUp className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5" />
                        )
                      ) : (
                        <ChevronsUpDown className="h-3.5 w-3.5 opacity-40" />
                      )}
                    </button>
                  ) : (
                    c.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, i) => (
              <tr
                key={rowKey(row, i)}
                className="border-b border-zinc-100 transition-colors odd:bg-zinc-50/40 hover:bg-indigo-50/50 dark:border-white/5 dark:odd:bg-white/[0.015] dark:hover:bg-indigo-500/10"
              >
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={[
                      'px-4 py-3 text-zinc-700 dark:text-zinc-300',
                      alignClass(c),
                      c.numeric ? 'tabular-nums' : '',
                      c.hideBelowLg ? 'hidden lg:table-cell' : '',
                    ].join(' ')}
                  >
                    {c.render ? c.render(row) : ((row as Record<string, ReactNode>)[c.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile card fallback */}
      <div className="space-y-2.5 md:hidden">
        {sorted.map((row, i) => {
          const primary = columns.find((c) => c.primary) ?? columns[0];
          const rest = columns.filter((c) => c !== primary);
          return (
            <div
              key={rowKey(row, i)}
              className="rounded-2xl ring-1 ring-zinc-200/80 dark:ring-white/10 bg-white/80 dark:bg-zinc-800/60 p-4"
            >
              <div className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {primary.render ? primary.render(row) : (row as Record<string, ReactNode>)[primary.key]}
              </div>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                {rest.map((c) => (
                  <div key={c.key} className="flex items-center justify-between gap-2">
                    <dt className="text-[11px] uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                      {c.header}
                    </dt>
                    <dd
                      className={`text-xs text-zinc-700 dark:text-zinc-300 ${c.numeric ? 'tabular-nums' : ''}`}
                    >
                      {c.render ? c.render(row) : ((row as Record<string, ReactNode>)[c.key] ?? '—')}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          );
        })}
      </div>
    </div>
  );
}
