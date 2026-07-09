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

const MEMO_ROWS = [
  { label: 'Deal overview', value: 'NSCLC · EGFR ex19del inhibitor · Series B' },
  { label: 'Scientific rationale', value: 'Validated target, strong translational data' },
  { label: 'Clinical risk', value: 'Ph2 readout pending — moderate' },
  { label: 'Market size', value: '$4.2B peak (US + EU5)' },
  { label: 'Competitive landscape', value: '3 approved, 2 in Ph3' },
  { label: 'Cap table / exit scenario', value: 'Base case 3.1× MOIC' },
  { label: 'Human review checkpoint', value: 'Awaiting partner sign-off' },
];

/* Static mockup — illustrative only, not a real deal. Placed beside the ProjectLead
   intro so the "IC-grade memo" claim has a visual payoff right where it's made. */
function DealCardMock() {
  return (
    <div className="rounded-2xl ring-1 ring-zinc-200/80 dark:ring-white/10 bg-white/80 dark:bg-zinc-800/80 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[15px] font-bold text-zinc-900 dark:text-zinc-100">Deal card</p>
          <p className="mt-0.5 text-[11px] text-zinc-400 dark:text-zinc-500">Axon Therapeutics — Series B</p>
        </div>
        <span className="shrink-0 text-[10.5px] font-medium px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 whitespace-nowrap">
          Human review required
        </span>
      </div>

      <div className="mt-4 border-t border-zinc-200/70 dark:border-white/10">
        {MEMO_ROWS.map((row) => (
          <div
            key={row.label}
            className="flex items-baseline justify-between gap-3 py-2 border-b border-zinc-100 dark:border-white/5 last:border-b-0"
          >
            <span className="text-[11.5px] text-zinc-400 dark:text-zinc-500 shrink-0">{row.label}</span>
            <span className="text-[12.5px] font-medium text-zinc-800 dark:text-zinc-200 text-right">{row.value}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-zinc-200/70 dark:border-white/10">
        <p className="text-[10.5px] text-zinc-400 dark:text-zinc-500 mb-1.5">Overall confidence</p>
        <div className="flex flex-wrap gap-1.5">
          <span className="text-[10.5px] font-semibold px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
            Scientific — Strong
          </span>
          <span className="text-[10.5px] font-semibold px-2 py-1 rounded-md bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
            Clinical — Moderate
          </span>
          <span className="text-[10.5px] font-semibold px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
            Financing — Strong
          </span>
        </div>
      </div>

      <p className="mt-3 text-[10px] italic text-zinc-300 dark:text-zinc-600 text-right">
        Illustrative preview — not a real deal
      </p>
    </div>
  );
}

const PIPELINE_COLS = ['Company', 'Status', 'Round', 'Investment', 'MOIC'];
const DEAL_PAGE_SECTIONS = [
  'Overview', 'Documents', 'Market sizing', 'Cap table', 'Exit scenarios', 'Founder insights', 'Review', 'Memo',
];

/* Structural snapshots — no data filled in, just the shape of each screen. */
function PipelineViewSnapshot() {
  return (
    <div className="rounded-xl ring-1 ring-zinc-200/80 dark:ring-white/10 bg-white/80 dark:bg-zinc-800/80 p-4">
      <p className="text-[11.5px] font-semibold text-zinc-900 dark:text-zinc-100 mb-3">Pipeline view</p>
      <div className="grid grid-cols-5 gap-2 pb-1.5 border-b border-zinc-200/80 dark:border-white/10">
        {PIPELINE_COLS.map((c) => (
          <span key={c} className="text-[9px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500">{c}</span>
        ))}
      </div>
      {[0, 1, 2].map((row) => (
        <div key={row} className="grid grid-cols-5 gap-2 py-2 border-b border-zinc-100 dark:border-white/5 last:border-b-0">
          {PIPELINE_COLS.map((c) => (
            <span key={c} className="h-2 rounded bg-zinc-100 dark:bg-zinc-700/60" />
          ))}
        </div>
      ))}
    </div>
  );
}

function DealPageSnapshot() {
  return (
    <div className="rounded-xl ring-1 ring-zinc-200/80 dark:ring-white/10 bg-white/80 dark:bg-zinc-800/80 p-4">
      <p className="text-[11.5px] font-semibold text-zinc-900 dark:text-zinc-100 mb-3">Deal page</p>
      <div className="flex items-center justify-between mb-3.5">
        <span className="h-2.5 w-24 rounded bg-zinc-200 dark:bg-zinc-700" />
        <span className="h-4 w-14 rounded-full bg-zinc-100 dark:bg-zinc-700/60" />
      </div>
      <div className="flex flex-wrap gap-1.5">
        {DEAL_PAGE_SECTIONS.map((s) => (
          <span key={s} className="text-[10px] px-2 py-1 rounded-md text-zinc-500 dark:text-zinc-400 ring-1 ring-zinc-200/80 dark:ring-white/10">
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}

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
    <ProjectPageLayout
      title={project.title}
      subtitle="Multi-agent diligence for biotech investment."
      containerClassName="max-w-6xl mx-auto px-6"
    >
      <div>
        {/* Status pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-slate-600 dark:text-zinc-400 px-2.5 py-1 bg-slate-100 dark:bg-zinc-800 rounded">
            {project.yearStart}
          </span>
          <Pill variant={project.status === 'Live' ? 'status-live' : 'status-wip'}>{project.status}</Pill>
          {project.themes.map((t) => <Pill key={t} variant="tech">{t}</Pill>)}
        </div>

        {/* Brand statement + deal card preview */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-[1fr_460px] gap-24 items-stretch">
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
            <p style={{ marginTop: '3.5rem' }}>
              In practice: create a deal, drop in the data room, and the agents get to work while you complete the
              founding-team read. Check back for risk flags, re-run any single agent as new documents land, and the
              memo compiles the moment you&apos;re ready to defend it to committee.
            </p>
          </ProjectLead>
          <DealCardMock />
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
            <UnderwriteFunnel
              data={funnel}
              variant="cool"
              hideEyebrow
              agentDetails={AGENTS.map((a) => ({ name: a.name, detail: a.tag }))}
              snapshots={
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <PipelineViewSnapshot />
                  <DealPageSnapshot />
                </div>
              }
            />
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
