import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

type Props = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  backTo?: string;
  backLabel?: string;
  containerClassName?: string;
  showFooter?: boolean;
};

export function ProjectPageLayout({
  title,
  subtitle,
  children,
  backTo = '/',
  backLabel = 'Back to home',
  containerClassName = 'max-w-4xl mx-auto px-6',
  showFooter = true,
}: Props) {
  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0b0f14]">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(120,119,198,0.05),transparent_50%)] dark:bg-[radial-gradient(ellipse_at_top,rgba(120,119,198,0.03),transparent_50%)]"
      />

      <header className="border-b border-zinc-200/80 bg-white/40 backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
        <div className={`${containerClassName} py-8`}>
          <Link
            to={backTo}
            className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors inline-flex items-center gap-1.5 mb-4"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {backLabel}
          </Link>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">{title}</h1>
          {subtitle && (
            <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">{subtitle}</p>
          )}
        </div>
      </header>

      <main className={`${containerClassName} py-10`}>{children}</main>

      {showFooter && (
        <footer className="border-t border-zinc-200/80 bg-white/40 backdrop-blur-sm dark:border-white/10 dark:bg-white/5 mt-16">
          <div className={`${containerClassName} py-8 text-center`}>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              © 2026 Katie Lui. All rights reserved.
            </p>
          </div>
        </footer>
      )}
    </div>
  );
}

export default ProjectPageLayout;
