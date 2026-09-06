import { Link } from 'react-router-dom';
import { ArrowRight, FileText, Layers, Flame, FileSearch, LockKeyhole } from 'lucide-react';
import { ProjectPageLayout } from '../components/ProjectPageLayout';
import { Pill } from '../components/Pill';
import catalogData from '../data/atlas/catalog.json';
import { themeIndex, hasEcosystem, type ThemeIndexEntry } from '../data/atlas/index';
import { taForTheme, themeShortLabel, type TherapeuticArea } from '../data/atlas/taxonomy';

type PublicStatus = 'published' | 'published_snapshot' | 'in_review' | 'planned';

type CatalogArtifact = {
  slug: string;
  title?: string;
};

type CatalogDeliverable = {
  status: PublicStatus;
  reviewed_on?: string;
  evidence_through?: string;
  mode: 'full' | 'summary' | 'none';
  artifacts: CatalogArtifact[];
};

type CatalogIndication = {
  id: string;
  name: string;
  short_name: string;
  therapeutic_area: TherapeuticArea;
  aliases?: string[];
  landscape: CatalogDeliverable;
  tpp: CatalogDeliverable;
};

type CatalogArea = {
  id: TherapeuticArea;
  description: string;
};

type CoverageCatalog = {
  schema_version: number;
  evaluated_at: string;
  therapeutic_areas: CatalogArea[];
  indications: CatalogIndication[];
};

const catalog = catalogData as CoverageCatalog;

const STATUS_LABEL: Record<PublicStatus, string> = {
  published: 'Published',
  published_snapshot: 'Published snapshot',
  in_review: 'In draft',
  planned: 'Planned',
};

const STATUS_CLASS: Record<PublicStatus, string> = {
  published:
    'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30',
  published_snapshot:
    'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30',
  in_review:
    'bg-indigo-50 text-indigo-700 ring-indigo-600/20 dark:bg-indigo-500/10 dark:text-indigo-300 dark:ring-indigo-500/30',
  planned:
    'bg-zinc-100 text-zinc-600 ring-zinc-500/20 dark:bg-white/5 dark:text-zinc-300 dark:ring-white/15',
};

function displayDate(value?: string): string | undefined {
  if (!value) return undefined;
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.valueOf())) return value;
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

function statusMeta(deliverable: CatalogDeliverable): string | undefined {
  if (deliverable.status === 'published' || deliverable.status === 'published_snapshot') {
    const evidenceDate = displayDate(deliverable.evidence_through);
    if (evidenceDate) return `Evidence through ${evidenceDate}`;
  }
  const reviewedDate = displayDate(deliverable.reviewed_on);
  return reviewedDate ? `Status reviewed ${reviewedDate}` : undefined;
}

function StatusBadge({ status }: { status: PublicStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_CLASS[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

function UnavailableRow({
  label,
  deliverable,
}: {
  label: string;
  deliverable: CatalogDeliverable;
}) {
  const meta = statusMeta(deliverable);
  return (
    <div className="rounded-lg bg-zinc-50/60 px-3 py-3 ring-1 ring-zinc-200 dark:bg-white/[0.03] dark:ring-white/10">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{label}</span>
        <StatusBadge status={deliverable.status} />
      </div>
      {meta && <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{meta}</div>}
    </div>
  );
}

function LandscapeRow({ indication }: { indication: CatalogIndication }) {
  const deliverable = indication.landscape;
  const artifact = deliverable.artifacts[0];
  if (!artifact) return <UnavailableRow label="Landscape map" deliverable={deliverable} />;

  return (
    <Link
      to={`/atlas-reader/etlm/${artifact.slug}`}
      className="group block rounded-lg bg-white/60 px-3 py-3 ring-1 ring-zinc-200 transition-all hover:ring-indigo-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:bg-white/5 dark:ring-white/10 dark:hover:ring-indigo-500/40"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Landscape map</span>
        <div className="flex items-center gap-2">
          <StatusBadge status={deliverable.status} />
          <ArrowRight className="h-3.5 w-3.5 text-zinc-400 transition-transform group-hover:translate-x-0.5 group-hover:text-indigo-500" />
        </div>
      </div>
      <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
        {deliverable.mode === 'summary' ? 'Summary view' : 'Full view'}
        {statusMeta(deliverable) ? ` · ${statusMeta(deliverable)}` : ''}
      </div>
    </Link>
  );
}

function TppRow({ indication }: { indication: CatalogIndication }) {
  const deliverable = indication.tpp;
  if (deliverable.artifacts.length === 0) {
    return <UnavailableRow label="Target product profiles" deliverable={deliverable} />;
  }

  return (
    <div className="rounded-lg bg-white/60 px-3 py-3 ring-1 ring-zinc-200 dark:bg-white/5 dark:ring-white/10">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
          Target product profiles
        </span>
        <StatusBadge status={deliverable.status} />
      </div>
      <ul className="space-y-1">
        {deliverable.artifacts.map((artifact) => (
          <li key={artifact.slug}>
            <Link
              to={`/atlas-reader/tpp/${artifact.slug}`}
              className="group -mx-2 flex items-start justify-between gap-3 rounded-md px-2 py-2 transition-colors hover:bg-rose-50/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 dark:hover:bg-rose-500/10"
            >
              <span className="flex min-w-0 items-start gap-2">
                <FileText className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-rose-600 dark:text-rose-400" />
                <span className="text-sm leading-snug text-zinc-700 group-hover:text-zinc-900 dark:text-zinc-300 dark:group-hover:text-zinc-100">
                  {artifact.title ?? 'Target product profile'}
                </span>
              </span>
              <ArrowRight className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-zinc-400 transition-transform group-hover:translate-x-0.5 group-hover:text-rose-500" />
            </Link>
          </li>
        ))}
      </ul>
      {statusMeta(deliverable) && (
        <div className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
          {statusMeta(deliverable)}
        </div>
      )}
    </div>
  );
}

function themesForArea(area: TherapeuticArea): ThemeIndexEntry[] {
  return themeIndex.filter((theme) => taForTheme(theme.slug, theme.indications_touched) === area);
}

export function AtlasReader() {
  const landscapePublished = catalog.indications.filter((item) =>
    item.landscape.status.startsWith('published'),
  ).length;
  const tppProfilesPublished = catalog.indications.reduce(
    (total, item) => total + item.tpp.artifacts.length,
    0,
  );

  return (
    <ProjectPageLayout
      title="Atlas Reader"
      subtitle="Drug-development landscapes, target product profiles, and class-level theses organised by therapeutic area. The catalogue separates published work from indications still in audit or planned."
      backTo="/atlas-drug-dev-analyst"
      backLabel="Back to Atlas"
    >
      <div className="mb-10 flex flex-wrap items-center gap-2">
        <Pill variant="tech">Open access</Pill>
        <Pill variant="tech">
          {catalog.indications.length} indications tracked · {landscapePublished} landscapes published ·{' '}
          {tppProfilesPublished} TPPs published · {themeIndex.length} themes
        </Pill>
      </div>

      {import.meta.env.DEV && (
        <div className="mb-8 grid gap-3 md:grid-cols-2">
          <Link
            to="/atlas-reader/staging"
            className="group flex items-center justify-between rounded-xl bg-emerald-50/70 px-5 py-4 ring-1 ring-emerald-300/60 transition-all hover:ring-emerald-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:bg-emerald-500/[0.08] dark:ring-emerald-500/30 dark:hover:ring-emerald-500/50"
          >
            <div className="flex items-center gap-3">
              <LockKeyhole className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
              <div>
                <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Open staged landscape previews
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                  Inspect topline figures with the published top-three preview treatment.
                </div>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-emerald-700/70 transition-transform group-hover:translate-x-0.5 dark:text-emerald-400/70" />
          </Link>
          <Link
            to="/atlas-reader/audits"
            className="group flex items-center justify-between rounded-xl bg-indigo-50/70 px-5 py-4 ring-1 ring-indigo-300/60 transition-all hover:ring-indigo-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:bg-indigo-500/[0.08] dark:ring-indigo-500/30 dark:hover:ring-indigo-500/50"
          >
            <div className="flex items-center gap-3">
              <FileSearch className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              <div>
                <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Open local audit workbench
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                  Read audit evidence and review the TPP candidates.
                </div>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-indigo-600/70 transition-transform group-hover:translate-x-0.5 dark:text-indigo-400/70" />
          </Link>
        </div>
      )}

      <section className="mb-12">
        <div className="border-l-4 border-zinc-900 py-2 pl-5 dark:border-zinc-100">
          <p className="max-w-[72ch] leading-relaxed text-zinc-700 dark:text-zinc-300">
            Published artifacts are the only linked items. “Published snapshot” marks a view that
            remains available while a newer evidence refresh is under review; “In draft” and
            “Planned” items are not yet available.
          </p>
        </div>
      </section>

      {hasEcosystem && (
        <Link
          to="/atlas-reader/ecosystem"
          className="group mb-12 flex items-center justify-between rounded-xl bg-amber-50/50 px-5 py-4 ring-1 ring-amber-300/60 transition-all hover:ring-amber-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:bg-amber-500/[0.06] dark:ring-amber-500/30 dark:hover:ring-amber-500/50"
        >
          <div className="flex min-w-0 items-center gap-3">
            <Flame className="h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
            <div className="min-w-0">
              <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                The analyst&apos;s read: what&apos;s hottest right now
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                Headline narratives on where the field is moving, with sources.
              </div>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 flex-shrink-0 text-amber-600/70 transition-transform group-hover:translate-x-0.5 dark:text-amber-400/70" />
        </Link>
      )}

      {catalog.therapeutic_areas.map((area) => {
        const indications = catalog.indications.filter(
          (item) => item.therapeutic_area === area.id,
        );
        const themes = themesForArea(area.id);
        return (
          <section key={area.id} className="mb-14">
            <div className="mb-5 border-b border-zinc-200 pb-3 dark:border-white/10">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
                {area.id}
              </h2>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{area.description}</p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {indications.map((indication) => (
                <article
                  key={indication.id}
                  className="rounded-xl bg-white/60 p-5 ring-1 ring-zinc-200 dark:bg-white/5 dark:ring-white/10"
                >
                  <div className="mb-4 flex items-start gap-2">
                    <Layers className="mt-0.5 h-4 w-4 flex-shrink-0 text-indigo-600 dark:text-indigo-400" />
                    <div>
                      <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                        {indication.short_name}
                      </h3>
                      {indication.name !== indication.short_name && (
                        <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
                          {indication.name}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <LandscapeRow indication={indication} />
                    <TppRow indication={indication} />
                  </div>
                </article>
              ))}
            </div>

            {themes.length > 0 && (
              <div className="mt-5">
                <div className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Cross-cutting themes
                </div>
                <div className="flex flex-wrap gap-2">
                  {themes.map((theme) => (
                    <Link
                      key={theme.slug}
                      to={`/atlas-reader/theme/${theme.slug}`}
                      className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs text-amber-700 ring-1 ring-amber-600/20 transition-all hover:ring-amber-600/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30"
                    >
                      <Layers className="h-3 w-3" />
                      {themeShortLabel(theme.slug)}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </section>
        );
      })}
    </ProjectPageLayout>
  );
}

export default AtlasReader;
