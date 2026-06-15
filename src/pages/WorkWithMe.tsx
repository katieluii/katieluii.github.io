import { Link } from 'react-router-dom';
import { WWM, type WwmContent, type WorkItem, type Dataflow, type Underwrite, type TwoMode } from '../data/workWithMe';
import { Grain, Reveal, emphasize, EDITORIAL } from '../components/shared/craft';
import { useReveal } from '../hooks/useReveal';
import UnderwriteFunnel from '../components/diagrams/UnderwriteFunnel';
import SharedAtlasDataflow from '../components/atlas/AtlasDataflow';

/* WS15 — two audience pages. Editorial flow (hero → POV → how it works → selected
   work → CTA), differentiated by which "system" leads. Warm canvas, one oxblood
   accent used sparingly, Fraunces display + an italic emphasis, Hanken Grotesk
   body, staggered motion, paper grain. */

const FONT_MAP: Record<string, string> = {
  fraunces: "'Fraunces', Georgia, serif",
  instrument: "'Instrument Serif', Georgia, serif",
  grotesk: "'Space Grotesk', system-ui, sans-serif",
};

const { BG, ACCENT, INK, INK_BODY, INK_META, HAIR } = EDITORIAL;

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

function Cta() {
  return (
    <a
      href="mailto:katieluikakiu@gmail.com?subject=Working%20together"
      className="inline-block text-[14px] font-medium px-5 py-2.5 rounded-lg text-white transition-transform hover:-translate-y-0.5"
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
          className={`mt-2 font-semibold leading-[1.15] opsz-auto ${featured ? 'text-[26px] sm:text-[32px]' : 'text-[21px]'}`}
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

/* TEAMS — the living-memory dataflow: continuous inputs → ATLAS → deliverables.
   The diagram itself is the shared <SharedAtlasDataflow/> (editorial skin); this
   wrapper adds the warm section chrome, the closer, and the "two ways to run it" strip. */
function TeamsDataflowSection({ d }: { d: Dataflow }) {
  const ref = useReveal<HTMLElement>();
  return (
    <section ref={ref} className="reveal py-20">
      <Eyebrow color={INK_META}>{d.eyebrow}</Eyebrow>
      <p className="mt-5 text-[23px] sm:text-[27px] leading-[1.4] max-w-2xl opsz-auto" style={{ fontFamily: 'var(--d)', fontWeight: 450, color: INK }}>
        {d.lead}
      </p>
      <p className="mt-4 text-[16px] leading-[1.6] max-w-xl" style={{ color: INK_BODY }}>{d.sub}</p>

      <div className="mt-12">
        <SharedAtlasDataflow theme="editorial" hub={{ name: d.hubName, line: d.hubLine }} />
      </div>

      <p className="mt-12 text-[16px] leading-[1.6] max-w-xl" style={{ color: INK_BODY }}>{d.closer}</p>

      <TwoModeStrip m={d.modes} />

      <a href={d.button.href} className="mt-9 inline-flex items-center gap-1.5 text-[14px] font-medium transition-all hover:gap-2.5" style={{ color: ACCENT }}>
        {d.button.label} →
      </a>
    </section>
  );
}

/* INVESTORS — the Underwrite engine: structured modules → agents → IC memo.
   The funnel diagram itself is the shared <UnderwriteFunnel/> (also rendered on the
   /investment-memo showcase page); this wrapper adds the warm section chrome +
   reveal animation + the sales-only "two ways to run it" strip and CTA. */
function UnderwriteSection({ u }: { u: Underwrite }) {
  const ref = useReveal<HTMLElement>();
  return (
    <section ref={ref} className="reveal py-20">
      <UnderwriteFunnel data={u} variant="warm" />

      <TwoModeStrip m={u.modes} />

      <a href={u.button.href} className="mt-9 inline-flex items-center gap-1.5 text-[14px] font-medium transition-all hover:gap-2.5" style={{ color: ACCENT }}>
        {u.button.label} →
      </a>
    </section>
  );
}

export default function WorkWithMe({ variant }: { variant: 'teams' | 'investors' }) {
  const c: WwmContent = WWM[variant];
  const [featured, ...rest] = c.work;

  return (
    <div style={{ background: BG, color: INK, minHeight: '100vh' }} className="antialiased">
      <Grain />
      <div className="mx-auto max-w-3xl px-6 sm:px-8" style={{ ['--d' as string]: display() }}>
        {/* top bar */}
        <div className="flex items-center justify-between pt-8 text-[13px]" style={{ color: INK_META }}>
          <Link to="/work-with-me" className="hover:opacity-70 transition-opacity">← Work with me</Link>
          <Link to={c.navOther.href} className="hover:opacity-70 transition-opacity" style={{ color: ACCENT }}>
            {c.navOther.label} →
          </Link>
        </div>

        {/* ── HERO — staggered on-load reveal + italic-Fraunces emphasis ── */}
        <header className="pt-20 sm:pt-28 pb-20">
          <div className="rise flex items-center gap-2 mb-8 text-[11.5px] uppercase" style={{ color: INK_META, letterSpacing: '0.14em', animationDelay: '0ms' }}>
            <span className="inline-block w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: ACCENT }} aria-hidden />
            Field memory current to June 2026
          </div>
          <h1
            className="rise opsz-auto max-w-[19ch] text-[42px] leading-[1.04] sm:text-[64px] sm:leading-[1.02]"
            style={{ fontFamily: 'var(--d)', fontWeight: 450, letterSpacing: '-0.02em', color: INK, animationDelay: '90ms' }}
          >
            {emphasize(c.hero.h1)}
          </h1>
          <p className="rise mt-7 text-[18px] sm:text-[19px] leading-[1.6] max-w-md" style={{ color: INK_BODY, animationDelay: '180ms' }}>
            {c.hero.sub}
          </p>
          <div className="rise mt-10 flex flex-wrap items-center gap-x-7 gap-y-3" style={{ animationDelay: '270ms' }}>
            <Cta />
            <a href="#work" className="text-[14px] font-medium hover:opacity-70 transition-opacity" style={{ color: INK }}>
              See a sample →
            </a>
          </div>
        </header>

        <div style={{ height: 1, background: HAIR }} />

        {/* ── POV ── */}
        <Reveal className="py-20">
          <Eyebrow color={INK_META}>How I think</Eyebrow>
          <p className="mt-5 text-[23px] sm:text-[27px] leading-[1.4] max-w-2xl opsz-auto" style={{ fontFamily: 'var(--d)', fontWeight: 450, color: INK }}>
            {c.pov}
          </p>
        </Reveal>

        <div style={{ height: 1, background: HAIR }} />

        {/* ── HOW IT WORKS — a different system on each page ──
            teams: the ATLAS living-memory dataflow · investors: the Underwrite engine. */}
        {c.dataflow && <TeamsDataflowSection d={c.dataflow} />}
        {c.underwrite && <UnderwriteSection u={c.underwrite} />}

        <div style={{ height: 1, background: HAIR }} />

        {/* ── SELECTED WORK (featured + 2-up) ── */}
        <Reveal id="work" className="py-20 scroll-mt-8">
          <Eyebrow color={INK_META}>Selected work</Eyebrow>
          <div className="mt-9">
            <WorkCard item={featured} featured />
          </div>
          <div className="mt-12 pt-12 grid grid-cols-1 sm:grid-cols-2 gap-10" style={{ borderTop: `1px solid ${HAIR}` }}>
            {rest.map((w) => <WorkCard key={w.href} item={w} />)}
          </div>
          <p className="mt-10 text-[13.5px] leading-[1.5]" style={{ color: INK_META }}>{c.workFootnote}</p>
        </Reveal>

        <div style={{ height: 1, background: HAIR }} />

        {/* ── CREDIBILITY + CTA ── */}
        <Reveal className="py-20">
          <p className="text-[22px] sm:text-[26px] leading-[1.42] max-w-2xl opsz-auto" style={{ fontFamily: 'var(--d)', fontWeight: 450, color: INK }}>
            {c.credibility}
          </p>
          <div className="mt-16 pt-14" style={{ borderTop: `1px solid ${HAIR}` }}>
            <p className="text-[24px] sm:text-[30px] leading-[1.18] opsz-auto" style={{ fontFamily: 'var(--d)', fontWeight: 500, color: ACCENT }}>
              {c.ctaHeadline}
            </p>
            <p className="mt-4 text-[16px] leading-[1.6] max-w-lg" style={{ color: INK_BODY }}>{c.ctaBody}</p>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
              <Cta />
              <a href="https://www.linkedin.com/in/katieluikakiu" target="_blank" rel="noreferrer" className="text-[14px] font-medium hover:opacity-70 transition-opacity" style={{ color: INK }}>LinkedIn →</a>
            </div>
          </div>
        </Reveal>

        <footer className="py-10 text-[12px]" style={{ color: INK_META, borderTop: `1px solid ${HAIR}` }}>
          © 2026 Katie Lui
        </footer>
      </div>
    </div>
  );
}
