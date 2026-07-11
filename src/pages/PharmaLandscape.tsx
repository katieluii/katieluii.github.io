import { ExternalLink, Mountain, Layers, Scale } from 'lucide-react';
import ProjectPageLayout from '../components/ProjectPageLayout';
import { ProjectLead } from '../components/ProjectLead';
import { Pill } from '../components/Pill';
import { StatCard, StatGrid } from '../components/ui';
import { getProjectBySlug, formatYearRange } from '../data/projects';

const DEMO = '/demos/pharma-landscape.html';

const STEPS = [
  {
    icon: <Mountain className="w-4 h-4" />,
    title: 'Start with the cliff',
    body: 'Almost every major is managing a loss-of-exclusivity between now and 2031. The map places each one by when its cliff hits and how exposed it is — the tension the whole sector shares.',
  },
  {
    icon: <Layers className="w-4 h-4" />,
    title: 'See the crowding',
    body: "Aggregating every named pipeline asset shows the three bets the industry is piling into — obesity, ADCs & radiopharma, and PD-1×VEGF bispecifics. Where everyone crowds is where the risk concentrates.",
  },
  {
    icon: <Scale className="w-4 h-4" />,
    title: 'Read the gap',
    body: 'A valuation-vs-momentum plot shows how the market prices each cliff-vs-pipeline story — from Lilly alone at a premium to the cliff names clustered cheap. Click any company for the full read.',
  },
];

export function PharmaLandscape() {
  const project = getProjectBySlug('pharma-landscape');

  return (
    <ProjectPageLayout
      title="Large-Cap Pharma Landscape"
      subtitle="An educational map of the sector's shape."
    >
      <div className="space-y-8">
        {/* Pills */}
        {project && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-slate-600 dark:text-zinc-400 px-2.5 py-1 bg-slate-100 dark:bg-zinc-800 rounded">
              {formatYearRange(project.yearStart, project.yearEnd)}
            </span>
            <Pill variant={project.status === 'Live' ? 'status-live' : project.status === 'WIP' ? 'status-wip' : 'tech'}>
              {project.status}
            </Pill>
            {project.themes.map(theme => (
              <Pill key={theme} variant="tech">{theme}</Pill>
            ))}
          </div>
        )}

        {/* Lead */}
        <ProjectLead headline="Thirteen companies, one shared problem, three crowded bets.">
          The large-cap pharma sector is easy to follow name-by-name and hard to see whole. This is the whole: a teaching-first view that distils a per-company profile knowledge base into one page. It opens on the strongest buy and sell signal on the screen — each with a plain-English rationale and its data provenance — then works down into the patent-cliff map, the pipeline crowding, and a valuation-vs-momentum plot. The aim is that someone new to the sector understands its shape in a few minutes, and someone who knows it can pressure-test their own read.
        </ProjectLead>

        {/* How to read it */}
        <div className="grid sm:grid-cols-3 gap-3">
          {STEPS.map((s, i) => (
            <div key={i} className="rounded-2xl ring-1 ring-zinc-200/80 dark:ring-white/10 bg-white/80 dark:bg-zinc-800/80 p-5 space-y-2">
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300">
                {s.icon}
              </div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{s.title}</h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>

        {/* At a glance */}
        <StatGrid cols={3}>
          <StatCard label="Companies profiled" value="13" />
          <StatCard label="Pipeline bets the field is crowding into" value="3" />
          <StatCard label="Data" value={<span className="text-base">Q1 2026 · latest quarter</span>} accent />
        </StatGrid>

        {/* Live view */}
        <div className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-zinc-100">Explore the landscape</h2>
          <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
            Sort the roster, toggle the positioning plot's axes, and click any company for its latest-quarter numbers, patent-cliff bridge, and bull/bear.{' '}
            <span className="text-slate-500 dark:text-zinc-500">Educational and directional — not investment advice.</span>
          </p>
          <div className="rounded-2xl ring-1 ring-zinc-200/80 dark:ring-white/10 overflow-hidden shadow-sm bg-white">
            <iframe
              src={DEMO}
              title="Large-Cap Pharma Landscape — interactive view"
              className="w-full block"
              style={{ height: 820, border: 0 }}
              loading="lazy"
            />
          </div>
          <a
            href={DEMO}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-teal-700 dark:text-teal-400 hover:underline"
          >
            Open the landscape full-screen
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Technologies */}
        {project && project.tags.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-widest">Technologies</h2>
            <div className="flex flex-wrap gap-1.5">
              {project.tags.map(tag => <Pill key={tag} variant="tech">{tag}</Pill>)}
            </div>
          </div>
        )}
      </div>
    </ProjectPageLayout>
  );
}

export default PharmaLandscape;
