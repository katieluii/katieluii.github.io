import {
  ExternalLink,
  Target,
  FlaskConical,
  Swords,
  Scale,
  Banknote,
  ScrollText,
} from 'lucide-react';
import { getProjectBySlug } from '../data/projects';
import { Pill } from '../components/Pill';
import ProjectPageLayout from '../components/ProjectPageLayout';
import { ProjectLead } from '../components/ProjectLead';
import { Reveal } from '../components/shared/craft';
import UnderwriteFunnel from '../components/diagrams/UnderwriteFunnel';
import { WWM } from '../data/workWithMe';

const APP_URL = 'https://investment-memo-agent-git-main-katieluiis-projects.vercel.app';

/* The six diligence agents — open-text icon grid (Atlas pattern), not boxed cards.
   Order matches the funnel's pill order; each line stays to one sentence. */
const AGENTS = [
  {
    icon: Target,
    name: 'Fund-fit',
    tag: 'Gate before the science',
    detail: 'Screens the deal against the fund’s thesis, stage, check size, and portfolio construction.',
  },
  {
    icon: FlaskConical,
    name: 'Scientific',
    tag: 'Mechanism & evidence',
    detail: 'Weighs mechanism of action, the preclinical/clinical data, and the live scientific debates.',
  },
  {
    icon: Swords,
    name: 'Competitive',
    tag: 'Landscape & differentiation',
    detail: 'Maps approved and emerging rivals, market size, and how the asset stands apart.',
  },
  {
    icon: Scale,
    name: 'Clinical & regulatory',
    tag: 'Pathway & precedent',
    detail: 'Reads the optimal regulatory route and the FDA/EMA precedent in the indication.',
  },
  {
    icon: Banknote,
    name: 'Financing & valuation',
    tag: 'Comps & structure',
    detail: 'Surfaces comparable financings and M&A, implied valuation, and structural risks.',
  },
  {
    icon: ScrollText,
    name: 'IP, patents & FTO',
    tag: 'Moat & freedom-to-operate',
    detail: 'Tests the patent estate, exclusivity runway, and blocking third-party patents.',
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
      <div>
        {/* Status pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-slate-600 dark:text-zinc-400 px-2.5 py-1 bg-slate-100 dark:bg-zinc-800 rounded">
            {project.yearStart}
          </span>
          <Pill variant={project.status === 'Live' ? 'status-live' : 'status-wip'}>{project.status}</Pill>
          {project.themes.map((t) => <Pill key={t} variant="tech">{t}</Pill>)}
        </div>

        {/* Brand statement */}
        <div className="mt-8">
          <ProjectLead headline="An IC-grade investment memo, at the click of a button.">
            <p>
              A multi-agent tool built for biotech VCs. The workflow runs in three phases: quantitative analysis —
              a market-sizing calculator, a cap-table &amp; dilution model, and an exit-scenario waterfall — then a
              founding-team assessment for the soft signals hard data can&apos;t reveal, then six specialist diligence
              agents — fund-fit, scientific, competitive, clinical &amp; regulatory, financing &amp; valuation, and
              IP &amp; freedom-to-operate — drawing on public biopharma intelligence and your indexed documents. You
              review and annotate each agent&apos;s findings before all inputs are synthesised into a structured
              investment memo, fully Word-exportable in a single click.
            </p>
          </ProjectLead>
        </div>

        {/* Open app */}
        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href={APP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-[13.5px] font-medium bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900 shadow-sm ring-1 ring-zinc-900/10 dark:ring-white/10 hover:-translate-y-0.5 transition-transform"
          >
            <ExternalLink className="w-4 h-4" />
            Open the app
          </a>
        </div>

        {/* How it works — the shared underwrite funnel (cool variant) in a ring panel */}
        <Reveal className="mt-14 border-t border-zinc-200/70 dark:border-white/10 pt-12 space-y-5">
          <h2 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-widest">
            How it works
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-2xl">
            Four inputs feed six diligence agents that run in parallel; every claim is fact-checked and each is refined
            by hand before the memo is written.
          </p>
          <div className="rounded-2xl ring-1 ring-zinc-200/80 dark:ring-white/10 bg-white/80 dark:bg-zinc-800/80 p-6">
            <UnderwriteFunnel data={funnel} variant="cool" />
          </div>
        </Reveal>

        {/* The diligence panel — six agents as an open-text icon grid */}
        <Reveal className="mt-14 border-t border-zinc-200/70 dark:border-white/10 pt-12 space-y-5">
          <h2 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-widest">
            The diligence panel
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-2xl">
            Six specialists, each owning one axis of the decision — run together, or one at a time as the deal moves.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-6 pt-1">
            {AGENTS.map((a) => {
              const Icon = a.icon;
              return (
                <div key={a.name} className="flex gap-3">
                  <Icon className="w-[18px] h-[18px] mt-0.5 text-zinc-400 dark:text-zinc-500 shrink-0" />
                  <div className="min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <p className="text-[14px] font-semibold text-zinc-900 dark:text-zinc-100">{a.name}</p>
                      <span className="text-[10px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500">{a.tag}</span>
                    </div>
                    <p className="mt-1 text-[13px] text-zinc-500 dark:text-zinc-400 leading-relaxed">{a.detail}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Reveal>

        {/* Technologies */}
        {project.tags.length > 0 && (
          <Reveal className="mt-14 border-t border-zinc-200/70 dark:border-white/10 pt-12 space-y-3">
            <h2 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-widest">
              Built with
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {project.tags.map((tag) => <Pill key={tag} variant="tech">{tag}</Pill>)}
            </div>
          </Reveal>
        )}

        {/* Close */}
        <Reveal className="mt-14 border-t border-zinc-200/70 dark:border-white/10 pt-12 space-y-4">
          <p className="text-[15px] sm:text-[16px] text-zinc-700 dark:text-zinc-300 leading-relaxed max-w-2xl">
            Run a deal end to end, or open one section at a time — the memo is yours to defend.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <a
              href={APP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13.5px] font-medium bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900 shadow-sm ring-1 ring-zinc-900/10 dark:ring-white/10 hover:-translate-y-0.5 transition-transform"
            >
              Open the app
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <a
              href="mailto:katieluikakiu@gmail.com?subject=Investment%20memo%20agent%20—%20enquiry"
              className="text-[13px] text-zinc-700 dark:text-zinc-300 underline decoration-zinc-400 dark:decoration-zinc-600 underline-offset-2 hover:decoration-zinc-700 dark:hover:decoration-zinc-300"
            >
              Get in touch →
            </a>
          </div>
        </Reveal>
      </div>
    </ProjectPageLayout>
  );
}
