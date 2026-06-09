import { ProjectPageLayout } from '../components/ProjectPageLayout';
import { Pill } from '../components/Pill';
import { getEcosystem } from '../data/atlas/index';
import { MarkdownView } from '../components/atlas/MarkdownView';

export function AtlasReaderEcosystem() {
  const md = getEcosystem();

  if (!md) {
    return (
      <ProjectPageLayout
        title="Ecosystem note"
        backTo="/atlas-reader"
        backLabel="Back to Atlas Reader"
      >
        <p className="text-zinc-600 dark:text-zinc-400">
          No ecosystem content has been synced into this preview yet.
        </p>
      </ProjectPageLayout>
    );
  }

  return (
    <ProjectPageLayout
      title="Ecosystem knowledge"
      subtitle="Long-running observations about how the drug-development ecosystem is moving."
      backTo="/atlas-reader"
      backLabel="Back to Atlas Reader"
    >
      <div className="flex flex-wrap items-center gap-2 mb-8">
        <Pill variant="tech">Ecosystem</Pill>
        <Pill variant="tech">Redacted subset</Pill>
      </div>
      <MarkdownView markdown={md} />
    </ProjectPageLayout>
  );
}

export default AtlasReaderEcosystem;
