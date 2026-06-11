import { ExternalLink, Flame } from 'lucide-react';
import { ProjectPageLayout } from '../components/ProjectPageLayout';
import { Pill } from '../components/Pill';
import {
  ecosystemNarratives,
  ecosystemIntro,
  ecosystemUpdated,
  type Momentum,
} from '../data/atlas/ecosystem';

const MOMENTUM_STYLE: Record<Momentum, string> = {
  Hot: 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30',
  Confirmed:
    'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30',
  Watch:
    'bg-zinc-100 text-zinc-600 ring-zinc-300/60 dark:bg-white/5 dark:text-zinc-300 dark:ring-white/10',
};

export function AtlasReaderEcosystem() {
  return (
    <ProjectPageLayout
      title="The analyst's read"
      subtitle="The hottest themes in drug development right now, with a point of view."
      backTo="/atlas-reader"
      backLabel="Back to Atlas Reader"
    >
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <Pill variant="tech">Analyst's read</Pill>
        <Pill variant="tech">Refreshed weekly · Mondays</Pill>
        <span className="text-xs text-zinc-400 dark:text-zinc-500">
          Updated {ecosystemUpdated}
        </span>
      </div>

      <p className="text-xl sm:text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 max-w-[72ch] mb-3">
        Here are the 5 hottest themes running in drug development today.
      </p>
      <p className="text-[15px] leading-relaxed text-zinc-500 dark:text-zinc-400 max-w-[72ch] mb-10 italic">
        {ecosystemIntro}
      </p>

      <div className="space-y-4">
        {ecosystemNarratives.map((n, i) => (
          <article
            key={i}
            className="rounded-xl ring-1 ring-zinc-200 dark:ring-white/10 bg-white/60 dark:bg-white/5 p-5"
          >
            <div className="flex items-start justify-between gap-4 mb-2">
              <h2 className="text-lg font-semibold leading-snug text-zinc-900 dark:text-zinc-100 max-w-[60ch]">
                {n.headline}
              </h2>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ring-1 flex-shrink-0 ${MOMENTUM_STYLE[n.momentum]}`}
              >
                {n.momentum === 'Hot' && <Flame className="w-3 h-3" />}
                {n.momentum}
              </span>
            </div>
            <p className="text-[15px] leading-relaxed text-zinc-600 dark:text-zinc-400 max-w-[72ch]">
              {n.detail}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs">
              <span className="uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                Sources
              </span>
              {n.sources.map((s, si) =>
                s.url ? (
                  <a
                    key={si}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 underline decoration-dotted underline-offset-4"
                  >
                    {s.label}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span key={si} className="text-zinc-500 dark:text-zinc-400">
                    {s.label}
                  </span>
                ),
              )}
            </div>
          </article>
        ))}
      </div>

      <p className="mt-10 text-xs text-zinc-400 dark:text-zinc-500 max-w-[72ch]">
        The full reasoning, signal trail, and per-modality crowding maps live in the analyst's
        working note and are not surfaced here.
      </p>
    </ProjectPageLayout>
  );
}

export default AtlasReaderEcosystem;
