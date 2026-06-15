import type { ReactNode } from 'react';

/* Standardized metric card — replaces the ad-hoc
   `ring-1 ring-zinc-200/80 bg-white/80 …` stat blocks copy-pasted across pages. */

export function StatCard({
  label,
  value,
  hint,
  icon,
  accent = false,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  /** Tint the value in the indigo accent (e.g. a headline figure). */
  accent?: boolean;
}) {
  return (
    <div className="rounded-2xl ring-1 ring-zinc-200/80 dark:ring-white/10 bg-white/80 dark:bg-zinc-800/60 px-4 py-3.5 backdrop-blur-sm transition-colors hover:ring-zinc-300 dark:hover:ring-white/20">
      <div className="flex items-center gap-1.5">
        {icon && <span className="text-zinc-400 dark:text-zinc-500">{icon}</span>}
        <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          {label}
        </span>
      </div>
      <div
        className={`mt-1.5 text-2xl font-bold tabular-nums tracking-tight ${
          accent ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-900 dark:text-zinc-100'
        }`}
      >
        {value}
      </div>
      {hint && <div className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{hint}</div>}
    </div>
  );
}

/* Responsive grid: defaults 4→2→1 columns. Pass `cols` to cap the wide count. */
export function StatGrid({
  children,
  cols = 4,
}: {
  children: ReactNode;
  cols?: 2 | 3 | 4;
}) {
  const wide = { 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-3', 4: 'sm:grid-cols-2 lg:grid-cols-4' }[cols];
  return <div className={`grid grid-cols-1 gap-3 ${wide}`}>{children}</div>;
}
