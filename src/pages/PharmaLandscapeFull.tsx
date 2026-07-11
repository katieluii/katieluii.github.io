import { Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { SAMPLE_RUN_LABEL } from '../data/pharmaLandscape';

const DEMO = '/demos/pharma-landscape.html';

/* Full research product as its own route — the complete landscape as a fixed, dated
   sample run, presented full-bleed (app-like) rather than embedded inside the case
   study. Opens at the top; the iframe scrolls internally with no cropping. */
export function PharmaLandscapeFull() {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-zinc-950">
      <header className="sticky top-0 z-10 flex items-center justify-between gap-3 px-4 sm:px-6 h-13 py-2.5 border-b border-zinc-200 dark:border-white/10 bg-white/90 dark:bg-zinc-950/90 backdrop-blur">
        <Link
          to="/pharma-landscape"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Case study
        </Link>
        <span className="text-xs text-zinc-500 dark:text-zinc-400 text-center">
          <span className="font-medium text-zinc-700 dark:text-zinc-300">{SAMPLE_RUN_LABEL}</span>
          <span className="hidden sm:inline"> · directional, not investment advice</span>
        </span>
        <a
          href={DEMO}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-teal-700 dark:text-teal-400 hover:underline"
        >
          <span className="hidden sm:inline">New tab</span> <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </header>
      <iframe
        src={DEMO}
        title="Large-cap pharma landscape — full reviewed sample run"
        className="w-full flex-1 border-0"
        style={{ height: 'calc(100vh - 53px)' }}
      />
    </div>
  );
}

export default PharmaLandscapeFull;
