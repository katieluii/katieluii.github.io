import { Link } from 'react-router-dom';
import { Grain } from '../components/shared/craft';

/* WS15 — the "Work with me" chooser. Two doors: biotech teams / investors. */

const INK = '#1B1A17';
const BG = '#FAF7F1';
const MUTED = '#6B665D';
const BODY = '#3A362F';
const ACCENT = '#6E2433'; // oxblood accent (match the audience pages)
const HAIR = 'rgba(27,26,23,0.12)';
const DISPLAY = "'Fraunces', Georgia, serif";

const WAYS = [
  {
    label: 'Retainer',
    line: 'Fractional AI and analytical expertise, ongoing — your standing analyst.',
  },
  {
    label: 'Project',
    line: 'A defined analysis or build, scoped by milestone — or by time when it’s work on your platform.',
  },
  {
    label: 'Tools',
    line: 'The AI tools and agents themselves — handed over, or licensed to run in-house.',
  },
];

const DOORS = [
  {
    href: '/work-with-me/teams',
    label: 'For biotech teams',
    line: 'Landscapes, target product profiles, and positioning. For companies building drugs, and the consultancies that serve them.',
  },
  {
    href: '/work-with-me/investors',
    label: 'For investors',
    line: 'IC memos and scientific diligence. For the funds underwriting biotech deals.',
  },
];

export default function WorkWithMeHub() {
  return (
    <div style={{ background: BG, color: INK, minHeight: '100vh' }} className="antialiased relative">
      <Grain />
      {/* ambient glow — soft oxblood depth behind the chooser */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(90% 55% at 22% 32%, rgba(110,36,51,0.10), rgba(110,36,51,0) 60%)' }}
      />
      <div className="relative mx-auto max-w-3xl px-6 sm:px-8 flex flex-col min-h-screen">
        {/* masthead wordmark — identity only; intentionally NOT a link back to the
            portfolio so the commercial surface stays one-directional (forward into work). */}
        <div className="rise pt-8 text-[13px] font-medium" style={{ color: INK }}>
          Katie Lui
        </div>

        <div className="flex-1 flex flex-col justify-center py-20">
          <div className="rise flex items-center gap-2 mb-7 text-[12px] uppercase tracking-[0.16em]" style={{ color: MUTED, animationDelay: '0.05s' }}>
            <span className="inline-block w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: ACCENT }} aria-hidden />
            Work with me
          </div>

          <h1
            className="rise text-[36px] leading-[1.08] sm:text-[52px] sm:leading-[1.05] font-semibold max-w-2xl"
            style={{ fontFamily: DISPLAY, letterSpacing: '-0.015em', animationDelay: '0.13s' }}
          >
            Analysis is cheap now. Judgment isn’t.
          </h1>
          <p className="rise mt-5 text-[18px] leading-[1.55] max-w-xl" style={{ color: BODY, animationDelay: '0.21s' }}>
            AI-run, human-checked. The drug development analysis teams build on, and the diligence investors rely on. Pick your side.
          </p>

          {/* the decision: two audience doors, first thing after the intro */}
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-5">
            {DOORS.map((d, i) => (
              <Link
                key={d.href}
                to={d.href}
                className="rise group flex flex-col p-7 rounded-2xl transition-all hover:-translate-y-1"
                style={{ border: `1px solid ${HAIR}`, background: 'rgba(255,255,255,0.5)', animationDelay: `${0.3 + i * 0.1}s` }}
              >
                <h2 className="text-[24px] sm:text-[27px] font-semibold leading-tight" style={{ fontFamily: DISPLAY }}>
                  {d.label}
                </h2>
                <p className="mt-3 text-[14px] leading-[1.55]" style={{ color: BODY }}>{d.line}</p>
                <span
                  className="mt-auto pt-6 inline-flex items-center gap-1.5 text-[14px] font-medium transition-all group-hover:gap-3"
                  style={{ color: ACCENT }}
                >
                  Enter →
                </span>
              </Link>
            ))}
          </div>

          {/* trust micro-line — echoes the provenance story without a full section */}
          <p className="mt-7 text-[13px] leading-[1.6]" style={{ color: MUTED }}>
            Every claim sourced to the primary record. Nothing generated; modelled figures flagged.
          </p>

          {/* ways of working — supporting "how it works" footnote, below the decision */}
          <div className="mt-14 pt-9" style={{ borderTop: `1px solid ${HAIR}` }}>
            <p className="text-[11px] font-semibold uppercase mb-5" style={{ color: MUTED, letterSpacing: '0.1em' }}>
              Ways of working
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-8 gap-y-5">
              {WAYS.map((w) => (
                <div key={w.label}>
                  <p className="text-[13px] font-semibold" style={{ color: BODY }}>{w.label}</p>
                  <p className="mt-1.5 text-[12.5px] leading-[1.5]" style={{ color: MUTED }}>{w.line}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <footer className="py-10 text-[12px]" style={{ color: MUTED, borderTop: `1px solid ${HAIR}` }}>
          © 2026 Katie Lui
        </footer>
      </div>
    </div>
  );
}
