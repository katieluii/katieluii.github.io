import { ExternalLink } from 'lucide-react';
import { getProjectBySlug } from '../data/projects';
import { Pill } from '../components/Pill';
import ProjectPageLayout from '../components/ProjectPageLayout';
import { ProjectLead } from '../components/ProjectLead';
import UnderwriteFunnel from '../components/diagrams/UnderwriteFunnel';
import { WWM } from '../data/workWithMe';

const APP_URL = 'https://investment-memo-agent-git-main-katieluiis-projects.vercel.app';

/* Per-agent detail — the funnel above shows the agents as pills; this grid carries
   the descriptions a showcase page warrants. Order matches the funnel's pill order. */
const AGENTS = [
  {
    icon: '🎯',
    name: 'Fund-fit',
    description:
      'Screens the opportunity against the fund\'s thesis, stage, check size, and portfolio construction — the gate before the science.',
  },
  {
    icon: '🔬',
    name: 'Scientific Diligence',
    description:
      'Evaluates mechanism of action, clinical and preclinical evidence, and the scientific validity of the asset. Highlights both opportunities and risks.',
  },
  {
    icon: '🏁',
    name: 'Competitive Intelligence',
    description:
      'Maps the competitive landscape, assesses market size and patient population, and identifies how the asset differentiates from approved and emerging competitors.',
  },
  {
    icon: '⚖️',
    name: 'Clinical & Regulatory',
    description:
      'Analyses the optimal regulatory pathway, draws on FDA and EMA precedent in the indication, and surfaces regulatory opportunities and risks.',
  },
  {
    icon: '💰',
    name: 'Financing & Valuation',
    description:
      'Identifies comparable recent financings and M&A transactions, assesses implied valuation, and flags financing opportunities and structural risks.',
  },
];

export default function InvestmentMemo() {
  const project = getProjectBySlug('investment-memo-agent');

  if (!project) {
    return (
      <ProjectPageLayout title="Project not found">
        <p className="text-slate-600 dark:text-zinc-400">That project doesn't exist.</p>
      </ProjectPageLayout>
    );
  }

  const funnel = WWM.investors.underwrite!;

  return (
    <ProjectPageLayout title={project.title} subtitle="Multi-agent · FastAPI · Next.js · SQLite">
      <div className="space-y-14">

        {/* Status pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-slate-600 dark:text-zinc-400 px-2.5 py-1 bg-slate-100 dark:bg-zinc-800 rounded">
            {project.yearStart}
          </span>
          <Pill variant={project.status === 'Live' ? 'status-live' : 'status-wip'}>{project.status}</Pill>
          {project.themes.map((t) => <Pill key={t} variant="tech">{t}</Pill>)}
        </div>

        {/* Brand statement — the thesis, not a wall of text */}
        <ProjectLead headline="An IC-grade investment memo, at the click of a button.">
          <p>
            A multi-agent tool built for biotech VCs. The workflow runs in three phases: quantitative analysis —
            a market-sizing calculator, a cap-table &amp; dilution model, and an exit-scenario waterfall — then a
            founding-team assessment for the soft signals hard data can't reveal, then five specialist diligence
            agents — fund-fit, scientific, competitive, clinical &amp; regulatory, and financing &amp; valuation —
            drawing on public biopharma intelligence and your indexed documents. You review and annotate each
            agent's findings before all inputs are synthesised into a structured investment memo, fully
            Word-exportable in a single click.
          </p>
        </ProjectLead>

        {/* Open app button */}
        <div className="flex flex-wrap gap-3">
          <a
            href={APP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Open App
          </a>
        </div>

        {/* How it works — shared underwrite funnel (cool variant; same diagram as the
            /work-with-me/investors page) */}
        <section>
          <UnderwriteFunnel data={funnel} variant="cool" />
        </section>

        {/* The agents — supporting detail under the funnel overview */}
        <section className="space-y-3">
          <h2 className="text-xs font-semibold text-slate-900 dark:text-zinc-100 uppercase tracking-widest">The agents</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {AGENTS.map((a) => (
              <div key={a.name} className="rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-3">
                <p className="text-sm font-semibold text-slate-900 dark:text-zinc-100 mb-1">{a.icon} {a.name}</p>
                <p className="text-xs text-slate-500 dark:text-zinc-500 leading-relaxed">{a.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Technologies */}
        {project.tags.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-xs font-semibold text-slate-900 dark:text-zinc-100 uppercase tracking-widest">Technologies</h2>
            <div className="flex flex-wrap gap-1.5">
              {project.tags.map((tag) => <Pill key={tag} variant="tech">{tag}</Pill>)}
            </div>
          </section>
        )}

      </div>
    </ProjectPageLayout>
  );
}
