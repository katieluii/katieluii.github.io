import { useState } from 'react';
import { Archive, FileText } from 'lucide-react';
import { getProjectBySlug } from '../data/projects';
import { Pill } from './Pill';

/**
 * Validation record for the trial duration predictor, plus the archived v1 page.
 *
 * Page slimmed 2026-08-31 on Katie's direction: the version-by-version narrative,
 * v4 change notes, methodological note and limitations table were removed from the
 * page. The full record of what each version was (v1 to v5, where v4 was previously
 * labelled v3.1) is archived in the model repo:
 * recruitment_rate_app/docs/VERSION_HISTORY.md. Do not re-derive it from git.
 *
 * Every figure is regenerated from recruitment_rate_app/experiments/published_metrics.json;
 * the ledger row beside each result is the source of truth and links to the public ledger.
 *
 * One results table, one fold (train <2018, test 2018–2020 starts), every version refit and
 * scored on it. The old iteration benchmark (train <2021, test 2021+) is archived in
 * docs/VERSION_HISTORY.md and no longer shown.
 */


/**
 * Results on ONE held-out fold (train <2018, test 2018–2020 starts). Every version's recipe
 * is refit on today's full corpus and scored on the same fold, so the rows are comparable:
 * an ML results table, not a changelog. Regenerated from published_metrics.json["versions"];
 * ledger rows link to the public ledger. v4 was labelled v3.1 until 2026-08-31.
 */
type Cell = { mae: string; r2: string; row: number };
type PhaseKey = 'P1HV' | 'P1' | 'P2' | 'P3';
type VersionRow = { label: string; desc: string; live?: boolean; cells: Record<PhaseKey, Cell> };

const PHASES: { key: PhaseKey; label: string }[] = [
  { key: 'P1HV', label: 'Phase 1 HV' },
  { key: 'P1', label: 'Phase 1' },
  { key: 'P2', label: 'Phase 2' },
  { key: 'P3', label: 'Phase 3' },
];

const RESULTS: VersionRow[] = [
  { label: 'Baseline', desc: 'per-therapeutic-area median lookup', cells: {
    P1HV: { mae: '4.47', r2: '−0.172', row: 401 }, P1: { mae: '11.96', r2: '0.214', row: 402 },
    P2: { mae: '12.20', r2: '0.068', row: 403 }, P3: { mae: '12.96', r2: '−0.009', row: 404 } } },
  { label: 'Model', desc: 'random-forest point estimate with a conformal band; recruiting/follow-up split from a two-stage model', live: true, cells: {
    P1HV: { mae: '3.16', r2: '0.452', row: 0 }, P1: { mae: '7.80', r2: '0.668', row: 0 },
    P2: { mae: '9.70', r2: '0.456', row: 0 }, P3: { mae: '9.90', r2: '0.467', row: 0 } } },
];

const num = (s: string) => parseFloat(s.replace('−', '-'));
/** Best value per column (lowest MAE, highest R²), for the bold convention. */
const BEST = Object.fromEntries(
  PHASES.map(({ key }) => [key, {
    mae: Math.min(...RESULTS.map(r => num(r.cells[key].mae))),
    r2: Math.max(...RESULTS.map(r => num(r.cells[key].r2))),
  }]),
) as Record<PhaseKey, { mae: number; r2: number }>;

/**
 * Separate record-history recruitment-rate model. Values mirror the validated
 * P1/P2/P3 artifacts; P1HV has no released rate head.
 */
type SimpleRateRow = { phase: string; training: string; factorError: string; coverage: string };

const RATE_ROWS: SimpleRateRow[] = [
  { phase: 'Phase 1', training: '1,107', factorError: '1.54×', coverage: '81.8%' },
  { phase: 'Phase 2', training: '1,280', factorError: '1.55×', coverage: '88.4%' },
  { phase: 'Phase 3', training: '1,248', factorError: '1.59×', coverage: '82.9%' },
];

const thBase =
  'py-2 px-2 font-medium text-slate-500 dark:text-zinc-500 text-xs uppercase tracking-wide';

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-base font-semibold text-slate-900 dark:text-zinc-100">{children}</h2>
  );
}

function ArchivedTrialPredictorV1() {
  const p = getProjectBySlug('trial-recruitment-prediction-v1');
  if (!p) return null;

  return (
    <div className="rounded-2xl ring-1 ring-slate-200/80 dark:ring-white/10 bg-slate-50/80 dark:bg-zinc-800/50 p-6 space-y-6">
      <div className="space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-500 dark:text-zinc-400 px-2 py-0.5 bg-slate-100 dark:bg-zinc-700 rounded-full">
            {p.yearStart}–{p.yearEnd.toString().slice(2)}
          </span>
          <Pill variant="tech">Archived</Pill>
          {p.themes.map(t => (
            <Pill key={t} variant="tech">
              {t}
            </Pill>
          ))}
        </div>
        <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
          {p.longDescription || p.summary}
        </p>
      </div>

      {p.sections?.map((section, idx) => (
        <div key={idx} className="space-y-3">
          <h3 className="text-xs font-semibold text-slate-900 dark:text-zinc-100 uppercase tracking-widest">
            {section.title}
          </h3>
          {section.bullets && (
            <ul className="space-y-1.5">
              {section.bullets.map((b, i) => (
                <li key={i} className="flex gap-2 text-xs text-slate-600 dark:text-zinc-400">
                  <span className="text-slate-300 dark:text-zinc-600 shrink-0">•</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          )}
          {section.images?.map((img, imgIdx) => (
            <div
              key={imgIdx}
              className="bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg p-4"
            >
              <a href={img.src} target="_blank" rel="noopener noreferrer" className="block">
                <img src={img.src} alt={img.alt} className="w-full h-auto rounded" />
              </a>
              {img.caption && (
                <p className="mt-2 text-xs text-slate-500 dark:text-zinc-400 text-center">
                  {img.caption}
                </p>
              )}
            </div>
          ))}
        </div>
      ))}

      {p.links.pdf && (
        <a
          href={p.links.pdf}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg hover:bg-slate-800 dark:hover:bg-zinc-200 transition-colors text-sm"
        >
          <FileText className="w-4 h-4" />
          Read report (PDF)
        </a>
      )}
    </div>
  );
}

export function TrialPredictorVersions() {
  const [showArchive, setShowArchive] = useState(false);

  return (
    <div className="space-y-12 text-[15px]">
      {/* Results: one held-out fold, every version */}
      <section id="results" className="space-y-4">
        <div className="space-y-1.5">
          <SectionHeading>Results</SectionHeading>
          <p className="text-sm text-slate-600 dark:text-zinc-400 leading-6">
            Use these numbers when describing model performance. Both rows are scored on the same
            held-out fold: trained on trials starting before 2018, tested on 2018–2020 starts,
            trials that have had five to eight years to finish, so long-duration trials are
            present. Bold marks the better value in each column.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-zinc-700">
                <th rowSpan={2} className={`${thBase} text-left pl-0 pr-4 align-bottom`}>Model</th>
                {PHASES.map(ph => (
                  <th key={ph.key} colSpan={2} className={`${thBase} text-center border-l border-slate-100 dark:border-zinc-800`}>
                    {ph.label}
                  </th>
                ))}
              </tr>
              <tr className="border-b border-slate-200 dark:border-zinc-700">
                {PHASES.flatMap(ph => [
                  <th key={`${ph.key}-mae`} className="py-1 px-2 text-right text-[11px] font-normal text-slate-400 dark:text-zinc-500 border-l border-slate-100 dark:border-zinc-800">MAE (mo)</th>,
                  <th key={`${ph.key}-r2`} className="py-1 px-2 text-right text-[11px] font-normal text-slate-400 dark:text-zinc-500">R²</th>,
                ])}
              </tr>
            </thead>
            <tbody>
              {RESULTS.map(r => (
                <tr key={r.label} className="border-b border-slate-100 dark:border-zinc-800">
                  <td className="py-2 pl-0 pr-4 align-top">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-900 dark:text-zinc-100">{r.label}</span>
                      {r.live && (
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400 border border-emerald-600/40 dark:border-emerald-400/40 rounded px-1 py-px">
                          Live
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-zinc-500">{r.desc}</div>
                  </td>
                  {PHASES.flatMap(ph => {
                    const c = r.cells[ph.key];
                    const bestMae = num(c.mae) === BEST[ph.key].mae;
                    const bestR2 = num(c.r2) === BEST[ph.key].r2;
                    const on = 'font-semibold text-slate-900 dark:text-zinc-100';
                    const off = 'text-slate-600 dark:text-zinc-400';
                    return [
                      <td key={`${ph.key}-mae`} className={`py-2 px-2 text-right tabular-nums align-top border-l border-slate-100 dark:border-zinc-800 ${bestMae ? on : off}`}>{c.mae}</td>,
                      <td key={`${ph.key}-r2`} className={`py-2 px-2 text-right tabular-nums align-top ${bestR2 ? on : off}`}>{c.r2}</td>,
                    ];
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-slate-500 dark:text-zinc-500 leading-5">
          MAE is the mean absolute error: the average size of the gap between the predicted and
          the actual trial duration, in months, ignoring direction. A Phase 3 MAE of 9.9 months
          means the estimate is typically about ten months out, in either direction. R² (R-squared)
          is the share of the variation in trial durations that the model accounts for, on a scale
          where 0 means no better than guessing the average and 1 means every trial predicted
          exactly; a Phase 1 R² of 0.67 means about two-thirds of the spread between fast and slow
          trials is captured. The model's 80% prediction interval covers 0.78 to 0.80 of actual
          outcomes on this fold. Earlier versions and how they compare are recorded in the model
          repo's version history.
        </p>
      </section>

      {/* Recruitment-rate estimate */}
      <section className="space-y-4">
        <div className="space-y-1">
          <SectionHeading>Separate recruitment-rate model</SectionHeading>
          <p className="text-xs text-slate-500 dark:text-zinc-500">
            Estimated in patients per centre per month from completed-trial record histories.
          </p>
        </div>
        <p className="text-sm text-slate-600 dark:text-zinc-400 leading-6">
          This estimate is independent of the duration model. It uses final actual enrolment,
          initiated centres and the interval during which the trial was recorded as recruiting.
          Phase 1 healthy-volunteer trials do not yet have a released rate model.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse table-fixed">
            <thead>
              <tr className="border-b border-slate-200 dark:border-zinc-700">
                <th className={`${thBase} text-left pl-0 pr-4 w-[28%]`}>Phase</th>
                <th className={`${thBase} text-right w-[24%]`}>Training trials</th>
                <th className={`${thBase} text-right w-[24%]`}>Median factor error</th>
                <th className={`${thBase} text-right w-[24%]`}>80% interval coverage</th>
              </tr>
            </thead>
            <tbody>
              {RATE_ROWS.map(r => (
                <tr key={r.phase} className="border-b border-slate-100 dark:border-zinc-800">
                  <td className="py-2 pl-0 pr-4 text-slate-700 dark:text-zinc-300">{r.phase}</td>
                  <td className="py-2 px-2 text-right tabular-nums text-slate-900 dark:text-zinc-100">{r.training}</td>
                  <td className="py-2 px-2 text-right tabular-nums text-slate-900 dark:text-zinc-100">{r.factorError}</td>
                  <td className="py-2 px-2 text-right tabular-nums text-slate-600 dark:text-zinc-400">{r.coverage}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-slate-500 dark:text-zinc-500 leading-5">
          Validation trains on starts before 2021 and tests 2021–2022 starts. Listed centres are
          treated as active throughout the recorded recruiting interval, so the result is a
          planning estimate rather than observed performance for each centre.
        </p>
      </section>

      {/* Archived v1: full page behind the toggle, matching the n8n pattern */}
      {!showArchive ? (
        <button
          onClick={() => setShowArchive(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:border-slate-300 dark:hover:border-zinc-600 transition-colors"
        >
          <Archive className="w-4 h-4" />
          View archived version (v1, per-phase random forest)
        </button>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
              Archived version: ML-driven Trial Recruitment Prediction (v1)
            </h2>
            <button
              onClick={() => setShowArchive(false)}
              className="text-xs text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200 transition-colors"
            >
              Hide
            </button>
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            The first iteration was a per-phase random forest scored on a single random split.
            It was replaced by the current two-stage model, which separates recruiting time from
            follow-up and carries a calibrated interval.
          </p>
          <ArchivedTrialPredictorV1 />
        </div>
      )}
    </div>
  );
}

export default TrialPredictorVersions;
