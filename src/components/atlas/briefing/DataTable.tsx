import { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, ChevronsUpDown, ChevronRight } from 'lucide-react';

export type Column = {
  key: string;
  label: string;
  align?: 'left' | 'right';
  sortable?: boolean;
};

export type Row = {
  id: string;
  /** Rendered cell content per column key. */
  cells: Record<string, React.ReactNode>;
  /** Optional values used for sorting (falls back to the cell's string form). */
  sortValues?: Record<string, string | number>;
  /** Highlight as an anchor row (e.g. standard-of-care). */
  isAnchor?: boolean;
  /** Expandable per-row detail revealed on click. */
  detail?: React.ReactNode;
};

type SortState = { key: string; dir: 'asc' | 'desc' } | null;

function sortValue(row: Row, key: string): string | number {
  if (row.sortValues && key in row.sortValues) return row.sortValues[key];
  const cell = row.cells[key];
  return typeof cell === 'string' || typeof cell === 'number' ? cell : '';
}

/**
 * Sortable table with optional anchor-row highlighting and click-to-expand detail.
 * Replaces card-grids for comparative data. Body text ~13px, single status colour map.
 */
export function DataTable({
  columns,
  rows,
  caption,
}: {
  columns: Column[];
  rows: Row[];
  caption?: string;
}) {
  const [sort, setSort] = useState<SortState>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const sortedRows = useMemo(() => {
    if (!sort) return rows;
    const factor = sort.dir === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => {
      const av = sortValue(a, sort.key);
      const bv = sortValue(b, sort.key);
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * factor;
      return String(av).localeCompare(String(bv), undefined, { numeric: true }) * factor;
    });
  }, [rows, sort]);

  const toggleSort = (key: string) =>
    setSort((prev) =>
      prev?.key === key
        ? prev.dir === 'asc'
          ? { key, dir: 'desc' }
          : null
        : { key, dir: 'asc' },
    );

  const toggleExpand = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const hasDetail = rows.some((r) => r.detail);

  return (
    <div className="overflow-x-auto rounded-xl ring-1 ring-zinc-200 dark:ring-white/10">
      <table className="w-full text-[13px] border-collapse">
        {caption && (
          <caption className="text-left text-xs text-zinc-400 dark:text-zinc-500 px-3 py-2">
            {caption}
          </caption>
        )}
        <thead>
          <tr className="bg-zinc-100/80 dark:bg-white/5">
            {hasDetail && <th className="w-8" aria-label="expand" />}
            {columns.map((col) => {
              const active = sort?.key === col.key;
              const SortIcon = !active
                ? ChevronsUpDown
                : sort?.dir === 'asc'
                  ? ChevronUp
                  : ChevronDown;
              return (
                <th
                  key={col.key}
                  className={`py-2.5 px-3 font-semibold text-zinc-700 dark:text-zinc-200 whitespace-nowrap ${
                    col.align === 'right' ? 'text-right' : 'text-left'
                  }`}
                >
                  {col.sortable === false ? (
                    col.label
                  ) : (
                    <button
                      type="button"
                      onClick={() => toggleSort(col.key)}
                      className={`inline-flex items-center gap-1 hover:text-zinc-900 dark:hover:text-white ${
                        col.align === 'right' ? 'flex-row-reverse' : ''
                      } ${active ? 'text-zinc-900 dark:text-white' : ''}`}
                    >
                      {col.label}
                      <SortIcon className="w-3 h-3 opacity-60" />
                    </button>
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sortedRows.map((row) => {
            const isOpen = expanded.has(row.id);
            return (
              <RowGroup
                key={row.id}
                row={row}
                columns={columns}
                hasDetail={hasDetail}
                isOpen={isOpen}
                onToggle={() => toggleExpand(row.id)}
              />
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function RowGroup({
  row,
  columns,
  hasDetail,
  isOpen,
  onToggle,
}: {
  row: Row;
  columns: Column[];
  hasDetail: boolean;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const anchorClass = row.isAnchor
    ? 'bg-emerald-50/50 dark:bg-emerald-500/[0.07]'
    : '';
  const clickable = Boolean(row.detail);
  return (
    <>
      <tr
        className={`border-t border-zinc-200 dark:border-white/10 ${anchorClass} ${
          clickable ? 'cursor-pointer hover:bg-zinc-50 dark:hover:bg-white/5' : ''
        }`}
        onClick={clickable ? onToggle : undefined}
      >
        {hasDetail && (
          <td className="pl-3 text-zinc-400">
            {row.detail ? (
              <ChevronRight
                className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-90' : ''}`}
              />
            ) : null}
          </td>
        )}
        {columns.map((col, ci) => (
          <td
            key={col.key}
            className={`py-2.5 px-3 align-top text-zinc-700 dark:text-zinc-300 ${
              col.align === 'right' ? 'text-right' : 'text-left'
            } ${ci === 0 ? 'font-medium text-zinc-900 dark:text-zinc-100' : ''}`}
          >
            {row.cells[col.key] ?? '—'}
            {ci === 0 && row.isAnchor && (
              <span className="ml-2 text-[10px] uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                SoC anchor
              </span>
            )}
          </td>
        ))}
      </tr>
      {isOpen && row.detail && (
        <tr className={`border-t border-zinc-200/60 dark:border-white/10 ${anchorClass}`}>
          <td
            colSpan={columns.length + (hasDetail ? 1 : 0)}
            className="px-4 py-3 bg-zinc-50/60 dark:bg-white/[0.02]"
          >
            {row.detail}
          </td>
        </tr>
      )}
    </>
  );
}

export default DataTable;
