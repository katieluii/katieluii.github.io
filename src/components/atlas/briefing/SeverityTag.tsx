// Consistent severity palette for unmet-need / risk tagging.
export type Severity = 'Critical' | 'High' | 'Medium';

const STYLES: Record<Severity, string> = {
  Critical:
    'bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/30',
  High: 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30',
  Medium:
    'bg-zinc-100 text-zinc-600 ring-zinc-300/60 dark:bg-white/5 dark:text-zinc-300 dark:ring-white/10',
};

export function SeverityTag({ severity }: { severity: Severity }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ring-1 ${STYLES[severity]}`}
    >
      {severity}
    </span>
  );
}

export default SeverityTag;
