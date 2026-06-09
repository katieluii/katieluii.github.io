import { Link } from 'react-router-dom';
import { ArrowRight, FileText, Layers, Globe2 } from 'lucide-react';
import { ProjectPageLayout } from '../components/ProjectPageLayout';
import { Pill } from '../components/Pill';
import { etlmIndex, tppIndex, themeIndex, hasEcosystem } from '../data/atlas/index';

export function AtlasReader() {
  return (
    <ProjectPageLayout
      title="Atlas Reader"
      subtitle="A redacted preview of what the drug-development analyst's deliverables look like — landscape maps, target product profiles, and class-level theses."
      backTo="/atlas-drug-dev-analyst"
      backLabel="Back to Atlas"
    >
      <div className="flex flex-wrap items-center gap-2 mb-10">
        <Pill variant="status-wip">Preview</Pill>
        <Pill variant="tech">Redacted sample</Pill>
        <Pill variant="tech">2 indications · {tppIndex.length} TPPs · {themeIndex.length} themes</Pill>
      </div>

      <section className="mb-12">
        <div className="border-l-4 border-zinc-900 dark:border-zinc-100 pl-5 py-2 mb-8">
          <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">
            Atlas turns landscape research into living, queryable deliverables. This page
            renders a small, sanitised slice of the actual outputs — enough to show the shape
            of each artifact and how they cross-reference each other.
          </p>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-4">
          Emerging Therapeutic Landscape Maps (ETLMs)
        </h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-5">
          The persistent strategic memory per indication — approved therapies, pipeline assets,
          efficacy benchmarks, regulatory state, and recent conference readouts.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {etlmIndex.map((entry) => (
            <Link
              key={entry.indication_code}
              to={`/atlas-reader/etlm/${entry.indication_code}`}
              className="group rounded-xl ring-1 ring-zinc-200 dark:ring-white/10 bg-white/60 dark:bg-white/5 p-5 hover:ring-zinc-400 dark:hover:ring-white/30 transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">
                      ETLM
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                    {entry.indication}
                  </h3>
                  {entry.subtitle && (
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{entry.subtitle}</p>
                  )}
                </div>
                <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-200 transition-colors mt-1" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-4">
          Target Product Profiles (TPPs)
        </h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-5">
          What a new asset would need to win in a specific line/segment — efficacy bar, safety
          bar, competitive set, regulatory pathway, differentiation axes.
        </p>
        <div className="space-y-2">
          {tppIndex.map((entry) => (
            <Link
              key={entry.slug}
              to={`/atlas-reader/tpp/${entry.slug}`}
              className="group flex items-center justify-between rounded-lg ring-1 ring-zinc-200 dark:ring-white/10 bg-white/40 dark:bg-white/5 px-4 py-3 hover:ring-rose-300 dark:hover:ring-rose-500/40 transition-all"
            >
              <div className="flex items-center gap-3 min-w-0">
                <FileText className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0" />
                <span className="text-sm text-zinc-800 dark:text-zinc-200 truncate">
                  {entry.title}
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-200 transition-colors flex-shrink-0" />
            </Link>
          ))}
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-4">
          Deep Thematic Syntheses
        </h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-5">
          Class- or modality-level deep dives that span indications — current state, momentum,
          watch flags. Different from indication analysis (per-disease) and the daily PM brief
          (today's cross-indication patterns).
        </p>
        <div className="space-y-2">
          {themeIndex.map((entry) => (
            <Link
              key={entry.slug}
              to={`/atlas-reader/theme/${entry.slug}`}
              className="group flex items-center justify-between rounded-lg ring-1 ring-zinc-200 dark:ring-white/10 bg-white/40 dark:bg-white/5 px-4 py-3 hover:ring-amber-300 dark:hover:ring-amber-500/40 transition-all"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Layers className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                <span className="text-sm text-zinc-800 dark:text-zinc-200 truncate">
                  {entry.title}
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-200 transition-colors flex-shrink-0" />
            </Link>
          ))}
        </div>
      </section>

      {hasEcosystem && (
        <section className="mb-12">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-4">
            Ecosystem Knowledge
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-5">
            Long-running observations about how the drug-development ecosystem is moving —
            modality momentum, deal climate, conference cycle patterns.
          </p>
          <Link
            to="/atlas-reader/ecosystem"
            className="group flex items-center justify-between rounded-lg ring-1 ring-zinc-200 dark:ring-white/10 bg-white/40 dark:bg-white/5 px-4 py-3 hover:ring-emerald-300 dark:hover:ring-emerald-500/40 transition-all"
          >
            <div className="flex items-center gap-3 min-w-0">
              <Globe2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <span className="text-sm text-zinc-800 dark:text-zinc-200">
                Read the ecosystem note
              </span>
            </div>
            <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-200 transition-colors flex-shrink-0" />
          </Link>
        </section>
      )}

      <section className="rounded-xl ring-1 ring-zinc-200 dark:ring-white/10 bg-zinc-50 dark:bg-white/5 p-6">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
          What's redacted
        </h3>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
          Analyst notes, confidence calibrations, internal decision rationale, and any
          ecosystem sections beyond the publicly shareable subset are stripped at sync time.
          What you see is the same shape of artifact a client team would receive, with the
          proprietary judgment layer removed.
        </p>
      </section>
    </ProjectPageLayout>
  );
}

export default AtlasReader;
