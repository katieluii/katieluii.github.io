import { Link } from 'react-router-dom';

/* WS15 — the "Work with me" chooser. Two doors: biotech teams / investors. */

const INK = '#1B1A17';
const BG = '#FAF7F1';
const MUTED = '#6B665D';
const BODY = '#3A362F';
const ACCENT = '#26306B'; // indigo (match the audience pages)
const HAIR = 'rgba(27,26,23,0.12)';
const DISPLAY = "'Fraunces', Georgia, serif";

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
    <div style={{ background: BG, color: INK, minHeight: '100vh' }} className="antialiased">
      <div className="mx-auto max-w-3xl px-6 sm:px-8 flex flex-col min-h-screen">
        <div className="pt-8 text-[13px]" style={{ color: MUTED }}>
          <Link to="/" className="hover:opacity-70 transition-opacity">← Katie Lui</Link>
        </div>

        <div className="flex-1 flex flex-col justify-center py-20">
          <div className="flex items-center gap-2 mb-7 text-[12px] uppercase tracking-[0.16em]" style={{ color: MUTED }}>
            <span className="inline-block w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: ACCENT }} aria-hidden />
            Work with me
          </div>

          <h1
            className="text-[36px] leading-[1.08] sm:text-[52px] sm:leading-[1.05] font-semibold max-w-2xl"
            style={{ fontFamily: DISPLAY, letterSpacing: '-0.015em' }}
          >
            One analyst, two practices.
          </h1>
          <p className="mt-5 text-[18px] leading-[1.55] max-w-xl" style={{ color: BODY }}>
            I do the drug-development analysis teams build on, and the diligence investors underwrite on. Pick the one that fits you.
          </p>

          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-5">
            {DOORS.map((d) => (
              <Link
                key={d.href}
                to={d.href}
                className="group block p-7 rounded-2xl transition-all hover:-translate-y-1"
                style={{ border: `1px solid ${HAIR}`, background: 'rgba(255,255,255,0.5)' }}
              >
                <h2 className="text-[24px] sm:text-[27px] font-semibold leading-tight" style={{ fontFamily: DISPLAY }}>
                  {d.label}
                </h2>
                <p className="mt-3 text-[14px] leading-[1.55]" style={{ color: BODY }}>{d.line}</p>
                <span
                  className="mt-5 inline-flex items-center gap-1.5 text-[14px] font-medium transition-all group-hover:gap-3"
                  style={{ color: ACCENT }}
                >
                  Enter →
                </span>
              </Link>
            ))}
          </div>
        </div>

        <footer className="py-10 text-[12px]" style={{ color: MUTED, borderTop: `1px solid ${HAIR}` }}>
          © 2026 Katie Lui
        </footer>
      </div>
    </div>
  );
}
