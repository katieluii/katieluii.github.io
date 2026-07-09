import type { ReactNode } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

/* WS15 commercial layout — the chrome for the /work-with-me pages.
   Deliberately NOT ProjectPageLayout: a paid service must not be framed as a case
   study (no breadcrumb / "back to projects" / portfolio nav that one-clicks a
   prospect into hobby projects). It reuses the zinc design system + the shared
   ThemeToggle (so light/dark matches the rest of the site), but a purpose-built
   minimal header: {wordmark → top of page, a link to Atlas, a Contact CTA}. */

const CONTACT_MAILTO = 'mailto:katieluikakiu@gmail.com?subject=Working%20together';

export default function CommercialLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0b0f14] text-zinc-900 dark:text-zinc-100 antialiased">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(120,119,198,0.05),transparent_50%)] dark:bg-[radial-gradient(ellipse_at_top,rgba(120,119,198,0.03),transparent_50%)]"
      />

      {/* minimal commercial header — wordmark scrolls to top, Atlas, Contact */}
      <header className="border-b border-zinc-200/70 dark:border-white/10 bg-white/40 backdrop-blur-sm dark:bg-white/5">
        <div className="max-w-3xl mx-auto px-6 sm:px-8 py-5 flex items-center justify-between gap-4">
          <a
            href="#top"
            className="text-sm font-medium tracking-tight text-zinc-900 dark:text-zinc-100 hover:opacity-70 transition-opacity"
          >
            Katie Lui
          </a>
          <div className="flex items-center gap-4 sm:gap-5">
            <a
              href="/atlas-drug-dev-analyst"
              className="text-[13px] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              Atlas
            </a>
            <a
              href={CONTACT_MAILTO}
              className="inline-flex items-center gap-1 rounded-full px-3.5 py-1.5 text-[13px] font-medium bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900 shadow-sm ring-1 ring-zinc-900/10 dark:ring-white/10 hover:-translate-y-0.5 transition-transform"
            >
              Contact
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main id="top" className="max-w-3xl mx-auto px-6 sm:px-8 py-14 sm:py-16">
        {children}
      </main>

      <footer className="border-t border-zinc-200/70 dark:border-white/10 bg-white/40 backdrop-blur-sm dark:bg-white/5 mt-16">
        <div className="max-w-3xl mx-auto px-6 sm:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">© 2026 Katie Lui. All rights reserved.</p>
          <div className="flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400">
            <a
              href="/atlas-drug-dev-analyst"
              className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              Atlas
            </a>
            <a
              href="https://www.linkedin.com/in/katieluikakiu"
              target="_blank"
              rel="noreferrer"
              className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              LinkedIn
            </a>
            <a
              href={CONTACT_MAILTO}
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
