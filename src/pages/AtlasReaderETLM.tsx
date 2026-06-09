import { useParams } from 'react-router-dom';
import { ProjectPageLayout } from '../components/ProjectPageLayout';
import { Pill } from '../components/Pill';
import { getETLM, etlmIndex } from '../data/atlas/index';
import { ETLMSections } from '../components/atlas/ETLMSections';

export function AtlasReaderETLM() {
  const { indication } = useParams<{ indication: string }>();
  const etlm = indication ? getETLM(indication) : undefined;
  const meta = etlmIndex.find((e) => e.indication_code === indication);

  if (!etlm || !meta) {
    return (
      <ProjectPageLayout
        title="ETLM not found"
        backTo="/atlas-reader"
        backLabel="Back to Atlas Reader"
      >
        <p className="text-zinc-600 dark:text-zinc-400">
          No ETLM exists in this preview for indication code <code>{indication}</code>.
        </p>
      </ProjectPageLayout>
    );
  }

  return (
    <ProjectPageLayout
      title={meta.indication}
      subtitle="Emerging Therapeutic Landscape Map — a living strategic memory."
      backTo="/atlas-reader"
      backLabel="Back to Atlas Reader"
      containerClassName="max-w-5xl mx-auto px-6"
    >
      <div className="flex flex-wrap items-center gap-2 mb-8">
        <Pill variant="tech">ETLM</Pill>
        {meta.subtitle && <Pill variant="tech">{meta.subtitle}</Pill>}
        {etlm.last_updated ? (
          <Pill variant="tech">Updated {String(etlm.last_updated).slice(0, 10)}</Pill>
        ) : null}
      </div>
      <ETLMSections etlm={etlm} indicationCode={meta.indication_code} />
    </ProjectPageLayout>
  );
}

export default AtlasReaderETLM;
