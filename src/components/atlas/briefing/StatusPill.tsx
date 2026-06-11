// Single consistent status colour map across all Atlas artifacts.
// Colour carries meaning ONLY — no decorative palette elsewhere.
export type StatusKind = 'approved' | 'pipeline' | 'at-risk' | 'watch';

const STYLES: Record<StatusKind, string> = {
  approved:
    'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30',
  pipeline:
    'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-500/30',
  'at-risk':
    'bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/30',
  watch:
    'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30',
};

const LABELS: Record<StatusKind, string> = {
  approved: 'Approved',
  pipeline: 'Pipeline',
  'at-risk': 'At risk',
  watch: 'Watch',
};

export function StatusPill({
  kind,
  children,
}: {
  kind: StatusKind;
  children?: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ring-1 ${STYLES[kind]}`}
    >
      {children ?? LABELS[kind]}
    </span>
  );
}

export default StatusPill;
