import { ProjectPageLayout } from '../ProjectPageLayout';

type Entry = Record<string, string>;

function sourceLinks(source: string): string[] {
  const urls = source.match(/https:\/\/[^\s;]+/g) ?? [];
  const pmids = [...source.matchAll(/PMID\s*:?\s*(\d+)/gi)].map((match) => `https://pubmed.ncbi.nlm.nih.gov/${match[1]}/`);
  return [...new Set([...urls, ...pmids])];
}

export function IndicationPreview({ etlm }: { etlm: Record<string, unknown> }) {
  const sections = [
    { key: 'approved_therapies', title: 'Selected approved therapies' },
    { key: 'approved_therapies_novel', title: 'Selected approved therapies' },
    { key: 'pipeline_assets', title: 'Selected studies' },
  ];
  return (
    <ProjectPageLayout title={String(etlm.indication)} subtitle="Capped landscape preview" backTo="/atlas-reader" backLabel="Back to Atlas Reader">
      <p className="mb-8 max-w-3xl text-zinc-600 dark:text-zinc-300">{String(etlm.detail_note)}</p>
      {sections.map(({ key, title }) => {
        const rows = etlm[key] as Entry[] | undefined;
        if (!rows?.length) return null;
        return (
          <section key={key} className="mb-10">
            <h2 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-zinc-100">{title}</h2>
            {key === 'pipeline_assets' && <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">Study listings can include approved medicines and historical programmes. Trial phase describes the listed study.</p>}
            <div className="grid gap-4 md:grid-cols-3">
              {rows.map((row) => (
                <article key={row.nct ?? row.drug_name ?? row.asset_name} className="rounded-xl border border-zinc-200 p-5 dark:border-white/10">
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">{row.drug_name ?? row.asset_name}</h3>
                  {row.brand && <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">{row.brand}</p>}
                  <dl className="mt-4 space-y-2 text-sm">
                    {Object.entries({ company: 'Company', modality: 'Modality', target: 'Target', indication_line: 'Setting', trial: 'Trial', trial_name: 'Trial', nct: 'Trial registration', phase: 'Trial phase', status: 'Study context' }).map(([field, label]) => row[field] ? (
                      <div key={field}><dt className="text-zinc-500 dark:text-zinc-400">{label}</dt><dd className="text-zinc-800 dark:text-zinc-200">{row[field]}</dd></div>
                    ) : null)}
                  </dl>
                  <div className="mt-4 flex flex-wrap gap-3">
                    {sourceLinks(row.source).map((url, index) => <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-700 underline dark:text-indigo-300">Source{index ? ` ${index + 1}` : ''}</a>)}
                  </div>
                </article>
              ))}
            </div>
          </section>
        );
      })}
    </ProjectPageLayout>
  );
}
