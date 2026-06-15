import type { ReactNode } from 'react';

/* One chip for severity-style flags (High / Medium / Low concentration,
   pipeline-change direction, etc.) — replaces bespoke inline `<span>`s. */

export type Severity = 'high' | 'medium' | 'low' | 'neutral';

const STYLES: Record<Severity, string> = {
  high: 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/20',
  medium: 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20',
  low: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20',
  neutral: 'bg-zinc-100 text-zinc-600 ring-zinc-300/60 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-white/10',
};

export function severityFromFlag(flag?: string | null): Severity {
  const f = (flag || '').toLowerCase();
  if (f === 'high') return 'high';
  if (f === 'medium' || f === 'med') return 'medium';
  if (f === 'low') return 'low';
  return 'neutral';
}

export function SeverityChip({
  severity,
  children,
  dot = true,
}: {
  severity: Severity;
  children: ReactNode;
  dot?: boolean;
}) {
  const dotColor = {
    high: 'bg-red-500',
    medium: 'bg-amber-500',
    low: 'bg-emerald-500',
    neutral: 'bg-zinc-400',
  }[severity];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${STYLES[severity]}`}
    >
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />}
      {children}
    </span>
  );
}
