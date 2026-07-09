import { useEffect, useState, useCallback } from 'react';
import { ExternalLink, RefreshCw, Zap, Handshake, DollarSign, FlaskConical } from 'lucide-react';
import ProjectPageLayout from '../components/ProjectPageLayout';
import { ProjectLead } from '../components/ProjectLead';
import { Pill } from '../components/Pill';
import { StatCard, StatGrid, EmptyState, SkeletonList, Reveal } from '../components/ui';
import { getProjectBySlug, formatYearRange } from '../data/projects';

const API = 'https://ai-deal-scraper-production.up.railway.app';

// ── Types ──────────────────────────────────────────────────────────────────────

interface Article {
  id: string;
  url: string;
  title: string;
  source: string;
  published_date: string;
  short_summary: string;
  ai_relevance_score: number;
  ai_application: string[];
  companies_mentioned: string[];
  primary_ai_company: string | null;
  primary_biopharma_company: string | null;
  is_deal_related: boolean;
  deal_type: string | null;
  partnership_flag: boolean;
  acquisition_flag: boolean;
  has_disclosed_value: boolean;
  deal_value_raw: string | null;
  therapeutic_area: string | null;
  capability_acquired: string | null;
  extraction_model: string | null;
}

interface Stats {
  total_articles: number;
  deal_related: number;
  disclosed_value: number;
  top_ai_application: string | null;
}

interface AnalyticsYear {
  year: number;
  mega: number;
  large: number;
  mid: number;
  undisclosed: number;
  total_value_b: number;
}

type ViewMode = 'all' | 'deals' | 'disclosed' | 'fundraises';

// ── Helpers ────────────────────────────────────────────────────────────────────

async function apiFetch(path: string) {
  const res = await fetch(`${API}${path}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function relevanceBar(score: number | null) {
  const s = score ?? 0;
  const filled = Math.round(s);
  return (
    <span className="flex gap-0.5 items-center" title={`AI relevance: ${s}/5`}>
      {[1, 2, 3, 4, 5].map(i => (
        <span
          key={i}
          className={`inline-block w-1.5 h-3 rounded-sm ${
            i <= filled
              ? 'bg-blue-500 dark:bg-blue-400'
              : 'bg-zinc-200 dark:bg-zinc-700'
          }`}
        />
      ))}
    </span>
  );
}

function Tag({ label, color = 'zinc' }: { label: string; color?: string }) {
  const cls =
    color === 'indigo'
      ? 'bg-indigo-100 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-600/15 dark:ring-indigo-400/20'
      : color === 'amber'
      ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400';
  return (
    <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${cls}`}>
      {label}
    </span>
  );
}

// ── Analytics panel ────────────────────────────────────────────────────────────

function AnalyticsPanel({ data }: { data: AnalyticsYear[] }) {
  if (!data.length) return null;

  const maxDeals = Math.max(...data.map(y => y.mega + y.large + y.mid + y.undisclosed), 1);

  // Trend callout: compare first and last year mega deals
  const first = data[0];
  const last = data[data.length - 1];
  const trendText = (() => {
    const firstMega = first.mega;
    const lastMega = last.mega;
    if (lastMega > firstMega) {
      return `Mega deals (≥$1B) grew from ${firstMega} in ${first.year} to ${lastMega} in ${last.year} — deal sizes are scaling up.`;
    } else if (lastMega === firstMega) {
      return `Mega deal (≥$1B) count held steady at ${lastMega} through ${last.year}.`;
    }
    return `Deal activity intensified ${first.year}–${last.year} with total disclosed value reaching $${last.total_value_b.toFixed(1)}B in ${last.year}.`;
  })();

  return (
    <div className="rounded-2xl ring-1 ring-zinc-200/80 dark:ring-white/10 bg-white/80 dark:bg-zinc-800/80 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Deal Trend by Year</h3>
        <div className="flex gap-3 text-xs text-zinc-500 dark:text-zinc-500">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-violet-500 inline-block" />≥$1B</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-blue-500 inline-block" />$100M–$1B</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-emerald-500 inline-block" />$1M–$100M</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-zinc-300 dark:bg-zinc-600 inline-block" />Undisclosed</span>
        </div>
      </div>

      <div className="space-y-2.5">
        {data.map(y => {
          const total = y.mega + y.large + y.mid + y.undisclosed;
          const pct = (n: number) => `${Math.round((n / maxDeals) * 100)}%`;
          return (
            <div key={y.year} className="flex items-center gap-3">
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 w-10 shrink-0">{y.year}</span>
              <div className="flex-1 flex h-5 rounded overflow-hidden gap-px">
                {y.mega > 0 && (
                  <div className="bg-violet-500 flex items-center justify-center text-white text-[10px] font-bold" style={{ width: pct(y.mega) }} title={`${y.mega} mega deal(s) ≥$1B`}>{y.mega}</div>
                )}
                {y.large > 0 && (
                  <div className="bg-blue-500 flex items-center justify-center text-white text-[10px] font-bold" style={{ width: pct(y.large) }} title={`${y.large} large deal(s) $100M–$1B`}>{y.large}</div>
                )}
                {y.mid > 0 && (
                  <div className="bg-emerald-500 flex items-center justify-center text-white text-[10px] font-bold" style={{ width: pct(y.mid) }} title={`${y.mid} mid deal(s) $1M–$100M`}>{y.mid}</div>
                )}
                {y.undisclosed > 0 && (
                  <div className="bg-zinc-200 dark:bg-zinc-600 flex items-center justify-center text-zinc-500 dark:text-zinc-400 text-[10px]" style={{ width: pct(y.undisclosed) }} title={`${y.undisclosed} undisclosed`}>{y.undisclosed}</div>
                )}
              </div>
              <span className="text-xs text-zinc-400 dark:text-zinc-500 w-16 text-right shrink-0">
                {y.total_value_b > 0 ? `$${y.total_value_b.toFixed(1)}B` : `${total} deals`}
              </span>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-zinc-500 dark:text-zinc-500 border-t border-zinc-100 dark:border-zinc-700 pt-3">
        {trendText}
      </p>
    </div>
  );
}

// ── Article card ───────────────────────────────────────────────────────────────

function ArticleCard({ article }: { article: Article }) {
  const isCurated = article.extraction_model === 'curated-seed-v1';
  return (
    <div className="rounded-2xl ring-1 ring-zinc-200/80 dark:ring-white/10 bg-white/80 dark:bg-zinc-800/80 p-5 space-y-3 hover:ring-zinc-300 dark:hover:ring-white/20 transition-all">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {isCurated ? (
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 leading-snug block">
              {article.title}
            </span>
          ) : (
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 hover:text-blue-600 dark:hover:text-blue-400 leading-snug block"
            >
              {article.title}
            </a>
          )}
          <div className="flex items-center gap-2 mt-1 text-xs text-zinc-500 dark:text-zinc-500">
            <span>{article.source}</span>
            <span>·</span>
            <span>{article.published_date}</span>
            {relevanceBar(article.ai_relevance_score)}
          </div>
        </div>
        {!isCurated && (
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 text-zinc-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </div>

      {/* Summary */}
      {article.short_summary && (
        <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
          {article.short_summary}
        </p>
      )}

      {/* Tags row — primary accent = AI application; money = amber; rest neutral */}
      <div className="flex flex-wrap gap-1.5">
        {article.ai_application?.slice(0, 3).map(tag => (
          <Tag key={tag} label={tag} color="indigo" />
        ))}
        {article.has_disclosed_value && article.deal_value_raw && (
          <Tag label={article.deal_value_raw} color="amber" />
        )}
        {article.deal_type && <Tag label={article.deal_type} />}
        {article.therapeutic_area && <Tag label={article.therapeutic_area} />}
      </div>

      {/* Companies */}
      {(article.primary_ai_company || article.primary_biopharma_company) && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500 dark:text-zinc-500">
          {article.primary_ai_company && (
            <span>
              <span className="font-medium text-zinc-700 dark:text-zinc-300">AI co: </span>
              {article.primary_ai_company}
            </span>
          )}
          {article.primary_biopharma_company && (
            <span>
              <span className="font-medium text-zinc-700 dark:text-zinc-300">Pharma: </span>
              {article.primary_biopharma_company}
            </span>
          )}
          {article.capability_acquired && (
            <span>
              <span className="font-medium text-zinc-700 dark:text-zinc-300">Capability: </span>
              {article.capability_acquired}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export function BiopharmaAIFeed() {
  const project = getProjectBySlug('ai-biopharma-feed');
  const [stats, setStats] = useState<Stats | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsYear[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [view, setView] = useState<ViewMode>('all');
  const [aiApp, setAiApp] = useState('');
  const [aiAppOptions, setAiAppOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Build query params from current view + filter
  const buildQuery = useCallback((v: ViewMode, app: string) => {
    const p = new URLSearchParams({ limit: '60', days: '1500' });
    if (v === 'deals') p.set('is_deal_related', 'true');
    if (v === 'disclosed') p.set('has_disclosed_value', 'true');
    if (v === 'fundraises') p.set('deal_type', 'Investment / funding');
    if (app) p.set('ai_application', app);
    return p.toString();
  }, []);

  const loadArticles = useCallback(async (v: ViewMode, app: string) => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch(`/articles?${buildQuery(v, app)}`);
      setArticles(data.articles ?? []);
    } catch {
      setError('Could not load articles from the backend.');
    } finally {
      setLoading(false);
    }
  }, [buildQuery]);

  // Initial load
  useEffect(() => {
    Promise.all([
      apiFetch('/stats').then(setStats).catch(() => null),
      apiFetch('/filters').then((f) => setAiAppOptions(f.ai_applications ?? [])).catch(() => null),
      apiFetch('/analytics').then((d) => setAnalytics(d.by_year ?? [])).catch(() => null),
    ]);
    loadArticles('all', '');
  }, [loadArticles]);

  // Reload when view or filter changes
  useEffect(() => {
    loadArticles(view, aiApp);
  }, [view, aiApp, loadArticles]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetch(`${API}/refresh?limit=50`, { method: 'POST' });
      // Pipeline runs async on the server — wait 45s then reload
      setTimeout(async () => {
        await loadArticles(view, aiApp);
        apiFetch('/stats').then(setStats).catch(() => null);
        apiFetch('/analytics').then((d) => setAnalytics(d.by_year ?? [])).catch(() => null);
        setRefreshing(false);
      }, 45000);
    } catch {
      setRefreshing(false);
    }
  };

  const viewBtns: { id: ViewMode; label: string; icon: React.ReactNode }[] = [
    { id: 'all', label: 'All AI news', icon: <Zap className="w-3.5 h-3.5" /> },
    { id: 'deals', label: 'Deals & partnerships', icon: <Handshake className="w-3.5 h-3.5" /> },
    { id: 'disclosed', label: 'Disclosed value', icon: <DollarSign className="w-3.5 h-3.5" /> },
    { id: 'fundraises', label: 'Fundraises', icon: <DollarSign className="w-3.5 h-3.5" /> },
  ];

  return (
    <ProjectPageLayout title="AI Deal Monitoring Agent" subtitle="Adoption tracking for AI in biopharma.">
      <div className="space-y-8">

        {/* Pills */}
        {project && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-slate-600 dark:text-zinc-400 px-2.5 py-1 bg-slate-100 dark:bg-zinc-800 rounded">
              {formatYearRange(project.yearStart, project.yearEnd)}
            </span>
            <Pill variant={project.status === 'Live' ? 'status-live' : project.status === 'WIP' ? 'status-wip' : 'tech'}>
              {project.status}
            </Pill>
            {project.themes.map(theme => (
              <Pill key={theme} variant="tech">{theme}</Pill>
            ))}
          </div>
        )}

        {/* Description */}
        <ProjectLead headline="Track how AI is being adopted across biopharma, deal by deal.">
          Tracks how AI is being adopted across biopharma — partnerships, acquisitions, platform deals, clinical trial technology, diagnostics, and drug discovery. RSS ingestion from nine sources, LLM-based relevance filtering, and structured deal/entity extraction.
        </ProjectLead>

        {/* Stats row */}
        {stats && (
          <StatGrid cols={4}>
            <StatCard label="Articles tracked" value={stats.total_articles.toLocaleString()} />
            <StatCard label="Deal-related" value={stats.deal_related.toLocaleString()} />
            <StatCard label="Disclosed value" value={stats.disclosed_value.toLocaleString()} />
            <StatCard label="Top AI application" value={<span className="text-base">{stats.top_ai_application ?? '—'}</span>} accent />
          </StatGrid>
        )}

        {/* Analytics panel */}
        {analytics.length > 0 && <AnalyticsPanel data={analytics} />}

        {/* View toggle + AI application filter */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex gap-1.5 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800">
            {viewBtns.map(btn => (
              <button
                key={btn.id}
                onClick={() => setView(btn.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  view === btn.id
                    ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
                }`}
              >
                {btn.icon}
                {btn.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing…' : 'Refresh feed'}
          </button>

          {aiAppOptions.length > 0 && (
            <select
              value={aiApp}
              onChange={e => setAiApp(e.target.value)}
              className="text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All AI applications</option>
              {aiAppOptions.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          )}
        </div>

        {/* Feed */}
        {error && (
          <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
        )}

        {loading ? (
          <SkeletonList count={5} />
        ) : articles.length === 0 ? (
          <EmptyState
            icon={<FlaskConical className="h-5 w-5" />}
            title="No articles yet"
            hint="The feed refreshes daily — trigger a refresh via the backend or wait for the scheduled job."
          />
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-zinc-400 dark:text-zinc-600">{articles.length} articles</p>
            {articles.map(a => (
              <Reveal key={a.id}>
                <ArticleCard article={a} />
              </Reveal>
            ))}
          </div>
        )}

        {/* Technologies */}
        {project && project.tags.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-widest">Technologies</h2>
            <div className="flex flex-wrap gap-1.5">
              {project.tags.map(tag => <Pill key={tag} variant="tech">{tag}</Pill>)}
            </div>
          </div>
        )}
      </div>
    </ProjectPageLayout>
  );
}

export default BiopharmaAIFeed;
