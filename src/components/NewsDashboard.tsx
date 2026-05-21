import { useEffect, useState } from 'react';

// Update this URL after deploying clinical_news_agent to Railway
const API = 'https://clinical-news-agent-production.up.railway.app';

interface Article {
  id: number;
  title: string;
  source: string;
  published: string;
  category: string;
  pipeline_change_type?: string;
  therapeutic_area?: string;
  indication?: string;
  sponsor?: string;
  asset_name?: string;
  summary?: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  data_readout: 'Data Readout',
  regulatory_approval: 'Regulatory',
  pipeline_change: 'Pipeline Change',
  other: 'Other',
};

const CATEGORY_COLOURS: Record<string, string> = {
  data_readout: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  regulatory_approval: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  pipeline_change: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  other: 'bg-slate-100 text-slate-600 dark:bg-zinc-700 dark:text-zinc-400',
};

const PIPELINE_COLOURS: Record<string, string> = {
  added: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  licensed: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
  dropped: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  deprioritised: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
};

export function NewsDashboard() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [tas, setTas] = useState<string[]>([]);
  const [filterCat, setFilterCat] = useState('');
  const [filterTa, setFilterTa] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchArticles = (cat?: string, ta?: string) => {
    const params = new URLSearchParams();
    if (cat) params.set('category', cat);
    if (ta) params.set('ta', ta);
    params.set('limit', '30');
    return fetch(`${API}/articles?${params}`)
      .then(r => r.json())
      .then(d => setArticles(d.articles || []));
  };

  useEffect(() => {
    Promise.all([
      fetchArticles(),
      fetch(`${API}/stats`).then(r => r.json()).then(setStats),
      fetch(`${API}/therapeutic-areas`).then(r => r.json()).then(setTas),
    ])
      .catch(() => setError('Could not reach the news backend.'))
      .finally(() => setLoading(false));
  }, []);

  const handleFilter = (cat: string, ta: string) => {
    setLoading(true);
    fetchArticles(cat || undefined, ta || undefined)
      .catch(() => setError('Filter failed.'))
      .finally(() => setLoading(false));
  };

  const selectClass =
    'rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 ' +
    'text-slate-900 dark:text-zinc-100 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

  if (error) return <p className="text-sm text-red-500">{error}</p>;

  return (
    <div className="space-y-6">
      {/* Category stats */}
      {Object.keys(stats).length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.entries(stats).map(([cat, count]) => (
            <button
              key={cat}
              onClick={() => {
                const next = filterCat === cat ? '' : cat;
                setFilterCat(next);
                handleFilter(next, filterTa);
              }}
              className={`rounded-xl border px-3 py-2.5 text-left transition-all ${
                filterCat === cat
                  ? 'border-blue-500 ring-1 ring-blue-500'
                  : 'border-slate-200 dark:border-zinc-700 hover:border-slate-400'
              } bg-white dark:bg-zinc-800`}
            >
              <div className="text-2xl font-bold text-slate-900 dark:text-zinc-100">{count}</div>
              <div className="text-xs text-slate-500 dark:text-zinc-500 mt-0.5">{CATEGORY_LABELS[cat] ?? cat}</div>
            </button>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <select
          className={selectClass}
          value={filterCat}
          onChange={e => { setFilterCat(e.target.value); handleFilter(e.target.value, filterTa); }}
        >
          <option value="">All categories</option>
          {Object.keys(CATEGORY_LABELS).map(k => (
            <option key={k} value={k}>{CATEGORY_LABELS[k]}</option>
          ))}
        </select>
        <select
          className={selectClass}
          value={filterTa}
          onChange={e => { setFilterTa(e.target.value); handleFilter(filterCat, e.target.value); }}
        >
          <option value="">All therapeutic areas</option>
          {tas.map(ta => <option key={ta} value={ta}>{ta}</option>)}
        </select>
        {(filterCat || filterTa) && (
          <button
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            onClick={() => { setFilterCat(''); setFilterTa(''); handleFilter('', ''); }}
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Articles */}
      {loading ? (
        <p className="text-sm text-slate-500 dark:text-zinc-400">Loading...</p>
      ) : articles.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-zinc-400">No articles found.</p>
      ) : (
        <div className="space-y-3">
          {articles.map(a => (
            <div key={a.id} className="rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-4 space-y-2">
              <div className="flex flex-wrap gap-1.5 items-center">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${CATEGORY_COLOURS[a.category] ?? CATEGORY_COLOURS.other}`}>
                  {CATEGORY_LABELS[a.category] ?? a.category}
                </span>
                {a.pipeline_change_type && (
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${PIPELINE_COLOURS[a.pipeline_change_type] ?? ''}`}>
                    {a.pipeline_change_type}
                  </span>
                )}
                {a.therapeutic_area && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-700 text-slate-600 dark:text-zinc-400">
                    {a.therapeutic_area}
                    {a.indication ? ` · ${a.indication}` : ''}
                  </span>
                )}
              </div>
              <p className="text-sm font-semibold text-slate-900 dark:text-zinc-100 leading-snug">{a.title}</p>
              {a.summary && (
                <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">{a.summary}</p>
              )}
              <div className="flex flex-wrap gap-3 text-xs text-slate-400 dark:text-zinc-500 pt-1">
                {a.sponsor && <span>🏢 {a.sponsor}</span>}
                {a.asset_name && <span>💊 {a.asset_name}</span>}
                <span>{a.source}</span>
                {a.published && <span>{a.published.slice(0, 10)}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
