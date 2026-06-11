export type Takeaway = {
  /** The bolded lead clause — the point. */
  lead: string;
  /** Supporting clause. */
  rest?: string;
};

/**
 * BLUF list — max 5 items, each a bold lead clause + supporting clause.
 */
export function KeyTakeaways({
  takeaways,
  heading = 'Key takeaways',
}: {
  takeaways: Takeaway[];
  heading?: string;
}) {
  if (!takeaways.length) return null;
  return (
    <section className="mb-10">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-4">
        {heading}
      </h2>
      <ul className="space-y-3 max-w-[72ch]">
        {takeaways.slice(0, 5).map((t, i) => (
          <li key={i} className="flex gap-3">
            <span className="mt-2 h-1.5 w-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500 flex-shrink-0" />
            <p className="text-[15px] leading-relaxed text-zinc-700 dark:text-zinc-300">
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">{t.lead}</span>
              {t.rest ? <> — {t.rest}</> : null}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default KeyTakeaways;
