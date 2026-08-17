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
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)]">

      <header className="border-b border-[var(--hair)] bg-[var(--surface)]/60 backdrop-blur-sm">
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
        <footer className="border-t border-[var(--hair)] bg-[var(--surface)]/60 backdrop-blur-sm mt-16">
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
