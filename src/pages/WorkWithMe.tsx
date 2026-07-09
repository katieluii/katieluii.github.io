import {
  Gauge,
  Layers,
  ShieldCheck,
  Lock,
  Target,
  RefreshCw,
  ArrowRight,
  ArrowUpRight,
  Clock,
  Compass,
  Repeat,
} from 'lucide-react';
import CommercialLayout from '../components/CommercialLayout';
import { Reveal } from '../components/shared/craft';
import AtlasDataflow from '../components/atlas/AtlasDataflow';
import UnderwriteFunnel from '../components/diagrams/UnderwriteFunnel';
import { WWM, UNDERWRITE, type WwmContent, type Point } from '../data/workWithMe';
import { POSITIONING } from '../data/atlas/copy';

/* WS15 — the two audience surfaces (/work-with-me/teams + /work-with-me/investors),
   folded into the Atlas zinc/editorial design system: zinc palette, light+dark via
   `dark:` classes, system sans, lucide icons, hairline dividers, rounded-pill CTA.
   ONE component, path-swapped by audience (variant prop, preset from the route).
   Copy carries the differentiation; the diagram is demoted below the fold. */

const CONTACT_MAILTO = 'mailto:katieluikakiu@gmail.com?subject=Working%20together';

// lucide icon registry — data files carry icon NAMES; resolved here
const ICONS: Record<string, React.ElementType> = {
  gauge: Gauge,
  layers: Layers,
  'shield-check': ShieldCheck,
  lock: Lock,
  target: Target,
  'refresh-cw': RefreshCw,
};

function PointRow({ p }: { p: Point }) {
  const Icon = ICONS[p.icon] ?? Gauge;
  return (
    <div className="flex gap-3">
      <Icon className="w-[18px] h-[18px] mt-0.5 text-zinc-400 dark:text-zinc-500 shrink-0" />
      <div>
        <p className="text-[14px] font-semibold text-zinc-900 dark:text-zinc-100">{p.title}</p>
        <p className="mt-1 text-[13px] text-zinc-500 dark:text-zinc-400 leading-relaxed">{p.detail}</p>
      </div>
    </div>
  );
}

export default function WorkWithMe({ variant }: { variant: 'teams' | 'investors' }) {
  const c: WwmContent = WWM[variant];

  return (
    <CommercialLayout>
      {/* ── HERO — outcome headline + one proof point ── */}
      <div>
        <div className="flex items-center gap-2 text-[11.5px] uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" aria-hidden />
          {variant === 'teams' ? 'For biotech teams' : 'For investors'}
        </div>
        <h1 className="mt-6 text-[34px] leading-[1.08] sm:text-[46px] sm:leading-[1.05] font-bold tracking-tight text-zinc-900 dark:text-zinc-50 max-w-[20ch]">
          {c.outcome}
        </h1>
        <p className="mt-6 text-[17px] sm:text-[18px] leading-relaxed text-zinc-600 dark:text-zinc-300 max-w-xl">
          {c.sub}
        </p>
        <p className="mt-5 text-[13.5px] leading-relaxed text-zinc-500 dark:text-zinc-400 max-w-xl border-l-2 border-zinc-200 dark:border-white/10 pl-4">
          {c.proofPoint}
        </p>
        <div className="mt-9 flex flex-wrap items-center gap-x-5 gap-y-3">
          <a
            href={CONTACT_MAILTO}
            className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13.5px] font-medium bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900 shadow-sm ring-1 ring-zinc-900/10 dark:ring-white/10 hover:-translate-y-0.5 transition-transform"
          >
            Start the pilot
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
          <a
            href="#proof"
            className="text-[13.5px] font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            See a sample →
          </a>
          <a
            href={c.navOther.href}
            className="text-[13px] text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            {c.navOther.label} →
          </a>
        </div>
      </div>

      {/* ── THE JOB — job-to-be-done in words ── */}
      <Reveal className="mt-14 border-t border-zinc-200/70 dark:border-white/10 pt-12 space-y-4">
        <h2 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-widest">
          {c.jobLabel}
        </h2>
        <p className="text-[17px] sm:text-[19px] leading-relaxed text-zinc-700 dark:text-zinc-300 max-w-2xl">
          {c.job}
        </p>
      </Reveal>

      {/* ── THE PILOT — the entry SKU, the gripping surface ── */}
      <Reveal className="mt-14 border-t border-zinc-200/70 dark:border-white/10 pt-12 space-y-5">
        <h2 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-widest">
          Where it starts — a fixed-scope pilot
        </h2>
        <div className="rounded-2xl ring-1 ring-zinc-200/80 dark:ring-white/10 bg-white/80 dark:bg-zinc-800/80 p-6 sm:p-7 space-y-5">
          <div className="flex gap-3">
            <Compass className="w-[18px] h-[18px] mt-0.5 text-zinc-400 dark:text-zinc-500 shrink-0" />
            <div>
              <p className="text-[10px] uppercase tracking-wider font-semibold text-zinc-400 dark:text-zinc-500">
                The deliverable
              </p>
              <p className="mt-1 text-[14.5px] leading-relaxed text-zinc-800 dark:text-zinc-200">{c.pilot.deliverable}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5 pt-1 border-t border-zinc-200/70 dark:border-white/10">
            <div className="flex gap-3 pt-1">
              <Clock className="w-[18px] h-[18px] mt-0.5 text-zinc-400 dark:text-zinc-500 shrink-0" />
              <div>
                <p className="text-[10px] uppercase tracking-wider font-semibold text-zinc-400 dark:text-zinc-500">
                  Turnaround
                </p>
                <p className="mt-1 text-[13.5px] leading-relaxed text-zinc-600 dark:text-zinc-400">{c.pilot.turnaround}</p>
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <Target className="w-[18px] h-[18px] mt-0.5 text-zinc-400 dark:text-zinc-500 shrink-0" />
              <div>
                <p className="text-[10px] uppercase tracking-wider font-semibold text-zinc-400 dark:text-zinc-500">
                  The decision it informs
                </p>
                <p className="mt-1 text-[13.5px] leading-relaxed text-zinc-600 dark:text-zinc-400">{c.pilot.decision}</p>
              </div>
            </div>
          </div>
          <div className="flex gap-3 pt-4 border-t border-zinc-200/70 dark:border-white/10">
            <Repeat className="w-[18px] h-[18px] mt-0.5 text-zinc-400 dark:text-zinc-500 shrink-0" />
            <div>
              <p className="text-[10px] uppercase tracking-wider font-semibold text-zinc-400 dark:text-zinc-500">
                What it becomes
              </p>
              <p className="mt-1 text-[13.5px] leading-relaxed text-zinc-600 dark:text-zinc-400">{c.pilot.converts}</p>
            </div>
          </div>
        </div>
        <a
          href={CONTACT_MAILTO}
          className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13.5px] font-medium bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900 shadow-sm ring-1 ring-zinc-900/10 dark:ring-white/10 hover:-translate-y-0.5 transition-transform"
        >
          Start the pilot
          <ArrowRight className="w-3.5 h-3.5" />
        </a>
      </Reveal>

      {/* ── WHAT YOU GET — differentiator points (incl. the info-barrier line) ── */}
      <Reveal className="mt-14 border-t border-zinc-200/70 dark:border-white/10 pt-12 space-y-6">
        <h2 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-widest">
          What you get
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-6">
          {c.points.map((p) => (
            <PointRow key={p.title} p={p} />
          ))}
        </div>
      </Reveal>

      {/* ── PROOF — real sample deliverables (proof, not catalog) ── */}
      <Reveal id="proof" className="mt-14 border-t border-zinc-200/70 dark:border-white/10 pt-12 space-y-4 scroll-mt-20">
        <h2 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-widest">
          Proof
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-2xl">{c.workLead}</p>
        <div className="border-y border-zinc-200/70 dark:border-white/10 divide-y divide-zinc-200/70 dark:divide-white/10">
          {c.work.map((w) => (
            <a key={w.href} href={w.href} className="group block py-4">
              <div className="flex items-center justify-between gap-4">
                <span className="min-w-0">
                  <span className="text-[14px] font-semibold text-zinc-900 dark:text-zinc-100">{w.title}</span>
                  <span className="ml-2 text-[12px] text-zinc-500 dark:text-zinc-400">{w.kind}</span>
                </span>
                <ArrowRight className="w-4 h-4 text-zinc-400 dark:text-zinc-500 group-hover:translate-x-0.5 transition-transform shrink-0" />
              </div>
              <p className="mt-1.5 text-[13px] text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-2xl">{w.dek}</p>
              <p className="mt-1 text-[11.5px] text-zinc-400 dark:text-zinc-500">{w.meta}</p>
            </a>
          ))}
        </div>
        <a
          href="/atlas-reader"
          className="inline-flex items-center gap-1 text-[13px] text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
        >
          Browse all deliverables
          <ArrowRight className="w-3.5 h-3.5" />
        </a>
      </Reveal>

      {/* ── HOW IT WORKS — demoted below the fold ── */}
      <Reveal className="mt-14 border-t border-zinc-200/70 dark:border-white/10 pt-12 space-y-5">
        <h2 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-widest">
          {c.howLabel}
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-2xl">{c.howLead}</p>
        <div className="rounded-2xl ring-1 ring-zinc-200/80 dark:ring-white/10 bg-white/80 dark:bg-zinc-800/80 p-6">
          {variant === 'teams' ? (
            <AtlasDataflow theme="portfolio" />
          ) : (
            <UnderwriteFunnel data={UNDERWRITE} variant="cool" hideEyebrow />
          )}
        </div>
      </Reveal>

      {/* ── POSITIONING — shared constant (single source of truth w/ Atlas page) ── */}
      <Reveal className="mt-14 border-t border-zinc-200/70 dark:border-white/10 pt-12 space-y-3">
        <h2 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-widest">
          {POSITIONING.framingLabel}
        </h2>
        <p className="text-[15px] sm:text-[16px] leading-relaxed text-zinc-700 dark:text-zinc-300 max-w-2xl">
          {POSITIONING.framing}
        </p>
      </Reveal>

      {/* ── CLOSE — capacity scarcity + contact ── */}
      <Reveal className="mt-14 border-t border-zinc-200/70 dark:border-white/10 pt-12 space-y-4">
        <p className="text-[18px] sm:text-[20px] font-semibold text-zinc-900 dark:text-zinc-100 leading-snug max-w-xl">
          {c.closeHeadline}
        </p>
        <p className="text-[15px] leading-relaxed text-zinc-600 dark:text-zinc-400 max-w-xl">{c.closeBody}</p>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3 pt-2">
          <a
            href={CONTACT_MAILTO}
            className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13.5px] font-medium bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900 shadow-sm ring-1 ring-zinc-900/10 dark:ring-white/10 hover:-translate-y-0.5 transition-transform"
          >
            Start a conversation
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
          <a
            href="https://www.linkedin.com/in/katieluikakiu"
            target="_blank"
            rel="noreferrer"
            className="text-[13.5px] font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            LinkedIn →
          </a>
        </div>
      </Reveal>
    </CommercialLayout>
  );
}
