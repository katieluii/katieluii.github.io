import { useState } from 'react';
import { Archive, FileText } from 'lucide-react';
import { getProjectBySlug } from '../data/projects';
import { Pill } from './Pill';

/**
 * Version history for the trial duration predictor, plus the archived v1 page.
 *
 * The archive block mirrors ArchivedDigestAgents on the Clinical Development
 * Monitoring Agent card: the superseded version is its own project entry and is
 * rendered in full behind a toggle, rather than summarised.
 */

type Row = { label: string; v1: string; v2: string; v3: string; v31: string };

const ROWS: Row[] = [
  { label: 'Phase 1 HV — R²', v1: '0.420', v2: '0.371', v3: '0.368', v31: '0.370' },
  { label: 'Phase 1 — R²', v1: '0.454', v2: '0.511', v3: '0.517', v31: '0.555' },
  { label: 'Phase 2 — R²', v1: '0.193', v2: '0.330', v3: '0.343', v31: '0.345' },
  { label: 'Phase 3 — R²', v1: '0.127', v2: '0.337', v3: '0.345', v31: '0.372' },
  { label: 'Phase 1 HV — MAE (months)', v1: '2.87', v2: '2.66', v3: '2.64', v31: '2.67' },
  { label: 'Phase 1 — MAE (months)', v1: '5.96', v2: '5.35', v3: '5.25', v31: '5.00' },
  { label: 'Phase 2 — MAE (months)', v1: '8.30', v2: '7.16', v3: '7.01', v31: '6.95' },
  { label: 'Phase 3 — MAE (months)', v1: '8.75', v2: '7.06', v3: '6.99', v31: '6.71' },
  { label: 'Phase 1 HV — RMSE (days)', v1: '134', v2: '140', v3: '140', v31: '140' },
  { label: 'Phase 1 — RMSE (days)', v1: '250', v2: '237', v3: '235', v31: '226' },
  { label: 'Phase 2 — RMSE (days)', v1: '311', v2: '284', v3: '281', v31: '280' },
  { label: 'Phase 3 — RMSE (days)', v1: '328', v2: '286', v3: '284', v31: '278' },
];

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
                  <span className="text-slate-300 dark:text-zinc-600 shrink-0">·</span>
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

      {p.tags.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-slate-900 dark:text-zinc-100 uppercase tracking-widest">
            Technologies
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {p.tags.map(tag => (
              <Pill key={tag} variant="tech">
                {tag}
              </Pill>
            ))}
          </div>
        </div>
      )}

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
    <div className="space-y-8">
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-zinc-100 uppercase tracking-wide">
          What changed
        </h2>
        <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed max-w-2xl">
          v1 shipped and looked plausible. Nobody had recorded a baseline, so nobody
          could tell it was losing to one: scored honestly, it was 2.9× worse than
          simply looking up the median duration for that therapeutic area. It also
          carried a target leak, using the completion year of the very trial it was
          predicting. The figures below show the v1 approach with that leak removed,
          which flatters it; as deployed it was far worse.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse table-fixed">
            <thead>
              <tr className="border-b border-slate-200 dark:border-zinc-700">
                <th className="text-left py-1.5 pr-4 font-medium text-slate-500 dark:text-zinc-500 text-xs uppercase tracking-wide w-[40%]">
                  Measure
                </th>
                <th className="text-right py-1.5 px-2 font-medium text-slate-500 dark:text-zinc-500 text-xs uppercase tracking-wide w-[15%]">
                  v1
                </th>
                <th className="text-right py-1.5 px-2 font-medium text-slate-500 dark:text-zinc-500 text-xs uppercase tracking-wide w-[15%]">
                  v2
                </th>
                <th className="text-right py-1.5 px-2 font-medium text-slate-500 dark:text-zinc-500 text-xs uppercase tracking-wide w-[15%]">
                  v3
                </th>
                <th className="text-right py-1.5 px-2 font-medium text-slate-500 dark:text-zinc-500 text-xs uppercase tracking-wide w-[15%] border-l border-slate-200 dark:border-zinc-700">
                  v3.1 (live)
                </th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map(r => (
                <tr key={r.label} className="border-b border-slate-100 dark:border-zinc-800">
                  <td className="py-1.5 pr-4 text-slate-700 dark:text-zinc-300">{r.label}</td>
                  <td className="py-1.5 px-2 text-right tabular-nums text-slate-400 dark:text-zinc-500">
                    {r.v1}
                  </td>
                  <td className="py-1.5 px-2 text-right tabular-nums text-slate-500 dark:text-zinc-500">
                    {r.v2}
                  </td>
                  <td className="py-1.5 px-2 text-right tabular-nums text-slate-600 dark:text-zinc-400">
                    {r.v3}
                  </td>
                  <td className="py-1.5 px-2 text-right tabular-nums font-semibold text-emerald-700 dark:text-emerald-400 border-l border-slate-100 dark:border-zinc-800">
                    {r.v31}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-slate-500 dark:text-zinc-500 max-w-2xl">
          Temporal holdout: trained on trials starting before 2021, tested on those
          starting after. All four columns share one test fold and one corpus, so they
          are directly comparable. For reference the
          per-therapeutic-area median baseline scores R² 0.003 on Phase 2 and −0.086 on
          Phase 3, roughly what predicting the average achieves. v2 replaced the model
          and its interval; v3 split duration into recruiting time and follow-up.
        </p>
        <p className="text-xs text-slate-500 dark:text-zinc-500 max-w-2xl">
          <strong className="text-slate-600 dark:text-zinc-400">v3.1 is the current
          production model.</strong> Three changes, no new architecture. An API cap of
          5,000 records had the model training on 2,024 of 17,092 eligible Phase 3
          trials; lifting it and tuning the hyperparameters lifted R² by about 0.10 on
          a like-for-like fold. Then the point estimate moved from the median to the
          mean: R² is minimised by the conditional mean, while a quantile head fits the
          median, so the loss was pulling against the metric. Switching it gained a
          further 0.038 on Phase 1 and 0.027 on Phase 3, and improved error on three of
          four phases. The prediction interval still comes from the quantile heads, so
          its calibration is unchanged.
        </p>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-zinc-100 uppercase tracking-wide">
          What this cannot tell you
        </h2>
        <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed max-w-2xl">
          The registry records when a trial started and when it hit its primary
          endpoint. It records nothing in between. The recruitment rate here is
          reconstructed rather than measured:
        </p>
        <div className="rounded-xl ring-1 ring-slate-200/80 dark:ring-white/10 bg-slate-50/60 dark:bg-zinc-800/40 p-4">
          <code className="text-xs text-slate-700 dark:text-zinc-300 block leading-relaxed">
            rate = enrolment ÷ (site count × recruiting months)
            <br />
            <span className="text-slate-400 dark:text-zinc-500">
              where recruiting months = (completion − start) − estimated follow-up
            </span>
          </code>
        </div>
        <ul className="space-y-2 max-w-2xl">
          {[
            ['Every site is treated as open for the whole window.',
             'Sites activate over months and the registry never says when, so a late-opening site counts the same as a day-one site.'],
            ['Recruitment is treated as uniform.',
             'Real accrual is S-shaped: slow start, ramp, long tail. The figure is an average across all of it.'],
            ['Follow-up is estimated, not stated.',
             'It is parsed from the primary endpoint time frame and imputed from the endpoint type for roughly half of trials.'],
            ['It is a trial-wide average, not a site rate.',
             'No individual site would recognise the number. Per-site enrolment is not published by ClinicalTrials.gov or AACT at all.'],
          ].map(([h, b]) => (
            <li key={h} className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
              <strong className="text-slate-900 dark:text-zinc-200">{h}</strong> {b}
            </li>
          ))}
        </ul>
        <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed max-w-2xl">
          The same gap caps accuracy. Lifting the training corpus fivefold and tuning
          the model raised R² by about 0.10 on Phases 2 and 3, to 0.34 and 0.36. Four
          further levers were tested and closed: more features, a different model
          class, per-indication models, and AACT as a second source. What decides
          whether a trial runs late is absent from a registry record: how many sites
          activate and when, which competing trials want the same patients, amendments
          mid-flight. Closing that gap needs CRO or CTMS data, or a commercial source
          such as Citeline. The limit is the data, not the model.
        </p>
      </div>

      {/* Archived v1: full page behind the toggle, matching the n8n pattern */}
      {!showArchive ? (
        <button
          onClick={() => setShowArchive(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:border-slate-300 dark:hover:border-zinc-600 transition-colors"
        >
          <Archive className="w-4 h-4" />
          View archived version (v1 — per-phase random forest)
        </button>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
              Archived Version — ML-driven Trial Recruitment Prediction (v1)
            </h2>
            <button
              onClick={() => setShowArchive(false)}
              className="text-xs text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200 transition-colors"
            >
              Hide
            </button>
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            The first iteration was a per-phase random forest scored on a single random
            split. It was replaced by the current two-stage model, which separates
            recruiting time from follow-up and carries a calibrated interval.
          </p>
          <ArchivedTrialPredictorV1 />
        </div>
      )}
    </div>
  );
}

export default TrialPredictorVersions;
