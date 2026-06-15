import type { ReactNode } from 'react';

/* Consistent empty state — replaces the mismatched text-only vs icon+text
   empties scattered across pages. */

export function EmptyState({
  icon,
  title,
  hint,
  action,
}: {
  icon?: ReactNode;
  title: string;
  hint?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl ring-1 ring-zinc-200/70 dark:ring-white/10 bg-white/40 dark:bg-white/[0.02] px-6 py-14 text-center">
      {icon && (
        <div className="mb-3 grid h-11 w-11 place-items-center rounded-full bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500">
          {icon}
        </div>
      )}
      <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">{title}</p>
      {hint && <p className="mt-1 max-w-sm text-xs text-zinc-500 dark:text-zinc-400">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
