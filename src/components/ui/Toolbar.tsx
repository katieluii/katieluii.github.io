import type { ReactNode } from 'react';

/* Tidy controls row — collapses the stacked filter blocks (Fundraising,
   Clinical News, AI Feed) into one consistent, wrapping toolbar. */

export function Toolbar({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`flex flex-wrap items-center gap-x-3 gap-y-2.5 ${className}`}>{children}</div>
  );
}

/* A labelled group inside the toolbar (e.g. "Round", "Source"). */
export function ToolbarGroup({ label, children }: { label?: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {label && (
        <span className="mr-0.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
          {label}
        </span>
      )}
      {children}
    </div>
  );
}

export function ToolbarSpacer() {
  return <div className="ml-auto" />;
}

/* Segmented chip selector — single-select pill group with a clear active state. */
export function SegmentedChips<T extends string | number | null>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: ReactNode }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex flex-wrap gap-1 rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={String(opt.value)}
            type="button"
            onClick={() => onChange(opt.value)}
            aria-pressed={active}
            className={[
              'rounded-lg px-3 py-1.5 text-xs font-semibold transition-all',
              active
                ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-100'
                : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200',
            ].join(' ')}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/* Small count badge for "N active" on multi-select triggers. */
export function CountBadge({ n }: { n: number }) {
  if (!n) return null;
  return (
    <span className="ml-1 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-indigo-600 px-1 text-[10px] font-bold text-white dark:bg-indigo-500">
      {n}
    </span>
  );
}
