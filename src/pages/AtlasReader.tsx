import { Link } from 'react-router-dom';
import { ArrowRight, FileText, Layers, Flame } from 'lucide-react';
import { ProjectPageLayout } from '../components/ProjectPageLayout';
import { Pill } from '../components/Pill';
import {
  etlmIndex,
  tppIndex,
  themeIndex,
  hasEcosystem,
  type TPPIndexEntry,
  type ThemeIndexEntry,
} from '../data/atlas/index';
import {
  TA_ORDER,
  taForIndication,
  taForTheme,
  themeShortLabel,
  indicationDisplay,
  type TherapeuticArea,
} from '../data/atlas/taxonomy';

type IndicationGroup = {
  code: string;
  short: string;
  long?: string;
  etlmCode?: string;
  tpps: TPPIndexEntry[];
};

type AreaGroup = {
  ta: TherapeuticArea;
  indications: Map<string, IndicationGroup>;
  themes: ThemeIndexEntry[];
};

function buildAreas(): AreaGroup[] {
  const areas = new Map<TherapeuticArea, AreaGroup>();
  const area = (ta: TherapeuticArea) => {
    if (!areas.has(ta)) areas.set(ta, { ta, indications: new Map(), themes: [] });
    return areas.get(ta)!;
  };
  const indication = (ta: TherapeuticArea, code: string, short: string) => {
    const a = area(ta);
    if (!a.indications.has(code))
      a.indications.set(code, { code, short, tpps: [] });
    return a.indications.get(code)!;
  };

  for (const e of etlmIndex) {
    const ta = taForIndication(e.indication_code);
    const ind = indication(ta, e.indication_code, indicationDisplay(e.indication_code, e.indication));
    ind.etlmCode = e.indication_code;
    ind.long = e.indication;
  }
  for (const t of tppIndex) {
    const code = t.indication_code ?? 'unknown';
    const ta = taForIndication(t.indication_code);
    indication(ta, code, t.indication_display).tpps.push(t);
  }
  for (const th of themeIndex) {
    area(taForTheme(th.slug, th.indications_touched)).themes.push(th);
  }

  return TA_ORDER.map((ta) => areas.get(ta)).filter((a): a is AreaGroup => Boolean(a));
}

function sortedIndications(group: AreaGroup): IndicationGroup[] {
  return [...group.indications.values()].sort((a, b) => {
    // ETLM-backed indications first, then alphabetical.
    if (Boolean(a.etlmCode) !== Boolean(b.etlmCode)) return a.etlmCode ? -1 : 1;
    return a.short.localeCompare(b.short);
  });
}

export function AtlasReader() {
  const areas = buildAreas();

  return (
    <ProjectPageLayout
      title="Atlas Reader"
      subtitle="A redacted preview of the drug-development analyst's deliverables — landscape maps, target product profiles, and class-level theses, organised by therapeutic area."
      backTo="/atlas-drug-dev-analyst"
      backLabel="Back to Atlas"
    >
      <div className="flex flex-wrap items-center gap-2 mb-10">
        <Pill variant="status-wip">Preview</Pill>
        <Pill variant="tech">Redacted sample</Pill>
        <Pill variant="tech">
          {etlmIndex.length} landscape maps · {tppIndex.length} TPPs · {themeIndex.length} themes
        </Pill>
      </div>

      <section className="mb-12">
        <div className="border-l-4 border-zinc-900 dark:border-zinc-100 pl-5 py-2">
          <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed max-w-[72ch]">
            Atlas turns landscape research into living, queryable deliverables. This page renders a
            small, sanitised slice of the actual outputs — each indication carries a landscape map
            (ETLM) and the target product profiles built on top of it, with class-level themes
            running across the therapeutic area.
          </p>
        </div>
      </section>

      {/* Analyst's read — the human-touch hook */}
      {hasEcosystem && (
        <Link
          to="/atlas-reader/ecosystem"
          className="group flex items-center justify-between rounded-xl ring-1 ring-amber-300/60 dark:ring-amber-500/30 bg-amber-50/50 dark:bg-amber-500/[0.06] px-5 py-4 mb-12 hover:ring-amber-400 dark:hover:ring-amber-500/50 transition-all"
        >
          <div className="flex items-center gap-3 min-w-0">
            <Flame className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <div className="min-w-0">
              <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                The analyst's read — what's hottest right now
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                Headline narratives on where the field is moving, with sources.
              </div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-amber-600/70 dark:text-amber-400/70 group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
        </Link>
      )}

      {/* Therapeutic area → indication hierarchy */}
      {areas.map((group) => (
        <section key={group.ta} className="mb-14">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-5 pb-2 border-b border-zinc-200 dark:border-white/10">
            {group.ta}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {sortedIndications(group).map((ind) => (
              <div
                key={ind.code}
                className="rounded-xl ring-1 ring-zinc-200 dark:ring-white/10 bg-white/60 dark:bg-white/5 p-5"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                    {ind.short}
                  </h3>
                </div>
                {ind.long && ind.long !== ind.short && (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 ml-6 mb-3">{ind.long}</p>
                )}

                {/* ETLM link */}
                {ind.etlmCode ? (
                  <Link
                    to={`/atlas-reader/etlm/${ind.etlmCode}`}
                    className="group flex items-center justify-between rounded-lg ring-1 ring-zinc-200 dark:ring-white/10 bg-white/50 dark:bg-white/5 px-3 py-2 mb-3 hover:ring-indigo-300 dark:hover:ring-indigo-500/40 transition-all"
                  >
                    <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">
                      Landscape map (ETLM)
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-indigo-500 transition-colors" />
                  </Link>
                ) : (
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-3 ml-6 italic">
                    No landscape map in this preview
                  </p>
                )}

                {/* TPPs for this indication */}
                {ind.tpps.length > 0 && (
                  <div>
                    <div className="text-[10px] font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1.5 ml-0.5">
                      Target product profiles
                    </div>
                    <ul className="space-y-1">
                      {ind.tpps.map((t) => (
                        <li key={t.slug}>
                          <Link
                            to={`/atlas-reader/tpp/${t.slug}`}
                            title={t.segment_full}
                            className="group flex items-center gap-2 rounded-md px-2 py-1.5 -mx-2 hover:bg-rose-50/60 dark:hover:bg-rose-500/10 transition-colors"
                          >
                            <FileText className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 flex-shrink-0" />
                            <span className="text-sm text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-zinc-100">
                              {t.segment}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Cross-cutting themes for this therapeutic area */}
          {group.themes.length > 0 && (
            <div className="mt-5">
              <div className="text-[10px] font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-2">
                Cross-cutting themes
              </div>
              <div className="flex flex-wrap gap-2">
                {group.themes.map((th) => (
                  <Link
                    key={th.slug}
                    to={`/atlas-reader/theme/${th.slug}`}
                    className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 ring-1 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30 hover:ring-amber-600/40 transition-all"
                  >
                    <Layers className="w-3 h-3" />
                    {themeShortLabel(th.slug)}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </section>
      ))}

      <section className="rounded-xl ring-1 ring-zinc-200 dark:ring-white/10 bg-zinc-50 dark:bg-white/5 p-6">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
          What's redacted
        </h3>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-[72ch]">
          Analyst notes, confidence calibrations, internal decision rationale, and any ecosystem
          sections beyond the publicly shareable subset are stripped at sync time. What you see is
          the same shape of artifact a client team would receive, with the proprietary judgment
          layer removed.
        </p>
      </section>
    </ProjectPageLayout>
  );
}

export default AtlasReader;
