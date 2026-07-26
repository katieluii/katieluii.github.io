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

type Row = { label: string; v1: string; v2: string; v3: string };

const ROWS: Row[] = [
  { label: 'Phase 2 error (MAE)', v1: '25.4 mo', v2: '7.2 mo', v3: '7.1 mo' },
  { label: 'Phase 3 error (MAE)', v1: '26.9 mo', v2: '7.3 mo', v3: '7.1 mo' },
  { label: 'Skill vs median lookup, P2', v1: '−1.87', v2: '+0.21', v3: '+0.23' },
  { label: 'Skill vs median lookup, P3', v1: '−1.72', v2: '+0.27', v3: '+0.31' },
  { label: '80% interval coverage, P2', v1: '0.08', v2: '0.84', v3: '0.86' },
  { label: '80% interval coverage, P3', v1: '0.08', v2: '0.82', v3: '0.84' },
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
          v1 shipped and looked plausible. Scored against a per-therapeutic-area median
          lookup it was 2.9× worse than the lookup. Nobody knew, because no baseline had
          ever been recorded. v2 and v3 rebuilt it around a harness that scores every
          change against that bar before it ships.
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
                <th className="text-right py-2 px-3 font-medium text-slate-500 dark:text-zinc-500 text-xs uppercase tracking-wide">
                  v2
                </th>
                <th className="text-right py-2 pl-3 font-medium text-slate-500 dark:text-zinc-500 text-xs uppercase tracking-wide">
                  v3 (live)
                </th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map(r => (
                <tr key={r.label} className="border-b border-slate-100 dark:border-zinc-800">
                  <td className="py-2 pr-4 text-slate-700 dark:text-zinc-300">{r.label}</td>
                  <td className="py-2 px-3 text-right tabular-nums text-slate-400 dark:text-zinc-500">
                    {r.v1}
                  </td>
                  <td className="py-2 px-3 text-right tabular-nums text-slate-600 dark:text-zinc-400">
                    {r.v2}
                  </td>
                  <td className="py-2 pl-3 text-right tabular-nums font-semibold text-emerald-700 dark:text-emerald-400">
                    {r.v3}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-slate-500 dark:text-zinc-500 max-w-2xl">
          Temporal holdout: trained on trials starting before 2021, tested on those
          starting after. Skill is the share of the baseline's error removed, so a negative
          number is worse than the lookup. v2 replaced the model and the interval; v3 split
          duration into recruiting time and follow-up. On 2,039 real held-out trials the
          rebuild cut mean error from 7.18 to 5.91 months.
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
