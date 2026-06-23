import { useParams, Link } from 'react-router-dom';
import { ArrowRight, Layers } from 'lucide-react';
import { ProjectPageLayout } from '../components/ProjectPageLayout';
import { getTheme, themeIndex, etlmIndex, crossLinks } from '../data/atlas/index';
import { themeShortLabel } from '../data/atlas/taxonomy';
import { ArtifactHeader } from '../components/atlas/briefing/ArtifactHeader';
import { RedactionGate } from '../components/atlas/AccessGate';
import { UNGATED_THEME } from '../data/atlas/gating';
import { KeyTakeaways } from '../components/atlas/briefing/KeyTakeaways';
import { Collapsible } from '../components/atlas/briefing/Collapsible';
import { DataTable, type Column, type Row } from '../components/atlas/briefing/DataTable';
import { MarkdownView } from '../components/atlas/MarkdownView';
import {
  getSection,
  getSectionBlock,
  getPreamble,
  parseGfmTable,
  leadSentence,
  boldLeadBullets,
} from '../data/atlas/markdown';

const TLDR_RE = /tl;?dr|executive summary|thesis summary|^synthesis|trajectory vector/i;
const ABOUT_RE = /class definition|what this theme|scope/i;

function evidenceTable(md: string): { columns: Column[]; rows: Row[] } | null {
  const table = parseGfmTable(md);
  if (!table || table.rows.length === 0) return null;
  const columns: Column[] = table.headers.map((label, i) => ({
    key: String(i),
    label,
    sortable: i === 0,
  }));
  const rows: Row[] = table.rows.map((cells, r) => ({
    id: String(r),
    cells: Object.fromEntries(cells.map((c, i) => [String(i), c])),
  }));
  return { columns, rows };
}

export function AtlasReaderTheme() {
  const { slug } = useParams<{ slug: string }>();
  const md = slug ? getTheme(slug) : undefined;
  const meta = themeIndex.find((t) => t.slug === slug);

  if (!md || !meta || !slug) {
    return (
      <ProjectPageLayout title="Theme not found" backTo="/atlas-reader" backLabel="Back to Atlas Reader">
        <p className="text-zinc-600 dark:text-zinc-400">
          No thematic synthesis exists in this preview for slug <code>{slug}</code>.
        </p>
      </ProjectPageLayout>
    );
  }

  const tldrBody = getSection(md, TLDR_RE)?.body ?? getPreamble(md);
  const verdict = leadSentence(tldrBody) || themeShortLabel(slug);
  const takeaways = boldLeadBullets(tldrBody);
  const aboutBlock = getSectionBlock(md, ABOUT_RE);
  const evidence = evidenceTable(md);
  const reportBase = `/atlas-reader/theme/${slug}/report`;
  const dateMatch = slug.match(/(\d{4}-\d{2}-\d{2})/);

  const touched = crossLinks.theme_to_indications?.[slug] ?? meta.indications_touched ?? [];
  const touchedEtlms = touched
    .map((code) => etlmIndex.find((e) => e.indication_code === code))
    .filter((e): e is NonNullable<typeof e> => Boolean(e));

  return (
    <ProjectPageLayout
      title={themeShortLabel(slug)}
      subtitle="Deep thematic synthesis — class-level state of play across indications."
      backTo="/atlas-reader"
      backLabel="Back to Atlas Reader"
    >
      <ArtifactHeader type="Thematic synthesis" updated={dateMatch?.[1]} verdict={verdict} />

      <Link
        to={reportBase}
        className="group flex items-center justify-between rounded-xl ring-1 ring-zinc-900/80 dark:ring-zinc-100/30 bg-zinc-900 dark:bg-white/10 text-zinc-50 dark:text-zinc-100 px-5 py-3.5 mb-10 hover:bg-zinc-800 dark:hover:bg-white/15 transition-colors"
      >
        <span className="flex items-center gap-2.5 text-sm font-medium">
          <Layers className="w-4 h-4" />
          Read the full synthesis — momentum, cross-indication dynamics, watch flags, counter-thesis
        </span>
        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
      </Link>

      {/* TL;DR as hero — bullets become takeaways, prose becomes a bottom-line block */}
      {takeaways.length >= 2 ? (
        <KeyTakeaways takeaways={takeaways} heading="TL;DR" />
      ) : (
        tldrBody && (
          <section className="mb-10">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">
              Bottom line
            </h2>
            <div className="border-l-4 border-zinc-900 dark:border-zinc-100 pl-5 py-1">
              <p className="text-[15px] leading-relaxed text-zinc-700 dark:text-zinc-300 max-w-[72ch]">
                {tldrBody.replace(/\*\*/g, '').replace(/\s*-{3,}\s*$/g, '').trim()}
              </p>
            </div>
          </section>
        )
      )}

      {/* Indications touched */}
      {touchedEtlms.length > 0 && (
        <section className="mb-10">
          <div className="text-[10px] font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-2">
            Indications this theme touches
          </div>
          <div className="flex flex-wrap gap-2">
            {touchedEtlms.map((e) => (
              <Link
                key={e.indication_code}
                to={`/atlas-reader/etlm/${e.indication_code}`}
                className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-white/60 dark:bg-white/5 ring-1 ring-zinc-200 dark:ring-white/10 text-zinc-700 dark:text-zinc-300 hover:ring-indigo-300 dark:hover:ring-indigo-500/40 transition-all"
              >
                <Layers className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                {e.indication}
              </Link>
            ))}
          </div>
        </section>
      )}

      <RedactionGate context={`${themeShortLabel(slug)} synthesis`} bypass={UNGATED_THEME.has(slug)}>
      {/* About this theme (macro prose, collapsed) */}
      {aboutBlock && (
        <section className="mb-6">
          <Collapsible title="About this theme — class definition & scope">
            <MarkdownView markdown={aboutBlock} />
          </Collapsible>
        </section>
      )}

      {/* Evidence & coverage (a representative table, collapsed) */}
      {evidence && (
        <section className="mb-6">
          <Collapsible title="Evidence & coverage" meta={`${evidence.rows.length} rows`}>
            <div className="pt-2">
              <DataTable columns={evidence.columns} rows={evidence.rows} />
              <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">
                One representative table from the synthesis. The full evidence set is in the report.
              </p>
            </div>
          </Collapsible>
        </section>
      )}
      </RedactionGate>
    </ProjectPageLayout>
  );
}

export default AtlasReaderTheme;
