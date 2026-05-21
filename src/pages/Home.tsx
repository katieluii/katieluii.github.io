import { useState, useMemo } from 'react';
import { Linkedin, Mail } from 'lucide-react';
import { ThemeToggle } from '../components/ThemeToggle';
import { FilterChips } from '../components/FilterChips';
import { ProjectTimeline } from '../components/ProjectTimeline';
import { getUniqueThemes, filterProjectsByTheme, groupProjectsByYear, type ProjectTheme } from '../data/projects';

export function Home() {
  const [selectedTheme, setSelectedTheme] = useState<ProjectTheme | null>(null);

  const themes = useMemo(() => getUniqueThemes(), []);

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
              <h1 className="text-4xl font-bold text-zinc-900 tracking-tight leading-tight dark:text-zinc-100">
                Katie Lui
              </h1>
            </div>
            <nav className="hidden sm:flex items-center gap-4 text-sm font-medium text-zinc-600 dark:text-zinc-400">
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
            </nav>
          </div>

          <div className="flex items-center gap-2 mt-4">
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
        <section id="about" className="scroll-mt-20">
          <h2 className="text-sm font-semibold text-zinc-900 tracking-tight uppercase mb-6 dark:text-zinc-100">
            About.
          </h2>
          <div className="space-y-4 text-zinc-600 leading-relaxed max-w-prose dark:text-zinc-400">
            <p>
              Biopharma x strategy x AI. Experience in a medtech startup and
              biopharma consultancy, translating complex science and data to
              insights and narratives. Started in wet lab (Oxford/HK/London),
              and recently AI/ML trained. Now at a SF-based Biopharma-AI startup.
            </p>
            <p>
              I enjoy building AI and automation tools to scale analysis, productivity, and impact.
            </p>
          </div>
        </section>

        <section id="projects" className="scroll-mt-20">
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

        <section id="interests" className="scroll-mt-20">
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
        <div className="max-w-3xl mx-auto px-6 py-8 text-center">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            © 2026 Katie Lui. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
