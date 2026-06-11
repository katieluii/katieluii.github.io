import { useState } from 'react';
import { ChevronRight } from 'lucide-react';

type Props = {
  /** Header label shown on the toggle row. */
  title: string;
  /** Optional small label on the right of the toggle (e.g. a count). */
  meta?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
};

/**
 * "Show full analysis" disclosure — collapsed by default. Used for MICRO detail
 * that stays inline on a briefing (macro prose lives on the report route instead).
 */
export function Collapsible({ title, meta, children, defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl ring-1 ring-zinc-200 dark:ring-white/10 bg-white/40 dark:bg-white/5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-medium text-zinc-800 dark:text-zinc-200">
          <ChevronRight
            className={`w-4 h-4 text-zinc-400 transition-transform ${open ? 'rotate-90' : ''}`}
          />
          {title}
        </span>
        {meta != null && (
          <span className="text-xs text-zinc-400 dark:text-zinc-500">{meta}</span>
        )}
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 border-t border-zinc-200/70 dark:border-white/10">
          {children}
        </div>
      )}
    </div>
  );
}

export default Collapsible;
