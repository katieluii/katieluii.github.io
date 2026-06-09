import { useParams, Link } from 'react-router-dom';
import { ProjectPageLayout } from '../components/ProjectPageLayout';
import { Pill } from '../components/Pill';
import { getTPP, tppIndex, etlmIndex, crossLinks } from '../data/atlas/index';
import { MarkdownView } from '../components/atlas/MarkdownView';

export function AtlasReaderTPP() {
  const { slug } = useParams<{ slug: string }>();
  const md = slug ? getTPP(slug) : undefined;
  const meta = tppIndex.find((t) => t.slug === slug);

  if (!md || !meta) {
    return (
      <ProjectPageLayout
        title="TPP not found"
        backTo="/atlas-reader"
        backLabel="Back to Atlas Reader"
      >
        <p className="text-zinc-600 dark:text-zinc-400">
          No TPP exists in this preview for slug <code>{slug}</code>.
        </p>
      </ProjectPageLayout>
    );
  }

  const sourceIndicationCode =
    crossLinks.tpp_to_etlm?.[meta.slug] ?? meta.indication_code;
  const sourceIndication = etlmIndex.find(
    (e) => e.indication_code === sourceIndicationCode,
  );

  return (
    <ProjectPageLayout
      title={meta.title}
      subtitle="Target Product Profile — what a new asset would need to win."
      backTo="/atlas-reader"
      backLabel="Back to Atlas Reader"
    >
      <div className="flex flex-wrap items-center gap-2 mb-8">
        <Pill variant="tech">TPP</Pill>
        {sourceIndication ? (
          <Link
            to={`/atlas-reader/etlm/${sourceIndication.indication_code}`}
            className="text-xs underline decoration-dotted underline-offset-4 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            ← Source ETLM: {sourceIndication.indication}
          </Link>
        ) : null}
      </div>
      <MarkdownView markdown={md} />
    </ProjectPageLayout>
  );
}

export default AtlasReaderTPP;
