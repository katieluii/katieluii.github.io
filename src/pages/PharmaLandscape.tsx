import { ExternalLink, ArrowRight } from 'lucide-react';
import ProjectPageLayout from '../components/ProjectPageLayout';
import { ProjectLead } from '../components/ProjectLead';
import { Pill } from '../components/Pill';
import { StatCard, StatGrid } from '../components/ui';
import { getProjectBySlug, formatYearRange } from '../data/projects';
import { PrimaryVisual } from '../components/research/PrimaryVisual';
import { ActionScreener, ActionSignals } from '../components/research/ActionVariants';
import { DATA_ASOF, SAMPLE_RUN_LABEL, HERO_METRICS, FULL_LANDSCAPE_ROUTE } from '../data/pharmaLandscape';

export function PharmaLandscape() {
  const project = getProjectBySlug('pharma-landscape');

  return (
    <ProjectPageLayout
      title="Bellwether"
      subtitle="AI equity research for large-cap pharma."
    >
      <div className="space-y-10">
        {/* Pills */}
        {project && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-slate-600 dark:text-zinc-400 px-2.5 py-1 bg-slate-100 dark:bg-zinc-800 rounded">
              {formatYearRange(project.yearStart, project.yearEnd)}
            </span>
            <Pill variant="status-live">{SAMPLE_RUN_LABEL}</Pill>
            {project.themes.map((theme) => (
              <Pill key={theme} variant="tech">{theme}</Pill>
            ))}
          </div>
        )}

        {/* Hero */}
        <section className="space-y-6">
          <ProjectLead headline="A dozen of the biggest pharma names, made comparable on one screen.">
            <p>
              Large-cap pharma doesn’t value on a single model — a cash-generative major and a pipeline-driven name need
              different approaches. Bellwether classifies each name, applies the valuation method that fits, reads its
              latest reported quarter, and normalises the results so the dozen can be compared directly: relative
              valuation, patent-cliff exposure and pipeline crowding in one view.
            </p>
            <p>
              Start with the two names that moved most this quarter, filter by valuation, growth or cliff risk, then open
              any company for its numbers, cliff timing and recent developments.
            </p>
          </ProjectLead>
          <StatGrid cols={3}>
            {HERO_METRICS.map((m) => (
              <StatCard key={m.label} label={m.label} value={m.value} accent={m.value === '13'} />
            ))}
          </StatGrid>
        </section>

        {/* Hook — the two names to know */}
        <section className="space-y-3">
          <div className="flex items-baseline justify-between gap-3 flex-wrap">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-zinc-100">The two names to know this quarter</h2>
            <span className="text-xs text-zinc-500 dark:text-zinc-500">{DATA_ASOF} sample run · directional, not investment advice</span>
          </div>
          <ActionSignals />
        </section>

        {/* Act — screen the 13 */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-zinc-100">Screen the field</h2>
          <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed max-w-2xl">
            Filter to a thesis — cheap-and-growing, cliff risk, crowded — and sort by momentum or valuation to find the setups.
          </p>
          <ActionScreener />
        </section>

        {/* Explore — the map */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-zinc-100">See it on the map</h2>
          <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed max-w-2xl">
            The same names, plotted four ways. Hover or focus any point for the read; open the full landscape for every
            company’s numbers, cliff bridge and dated developments.
          </p>
          <PrimaryVisual />
        </section>

        {/* CTA */}
        <section className="flex flex-wrap items-center gap-3 pt-2">
          <a
            href={FULL_LANDSCAPE_ROUTE}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50"
          >
            Explore the full landscape <ExternalLink className="w-4 h-4" />
          </a>
          <span
            aria-disabled="true"
            title="Point Bellwether at your own ticker list — engine in development"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-zinc-300 dark:border-white/20 text-zinc-500 dark:text-zinc-400 text-sm font-medium cursor-not-allowed select-none"
          >
            Run Bellwether on your names <ArrowRight className="w-4 h-4 opacity-70" />
            <span className="ml-0.5 text-[10px] font-semibold uppercase tracking-wide text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-500/10 px-1.5 py-0.5 rounded">Build in progress</span>
          </span>
        </section>
      </div>
    </ProjectPageLayout>
  );
}

export default PharmaLandscape;
