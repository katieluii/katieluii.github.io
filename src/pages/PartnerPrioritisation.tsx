import { useEffect, useState } from 'react';
import { ExternalLink, Building2, SlidersHorizontal, Send } from 'lucide-react';
import ProjectPageLayout from '../components/ProjectPageLayout';
import { ProjectLead } from '../components/ProjectLead';
import { Pill } from '../components/Pill';
import { StatCard, StatGrid } from '../components/ui';
import { getProjectBySlug, formatYearRange } from '../data/projects';

/* Edge (suite letter E). The portal is a self-contained HTML app built by
   ws19_partnering/build_portal.py and copied to public/demos/. It scores in the
   visitor's browser. Jefferies London 2026 is the default dataset (330 company
   entries and 899 published attendee records, pulled 21 Sep 2026); the existing
   1,654-company BIO 2026 dataset remains selectable. Nothing is sent anywhere. */
const PORTAL = '/demos/ws19-partner-portal.html';
const CONTACT = 'mailto:katie@renascor.xyz?subject=Edge%20for%20our%20next%20conference';

/* The universe is third-party text (exhibitor blurbs). The build escapes it and the
   portal builds its DOM with createElement only, but the embed is still sandboxed
   without allow-same-origin so a future data problem can never reach this page.
   Clipboard is delegated so "Copy + open in mail" works inside the frame. */
const SANDBOX = 'allow-scripts allow-popups allow-popups-to-escape-sandbox allow-modals allow-forms allow-downloads';

const STEPS = [
  {
    icon: <Building2 className="w-4 h-4" />,
    title: 'Read public data',
    body: 'Classify each exhibitor by partner type, stage, and focus. Empty blurbs stay unclassified.',
  },
  {
    icon: <SlidersHorizontal className="w-4 h-4" />,
    title: 'Score your angle',
    body: 'Hard filters set scope. Weighted rules score fit from 0 to 100, with the breakdown and data coverage on every row.',
  },
  {
    icon: <Send className="w-4 h-4" />,
    title: 'Shortlist and draft',
    body: 'Review the rationale, edit a first-pass note, then approve, export, or copy it. Edge never sends.',
  },
];

function EmbeddedPortal() {
  const [state, setState] = useState<'loading' | 'ready' | 'failed'>('loading');
  useEffect(() => {
    if (state !== 'loading') return;
    const t = window.setTimeout(() => setState((s) => (s === 'loading' ? 'failed' : s)), 12000);
    return () => window.clearTimeout(t);
  }, [state]);

  return (
    <div className="rounded-2xl ring-1 ring-zinc-200/80 dark:ring-white/10 overflow-hidden shadow-sm bg-[#F3EFE7] relative">
      {state === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-zinc-500 pointer-events-none" aria-hidden>
          Loading Edge…
        </div>
      )}
      {state === 'failed' ? (
        <div className="p-8 text-sm text-zinc-700">
          The embedded portal did not load.{' '}
          <a href={PORTAL} target="_blank" rel="noopener noreferrer" className="font-semibold underline">
            Open Edge directly
          </a>
          .
        </div>
      ) : (
        <iframe
          src={PORTAL}
          title="Edge — partner shortlist for Jefferies London 2026 (interactive)"
          className="w-full block"
          style={{ height: 'clamp(480px, 65vh, 680px)', border: 0 }}
          sandbox={SANDBOX}
          allow="clipboard-write"
          referrerPolicy="no-referrer"
          loading="lazy"
          onLoad={() => setState('ready')}
          onError={() => setState('failed')}
        />
      )}
    </div>
  );
}

export function PartnerPrioritisation() {
  const project = getProjectBySlug('partner-prioritisation');

  return (
    <ProjectPageLayout title="Edge" subtitle="Who is worth a meeting at your next conference, and why. Scored in your browser against your own angle.">
      <div className="space-y-8">
        {project && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-slate-600 dark:text-zinc-400 px-2.5 py-1 bg-slate-100 dark:bg-zinc-800 rounded">
              {formatYearRange(project.yearStart, project.yearEnd)}
            </span>
            <Pill variant={project.status === 'Live' ? 'status-live' : project.status === 'WIP' ? 'status-wip' : 'tech'}>
              {project.status}
            </Pill>
            {project.themes.map((theme) => (
              <Pill key={theme} variant="tech">
                {theme}
              </Pill>
            ))}
          </div>
        )}

        <ProjectLead headline="Your company's BD conference outreach manager. Prioritise the right companies and the right partnership angle.">
          Conference matchmakers rely on standard profile fields. Edge ranks companies against your actual positioning,
          scores each match by rule, and drafts a first note for you to edit.

          Below is the current public Jefferies London 2026 company and attendee roster with a sample angle. Replace it
          with your company and offer; the rankings and drafts update as you type. BIO 2026 remains available in the
          conference selector.
        </ProjectLead>

        {/* Try it */}
        <div className="space-y-3">
          <div className="flex items-baseline justify-between gap-4 flex-wrap">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-zinc-100">Try it on Jefferies London 2026</h2>
            <a
              href={PORTAL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-[#042A1D] hover:bg-[#0B5138] rounded-lg px-3.5 py-2"
            >
              Open Edge full-screen
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
          <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
            A sample angle is already set. Replace it with your own company and offer; the ranking and draft notes
            update as you type.
          </p>
          <EmbeddedPortal />
        </div>

        {/* How it works */}
        <div className="grid sm:grid-cols-3 gap-3">
          {STEPS.map((s) => (
            <div key={s.title} className="rounded-2xl ring-1 ring-zinc-200/80 dark:ring-white/10 bg-white/80 dark:bg-zinc-800/80 p-5 space-y-2">
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#F3EFE7] text-[#042A1D] dark:bg-teal-500/10 dark:text-teal-300">
                {s.icon}
              </div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{s.title}</h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>

        {/* The numbers, honestly */}
        <StatGrid cols={3}>
          <StatCard label="Jefferies company entries" value="330" />
          <StatCard label="Published attendee records" value="899" />
          <StatCard label="BIO exhibitors retained" value="1,654" accent />
        </StatGrid>
        <p className="text-xs text-zinc-500 dark:text-zinc-500 leading-relaxed -mt-4">
          Jefferies data reflects the 11-page public roster pulled on 21 September 2026. Seven company entries did not
          publish attendee names. Each row shows data coverage, and missing fields remain unknown.
        </p>

        {/* Close */}
        <div className="rounded-2xl ring-1 ring-zinc-200/80 dark:ring-white/10 bg-white/80 dark:bg-zinc-800/80 p-5 sm:p-6 space-y-2">
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Want the outputs ready to use, or Atlas inside your own systems? Either works.
          </p>
          <a href={CONTACT} className="inline-flex items-center text-sm font-semibold text-[#042A1D] dark:text-teal-300 hover:underline">
            Get in touch →
          </a>
        </div>

      </div>
    </ProjectPageLayout>
  );
}

export default PartnerPrioritisation;
