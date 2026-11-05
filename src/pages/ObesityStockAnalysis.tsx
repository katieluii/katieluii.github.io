import { useEffect, useState } from 'react';
import { getProjectBySlug } from '../data/projects';
import { Pill } from '../components/Pill';
import ProjectPageLayout from '../components/ProjectPageLayout';
import { ProjectLead } from '../components/ProjectLead';
import { StockChart } from '../components/StockChart';
import { PipelineLandscape } from '../components/PipelineLandscape';
import { MaSignals } from '../components/MaSignals';
import { SegmentedChips, Skeleton } from '../components/ui';

const API = `${import.meta.env.BASE_URL}data/obesity-landscape`;

type Tab = 'stocks' | 'pipeline' | 'ma';

export default function ObesityStockAnalysis() {
  const project = getProjectBySlug('obesity-stock-analysis');

  const [tab, setTab]             = useState<Tab>('ma');
  const [stockData, setStockData] = useState<Record<string, any>>({});
  const [catalysts, setCatalysts] = useState<Record<string, any>>({});
  const [forecasts, setForecasts] = useState<Record<string, any>>({});
  const [pipeline, setPipeline]   = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [apiStatus, setApiStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    Promise.all([
      fetch(`${API}/stocks.json`).then(r => { if (!r.ok) throw new Error("Snapshot unavailable"); return r.json(); }),
      fetch(`${API}/catalysts.json`).then(r => { if (!r.ok) throw new Error("Snapshot unavailable"); return r.json(); }),
      fetch(`${API}/pipeline.json`).then(r => { if (!r.ok) throw new Error("Snapshot unavailable"); return r.json(); }),
      fetch(`${API}/health.json`).then(r => { if (!r.ok) throw new Error("Snapshot unavailable"); return r.json(); }),
    ])
      .then(([stocks, cats, pipe, health]) => {
        setStockData(stocks);
        setCatalysts(cats);
        setPipeline(pipe);
        setApiStatus(health.status === 'ready' ? 'ready' : 'loading');
        // Fetch per-ticker forecasts in the background
        const tickers: string[] = Object.keys(stocks);
        Promise.all(
          tickers.map(t => fetch(`${API}/forecast/${t}.json`).then(r => { if (!r.ok) throw new Error("Forecast unavailable"); return r.json(); }))
        ).then(fcs => {
          const fcMap: Record<string, any> = {};
          tickers.forEach((t, i) => { if (fcs[i]?.forecast) fcMap[t] = fcs[i]; });
          setForecasts(fcMap);
        }).catch(() => setApiStatus('error'));
      })
      .catch(() => setApiStatus('error'))
      .finally(() => setLoading(false));
  }, []);

  if (!project) {
    return (
      <ProjectPageLayout title="Project not found">
        <p className="text-zinc-500 dark:text-zinc-400">That project doesn't exist.</p>
      </ProjectPageLayout>
    );
  }

  return (
    <ProjectPageLayout
      title={project.title}
      subtitle="Market intelligence for the obesity drug race."
      containerClassName="max-w-5xl mx-auto px-6"
    >
      <div className="space-y-8">

        {/* header meta */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-zinc-500 dark:text-zinc-400 px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-full">
            {project.yearStart}
          </span>
          <Pill variant="status-wip">Static archive</Pill>
          {project.themes.map(t => <Pill key={t} variant="tech">{t}</Pill>)}
        </div>

        <ProjectLead headline="The obesity drug race, read through markets, pipelines, and M&A firepower.">
          A competitive intelligence tool for the GLP-1/obesity pharma space, anchored to an M&A signal framework. The M&A Signals tab analyzes firepower (Net Debt/EBITDA capacity to deploy capital), surfaces likely targets, and tracks the 2023–2025 deal timeline. The Pipeline tab maps the asset-level competitive landscape feeding into those M&A decisions, captured from ClinicalTrials.gov. The Stock Charts tab tracks 3-year price history with SMA-50/200, ARIMA 30-day forecasts, and deal/readout markers overlaid as catalysts — captured from yfinance.
        </ProjectLead>

        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Archived snapshot: source data last updated 26 August 2026; saved 5 November 2026.
          Prices, pipeline records and 30-day forecasts are historical and do not update automatically.
        </p>

        {/* Snapshot status */}
        {!loading && apiStatus !== 'ready' && (
          <div className="rounded-2xl ring-1 ring-amber-200 dark:ring-amber-800/40 bg-amber-50 dark:bg-amber-900/20 px-4 py-3 flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400">
            {apiStatus === 'error'
              ? 'Could not load the archived data. Please reload the page.'
              : 'The archived snapshot is incomplete.'}
          </div>
        )}

        {/* tabs */}
        <SegmentedChips<Tab>
          value={tab}
          onChange={setTab}
          options={[
            { value: 'ma', label: 'M&A Signals' },
            { value: 'pipeline', label: 'Pipeline' },
            { value: 'stocks', label: 'Stock Charts' },
          ]}
        />

        {/* tab content */}
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-64 w-full rounded-2xl" />
            <Skeleton className="h-32 w-full rounded-2xl" />
          </div>
        ) : (
          <>
            {tab === 'stocks' && (
              <StockChart
                data={stockData}
                catalysts={catalysts}
                forecasts={forecasts}
              />
            )}
            {tab === 'pipeline' && (
              <PipelineLandscape pipeline={pipeline} api={API} />
            )}
            {tab === 'ma' && (
              <MaSignals api={API} />
            )}
          </>
        )}

      </div>
    </ProjectPageLayout>
  );
}
