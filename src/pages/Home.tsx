import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowDown, Mail } from 'lucide-react';
import { ThemeToggle } from '../components/ThemeToggle';
import { SuiteLedger } from '../components/SuiteLedger';
import { useReveal } from '../hooks/useReveal';
import { projects } from '../data/projects';

/* ── Home ─────────────────────────────────────────────────────────────────────
   Journey: (1) who she is, in her own words, and a way to get in touch →
   (2) the suite, A→E, one pass → (3) how an engagement runs → (4) interests.
   One measure (max-w-3xl) top to bottom. One family (Hanken Grotesk); hierarchy
   comes from size and weight. Colours are tokens from src/index.css (Renascor
   palette on a bone ground; the dark toggle is the green/bone/brass version). */

const EMAIL = 'katie@renascor.xyz';
const MAILTO = `mailto:${EMAIL}?subject=${encodeURIComponent('Working together')}`;

const btn =
  'inline-flex items-center gap-2 rounded-full bg-[var(--btn-bg)] px-4 py-2 text-[14px] font-medium text-[var(--btn-fg)] shadow-sm transition-[filter] hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--accent)]';
const textLink =
  'underline decoration-[var(--hair)] underline-offset-[3px] transition-colors hover:text-[var(--ink-strong)] hover:decoration-[var(--accent)]';
const navLink = 'text-[13.5px] text-[var(--muted)] transition-colors hover:text-[var(--ink-strong)]';

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-[22px] font-semibold leading-tight tracking-[-0.01em] text-[var(--ink-strong)]">{children}</h2>;
}

export function Home() {
  const suiteRef = useReveal<HTMLElement>();
  const workRef = useReveal<HTMLElement>();
  const interestsRef = useReveal<HTMLElement>();

  // computed, never typed: the archive count must match what's behind the link
  const projectCount = useMemo(() => projects.filter((p) => !p.hideFromTimeline).length, []);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      {/* top bar: wordmark + nav */}
      <header className="border-b border-[var(--hair)]">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-6 px-6 py-5">
          <Link to="/" className="rise text-[17px] font-semibold leading-none tracking-[-0.01em] text-[var(--ink-strong)]">
            Katie Lui
          </Link>
          <nav className="rise flex items-center gap-5" style={{ animationDelay: '60ms' }}>
            <a href="#suite" className={`${navLink} hidden sm:inline`}>Suite</a>
            <a href="#work" className={`${navLink} hidden sm:inline`}>Work with me</a>
            <Link to="/projects" className={navLink}>All projects</Link>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6">
        {/* 1 · hero: who, in her own words, and the door */}
        <section className="pb-14 pt-16 sm:pb-16 sm:pt-20">
          <h1
            className="rise max-w-2xl text-[36px] font-semibold leading-[1.08] tracking-[-0.022em] text-[var(--ink-strong)] sm:text-[44px]"
            style={{ animationDelay: '120ms' }}
          >
            Builder, translator, operator in biotech and AI.
          </h1>
          <div className="rise mt-6 max-w-2xl space-y-4 text-[16.5px] leading-[1.6] text-[var(--ink)]" style={{ animationDelay: '200ms' }}>
            <p>
              Experience in a medtech startup and biopharma consultancy, "translating" complex science
              and data into actionable insights and narratives. Started in wet labs with astrocytes and
              iPSCs (Oxford/HK/London), now at biopharma-AI startups (SF/London).
            </p>
            <p>
              I build AI and automation tools/workflows to scale analysis, productivity, and impact: for
              drug-development and strategy teams, biotech investors, and early-stage funds.
            </p>
          </div>
          <div className="rise mt-8 flex flex-wrap items-center gap-x-5 gap-y-3" style={{ animationDelay: '280ms' }}>
            <a href={MAILTO} className={btn}>
              <Mail className="h-4 w-4" aria-hidden />
              Start a conversation
            </a>
            <a href="#suite" className="inline-flex items-center gap-1.5 text-[14px] text-[var(--ink)] hover:text-[var(--ink-strong)]">
              See the suite
              <ArrowDown className="h-3.5 w-3.5" aria-hidden />
            </a>
          </div>
          <p className="rise mt-6 text-[13px] text-[var(--muted)]" style={{ animationDelay: '340ms' }}>
            <a href="https://renascor.xyz" target="_blank" rel="noreferrer" className={textLink}>Renascor</a>
            <span className="mx-2 text-[var(--faint)]">·</span>
            <a href="https://www.linkedin.com/in/katieluikakiu" target="_blank" rel="noreferrer" className={textLink}>LinkedIn</a>
            <span className="mx-2 text-[var(--faint)]">·</span>
            <a href="https://github.com/katieluii" target="_blank" rel="noreferrer" className={textLink}>GitHub</a>
            <span className="mx-2 text-[var(--faint)]">·</span>
            Oxford / HK / London
          </p>
        </section>

        {/* 2 · the suite */}
        <section ref={suiteRef} id="suite" className="reveal scroll-mt-16 border-t border-[var(--hair)] pb-4 pt-12">
          {/* alias for old /#projects links */}
          <span id="projects" aria-hidden className="block" />
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
            <SectionTitle>The suite</SectionTitle>
          </div>
          <p className="mt-3 max-w-2xl text-[15px] leading-[1.6] text-[var(--muted)]">
            One decision per product: landscape, valuation, diligence and fund operations, enrolment,
            partnering. Open a row for the tool and its output.
          </p>

          <div className="mt-8">
            <SuiteLedger />
          </div>

          <div className="mt-2 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-[var(--hair)] py-5 text-[14px]">
            <p className="text-[var(--muted)]">Earlier tools and the research years are in the full index.</p>
            <Link to="/projects" className="group inline-flex items-center gap-1.5 font-medium text-[var(--ink-strong)] hover:text-[var(--accent)]">
              All {projectCount} projects
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </Link>
          </div>
        </section>

        {/* 3 · work with me */}
        <section ref={workRef} id="work" className="reveal scroll-mt-16 border-t border-[var(--hair)] py-12">
          <SectionTitle>Work with me</SectionTitle>
          <p className="mt-3 max-w-2xl text-[15px] leading-[1.6] text-[var(--muted)]">
            I work directly with teams as an independent contractor, or take on defined projects from
            scoping through to delivery. Engagements can be short and focused, or continue as
            priorities evolve.
          </p>
          <ul className="mt-7 grid gap-6 sm:grid-cols-3">
            {[
              {
                t: 'Join your team',
                d: 'Bring me in as an individual contractor to work alongside your existing team — building, shipping and solving problems on your stack.',
              },
              {
                t: 'Build a project',
                d: 'Give me a defined problem or outcome and I can scope and deliver the project end-to-end, with a clear handover at the end.',
              },
              {
                t: 'Start with a diagnostic',
                d: 'Not sure what is worth building? I can spend two weeks mapping the workflows, data and opportunities, then recommend what to prioritise.',
              },
            ].map((x) => (
              <li key={x.t}>
                <h3 className="text-[15px] font-semibold text-[var(--ink-strong)]">{x.t}</h3>
                <p className="mt-1.5 text-[14px] leading-[1.55] text-[var(--muted)]">{x.d}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* 4 · interests */}
        <section ref={interestsRef} id="interests" className="reveal scroll-mt-16 border-t border-[var(--hair)] py-12">
          <SectionTitle>Interests</SectionTitle>
          <div className="mt-3 max-w-2xl space-y-4 text-[15px] leading-[1.6] text-[var(--muted)]">
            <p>AI. Biopharma M&A/BD/Corp dev, biotech investing. Neuroscience, BCI.</p>
            <p>
              Outside work, I enjoy classical music (flute, double bass, piano), chamber music, jazz,
              languages (trilingual; learning Japanese and French), belief systems, and chess.
            </p>
            <p>Favourite podcasts: Unhedged, The Rachman Review, BioCentury, The Rest is History</p>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--hair)]">
        <div className="mx-auto flex max-w-3xl flex-col gap-3 px-6 py-8 text-[12.5px] text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Katie Lui. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <a href={MAILTO} className={textLink}>{EMAIL}</a>
            <a href="https://www.linkedin.com/in/katieluikakiu" target="_blank" rel="noreferrer" className={textLink}>LinkedIn</a>
            <a href="https://github.com/katieluii" target="_blank" rel="noreferrer" className={textLink}>GitHub</a>
            <a href="https://renascor.xyz" target="_blank" rel="noreferrer" className={textLink}>Renascor</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
