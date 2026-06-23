import { useEffect } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { ProjectPageLayout } from '../components/ProjectPageLayout';
import { Pill } from '../components/Pill';
import { getTPP, tppIndex } from '../data/atlas/index';
import { MarkdownView } from '../components/atlas/MarkdownView';
import { RedactionGate } from '../components/atlas/AccessGate';
import { UNGATED_TPP } from '../data/atlas/gating';

export function AtlasReaderTPPReport() {
  const { slug } = useParams<{ slug: string }>();
  const { hash } = useLocation();
  const md = slug ? getTPP(slug) : undefined;
  const meta = tppIndex.find((t) => t.slug === slug);

  // Scroll to a deep-linked section anchor (SPA hash isn't auto-scrolled).
  useEffect(() => {
    if (!hash) return;
    const el = document.getElementById(hash.slice(1));
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [hash, md]);

  if (!md || !meta) {
    return (
      <ProjectPageLayout
        title="TPP report not found"
        backTo="/atlas-reader"
        backLabel="Back to Atlas Reader"
      >
        <p className="text-zinc-600 dark:text-zinc-400">
          No TPP exists in this preview for slug <code>{slug}</code>.
        </p>
      </ProjectPageLayout>
    );
  }

  return (
    <ProjectPageLayout
      title={`${meta.indication_display} — ${meta.segment}`}
      subtitle="Full report — complete analytical detail."
      backTo={`/atlas-reader/tpp/${slug}`}
      backLabel="Back to briefing"
    >
      <div className="flex flex-wrap items-center gap-2 mb-8">
        <Pill variant="tech">TPP</Pill>
        <Pill variant="tech">Full report</Pill>
        <Link
          to={`/atlas-reader/tpp/${slug}`}
          className="inline-flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to briefing
        </Link>
      </div>
      <RedactionGate context={`${meta.indication_display} — ${meta.segment} TPP`} bypass={!!slug && UNGATED_TPP.has(slug)}>
        <MarkdownView markdown={md.replace(/^#\s+.+?\n/, '')} anchors />
      </RedactionGate>
    </ProjectPageLayout>
  );
}

export default AtlasReaderTPPReport;
