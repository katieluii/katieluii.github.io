import { useEffect } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { ProjectPageLayout } from '../components/ProjectPageLayout';
import { Pill } from '../components/Pill';
import { getTheme, themeIndex } from '../data/atlas/index';
import { themeShortLabel } from '../data/atlas/taxonomy';
import { MarkdownView } from '../components/atlas/MarkdownView';

export function AtlasReaderThemeReport() {
  const { slug } = useParams<{ slug: string }>();
  const { hash } = useLocation();
  const md = slug ? getTheme(slug) : undefined;
  const meta = themeIndex.find((t) => t.slug === slug);

  useEffect(() => {
    if (!hash) return;
    const el = document.getElementById(hash.slice(1));
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [hash, md]);

  if (!md || !meta || !slug) {
    return (
      <ProjectPageLayout title="Theme report not found" backTo="/atlas-reader" backLabel="Back to Atlas Reader">
        <p className="text-zinc-600 dark:text-zinc-400">
          No thematic synthesis exists in this preview for slug <code>{slug}</code>.
        </p>
      </ProjectPageLayout>
    );
  }

  return (
    <ProjectPageLayout
      title={themeShortLabel(slug)}
      subtitle="Full thematic synthesis — complete analytical detail."
      backTo={`/atlas-reader/theme/${slug}`}
      backLabel="Back to briefing"
    >
      <div className="flex flex-wrap items-center gap-2 mb-8">
        <Pill variant="tech">Thematic synthesis</Pill>
        <Pill variant="tech">Full report</Pill>
        <Link
          to={`/atlas-reader/theme/${slug}`}
          className="inline-flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to briefing
        </Link>
      </div>
      <MarkdownView markdown={md.replace(/^#\s+.+?\n/, '')} anchors />
    </ProjectPageLayout>
  );
}

export default AtlasReaderThemeReport;
