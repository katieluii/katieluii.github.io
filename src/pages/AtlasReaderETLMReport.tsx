import { useEffect } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { ProjectPageLayout } from '../components/ProjectPageLayout';
import { Pill } from '../components/Pill';
import { getETLM, etlmIndex } from '../data/atlas/index';
import { ETLMSections } from '../components/atlas/ETLMSections';
import { RedactionGate } from '../components/atlas/AccessGate';
import { useNoindex } from '../hooks/useNoindex';
import { FULL_DETAIL_ETLM } from '../data/atlas/gating';

export function AtlasReaderETLMReport() {
  useNoindex();
  const { indication } = useParams<{ indication: string }>();
  const { hash } = useLocation();
  const etlm = indication ? getETLM(indication) : undefined;
  const meta = etlmIndex.find((e) => e.indication_code === indication);

  useEffect(() => {
    if (!hash) return;
    const el = document.getElementById(hash.slice(1));
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [hash, etlm]);

  if (!etlm || !meta) {
    return (
      <ProjectPageLayout title="ETLM report not found" backTo="/atlas-reader" backLabel="Back to Atlas Reader">
        <p className="text-zinc-600 dark:text-zinc-400">
          No ETLM exists in this preview for indication code <code>{indication}</code>.
        </p>
      </ProjectPageLayout>
    );
  }

  return (
    <ProjectPageLayout
      title={meta.indication}
      subtitle="Full landscape map — complete analytical detail."
      backTo={`/atlas-reader/etlm/${indication}`}
      backLabel="Back to briefing"
      containerClassName="max-w-5xl mx-auto px-6"
    >
      <div className="flex flex-wrap items-center gap-2 mb-8">
        <Pill variant="tech">ETLM</Pill>
        <Pill variant="tech">Full report</Pill>
        <Link
          to={`/atlas-reader/etlm/${indication}`}
          className="inline-flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to briefing
        </Link>
      </div>
      <RedactionGate context={`${meta.indication} landscape map`} bypass={!!indication && FULL_DETAIL_ETLM.has(indication)}>
        <ETLMSections etlm={etlm} indicationCode={meta.indication_code} />
      </RedactionGate>
    </ProjectPageLayout>
  );
}

export default AtlasReaderETLMReport;
