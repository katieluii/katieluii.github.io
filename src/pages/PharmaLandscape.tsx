import { ExternalLink, BookOpen } from 'lucide-react';
import ProjectPageLayout from '../components/ProjectPageLayout';
import { ProjectLead } from '../components/ProjectLead';
import { Pill } from '../components/Pill';
import { StatCard, StatGrid } from '../components/ui';
import { getProjectBySlug, formatYearRange } from '../data/projects';
import { PrimaryVisual } from '../components/research/PrimaryVisual';
import {
  KeyFindings,
  TracedNameKeystone,
  WorkflowStrip,
  ProvenanceCallout,
  MethodologySummary,
} from '../components/research/ResearchBlocks';
import {
  DATA_ASOF,
  SAMPLE_RUN_LABEL,
  HERO_METRICS,
  offLadder,
  FULL_LANDSCAPE_ROUTE,
} from '../data/pharmaLandscape';

export function PharmaLandscape() {
  const project = getProjectBySlug('pharma-landscape');

  return (
    <ProjectPageLayout
      title="Building Bellwether"
      subtitle="An AI-native pharma equity-research system that routes 13 large-cap companies through the valuation model that fits each, normalises the outputs, and surfaces re-rating opportunities, patent-cliff exposure and pipeline crowding."
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

        {/* 1 — Hero + outcome */}
        <section className="space-y-6">
          <ProjectLead headline="Traditional equity research evaluates companies one at a time. This makes 13 comparable.">
            The system converts quarterly disclosures, valuation data, franchise exposure and pipeline events into a
            single comparable view across the 13 largest pharma companies — routing each name through the valuation
            model that actually fits it, then normalising the outputs so re-rating gaps, cliff exposure and pipeline
            crowding read at a glance.
          </ProjectLead>
          <StatGrid cols={3}>
            {HERO_METRICS.map((m) => (
              <StatCard key={m.label} label={m.label} value={m.value} accent={m.value === '13'} />
            ))}
          </StatGrid>
        </section>

        {/* 2 — Three findings from the sample run */}
        <section className="space-y-3">
          <div className="flex items-baseline justify-between gap-3 flex-wrap">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-zinc-100">Three findings from the {DATA_ASOF} run</h2>
            <span className="text-xs text-zinc-500 dark:text-zinc-500">Directional · not investment advice</span>
          </div>
          <KeyFindings />
        </section>

        {/* 3 — Keystone: routing traced */}
        <section>
          <TracedNameKeystone />
        </section>

        {/* 4 — Primary interactive visual */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-zinc-100">Explore the normalised view</h2>
          <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed max-w-2xl">
            The comparable outputs, four ways. Hover or focus any point for the read; open the full landscape for every
            company’s numbers, cliff bridge and dated developments.
          </p>
          <PrimaryVisual />
        </section>

        {/* 5 — Compact workflow */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-zinc-100">How a run works</h2>
          <WorkflowStrip />
        </section>

        {/* 6 — My contribution */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-zinc-100">What I designed and built</h2>
          <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed max-w-2xl">
            I designed the research taxonomy and A–E franchise model, the company-classification and valuation-engine
            routing, the scoring framework, the data pipeline and the interactive research interface — and defined the
            provenance and review rules that separate sourced facts from model-generated conclusions.
          </p>
        </section>

        {/* 7 — Validation & limitations */}
        <section id="methodology" className="space-y-4 scroll-mt-24">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-zinc-100">Trust &amp; method</h2>
          <ProvenanceCallout />
          <MethodologySummary asOf={DATA_ASOF} offLadder={offLadder} />
        </section>

        {/* 8 — CTAs */}
        <section className="flex flex-wrap gap-3 pt-2">
          <a
            href={FULL_LANDSCAPE_ROUTE}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50"
          >
            Explore the full landscape <ExternalLink className="w-4 h-4" />
          </a>
          <a
            href="#methodology"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl ring-1 ring-zinc-300 dark:ring-white/15 text-zinc-800 dark:text-zinc-200 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors"
          >
            Read the methodology <BookOpen className="w-4 h-4" />
          </a>
        </section>
      </div>
    </ProjectPageLayout>
  );
}

export default PharmaLandscape;
