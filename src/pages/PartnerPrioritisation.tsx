import { useEffect, useState } from 'react';
import { ExternalLink, Building2, SlidersHorizontal, Send, Mail } from 'lucide-react';
import ProjectPageLayout from '../components/ProjectPageLayout';
import { ProjectLead } from '../components/ProjectLead';
import { Pill } from '../components/Pill';
import { StatCard, StatGrid } from '../components/ui';
import { getProjectBySlug, formatYearRange } from '../data/projects';

/* Edge (suite letter E). The portal is a self-contained HTML app built by
   ws19_partnering/build_portal.py and copied to public/demos/. It scores in the
   visitor's browser: 1,654 BIO 2026 exhibitors (public directory, pulled 21 Jun 2026)
   against whatever angle the visitor types. Nothing is sent anywhere. */
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
    title: 'Read the room from public data',
    body: 'The conference exhibitor list is pulled and each company is classified from its own public blurb: partner type, stage, focus. Companies with an empty blurb stay unclassified and say so.',
  },
  {
    icon: <SlidersHorizontal className="w-4 h-4" />,
    title: 'Score against your angle, in the open',
    body: 'Hard filters (partner type, area, geography) decide who is in scope. Weighted rules (stage band, recent signals, funding, and more) give a 0 to 100 fit. Every row shows its bar by rule and how much public data it rests on.',
  },
  {
    icon: <Send className="w-4 h-4" />,
    title: 'Shortlist, then draft the first touch',
    body: 'Rank, open a company for the reasoning, and edit a first-pass note in your own greeting and sign-off. Approve it, export the list, or copy it into your mail app. Edge never sends anything.',
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
          title="Edge — partner shortlist for BIO 2026 (interactive)"
          className="w-full block"
          style={{ height: 'clamp(560px, calc(100vh - 7rem), 900px)', border: 0 }}
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
    <ProjectPageLayout title="Edge" subtitle="Who is worth a meeting at BIO, and why. Scored in your browser against your own angle.">
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

        <ProjectLead headline="1,654 exhibitors. Type who you want to meet; get a ranked shortlist with the reasoning on every row.">
          Partnering conferences put thousands of companies under one roof, and the platform matchmakers work from
          the fields everyone fills in the same way. Edge works from your positioning instead: it scores every
          attending company against what you are actually looking for, shows the score by rule, and drafts a first
          note you edit before it goes anywhere. Below is the real BIO 2026 exhibitor list with a sample angle already
          set. Replace the angle with your own company and offer; the ranking and drafts update as you type.
        </ProjectLead>

        {/* Try it */}
        <div className="space-y-3">
          <div className="flex items-baseline justify-between gap-4 flex-wrap">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-zinc-100">Try it on BIO 2026</h2>
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
            The sample angle is a fictional drug development consultancy. Set your own under{' '}
            <span className="font-medium text-slate-800 dark:text-zinc-200">Set your angle</span>. Full-screen keeps
            your edits between visits; inside this page they last for the session only. Nothing you type leaves your
            browser.
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
          <StatCard label="BIO 2026 exhibitors in the universe (public directory, pulled 21 Jun 2026)" value="1,654" />
          <StatCard label="Pass the sample angle (biotech, preclinical to Phase 2)" value="90" />
          <StatCard label="Unclassifiable from an empty public blurb; shown as such, never ranked" value="744" accent />
        </StatGrid>
        <p className="text-xs text-zinc-500 dark:text-zinc-500 leading-relaxed -mt-4">
          Public exhibitor data is thin: most companies list no funding stage and many list no therapeutic area, so
          fit scores cluster and ties are broken by how much public data a company has, then by name. Each row shows
          its data count out of five, and drafts on thin signal are flagged before you send them.
        </p>

        {/* Get it for your conference */}
        <div className="rounded-2xl ring-1 ring-zinc-200/80 dark:ring-white/10 bg-white/80 dark:bg-zinc-800/80 p-5 sm:p-6 space-y-2">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Edge for your conference</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            The version above runs on one public exhibitor list. A client build adds your delegate export
            (partneringONE, Inova, BIO One-on-One), your positioning read from your own site, and enrichment from
            owned news, financing and readout data, so the sparse fields above fill in. Built per client for JPM,
            BIO and BioEquity.
          </p>
          <a href={CONTACT} className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#042A1D] dark:text-teal-300 hover:underline">
            <Mail className="w-3.5 h-3.5" />
            katie@renascor.xyz
          </a>
        </div>

      </div>
    </ProjectPageLayout>
  );
}

export default PartnerPrioritisation;
