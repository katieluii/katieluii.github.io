import { useParams, Link } from 'react-router-dom';
import { ArrowRight, Layers, ExternalLink } from 'lucide-react';
import { ProjectPageLayout } from '../components/ProjectPageLayout';
import { Pill } from '../components/Pill';
import { getETLM, etlmIndex } from '../data/atlas/index';
import { ArtifactHeader } from '../components/atlas/briefing/ArtifactHeader';
import { KeyFactsStrip, type KeyFact } from '../components/atlas/briefing/KeyFactsStrip';
import { DataTable, type Column, type Row } from '../components/atlas/briefing/DataTable';
import { Collapsible } from '../components/atlas/briefing/Collapsible';
import { SeverityTag, type Severity } from '../components/atlas/briefing/SeverityTag';
import { getEtlmSummary } from '../data/atlas/summaries';
import { DetailHook } from '../components/atlas/AccessGate';
import {
  getProfile,
  profileColumns,
  resolveEntry,
  entryCaveat,
  type PresentationProfile,
} from '../data/atlas/presentationProfile';

function isObj(v: unknown): v is Record<string, unknown> {
  return Boolean(v) && typeof v === 'object' && !Array.isArray(v);
}

const SEVERITY_MAP: Record<string, Severity> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  moderate: 'Medium',
};
const SEVERITY_RANK: Record<Severity, number> = { Critical: 0, High: 1, Medium: 2 };

/** Short, human label for a structured source by type. */
function srcTypeLabel(type: string): string {
  const t = type.toLowerCase();
  if (t.includes('pubmed')) return 'PubMed';
  if (t.includes('ctgov') || t.includes('clinicaltrials')) return 'CT.gov';
  if (t.includes('journal')) return 'Journal';
  if (t.includes('fda')) return 'FDA';
  return 'Source';
}

/** Inline provenance cell — clickable links to where the benchmark data came
 *  from. Prefers the structured `sources[]` (PubMed/CT.gov/journal w/ quoted
 *  metric); falls back to the entry's NCT → ClinicalTrials.gov. */
function sourceCell(entry: unknown): React.ReactNode {
  const e = isObj(entry) ? entry : {};
  const structured = Array.isArray(e.sources) ? e.sources.filter(isObj) : [];
  const linkCls =
    'inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 underline decoration-dotted underline-offset-2 whitespace-nowrap';
  if (structured.length > 0) {
    return (
      <div className="flex flex-col gap-0.5">
        {structured.slice(0, 3).map((s, i) => (
          <a
            key={i}
            href={String(s.url)}
            target="_blank"
            rel="noopener noreferrer"
            title={`${String(s.label ?? '')}${s.quoted_metric ? ` — ${String(s.quoted_metric)}` : ''}`}
            className={linkCls}
          >
            {srcTypeLabel(String(s.type ?? ''))}
            <ExternalLink className="w-3 h-3" />
          </a>
        ))}
      </div>
    );
  }
  const nct = e.nct ? String(e.nct) : '';
  if (nct) {
    const trial = String(e.trial ?? '').split(/[;(]/)[0].trim();
    return (
      <a
        href={`https://clinicaltrials.gov/study/${nct}`}
        target="_blank"
        rel="noopener noreferrer"
        title={String(e.trial ?? nct)}
        className={linkCls}
      >
        {trial ? (trial.length > 22 ? trial.slice(0, 21) + '…' : trial) : 'CT.gov'}
        <ExternalLink className="w-3 h-3" />
      </a>
    );
  }
  return <span className="text-zinc-400 dark:text-zinc-500">—</span>;
}

/** Append a clickable Source column, keyed positionally to the therapy entries
 *  (rows are built in entry order). Generic across both table builders. */
function withSourceColumn(
  table: { columns: Column[]; rows: Row[] },
  therapies: unknown[],
): { columns: Column[]; rows: Row[] } {
  return {
    columns: [...table.columns, { key: 'source', label: 'Source', sortable: false }],
    rows: table.rows.map((r, i) => ({
      ...r,
      cells: { ...r.cells, source: sourceCell(therapies[i]) },
    })),
  };
}

function num(v: unknown): number | undefined {
  return typeof v === 'number' ? v : undefined;
}

/** Trailing integer in a benchmark key — used to prefer the latest timepoint
 *  (e.g. tbwl_pct_w68_or_72 -> 72, tbwl_pct_w52 -> 52, vs_placebo_tbwl_pct -> 0). */
function weekOf(key: string): number {
  const m = key.match(/(\d+)(?!.*\d)/);
  return m ? Number(m[1]) : 0;
}

/** Infer route of administration from a free-text modality string. */
function routeOf(modality: string): string {
  const m = modality.toLowerCase();
  if (m.includes('oral')) return 'Oral';
  if (/s\.c\.|subcutaneous|\bsc\b|inject/.test(m)) return 'S.C.';
  if (/i\.v\.|intravenous|\biv\b|infus/.test(m)) return 'I.V.';
  return '—';
}

/** Latest-timepoint total-body-weight-loss % from a custom_efficacy object,
 *  scanning any tbwl-named numeric key rather than a fixed allow-list. */
function tbwlOf(custEff: Record<string, unknown>): number | undefined {
  const keys = Object.keys(custEff).filter(
    (k) => /tbwl/i.test(k) && typeof custEff[k] === 'number',
  );
  if (keys.length === 0) return undefined;
  keys.sort((a, b) => weekOf(b) - weekOf(a));
  return num(custEff[keys[0]]);
}

/** All-grade nausea % from a custom_safety object — any nausea-named numeric key. */
function nauseaOf(custSafe: Record<string, unknown>): number | undefined {
  const k = Object.keys(custSafe).find(
    (key) => /nausea/i.test(key) && typeof custSafe[key] === 'number',
  );
  return k ? num(custSafe[k]) : undefined;
}

/** Rare/monogenic obesity agents (e.g. setmelanotide) address a different
 *  population than the mass-market incretins — flag so their efficacy isn't
 *  read as directly comparable. */
function isRareGeneticObesity(indicationLine: string): boolean {
  return /genetic|monogenic|syndrom|hypothalamic|POMC|PCSK1|LEPR|Bardet/i.test(indicationLine);
}

function buildKeyFacts(etlm: Record<string, unknown>): KeyFact[] {
  const epi = isObj(etlm.epidemiology) ? etlm.epidemiology : {};
  // Prefer the novel/legacy split when present (the flat `approved_therapies`
  // array is a stale subset on indications that have split their approved set).
  const approved = Array.isArray(etlm.approved_therapies_novel)
    ? (etlm.approved_therapies_novel as unknown[]).length +
      (Array.isArray(etlm.approved_therapies_legacy) ? (etlm.approved_therapies_legacy as unknown[]).length : 0)
    : Array.isArray(etlm.approved_therapies)
      ? etlm.approved_therapies.length
      : 0;
  const segments = Array.isArray((epi as any).key_genomic_segments)
    ? (epi as any).key_genomic_segments.length
    : Array.isArray(etlm.mechanism_landscape)
      ? etlm.mechanism_landscape.length
      : 0;
  const facts: (KeyFact | null)[] = [
    epi.us_incidence_annual != null
      ? { label: 'US incidence / yr', value: Number(epi.us_incidence_annual).toLocaleString() }
      : null,
    epi['5yr_survival_pct'] != null
      ? { label: '5-yr survival', value: `${epi['5yr_survival_pct']}%` }
      : null,
    epi.median_age_at_diagnosis != null
      ? { label: 'Median age at dx', value: String(epi.median_age_at_diagnosis) }
      : null,
    approved ? { label: 'Approved therapies', value: String(approved) } : null,
    segments ? { label: 'Tracked segments', value: String(segments) } : null,
  ];
  return facts.filter((f): f is KeyFact => Boolean(f));
}

function effVal(eff: Record<string, unknown>, keys: string[]): unknown {
  for (const k of keys) if (eff[k] != null) return eff[k];
  return undefined;
}

function buildTherapiesTable(
  therapies: unknown[],
  anchorAssets: string[],
  therapeuticArea: string = '',
): { columns: Column[]; rows: Row[] } {
  const isMetabolic = therapeuticArea === 'metabolic';

  const columns: Column[] = isMetabolic
    ? [
        { key: 'asset', label: 'Asset' },
        { key: 'sponsor', label: 'Sponsor' },
        { key: 'target', label: 'Target' },
        { key: 'route', label: 'Route' },
        { key: 'tbwl', label: 'TBWL%', align: 'right' },
        { key: 'nausea', label: 'Nausea%', align: 'right' },
        { key: 'fda', label: 'FDA' },
      ]
    : [
        { key: 'asset', label: 'Asset' },
        { key: 'sponsor', label: 'Sponsor' },
        { key: 'target', label: 'Target' },
        { key: 'line', label: 'Line / setting', sortable: false },
        { key: 'orr', label: 'ORR', align: 'right' },
        { key: 'mpfs', label: 'mPFS', align: 'right' },
        { key: 'mos', label: 'mOS', align: 'right' },
        { key: 'fda', label: 'FDA' },
      ];

  const rows: Row[] = therapies.map((entry, i) => {
    const e = isObj(entry) ? entry : {};
    const eff = isObj(e.key_efficacy) ? e.key_efficacy : {};
    const custEff = isObj(e.custom_efficacy) ? e.custom_efficacy : {};
    const custSafe = isObj(e.custom_safety) ? e.custom_safety : {};
    const asset = String(e.brand ?? e.drug_name ?? e.asset_name ?? '—');
    const fda = e.fda_approval_date ? String(e.fda_approval_date) : '';
    const line = e.indication_line ? String(e.indication_line) : '';
    const isAnchor = anchorAssets.some(
      (a) => asset.toLowerCase().includes(a) || String(e.drug_name ?? '').toLowerCase().includes(a),
    );

    const modality = String(e.modality ?? '');
    const route = routeOf(modality);

    const tbwl = tbwlOf(custEff);
    const nausea = nauseaOf(custSafe);
    const rareGenetic = isMetabolic && isRareGeneticObesity(line);
    const orr = num(effVal(eff, ['orr_pct', 'orr']));
    const mpfs = num(effVal(eff, ['median_pfs_mo', 'mpfs_mo', 'pfs_mo']));
    const mos = num(effVal(eff, ['median_os_mo', 'mos_mo', 'os_mo']));

    const cells: Record<string, React.ReactNode> = isMetabolic
      ? {
          asset: rareGenetic ? (
            <span>
              {asset}
              <span className="ml-1.5 text-[10px] uppercase tracking-wider text-amber-600 dark:text-amber-400">
                rare genetic
              </span>
            </span>
          ) : (
            asset
          ),
          sponsor: String(e.company ?? '—'),
          target: e.target ? String(e.target) : '—',
          route,
          tbwl: tbwl != null ? `${tbwl}%` : '—',
          nausea: nausea != null ? `${nausea}%` : '—',
          fda: fda ? fda.slice(0, 7) : '—',
        }
      : {
          asset,
          sponsor: String(e.company ?? '—'),
          target: e.target ? String(e.target) : '—',
          line: <span title={line}>{line.length > 34 ? line.slice(0, 33) + '…' : line || '—'}</span>,
          orr: orr != null ? `${orr}%` : '—',
          mpfs: mpfs != null ? `${mpfs} mo` : '—',
          mos: mos != null ? `${mos} mo` : '—',
          fda: fda ? fda.slice(0, 7) : '—',
        };

    const sortValues: Record<string, string | number> = isMetabolic
      ? {
          asset,
          sponsor: String(e.company ?? ''),
          target: String(e.target ?? ''),
          route,
          tbwl: tbwl ?? Infinity,
          nausea: nausea ?? -1,
          fda,
        }
      : {
          asset,
          sponsor: String(e.company ?? ''),
          target: String(e.target ?? ''),
          orr: orr ?? -1,
          mpfs: mpfs ?? -1,
          mos: mos ?? -1,
          fda,
        };

    const detailEff = isMetabolic ? custEff : eff;
    const detailEffLabel = isMetabolic ? 'Efficacy' : 'Key efficacy';

    return {
      id: String(i),
      isAnchor,
      cells,
      sortValues,
      detail: (
        <div className="space-y-2 text-[13px] text-zinc-600 dark:text-zinc-400">
          {e.drug_name && e.brand ? (
            <div>
              <span className="text-zinc-500">Generic: </span>
              {String(e.drug_name)}
            </div>
          ) : null}
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {e.modality ? (
              <span>
                <span className="text-zinc-500">Modality: </span>
                {String(e.modality)}
              </span>
            ) : null}
            {e.ema_approval_date ? (
              <span>
                <span className="text-zinc-500">EMA: </span>
                {String(e.ema_approval_date)}
              </span>
            ) : null}
            {e.trial ? (
              <span>
                <span className="text-zinc-500">Trial: </span>
                {String(e.trial)}
              </span>
            ) : null}
          </div>
          {line ? (
            <div>
              <span className="text-zinc-500">Line / setting: </span>
              {line}
            </div>
          ) : null}
          {Object.keys(detailEff).filter((k) => detailEff[k] != null).length > 0 && (
            <div>
              <div className="text-[10px] font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1">
                {detailEffLabel}
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {Object.entries(detailEff)
                  .filter(([, v]) => v != null)
                  .map(([k, v]) => (
                    <span key={k}>
                      <span className="text-zinc-500">{k.replace(/_/g, ' ')}: </span>
                      <span className="text-zinc-800 dark:text-zinc-200">{String(v)}</span>
                    </span>
                  ))}
              </div>
            </div>
          )}
          {isMetabolic && Object.keys(custSafe).filter((k) => custSafe[k] != null).length > 0 && (
            <div>
              <div className="text-[10px] font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1">
                Safety (GI)
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {Object.entries(custSafe)
                  .filter(([, v]) => v != null)
                  .map(([k, v]) => (
                    <span key={k}>
                      <span className="text-zinc-500">{k.replace(/_/g, ' ')}: </span>
                      <span className="text-zinc-800 dark:text-zinc-200">{String(v)}</span>
                    </span>
                  ))}
              </div>
            </div>
          )}
          {e.nct ? (
            <a
              href={`https://clinicaltrials.gov/study/${String(e.nct)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 underline decoration-dotted underline-offset-4"
            >
              {String(e.nct)}
              <ExternalLink className="w-3 h-3" />
            </a>
          ) : null}
        </div>
      ),
    };
  });
  return { columns, rows };
}

/** Profile-driven variant: columns + cell extraction come entirely from the
 *  ETLM's presentation_profile (curated per indication). Falls back to
 *  buildTherapiesTable when no profile exists. */
function buildTherapiesTableFromProfile(
  therapies: unknown[],
  profile: PresentationProfile,
  anchorAssets: string[],
): { columns: Column[]; rows: Row[] } {
  const columns = profileColumns(profile);
  const rows: Row[] = therapies.map((entry, i) => {
    const e = isObj(entry) ? entry : {};
    const resolved = resolveEntry(profile, e);
    const cav = entryCaveat(profile, e);
    const assetStr = String(e.brand ?? e.drug_name ?? e.asset_name ?? '—');
    const isAnchor = anchorAssets.some(
      (a) => assetStr.toLowerCase().includes(a) || String(e.drug_name ?? '').toLowerCase().includes(a),
    );
    const cells: Record<string, React.ReactNode> = {};
    const sortValues: Record<string, string | number> = {};
    for (const c of profile.headline_table?.columns ?? []) {
      const r = resolved[c.key];
      sortValues[c.key] = r?.sort ?? '';
      // Attach the caveat tag to the first (asset) column.
      cells[c.key] =
        c === profile.headline_table?.columns[0] && cav ? (
          <span>
            {r?.display}
            <span
              className="ml-1.5 text-[10px] uppercase tracking-wider text-amber-600 dark:text-amber-400"
              title={cav.why}
            >
              {cav.tag}
            </span>
          </span>
        ) : (
          r?.display ?? '—'
        );
    }
    const custEff = isObj(e.custom_efficacy) ? e.custom_efficacy : {};
    const custSafe = isObj(e.custom_safety) ? e.custom_safety : {};
    return {
      id: String(i),
      isAnchor,
      cells,
      sortValues,
      detail: (
        <div className="space-y-2 text-[13px] text-zinc-600 dark:text-zinc-400">
          {e.drug_name && e.brand ? (
            <div>
              <span className="text-zinc-500">Generic: </span>
              {String(e.drug_name)}
            </div>
          ) : null}
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {e.modality ? (
              <span>
                <span className="text-zinc-500">Modality: </span>
                {String(e.modality)}
              </span>
            ) : null}
            {e.ema_approval_date ? (
              <span>
                <span className="text-zinc-500">EMA: </span>
                {String(e.ema_approval_date)}
              </span>
            ) : null}
            {e.trial ? (
              <span>
                <span className="text-zinc-500">Trial: </span>
                {String(e.trial)}
              </span>
            ) : null}
          </div>
          {Object.keys(custEff).filter((k) => custEff[k] != null).length > 0 && (
            <div>
              <div className="text-[10px] font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1">
                Efficacy
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {Object.entries(custEff)
                  .filter(([, v]) => v != null)
                  .map(([k, v]) => (
                    <span key={k}>
                      <span className="text-zinc-500">{k.replace(/_/g, ' ')}: </span>
                      <span className="text-zinc-800 dark:text-zinc-200">{String(v)}</span>
                    </span>
                  ))}
              </div>
            </div>
          )}
          {Object.keys(custSafe).filter((k) => custSafe[k] != null).length > 0 && (
            <div>
              <div className="text-[10px] font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1">
                Safety
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {Object.entries(custSafe)
                  .filter(([, v]) => v != null)
                  .map(([k, v]) => (
                    <span key={k}>
                      <span className="text-zinc-500">{k.replace(/_/g, ' ')}: </span>
                      <span className="text-zinc-800 dark:text-zinc-200">{String(v)}</span>
                    </span>
                  ))}
              </div>
            </div>
          )}
          {e.nct ? (
            <a
              href={`https://clinicaltrials.gov/study/${String(e.nct)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 underline decoration-dotted underline-offset-4"
            >
              {String(e.nct)}
              <ExternalLink className="w-3 h-3" />
            </a>
          ) : null}
        </div>
      ),
    };
  });
  return { columns, rows };
}

type UnmetNeedCard = { need: string; severity?: Severity; note?: string };

/** Surface the top unmet needs with their reasoning. Handles BOTH shapes the
 *  corpus uses: structured objects (need/severity/patient_fraction) and the
 *  free-text "Need title — reasoning" strings (obesity et al.). String-form
 *  needs carry no clinical severity, so we render no severity tag rather than
 *  inventing one, and keep their authored (priority) order. */
function topUnmetNeeds(etlm: Record<string, unknown>): UnmetNeedCard[] {
  const needs = Array.isArray(etlm.unmet_needs) ? etlm.unmet_needs : [];
  const cards: UnmetNeedCard[] = needs
    .map((u): UnmetNeedCard | null => {
      if (isObj(u)) {
        return {
          need: String(u.need ?? '—'),
          severity: SEVERITY_MAP[String(u.severity ?? '').toLowerCase()] ?? 'Medium',
          note: u.patient_fraction ? String(u.patient_fraction) : undefined,
        };
      }
      if (typeof u === 'string') {
        const [head, ...rest] = u.split(/\s+[—–]\s+/); // em/en-dash separates title from reasoning
        return { need: head.trim(), note: rest.join(' — ').trim() || undefined };
      }
      return null;
    })
    .filter((c): c is UnmetNeedCard => Boolean(c));
  // Severity-ranked where known; unranked (string-form) keep authored order after.
  return cards
    .map((c, i) => ({ c, rank: c.severity ? SEVERITY_RANK[c.severity] : 90 + i }))
    .sort((a, b) => a.rank - b.rank)
    .slice(0, 3)
    .map((x) => x.c);
}

export function AtlasReaderETLM() {
  const { indication } = useParams<{ indication: string }>();
  const etlm = indication ? getETLM(indication) : undefined;
  const meta = etlmIndex.find((e) => e.indication_code === indication);

  if (!etlm || !meta || !indication) {
    return (
      <ProjectPageLayout title="ETLM not found" backTo="/atlas-reader" backLabel="Back to Atlas Reader">
        <p className="text-zinc-600 dark:text-zinc-400">
          No ETLM exists in this preview for indication code <code>{indication}</code>.
        </p>
      </ProjectPageLayout>
    );
  }

  const summary = getEtlmSummary(indication);
  const keyFacts = buildKeyFacts(etlm);
  // Headline table = current/novel agents only. The TBWL% / nausea% endpoints
  // are only meaningful for the incretin-era agents; legacy (pre-incretin)
  // agents are surfaced as a collapsed, low-granularity block below.
  const profile = getProfile(etlm);
  const novelList = Array.isArray(etlm.approved_therapies_novel)
    ? etlm.approved_therapies_novel
    : null;
  const legacyList = Array.isArray(etlm.approved_therapies_legacy)
    ? etlm.approved_therapies_legacy
    : [];
  const flatList = Array.isArray(etlm.approved_therapies) ? etlm.approved_therapies : [];
  // A curated profile names the headline source; else default to novel.
  const profileSource = profile?.headline_table?.source;
  const headlineTherapies =
    profileSource && Array.isArray(etlm[profileSource])
      ? (etlm[profileSource] as unknown[])
      : novelList ?? (flatList.length ? flatList : legacyList);
  const showLegacyBlock = Boolean(novelList) && legacyList.length > 0;
  // Public summary = the SOURCED benchmark grid for the top assets (the credibility
  // proof) + unmet-need reasoning. What stays paid is the so-what: competitive
  // positioning, the full pipeline read, and the deep landscape report.
  const TOP_N = 10;
  const topTherapies = headlineTherapies.slice(0, TOP_N);
  const table = withSourceColumn(
    profile?.headline_table
      ? buildTherapiesTableFromProfile(topTherapies, profile, summary?.anchorAssets ?? [])
      : buildTherapiesTable(topTherapies, summary?.anchorAssets ?? [], String(etlm.therapeutic_area ?? '')),
    topTherapies,
  );
  const needs = topUnmetNeeds(etlm);
  const epi = isObj(etlm.epidemiology) ? etlm.epidemiology : {};
  const segments = Array.isArray((epi as any).key_genomic_segments)
    ? ((epi as any).key_genomic_segments as unknown[]).map(String)
    : [];
  const pipelineCount = Array.isArray(etlm.pipeline_assets) ? etlm.pipeline_assets.length : 0;
  const reportBase = `/atlas-reader/etlm/${indication}/report`;
  const verdict =
    summary?.verdict ??
    `${meta.indication}: ${(novelList ? novelList.length + legacyList.length : headlineTherapies.length)} approved therapies and ${pipelineCount} pipeline assets tracked across this landscape.`;

  return (
    <ProjectPageLayout
      title={meta.indication}
      subtitle="Emerging Therapeutic Landscape Map"
      backTo="/atlas-reader"
      backLabel="Back to Atlas Reader"
      containerClassName="max-w-5xl mx-auto px-6"
    >
      <ArtifactHeader
        type="ETLM"
        updated={etlm.last_updated ? String(etlm.last_updated) : undefined}
        verdict={verdict}
        pills={meta.subtitle ? <Pill variant="tech">{meta.subtitle}</Pill> : null}
      />

      <Link
        to={reportBase}
        className="group flex items-center justify-between rounded-xl ring-1 ring-zinc-900/80 dark:ring-zinc-100/30 bg-zinc-900 dark:bg-white/10 text-zinc-50 dark:text-zinc-100 px-5 py-3.5 mb-10 hover:bg-zinc-800 dark:hover:bg-white/15 transition-colors"
      >
        <span className="flex items-center gap-2.5 text-sm font-medium">
          <Layers className="w-4 h-4" />
          Open the full landscape map — full pipeline read, mechanisms, competitive positioning & regulatory
        </span>
        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
      </Link>

      {keyFacts.length > 0 && <KeyFactsStrip facts={keyFacts} />}

      {/* Approved therapies — the standard-of-care anchor */}
      {table.rows.length > 0 && (
        <section className="mb-10">
          <div className="flex items-end justify-between mb-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Approved therapies — the standard-of-care anchor
            </h2>
            <Link
              to={reportBase}
              className="text-xs text-indigo-600 dark:text-indigo-400 underline decoration-dotted underline-offset-4"
            >
              Full landscape →
            </Link>
          </div>
          <DataTable columns={table.columns} rows={table.rows} />
          <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">
            Sort any column; click a row for full efficacy, safety & trial detail. The Source column
            links each asset to ClinicalTrials.gov / its pivotal publication. Highlighted rows are
            standard-of-care anchors.
          </p>
        </section>
      )}

      {/* Legacy / pre-incretin agents — collapsed, class-level only */}
      {showLegacyBlock && (
        <section className="mb-10">
          <Collapsible
            title={`Legacy / pre-incretin agents (${legacyList.length}) — displaced by GLP-1/incretins`}
          >
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3 max-w-[72ch] leading-relaxed">
              Pre-incretin oral agents. Efficacy ceiling ~3–8% total body-weight loss versus
              15–23% for the incretin class — commercially displaced. Retained relevance: low-cost
              generics, payer step-therapy, and contraindication / adolescent niches.
            </p>
            <ul className="text-xs">
              {legacyList.filter(isObj).map((a, i) => {
                const ce = isObj(a.custom_efficacy) ? a.custom_efficacy : {};
                const tb = tbwlOf(ce);
                const modShort = String(a.modality ?? '').replace(/\s*\(.*$/, '');
                return (
                  <li
                    key={i}
                    className="flex justify-between gap-3 border-b border-zinc-100 dark:border-white/5 py-1.5"
                  >
                    <span className="text-zinc-700 dark:text-zinc-300">
                      {String(a.brand ?? a.drug_name ?? '—')}
                      {modShort ? (
                        <span className="text-zinc-400 dark:text-zinc-500"> · {modShort}</span>
                      ) : null}
                    </span>
                    <span className="tabular-nums text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                      {tb != null ? `${tb}% TBWL` : '—'}
                    </span>
                  </li>
                );
              })}
            </ul>
          </Collapsible>
        </section>
      )}

      {/* Genomic / clinical segments */}
      {segments.length > 0 && (
        <section className="mb-10">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">
            Key segments
          </h2>
          <ul className="space-y-1.5 max-w-[72ch] mb-3">
            {segments.slice(0, 5).map((s, i) => (
              <li key={i} className="flex gap-2 text-[15px] text-zinc-700 dark:text-zinc-300">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500 flex-shrink-0" />
                {s}
              </li>
            ))}
          </ul>
          {segments.length > 5 && (
            <Collapsible title={`Show all ${segments.length} segments`}>
              <ul className="space-y-1.5 max-w-[72ch]">
                {segments.slice(5).map((s, i) => (
                  <li key={i} className="flex gap-2 text-[15px] text-zinc-700 dark:text-zinc-300">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500 flex-shrink-0" />
                    {s}
                  </li>
                ))}
              </ul>
            </Collapsible>
          )}
        </section>
      )}

      {/* Top unmet needs */}
      {needs.length > 0 && (
        <section className="mb-10">
          <div className="flex items-end justify-between mb-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Top unmet needs
            </h2>
            <Link
              to={reportBase}
              className="text-xs text-indigo-600 dark:text-indigo-400 underline decoration-dotted underline-offset-4"
            >
              All unmet needs →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {needs.map((need, i) => (
              <div
                key={i}
                className="rounded-xl ring-1 ring-zinc-200 dark:ring-white/10 bg-white/60 dark:bg-white/5 p-4 flex flex-col gap-2"
              >
                {need.severity && <SeverityTag severity={need.severity} />}
                <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 leading-snug">
                  {need.need}
                </div>
                {need.note && (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed line-clamp-5">
                    {need.note}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <DetailHook context={`${meta.indication} landscape map`} />
    </ProjectPageLayout>
  );
}

export default AtlasReaderETLM;
