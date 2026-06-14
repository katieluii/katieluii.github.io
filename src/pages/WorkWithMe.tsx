import { Link } from 'react-router-dom';
import { WWM, type WwmContent, type WorkItem, type Dataflow, type Underwrite, type TwoMode } from '../data/workWithMe';

/* WS15 — two audience pages. Canonical consultancy flow (hero → POV → how it
   works → selected work → CTA), differentiated by hero alignment + which
   deliverable leads. Warm canvas, near-black ink with an opacity ramp, one
   indigo accent used sparingly, Fraunces display at light weight + large scale. */

const FONT_MAP: Record<string, string> = {
  fraunces: "'Fraunces', Georgia, serif",
  instrument: "'Instrument Serif', Georgia, serif",
  grotesk: "'Space Grotesk', system-ui, sans-serif",
};

const BG = '#FAF7F1';
const ACCENT = '#6E2433'; // single oxblood accent — eyebrows, links, CTA only
// ink opacity ramp
const INK = 'rgba(27,26,23,1)';
const INK_BODY = 'rgba(27,26,23,0.72)';
const INK_META = 'rgba(27,26,23,0.5)';
const HAIR = 'rgba(27,26,23,0.12)';

function display(): string {
  if (typeof window === 'undefined') return FONT_MAP.fraunces;
  const t = new URLSearchParams(window.location.search).get('type') || 'fraunces';
  return FONT_MAP[t] ?? FONT_MAP.fraunces;
}

function Eyebrow({ children, color = ACCENT }: { children: React.ReactNode; color?: string }) {
  return (
    <p className="text-[11.5px] font-semibold uppercase" style={{ color, letterSpacing: '0.09em' }}>
      {children}
    </p>
  );
}

function Cta({ block = false }: { block?: boolean }) {
  return (
    <a
      href="mailto:katieluikakiu@gmail.com?subject=Working%20together"
      className={`text-[14px] font-medium px-5 py-2.5 rounded-lg text-white transition-transform hover:-translate-y-0.5 ${block ? 'inline-block' : 'inline-block'}`}
      style={{ background: ACCENT }}
    >
      Start a conversation
    </a>
  );
}

/* featured (wide) + 2-up work cards — the proof block */
function WorkCard({ item, featured = false }: { item: WorkItem; featured?: boolean }) {
  return (
    <Link
      to={item.href}
      className={`group block ${featured ? 'sm:grid sm:grid-cols-[1fr_1.1fr] sm:gap-10 items-center' : ''}`}
    >
      {featured && (
        item.image ? (
          <div
            className="hidden sm:block aspect-[4/3] rounded-xl overflow-hidden"
            style={{ border: `1px solid ${HAIR}` }}
          >
            <img
              src={item.image}
              alt={`${item.title} — sample`}
              loading="lazy"
              className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
            />
          </div>
        ) : (
          <div
            className="hidden sm:flex aspect-[4/3] rounded-xl items-end p-6"
            style={{ background: 'rgba(110,36,51,0.05)', border: `1px solid ${HAIR}` }}
          >
            <span className="text-[13px]" style={{ fontFamily: display(), color: ACCENT }}>
              {item.eyebrow.split(' · ')[0]}
            </span>
          </div>
        )
      )}
      <div className={featured ? 'mt-5 sm:mt-0' : ''}>
        <Eyebrow>{item.eyebrow}</Eyebrow>
        <h3
          className={`mt-2 font-semibold leading-[1.15] ${featured ? 'text-[26px] sm:text-[32px]' : 'text-[21px]'}`}
          style={{ fontFamily: display(), color: INK }}
        >
          {item.title}
        </h3>
        <p className={`mt-2.5 leading-[1.6] ${featured ? 'text-[15.5px]' : 'text-[14px]'}`} style={{ color: INK_BODY }}>
          {item.dek}
        </p>
        <p className="mt-3 text-[12.5px]" style={{ color: INK_META }}>{item.meta}</p>
        <span
          className="mt-4 inline-flex items-center gap-1.5 text-[13.5px] font-medium transition-all group-hover:gap-2.5"
          style={{ color: ACCENT }}
        >
          {item.cta} →
        </span>
      </div>
    </Link>
  );
}

/* minimal single-weight line icons for the underwrite modules */
function ModuleIcon({ name }: { name: 'doc' | 'market' | 'cap' | 'team' }) {
  const common = {
    width: 19, height: 19, viewBox: '0 0 24 24', fill: 'none',
    stroke: ACCENT, strokeWidth: 1.5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
  };
  switch (name) {
    case 'doc':
      return (<svg {...common}><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5" /><path d="M9 13h6M9 17h4" /></svg>);
    case 'market':
      return (<svg {...common}><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></svg>);
    case 'cap':
      return (<svg {...common}><path d="M3 5h18M3 12h18M3 19h18M9 5v14" /></svg>);
    case 'team':
      return (<svg {...common}><circle cx="9" cy="8" r="3" /><path d="M3 20a6 6 0 0 1 12 0" /><path d="M16 5.5a3 3 0 0 1 0 5.5M21 20a6 6 0 0 0-4-5.6" /></svg>);
  }
}

/* "two ways to run it" — the core offering + the deploy-on-your-stack option */
function TwoModeStrip({ m }: { m: TwoMode }) {
  return (
    <div className="mt-10 pt-9 grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-7" style={{ borderTop: `1px solid ${HAIR}` }}>
      <p className="sm:col-span-2 text-[11px] font-semibold uppercase" style={{ color: INK_META, letterSpacing: '0.1em' }}>
        {m.eyebrow}
      </p>
      {[m.a, m.b].map((x) => (
        <div key={x.label}>
          <p className="text-[15.5px] font-semibold" style={{ color: INK }}>{x.label}</p>
          <p className="mt-2 text-[14.5px] leading-[1.6]" style={{ color: INK_BODY }}>{x.dek}</p>
        </div>
      ))}
    </div>
  );
}

/* TEAMS — the living-memory dataflow: continuous inputs → ATLAS → deliverables */
function AtlasDataflow({ d }: { d: Dataflow }) {
  const Connector = () => (
    <div className="flex items-center justify-center py-3 sm:py-0 sm:px-2" style={{ color: INK_META }} aria-hidden>
      <span className="sm:hidden text-[18px]">↓</span>
      <span className="hidden sm:inline text-[18px]">→</span>
    </div>
  );
  return (
    <section className="py-20">
      <Eyebrow color={INK_META}>{d.eyebrow}</Eyebrow>
      <p className="mt-5 text-[23px] sm:text-[27px] leading-[1.4] max-w-2xl" style={{ fontFamily: 'var(--d)', fontWeight: 450, color: INK }}>
        {d.lead}
      </p>
      <p className="mt-4 text-[16px] leading-[1.6] max-w-xl" style={{ color: INK_BODY }}>{d.sub}</p>

      <div className="mt-12 flex flex-col sm:flex-row sm:items-stretch">
        {/* inputs */}
        <div className="flex-1">
          <p className="text-[11px] font-semibold uppercase mb-3" style={{ color: INK_META, letterSpacing: '0.1em' }}>Continuous inputs</p>
          <ul className="space-y-2">
            {d.inputs.map((i) => (
              <li key={i} className="flex items-center gap-2.5 text-[14.5px]" style={{ color: INK_BODY }}>
                <span className="inline-block w-1 h-1 rounded-full" style={{ background: ACCENT }} aria-hidden />
                {i}
              </li>
            ))}
          </ul>
        </div>

        <Connector />

        {/* the living memory — visual hub */}
        <div
          className="flex-[1.25] flex flex-col justify-center rounded-xl px-6 py-7 text-center"
          style={{ background: 'rgba(110,36,51,0.045)', border: `1px solid ${HAIR}` }}
        >
          <p className="text-[26px] sm:text-[30px]" style={{ fontFamily: 'var(--d)', fontWeight: 500, color: ACCENT, letterSpacing: '0.01em' }}>
            {d.hubName}
          </p>
          <p className="mt-2.5 text-[13.5px] leading-[1.5]" style={{ color: INK_BODY }}>{d.hubLine}</p>
        </div>

        <Connector />

        {/* outputs */}
        <div className="flex-1">
          <p className="text-[11px] font-semibold uppercase mb-3" style={{ color: INK_META, letterSpacing: '0.1em' }}>What comes out</p>
          <ul className="space-y-2">
            {d.outputs.map((o) => (
              <li key={o} className="flex items-start gap-2.5 text-[14.5px]" style={{ color: INK }}>
                <span className="inline-block w-1 h-1 rounded-full mt-[9px] shrink-0" style={{ background: INK_META }} aria-hidden />
                {o}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <p className="mt-12 text-[16px] leading-[1.6] max-w-xl" style={{ color: INK_BODY }}>{d.closer}</p>

      <TwoModeStrip m={d.modes} />

      <a href={d.button.href} className="mt-9 inline-flex items-center gap-1.5 text-[14px] font-medium transition-all hover:gap-2.5" style={{ color: ACCENT }}>
        {d.button.label} →
      </a>
    </section>
  );
}

/* INVESTORS — the Underwrite engine: structured modules → agents → IC memo */
function UnderwriteFunnel({ u }: { u: Underwrite }) {
  const FlowLabel = ({ children }: { children: React.ReactNode }) => (
    <div className="flex flex-col items-center py-5" aria-hidden>
      <span className="text-[18px]" style={{ color: INK_META }}>↓</span>
      <span className="mt-1 text-[11px] uppercase" style={{ color: INK_META, letterSpacing: '0.1em' }}>{children}</span>
    </div>
  );
  return (
    <section className="py-20">
      <Eyebrow color={INK_META}>{u.eyebrow}</Eyebrow>
      <p className="mt-5 text-[23px] sm:text-[27px] leading-[1.4] max-w-2xl" style={{ fontFamily: 'var(--d)', fontWeight: 450, color: INK }}>
        {u.lead}
      </p>

      {/* tier 1 — input modules */}
      <div className="mt-11 grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {u.inputs.map((m) => (
          <div key={m.label} className="rounded-xl px-4 py-4" style={{ border: `1px solid ${HAIR}` }}>
            <ModuleIcon name={m.icon} />
            <p className="mt-3 text-[14.5px] font-semibold" style={{ color: INK }}>{m.label}</p>
            <p className="mt-1 text-[12px] leading-[1.4]" style={{ color: INK_META }}>{m.dek}</p>
          </div>
        ))}
      </div>

      <FlowLabel>Feed into</FlowLabel>

      {/* tier 2 — the five agents */}
      <div className="rounded-xl px-5 py-5" style={{ border: `1px solid ${HAIR}`, background: 'rgba(110,36,51,0.035)' }}>
        <p className="text-[16px]" style={{ fontFamily: 'var(--d)', fontWeight: 500, color: INK }}>{u.agentsLabel}</p>
        <p className="mt-1 text-[13px] leading-[1.5]" style={{ color: INK_META }}>{u.agentsSub}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {u.agents.map((a) => (
            <span key={a} className="text-[12.5px] px-3 py-1.5 rounded-md" style={{ color: INK_BODY, border: `1px solid ${HAIR}`, background: BG }}>
              {a}
            </span>
          ))}
        </div>
      </div>

      <FlowLabel>Synthesised into</FlowLabel>

      {/* tier 3 — the IC memo (the payoff; the one strongly-indigo element) */}
      <div className="rounded-xl px-6 py-5 flex items-center justify-between gap-4" style={{ background: ACCENT }}>
        <div>
          <p className="text-[19px]" style={{ fontFamily: 'var(--d)', fontWeight: 500, color: '#fff' }}>{u.output.label}</p>
          <p className="mt-0.5 text-[13px]" style={{ color: 'rgba(255,255,255,0.72)' }}>{u.output.dek}</p>
        </div>
        <span className="text-[22px]" style={{ color: 'rgba(255,255,255,0.6)' }} aria-hidden>↳</span>
      </div>

      {/* wrapper — pipeline + deal page tracking layer */}
      <div className="mt-12 pt-10" style={{ borderTop: `1px solid ${HAIR}` }}>
        <p className="text-[16px] leading-[1.6] max-w-xl" style={{ color: INK_BODY }}>{u.wrapper}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          {u.wrapperTags.map((t) => (
            <span key={t} className="text-[12.5px] px-3 py-1.5 rounded-md" style={{ color: INK_BODY, border: `1px solid ${HAIR}` }}>{t}</span>
          ))}
        </div>
      </div>

      <TwoModeStrip m={u.modes} />

      <a href={u.button.href} className="mt-9 inline-flex items-center gap-1.5 text-[14px] font-medium transition-all hover:gap-2.5" style={{ color: ACCENT }}>
        {u.button.label} →
      </a>
    </section>
  );
}

export default function WorkWithMe({ variant }: { variant: 'teams' | 'investors' }) {
  const c: WwmContent = WWM[variant];
  const centered = false; // both pages left-aligned (Katie); differentiate by content, not alignment
  const [featured, ...rest] = c.work;

  return (
    <div style={{ background: BG, color: INK, minHeight: '100vh' }} className="antialiased">
      <div className="mx-auto max-w-3xl px-6 sm:px-8" style={{ ['--d' as string]: display() }}>
        {/* top bar */}
        <div className="flex items-center justify-between pt-8 text-[13px]" style={{ color: INK_META }}>
          <Link to="/work-with-me" className="hover:opacity-70 transition-opacity">← Work with me</Link>
          <Link to={c.navOther.href} className="hover:opacity-70 transition-opacity" style={{ color: ACCENT }}>
            {c.navOther.label} →
          </Link>
        </div>

        {/* ── HERO (asymmetric for teams, centered masthead for investors) ── */}
        <header className={`pt-20 sm:pt-28 pb-20 ${centered ? 'text-center' : ''}`}>
          <div className={`flex items-center gap-2 mb-8 text-[11.5px] uppercase ${centered ? 'justify-center' : ''}`} style={{ color: INK_META, letterSpacing: '0.14em' }}>
            <span className="inline-block w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: ACCENT }} aria-hidden />
            Field memory current to June 2026
          </div>
          <h1
            className={`text-[42px] leading-[1.04] sm:text-[64px] sm:leading-[1.02] ${centered ? 'mx-auto max-w-2xl' : 'max-w-[19ch]'}`}
            style={{ fontFamily: 'var(--d)', fontWeight: 450, letterSpacing: '-0.02em', color: INK }}
          >
            {c.hero.h1}
          </h1>
          <p className={`mt-7 text-[18px] sm:text-[19px] leading-[1.6] ${centered ? 'mx-auto max-w-lg' : 'max-w-md'}`} style={{ color: INK_BODY }}>
            {c.hero.sub}
          </p>
          <div className={`mt-10 flex flex-wrap items-center gap-x-7 gap-y-3 ${centered ? 'justify-center' : ''}`}>
            <Cta />
            <a href="#work" className="text-[14px] font-medium hover:opacity-70 transition-opacity" style={{ color: INK }}>
              See a sample →
            </a>
          </div>
        </header>

        <div style={{ height: 1, background: HAIR }} />

        {/* ── POV ── */}
        <section className="py-20">
          <Eyebrow color={INK_META}>How I think</Eyebrow>
          <p className="mt-5 text-[23px] sm:text-[27px] leading-[1.4] max-w-2xl" style={{ fontFamily: 'var(--d)', fontWeight: 450, color: INK }}>
            {c.pov}
          </p>
        </section>

        {/* ── HOW IT WORKS — a different system on each page ──
            teams: the ATLAS living-memory dataflow · investors: the Underwrite engine.
            Both abstracted/outcome-framed; never name scrapers/DBs/cron. */}
        {c.dataflow && <AtlasDataflow d={c.dataflow} />}
        {c.underwrite && <UnderwriteFunnel u={c.underwrite} />}

        <div style={{ height: 1, background: HAIR }} />

        {/* ── SELECTED WORK (featured + 2-up) ── */}
        <section id="work" className="py-20 scroll-mt-8">
          <Eyebrow color={INK_META}>Selected work</Eyebrow>
          <div className="mt-9">
            <WorkCard item={featured} featured />
          </div>
          <div className="mt-12 pt-12 grid grid-cols-1 sm:grid-cols-2 gap-10" style={{ borderTop: `1px solid ${HAIR}` }}>
            {rest.map((w) => <WorkCard key={w.href} item={w} />)}
          </div>
          <p className="mt-10 text-[13.5px] leading-[1.5]" style={{ color: INK_META }}>{c.workFootnote}</p>
        </section>

        <div style={{ height: 1, background: HAIR }} />

        {/* ── CREDIBILITY + CTA ── */}
        <section className="py-20">
          <p className="text-[22px] sm:text-[26px] leading-[1.42] max-w-2xl" style={{ fontFamily: 'var(--d)', fontWeight: 450, color: INK }}>
            {c.credibility}
          </p>
          <div className="mt-16 pt-14" style={{ borderTop: `1px solid ${HAIR}` }}>
            <p className="text-[24px] sm:text-[30px] leading-[1.18]" style={{ fontFamily: 'var(--d)', fontWeight: 500, color: ACCENT }}>
              {c.ctaHeadline}
            </p>
            <p className="mt-4 text-[16px] leading-[1.6] max-w-lg" style={{ color: INK_BODY }}>{c.ctaBody}</p>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
              <Cta />
              <a href="https://www.linkedin.com/in/katieluikakiu" target="_blank" rel="noreferrer" className="text-[14px] font-medium hover:opacity-70 transition-opacity" style={{ color: INK }}>LinkedIn →</a>
            </div>
          </div>
        </section>

        <footer className="py-10 text-[12px]" style={{ color: INK_META, borderTop: `1px solid ${HAIR}` }}>
          © 2026 Katie Lui
        </footer>
      </div>
    </div>
  );
}
