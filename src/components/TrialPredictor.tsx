import { useEffect, useState } from 'react';

const API = 'https://web-production-e6859b.up.railway.app/api';

interface Phase { key: string; label: string; trained: boolean; }
interface PredictResult {
  phase_label: string;
  therapeutic_area: string;
  predicted_months: number;
  lower_months: number;
  upper_months: number;
  predicted_days: number;
  rmse_days: number;
  n_train: number;
}

async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

export function TrialPredictor() {
  const [phases, setPhases]   = useState<Phase[]>([]);
  const [areas, setAreas]     = useState<string[]>([]);
  const [phase, setPhase]     = useState('');
  const [ta, setTa]           = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState<PredictResult | null>(null);
  const [error, setError]     = useState('');

  useEffect(() => {
    Promise.all([apiFetch('/phases'), apiFetch('/therapeutic-areas')])
      .then(([p, a]) => { setPhases(p); setAreas(a); })
      .catch(() => setError('Could not reach the prediction backend.'));
  }, []);

  async function handlePredict() {
    if (!phase || !ta) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const r = await apiFetch('/predict', {
        method: 'POST',
        body: JSON.stringify({ phase, therapeutic_area: ta }),
      });
      setResult(r);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Prediction failed.');
    } finally {
      setLoading(false);
    }
  }

  const selectClass =
    'w-full rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 ' +
    'text-slate-900 dark:text-zinc-100 px-3 py-2 text-sm focus:outline-none ' +
    'focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400';

  const intervalPct = result
    ? ((result.predicted_months - result.lower_months) / (result.upper_months - result.lower_months)) * 100
    : 50;

  return (
    <div className="space-y-6">
      {/* Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-600 dark:text-zinc-400 uppercase tracking-wide">
            Trial Phase
          </label>
          <select className={selectClass} value={phase} onChange={e => setPhase(e.target.value)}>
            <option value="" disabled>Select a phase…</option>
            {phases.map(p => (
              <option key={p.key} value={p.key} disabled={!p.trained}>
                {p.label}{!p.trained ? ' (model pending)' : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-600 dark:text-zinc-400 uppercase tracking-wide">
            Therapeutic Area
          </label>
          <select className={selectClass} value={ta} onChange={e => setTa(e.target.value)}>
            <option value="" disabled>Select a therapeutic area…</option>
            {areas.map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
      </div>

      <button
        onClick={handlePredict}
        disabled={!phase || !ta || loading}
        className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors"
      >
        {loading ? 'Predicting…' : 'Predict Duration'}
      </button>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {/* Result */}
      {result && (
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-zinc-800/50 p-5 space-y-5">
          {/* Headline */}
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-4xl font-bold text-slate-900 dark:text-zinc-100">
              {result.predicted_months.toFixed(1)}
            </span>
            <span className="text-lg text-slate-500 dark:text-zinc-400">months</span>
            <span className="ml-1 text-sm px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-medium">
              {result.therapeutic_area}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-500">
            {result.phase_label} &nbsp;·&nbsp; Primary completion endpoint
          </p>

          {/* Prediction interval bar */}
          <div className="space-y-1.5">
            <p className="text-xs text-slate-500 dark:text-zinc-500">
              80% Prediction Interval &nbsp;·&nbsp;
              <span className="text-blue-600 dark:text-blue-400 font-medium">
                {result.lower_months.toFixed(1)} – {result.upper_months.toFixed(1)} months
              </span>
            </p>
            <div className="relative h-2 rounded-full bg-slate-200 dark:bg-zinc-700 overflow-hidden">
              <div className="absolute inset-0 rounded-full bg-blue-200 dark:bg-blue-900/60" />
              <div
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-blue-600 dark:bg-blue-400 shadow"
                style={{ left: `calc(${intervalPct}% - 6px)` }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-400 dark:text-zinc-500">
              <span>{result.lower_months.toFixed(1)} mo</span>
              <span className="text-blue-600 dark:text-blue-400 font-semibold">
                ▲ {result.predicted_months.toFixed(1)} mo
              </span>
              <span>{result.upper_months.toFixed(1)} mo</span>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 pt-1">
            {[
              { value: `${result.predicted_days.toFixed(0)} d`, label: 'Days (point estimate)' },
              { value: `±${result.rmse_days.toFixed(0)} d`,     label: 'Model RMSE' },
              { value: result.n_train.toLocaleString(),          label: 'Training trials' },
            ].map(s => (
              <div key={s.label} className="rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 px-3 py-2.5 text-center">
                <div className="text-base font-bold text-slate-900 dark:text-zinc-100">{s.value}</div>
                <div className="text-xs text-slate-500 dark:text-zinc-500 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
