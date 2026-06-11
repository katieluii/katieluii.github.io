export type KeyFact = {
  label: string;
  value: string;
  /** Optional sub-note shown under the value in smaller text. */
  note?: string;
};

/**
 * A row of 2–5 compact stat tiles: big value, small label. Responsive — wraps to
 * a 2-col grid on narrow screens.
 */
export function KeyFactsStrip({ facts }: { facts: KeyFact[] }) {
  if (!facts.length) return null;
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
      {facts.slice(0, 5).map((f, i) => (
        <div
          key={i}
          className="rounded-xl ring-1 ring-zinc-200 dark:ring-white/10 bg-white/60 dark:bg-white/5 px-4 py-3"
        >
          <div className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 leading-tight">
            {f.value}
          </div>
          <div className="mt-1 text-[11px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            {f.label}
          </div>
          {f.note && (
            <div className="mt-0.5 text-[11px] text-zinc-400 dark:text-zinc-500">{f.note}</div>
          )}
        </div>
      ))}
    </div>
  );
}

export default KeyFactsStrip;
