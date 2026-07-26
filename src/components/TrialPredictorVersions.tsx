import { useState } from 'react';
import { Archive } from 'lucide-react';
import { Pill } from './Pill';

/**
 * Version history for the trial duration predictor.
 *
 * The v1 block is deliberately candid: the model shipped for months scoring
 * WORSE than a median lookup table, and saying so is the point of the section.
 * A portfolio piece that only shows the good version teaches nothing about how
 * the good version was arrived at.
 */

type Row = { label: string; v1: string; now: string; better: boolean };

const HEADLINE: Row[] = [
  { label: 'Phase 2 error (MAE)', v1: '25.4 mo', now: '7.1 mo', better: true },
  { label: 'Phase 3 error (MAE)', v1: '26.9 mo', now: '6.9 mo', better: true },
  { label: 'Skill vs median lookup, P2', v1: '−1.87 (worse)', now: '+0.23', better: true },
  { label: '80% interval coverage, P2', v1: '0.08', now: '0.84', better: true },
  { label: 'Distinct answers across 22 areas, P3', v1: '9', now: '20', better: true },
];

const FIXES = [
  {
    title: 'A target leak',
    body:
      '`primary_completion_year` was a feature — but it is the label\'s own endpoint. ' +
      'Removing that single column took Phase 2 error from 25.4 to 8.9 months.',
  },
  {
    title: 'A feature that meant two different things',
    body:
      '`site_count` counted COUNTRIES during training but received real site counts at ' +
      'prediction time. The model was trained on 1–20 and served at 40+ — outside its ' +
      'range, where a forest returns a constant, which is why every therapeutic area ' +
      'collapsed onto the same answer.',
  },
  {
    title: 'One target hiding two processes',
    body:
      'Duration fuses recruiting with follow-up. Split apart they are near-independent ' +
      '(r = +0.03), and the split reverses the read: Phase 3 oncology recruits FASTEST ' +
      'of any area at 9.6 months, and runs long only because it then follows patients ' +
      'for 21.',
  },
  {
    title: 'Survivorship bias in the source data',
    body:
      'The registry only shows completed trials, so recent history skews fast. Measured ' +
      'from a 2018 vantage, Phase 3 duration looked 20.9 months when it was truly 24.6. ' +
      'Corrected by weighting the training set against the censoring distribution.',
  },
  {
    title: 'An interval that said nothing',
    body:
      'The old 80% band was pinned near ±6 months for every input and contained 8% of ' +
      'actuals on Phase 2. Replaced with real quantile models, calibrated to 0.82–0.89.',
  },
];

const NOT_SHIPPED = [
  {
    title: 'Country recruitment rankings',
    body:
      'Not identifiable from registry data. A multi-country trial reports ONE enrolment ' +
      'window shared by every participating country, and countries split sharply on ' +
      'whether they ever run a domestic-only trial — 43.6% of US appearances against ' +
      '0.8% for Eastern Europe. A model fitted anyway ranked the US fastest, which is ' +
      'wrong, and it was learning trial-portfolio mix rather than recruitment speed.',
  },
  {
    title: 'Eligibility-text features',
    body:
      'Built and measured; no consistent gain, every difference within noise. The ' +
      'feature set had reached its ceiling.',
  },
];

export function TrialPredictorVersions() {
  const [showArchive, setShowArchive] = useState(false);

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-zinc-100 uppercase tracking-wide">
          What changed
        </h2>
        <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed max-w-2xl">
          v1 shipped and looked plausible. Scored honestly against a per-therapeutic-area
          median lookup, it was <strong>2.9× worse than the lookup</strong> — nobody knew,
          because no baseline had ever been recorded. v2 and v3 rebuilt it around a
          measurement harness where nothing ships without beating that bar.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-zinc-700">
                <th className="text-left py-2 pr-4 font-medium text-slate-500 dark:text-zinc-500 text-xs uppercase tracking-wide">
                  Measure
                </th>
                <th className="text-right py-2 px-3 font-medium text-slate-500 dark:text-zinc-500 text-xs uppercase tracking-wide">
                  v1
                </th>
                <th className="text-right py-2 pl-3 font-medium text-slate-500 dark:text-zinc-500 text-xs uppercase tracking-wide">
                  v3 (live)
                </th>
              </tr>
            </thead>
            <tbody>
              {HEADLINE.map(r => (
                <tr key={r.label} className="border-b border-slate-100 dark:border-zinc-800">
                  <td className="py-2 pr-4 text-slate-700 dark:text-zinc-300">{r.label}</td>
                  <td className="py-2 px-3 text-right tabular-nums text-slate-400 dark:text-zinc-500">
                    {r.v1}
                  </td>
                  <td className="py-2 pl-3 text-right tabular-nums font-semibold text-emerald-700 dark:text-emerald-400">
                    {r.now}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-slate-500 dark:text-zinc-500">
          Temporal holdout — trained on trials starting before 2021, tested on those
          starting after. On 2,039 real held-out trials the rebuild cut mean error from
          7.18 to 5.91 months and was closer on 61.5% of them.
        </p>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-zinc-100 uppercase tracking-wide">
          Five defects behind the gap
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {FIXES.map(f => (
            <div
              key={f.title}
              className="rounded-xl ring-1 ring-slate-200/80 dark:ring-white/10 bg-slate-50/60 dark:bg-zinc-800/40 p-4 space-y-1.5"
            >
              <h3 className="text-xs font-semibold text-slate-900 dark:text-zinc-100">
                {f.title}
              </h3>
              <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-zinc-100 uppercase tracking-wide">
          Built, measured, not shipped
        </h2>
        <p className="text-sm text-slate-600 dark:text-zinc-400 max-w-2xl">
          Two planned features were built and then disabled on the evidence. Recording
          them is part of the method — the harness is only worth having if it is allowed
          to say no.
        </p>
        <div className="space-y-3">
          {NOT_SHIPPED.map(n => (
            <div
              key={n.title}
              className="rounded-xl ring-1 ring-amber-200/60 dark:ring-amber-500/20 bg-amber-50/50 dark:bg-amber-500/5 p-4 space-y-1.5"
            >
              <h3 className="text-xs font-semibold text-slate-900 dark:text-zinc-100">
                {n.title}
              </h3>
              <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">{n.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Archived v1 */}
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
              Archived Version — per-phase random forest (v1)
            </h2>
            <button
              onClick={() => setShowArchive(false)}
              className="text-xs text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200 transition-colors"
            >
              Hide
            </button>
          </div>
          <div className="rounded-2xl ring-1 ring-slate-200/80 dark:ring-white/10 bg-slate-50/80 dark:bg-zinc-800/50 p-6 space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-500 dark:text-zinc-400 px-2 py-0.5 bg-slate-100 dark:bg-zinc-700 rounded-full">
                2024–25
              </span>
              <Pill variant="tech">Archived</Pill>
              <Pill variant="tech">RandomForest</Pill>
              <Pill variant="tech">scikit-learn</Pill>
            </div>
            <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
              One random forest per phase over ClinicalTrials.gov, trained on a random
              split with RMSE as the only metric and no baseline to compare against.
              Uncertainty was a normal approximation around that RMSE. It was a
              reasonable first cut, and it was serving predictions that clustered so
              tightly by therapeutic area that 17 of 22 Phase 1 areas returned the
              identical 10.9 months.
            </p>
            <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
              Kept here because the interesting part of the project is the gap between
              a model that looks fine and one that has been measured. The tag{' '}
              <code className="text-xs px-1 py-0.5 rounded bg-slate-100 dark:bg-zinc-700">
                v1.0-baseline
              </code>{' '}
              remains in the repository as the revert point.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default TrialPredictorVersions;
