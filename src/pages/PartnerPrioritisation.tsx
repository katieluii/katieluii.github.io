import { ExternalLink, Building2, SlidersHorizontal, Send } from 'lucide-react';
import ProjectPageLayout from '../components/ProjectPageLayout';
import { ProjectLead } from '../components/ProjectLead';
import { Pill } from '../components/Pill';
import { StatCard, StatGrid } from '../components/ui';
import { getProjectBySlug, formatYearRange } from '../data/projects';

const DEMO = '/demos/ws19-partner-portal.html';

const STEPS = [
  {
    icon: <Building2 className="w-4 h-4" />,
    title: 'Profile from the public domain',
    body: "Read the client's positioning from their website, and pull the conference's attending-company list. Each company is classified from its public blurb — type, stage, focus.",
  },
  {
    icon: <SlidersHorizontal className="w-4 h-4" />,
    title: 'Score, explainably',
    body: 'Hard filters gate the universe; weighted rules (stage fit, complementarity, BD appetite, capacity) give a 0–100 fit. Every rank carries its reasons — no black box.',
  },
  {
    icon: <Send className="w-4 h-4" />,
    title: 'Prioritise + reach out',
    body: 'A client portal ranks who to meet, re-ranks live as you set your angle, and drafts a tailored first-touch per company to approve, edit and send.',
  },
];

export function PartnerPrioritisation() {
  const project = getProjectBySlug('partner-prioritisation');

  return (
    <ProjectPageLayout
      title="Conference Partner Prioritisation Engine"
      subtitle="Who to meet at BIO / JPM / BioEquity — scored from company profiles"
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
        <ProjectLead headline="Thousands of companies in one place. This tells you who's worth a meeting — and why.">
          Partnering conferences put thousands of companies under one roof, and the platform's own AI matchmaker is generic. This engine builds the prioritisation matrix from company profiles instead: it takes a client's positioning from the public domain, scores every attending company against what the client is actually looking for, and explains each rank. The same engine reshapes per client — for a therapeutic-agnostic drug-development consultancy it drops the disease filters and rewards an early-clinical stage band instead.
        </ProjectLead>

        {/* How it works */}
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

        {/* Stats from a real run */}
        <StatGrid cols={3}>
          <StatCard label="BIO 2026 exhibitors scored (live)" value="1,654" />
          <StatCard label="Priority biotechs surfaced" value="~90" />
          <StatCard label="Scoring" value={<span className="text-base">Two-tier · explainable</span>} accent />
        </StatGrid>

        {/* Live demo */}
        <div className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-zinc-100">Live demo</h2>
          <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
            Set your angle, watch the list re-rank in-browser, then open any company for its rank rationale plus an editable outreach draft.{' '}
            <span className="text-slate-500 dark:text-zinc-500">Illustrative client; public BIO 2026 exhibitor data — the engine and UX are real.</span>
          </p>
          <div className="rounded-2xl ring-1 ring-zinc-200/80 dark:ring-white/10 overflow-hidden shadow-sm bg-white">
            <iframe
              src={DEMO}
              title="Partner Priority Portal — live demo"
              className="w-full block"
              style={{ height: 760, border: 0 }}
              loading="lazy"
            />
          </div>
          <a
            href={DEMO}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-teal-700 dark:text-teal-400 hover:underline"
          >
            Open the demo full-screen
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

export default PartnerPrioritisation;
