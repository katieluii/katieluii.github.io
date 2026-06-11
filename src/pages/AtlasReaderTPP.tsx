import { useParams, Link } from 'react-router-dom';
import { ArrowRight, FileText } from 'lucide-react';
import { ProjectPageLayout } from '../components/ProjectPageLayout';
import { getTPP, tppIndex, etlmIndex, crossLinks } from '../data/atlas/index';
import { ArtifactHeader } from '../components/atlas/briefing/ArtifactHeader';
import { KeyFactsStrip } from '../components/atlas/briefing/KeyFactsStrip';
import { KeyTakeaways } from '../components/atlas/briefing/KeyTakeaways';
import { DataTable, type Column, type Row } from '../components/atlas/briefing/DataTable';
import { SeverityTag } from '../components/atlas/briefing/SeverityTag';
import {
  getTppSummary,
  type ArtifactSummary,
  type UnmetNeed,
} from '../data/atlas/summaries';
import {
  getSection,
  parseGfmTable,
  getPreamble,
  slugify,
  leadSentence,
  boldLeadBullets,
} from '../data/atlas/markdown';

// --- Fallbacks derived from the body when no overlay entry exists --------------

// Heading vocabularies — broad enough to cover the varied TPP skeletons.
const UNMET_RE = /unmet need|key gaps|gaps in (current )?(soc|standard)/i;
const EFFICACY_RE = /efficacy bar|efficacy target|efficacy threshold/i;
const SEGMENT_RE = /patient segment|segment definition|patient population/i;
const SUMMARY_RE = /tpp summary|positioning statement|one-liner|the brief|bottom line/i;

function deriveSummary(md: string): ArtifactSummary {
  const verdict =
    leadSentence(getSection(md, SUMMARY_RE)?.body ?? getPreamble(md)) || 'Target product profile.';
  const bullets = boldLeadBullets(getSection(md, UNMET_RE)?.body ?? '');
  return {
    verdict,
    keyFacts: [], // TODO(human): add stat tiles for this TPP in summaries.ts
    keyTakeaways: bullets.slice(0, 5),
    topUnmetNeeds: bullets.slice(0, 3).map<UnmetNeed>((b) => ({
      need: b.lead,
      severity: 'High', // TODO(human): set real severity in summaries.ts
      note: b.rest,
    })),
  };
}

// --- Efficacy-bar table → DataTable -------------------------------------------

function buildEfficacyTable(md: string): { columns: Column[]; rows: Row[] } | null {
  const section = getSection(md, EFFICACY_RE);
  if (!section) return null;
  const table = parseGfmTable(section.body);
  if (!table || table.rows.length === 0) return null;

  const h = table.headers.map((x) => x.toLowerCase());
  const idx = (re: RegExp) => h.findIndex((x) => re.test(x));
  const iEndpoint = idx(/endpoint/) >= 0 ? idx(/endpoint/) : 0;
  const iCurrent = idx(/current|best-in-class/);
  const iAsset = idx(/^asset/);
  const iTrial = idx(/trial/);
  const iTarget = idx(/target/);

  // Generic fallback if the expected shape isn't present.
  if (iCurrent < 0 || iTarget < 0) {
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

  const columns: Column[] = [
    { key: 'endpoint', label: 'Endpoint' },
    { key: 'current', label: 'Current best-in-class', sortable: false },
    { key: 'target', label: 'Target to beat', sortable: false },
  ];
  const rows: Row[] = table.rows.map((cells, r) => ({
    id: String(r),
    cells: {
      endpoint: cells[iEndpoint],
      current: cells[iCurrent],
      target: <span className="text-zinc-900 dark:text-zinc-100 font-medium">{cells[iTarget]}</span>,
    },
    detail: (
      <div className="space-y-1.5 text-[13px] text-zinc-600 dark:text-zinc-400">
        {iAsset >= 0 && cells[iAsset] && (
          <div>
            <span className="text-zinc-500 dark:text-zinc-500">Asset / regimen: </span>
            <span className="text-zinc-800 dark:text-zinc-200">{cells[iAsset]}</span>
          </div>
        )}
        {iTrial >= 0 && cells[iTrial] && (
          <div>
            <span className="text-zinc-500 dark:text-zinc-500">Trial: </span>
            <span className="text-zinc-800 dark:text-zinc-200">{cells[iTrial]}</span>
          </div>
        )}
        <div>
          <span className="text-zinc-500 dark:text-zinc-500">Full target: </span>
          {cells[iTarget]}
        </div>
      </div>
    ),
  }));
  return { columns, rows };
}

// ------------------------------------------------------------------------------

export function AtlasReaderTPP() {
  const { slug } = useParams<{ slug: string }>();
  const md = slug ? getTPP(slug) : undefined;
  const meta = tppIndex.find((t) => t.slug === slug);

  if (!md || !meta || !slug) {
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

  const summary = getTppSummary(slug) ?? deriveSummary(md);
  const efficacy = buildEfficacyTable(md);
  const reportBase = `/atlas-reader/tpp/${slug}/report`;

  // Section anchors for deep-links into the full report.
  const unmetHeading = getSection(md, UNMET_RE)?.heading;
  const efficacyHeading = getSection(md, EFFICACY_RE)?.heading;
  const segmentHeading = getSection(md, SEGMENT_RE)?.heading;
  const anchor = (heading?: string) => (heading ? `${reportBase}#${slugify(heading)}` : reportBase);

  const updated = meta.date;

  const sourceIndicationCode = crossLinks.tpp_to_etlm?.[meta.slug] ?? meta.indication_code;
  const sourceIndication = etlmIndex.find((e) => e.indication_code === sourceIndicationCode);

  return (
    <ProjectPageLayout
      title={`${meta.indication_display} — ${meta.segment}`}
      subtitle="Target Product Profile — what a new asset would need to win."
      backTo="/atlas-reader"
      backLabel="Back to Atlas Reader"
    >
      <ArtifactHeader
        type="TPP"
        updated={updated}
        verdict={summary.verdict}
        pills={
          sourceIndication ? (
            <Link
              to={`/atlas-reader/etlm/${sourceIndication.indication_code}`}
              className="text-xs underline decoration-dotted underline-offset-4 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              Source ETLM: {sourceIndication.indication}
            </Link>
          ) : null
        }
      />

      {/* Read full report CTA */}
      <Link
        to={reportBase}
        className="group flex items-center justify-between rounded-xl ring-1 ring-zinc-900/80 dark:ring-zinc-100/30 bg-zinc-900 dark:bg-white/10 text-zinc-50 dark:text-zinc-100 px-5 py-3.5 mb-10 hover:bg-zinc-800 dark:hover:bg-white/15 transition-colors"
      >
        <span className="flex items-center gap-2.5 text-sm font-medium">
          <FileText className="w-4 h-4" />
          Read the full report — competitive set, safety bar, differentiation axes, regulatory reality
        </span>
        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
      </Link>

      {summary.keyFacts.length > 0 && <KeyFactsStrip facts={summary.keyFacts} />}

      {/* Payload: the efficacy bar, promoted high */}
      {efficacy && (
        <section className="mb-10">
          <div className="flex items-end justify-between mb-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Efficacy bar — the numbers to beat
            </h2>
            <Link
              to={anchor(efficacyHeading)}
              className="text-xs text-indigo-600 dark:text-indigo-400 underline decoration-dotted underline-offset-4"
            >
              Full efficacy + safety detail →
            </Link>
          </div>
          <DataTable columns={efficacy.columns} rows={efficacy.rows} />
          <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">
            Click a row for the reference asset, trial, and full target threshold.
          </p>
        </section>
      )}

      <KeyTakeaways takeaways={summary.keyTakeaways} />

      {/* Top-3 unmet needs */}
      {summary.topUnmetNeeds && summary.topUnmetNeeds.length > 0 && (
        <section className="mb-10">
          <div className="flex items-end justify-between mb-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Top unmet needs
            </h2>
            <Link
              to={anchor(unmetHeading)}
              className="text-xs text-indigo-600 dark:text-indigo-400 underline decoration-dotted underline-offset-4"
            >
              Full unmet-need analysis →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {summary.topUnmetNeeds.slice(0, 3).map((need, i) => (
              <div
                key={i}
                className="rounded-xl ring-1 ring-zinc-200 dark:ring-white/10 bg-white/60 dark:bg-white/5 p-4 flex flex-col gap-2"
              >
                <SeverityTag severity={need.severity} />
                <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 leading-snug">
                  {need.need}
                </div>
                {need.note && (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    {need.note}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Closing pointers into the report */}
      <section className="rounded-xl ring-1 ring-zinc-200 dark:ring-white/10 bg-zinc-50 dark:bg-white/5 p-5">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
          In the full report
        </h3>
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
          <Link to={anchor(segmentHeading)} className="text-indigo-600 dark:text-indigo-400 underline decoration-dotted underline-offset-4">
            Patient segment & standard of care →
          </Link>
          <Link to={anchor(efficacyHeading)} className="text-indigo-600 dark:text-indigo-400 underline decoration-dotted underline-offset-4">
            Efficacy & safety bars →
          </Link>
          <Link to={reportBase} className="text-indigo-600 dark:text-indigo-400 underline decoration-dotted underline-offset-4">
            Competitive set, differentiation axes & regulatory reality →
          </Link>
        </div>
      </section>
    </ProjectPageLayout>
  );
}

export default AtlasReaderTPP;
