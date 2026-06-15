import type { ReactNode } from 'react';

/* Shared brand-statement intro for project pages — a left-border bold headline over
   a normalized body block. Single source of truth so the intro style can't drift
   across pages. Body is `children`, so it supports multiple paragraphs and inline
   emphasis. (The bespoke Atlas + warm work-with-me pages do not use this.) */
export function ProjectLead({ headline, children }: { headline: ReactNode; children?: ReactNode }) {
  return (
    <section className="border-l-2 border-zinc-900 dark:border-zinc-100 pl-5 sm:pl-6 py-1">
      <p className="text-[22px] sm:text-[26px] font-bold text-zinc-900 dark:text-zinc-100 leading-[1.2] tracking-tight">
        {headline}
      </p>
      {children && (
        <div className="mt-3 text-[14px] text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-2xl space-y-3">
          {children}
        </div>
      )}
    </section>
  );
}

export default ProjectLead;
