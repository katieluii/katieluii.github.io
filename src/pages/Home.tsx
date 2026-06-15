import { useState, useMemo } from 'react';
import { Linkedin, Mail } from 'lucide-react';
import { ThemeToggle } from '../components/ThemeToggle';
import { FilterChips } from '../components/FilterChips';
import { ProjectTimeline } from '../components/ProjectTimeline';
import { useReveal } from '../hooks/useReveal';
import { getUniqueThemes, filterProjectsByTheme, groupProjectsByYear, type ProjectTheme } from '../data/projects';

export function Home() {
  const [selectedTheme, setSelectedTheme] = useState<ProjectTheme | null>(null);

  const themes = useMemo(() => getUniqueThemes(), []);

  const aboutRef = useReveal<HTMLElement>();
  const projectsRef = useReveal<HTMLElement>();
  const interestsRef = useReveal<HTMLElement>();

  const groupedProjects = useMemo(() => {
    const filtered = filterProjectsByTheme(selectedTheme);
    return groupProjectsByYear(filtered);
  }, [selectedTheme]);

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0b0f14]">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(120,119,198,0.05),transparent_50%)] dark:bg-[radial-gradient(ellipse_at_top,rgba(120,119,198,0.03),transparent_50%)] pointer-events-none"></div>

      <header className="relative border-b border-zinc-200/80 bg-white/40 backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
        <div className="max-w-3xl mx-auto px-6 py-10 sm:py-12">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="rise text-5xl sm:text-6xl font-bold text-zinc-900 tracking-tight leading-[0.95] dark:text-zinc-50">
                Katie Lui
              </h1>
              <p
                className="rise mt-4 text-lg text-zinc-600 leading-relaxed max-w-xl dark:text-zinc-300"
                style={{ animationDelay: '60ms' }}
              >
                Biopharma × strategy × AI — building tools that turn complex science and data into decisions.
              </p>
              <div
                className="rise mt-4 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[13px] text-zinc-500 dark:text-zinc-400"
                style={{ animationDelay: '120ms' }}
              >
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  biopharma-AI startup
                </span>
                <span className="text-zinc-300 dark:text-zinc-600">·</span>
                <span>Oxford / HK / London</span>
              </div>
            </div>
            <nav className="hidden sm:flex items-center gap-4 text-sm font-medium text-zinc-600 dark:text-zinc-400 shrink-0">
              <a
                href="#about"
                className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
              >
                About
              </a>
              <a
                href="#projects"
                className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
              >
                Projects
              </a>
              <a
                href="#interests"
                className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
              >
                Interests
              </a>
              {/* WS15 "Work with me" link removed — pages disconnected pending review */}
            </nav>
          </div>

          <div className="rise flex items-center gap-2 mt-6" style={{ animationDelay: '180ms' }}>
            {/* TODO: Replace with your actual LinkedIn URL */}
            <a
              href="https://www.linkedin.com/in/katieluikakiu"
              target="_blank"
              rel="noreferrer"
              aria-label="LinkedIn profile"
              className="p-2 rounded-lg text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-white/10 transition-colors"
            >
              <Linkedin className="w-4 h-4" />
            </a>

            {/* TODO: Replace with your actual email address */}
            <a
              href="mailto:katieluikakiu@gmail.com"
              aria-label="Email contact"
              className="p-2 rounded-lg text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-white/10 transition-colors"
            >
              <Mail className="w-4 h-4" />
            </a>

<ThemeToggle />
          </div>
        </div>
      </header>

      <main className="relative max-w-3xl mx-auto px-6 py-12 sm:py-16 space-y-16">
        <section ref={aboutRef} id="about" className="reveal scroll-mt-20">
          <h2 className="text-sm font-semibold text-zinc-900 tracking-tight uppercase mb-6 dark:text-zinc-100">
            About.
          </h2>
          <div className="space-y-4 text-zinc-600 leading-relaxed max-w-prose dark:text-zinc-400">
            <p>
              Experience in a medtech startup and biopharma consultancy,
              translating complex science and data to insights and narratives.
              Started in wet lab (Oxford/HK/London), and recently AI/ML trained.
              Now at a SF-based Biopharma-AI startup.
            </p>
            <p>
              I enjoy building AI and automation tools to scale analysis, productivity, and impact.
            </p>
          </div>
        </section>

        <section ref={projectsRef} id="projects" className="reveal scroll-mt-20">
          <h2 className="text-sm font-semibold text-zinc-900 tracking-tight uppercase mb-6 dark:text-zinc-100">
            Projects.
          </h2>

          <div className="space-y-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                  Theme
                </span>
              </div>
              <FilterChips
                options={themes}
                selected={selectedTheme}
                onSelect={(value) => setSelectedTheme(value as ProjectTheme | null)}
              />
            </div>

            <ProjectTimeline groupedProjects={groupedProjects} />
          </div>
        </section>

        <section ref={interestsRef} id="interests" className="reveal scroll-mt-20">
          <h2 className="text-sm font-semibold text-zinc-900 tracking-tight uppercase mb-6 dark:text-zinc-100">
            Interests.
          </h2>
          <div className="space-y-4 text-zinc-600 leading-relaxed max-w-prose dark:text-zinc-400">
            <p>
              AI. Biopharma M&A/BD/Corp dev, biotech investing. 
              Neuroscience, BCI.
            </p>
            <p>
              Outside work, I enjoy classical music (flute, double bass, piano), chamber music, jazz,
              languages (trilingual; learning Japanese and French), belief systems, and chess.
            </p>
            <p>
              Favourite podcasts: Unhedged, The Rachman Review, BioCentury, The
              Rest is History
            </p>
          </div>
        </section>
      </main>

      <footer className="relative border-t border-zinc-200/80 bg-white/40 backdrop-blur-sm mt-16 dark:border-white/10 dark:bg-white/5">
        <div className="max-w-3xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            © 2026 Katie Lui. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400">
            <a
              href="https://www.linkedin.com/in/katieluikakiu"
              target="_blank"
              rel="noreferrer"
              className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              LinkedIn
            </a>
            <a
              href="mailto:katieluikakiu@gmail.com"
              className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              Email
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
