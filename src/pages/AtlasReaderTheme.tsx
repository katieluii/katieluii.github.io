import { useParams, Link } from 'react-router-dom';
import { ProjectPageLayout } from '../components/ProjectPageLayout';
import { Pill } from '../components/Pill';
import { getTheme, themeIndex, etlmIndex, crossLinks } from '../data/atlas/index';
import { MarkdownView } from '../components/atlas/MarkdownView';

export function AtlasReaderTheme() {
  const { slug } = useParams<{ slug: string }>();
  const md = slug ? getTheme(slug) : undefined;
  const meta = themeIndex.find((t) => t.slug === slug);

  if (!md || !meta) {
    return (
      <ProjectPageLayout
        title="Theme not found"
        backTo="/atlas-reader"
        backLabel="Back to Atlas Reader"
      >
        <p className="text-zinc-600 dark:text-zinc-400">
          No theme exists in this preview for slug <code>{slug}</code>.
        </p>
      </ProjectPageLayout>
    );
  }

  const touched =
    crossLinks.theme_to_indications?.[meta.slug] ?? meta.indications_touched ?? [];
  const touchedWithEtlm = touched
    .map((code) => etlmIndex.find((e) => e.indication_code === code))
    .filter((e): e is NonNullable<typeof e> => Boolean(e));

  return (
    <ProjectPageLayout
      title={meta.title}
      subtitle="Deep thematic synthesis — class- or modality-level state of play."
      backTo="/atlas-reader"
      backLabel="Back to Atlas Reader"
    >
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <Pill variant="tech">Theme</Pill>
      </div>

      {touchedWithEtlm.length > 0 ? (
        <div className="mb-8 rounded-xl ring-1 ring-zinc-200 dark:ring-white/10 bg-white/40 dark:bg-white/5 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
            Indications in this preview
          </p>
          <div className="flex flex-wrap gap-2">
            {touchedWithEtlm.map((e) => (
              <Link
                key={e.indication_code}
                to={`/atlas-reader/etlm/${e.indication_code}`}
                className="text-xs px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 ring-1 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/20 hover:ring-amber-600/40"
              >
                {e.indication}
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      <MarkdownView markdown={md} />
    </ProjectPageLayout>
  );
}

export default AtlasReaderTheme;
