import { useEffect, useState, useCallback, useMemo } from 'react';
import { RefreshCw, FlaskConical, ExternalLink, Archive } from 'lucide-react';
import ProjectPageLayout from '../components/ProjectPageLayout';
import { Pill } from '../components/Pill';
import { getProjectBySlug, formatYearRange } from '../data/projects';

const API = 'https://clinical-news-agent-production.up.railway.app';

// ── Types ──────────────────────────────────────────────────────────────────────

interface Article {
  id: number;
  title: string;
  source: string;
  link: string;
  published: string;
  category: string;
  pipeline_change_type: string | null;
  therapeutic_area: string | null;
  indication: string | null;
  sponsor: string | null;
  asset_name: string | null;
  summary: string | null;
  created_at?: string;
}

interface Digest {
  date: string | null;
  narrative: string;
  one_liners: string[];
  article_count: number;
}

interface Stats {
  total_articles: number;
  by_category: Record<string, number>;
  top_therapeutic_areas: Record<string, number>;
}

interface WeekStats {
  data_readout: number;
  pipeline_regulatory: number;
  company_action: number;
}

type ViewMode = 'all' | 'data_readout' | 'pipeline_regulatory' | 'company_action';
type WeekTab = 'this' | 'last';

// ── Constants ──────────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  data_readout: 'Data Readout',
  regulatory: 'Regulatory',
  pipeline_change: 'Pipeline Change',
  company_action: 'M&A Activity / Management Change',
  other: 'Other',
};

// ── Date helpers ───────────────────────────────────────────────────────────────

function getMondayOfCurrentWeek(): Date {
  const today = new Date();
  const day = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() + (day === 0 ? -6 : 1 - day));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function getMondayOfLastWeek(): Date {
  const m = getMondayOfCurrentWeek();
  const prev = new Date(m);
  prev.setDate(m.getDate() - 7);
  return prev;
}

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Days from the Saturday before this week's Monday through today.
function weekStartDays(): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const saturday = new Date(getMondayOfCurrentWeek());
  saturday.setDate(saturday.getDate() - 2);
  return Math.max(1, Math.floor((today.getTime() - saturday.getTime()) / 86400000));
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatPublished(published: string): string {
  if (!published) return '';
  const d = new Date(published);
  if (!isNaN(d.getTime())) {
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  // Strip time from raw string: "May 18, 2026 8:50..." → "May 18, 2026"
  return published.replace(/[T ]\d{1,2}:\d{2}.*$/, '').trim();
}

// Robust published-date parser — handles ISO 8601, RFC 2822, and common RSS variants.
// (feedparser stores the raw string; "UTC" suffix isn't valid in JS but "GMT" is.)
// Also handles FierceBiotech/FiercePharma "Month D, YYYY H:MMam/pm" format which
// JS Date can't parse natively, causing those articles to vanish from "last week".
function parsePublished(s: string | undefined): number {
  if (!s) return NaN;
  let t = new Date(s).getTime();
  if (!isNaN(t)) return t;
  t = new Date(s.replace(/\bUTC\b/gi, 'GMT')).getTime();
  if (!isNaN(t)) return t;
  // "May 21, 2026 3:21pm" / "May 22, 2026 4:23am" (FierceBiotech / FiercePharma)
  const ampm = s.match(/^(\w+ \d{1,2},\s*\d{4})\s+(\d{1,2}):(\d{2})(am|pm)$/i);
  if (ampm) {
    let h = parseInt(ampm[2], 10);
    if (ampm[4].toLowerCase() === 'pm' && h !== 12) h += 12;
    if (ampm[4].toLowerCase() === 'am' && h === 12) h = 0;
    t = new Date(`${ampm[1]} ${String(h).padStart(2, '0')}:${ampm[3]}:00`).getTime();
    if (!isNaN(t)) return t;
  }
  // Last resort: pull YYYY-MM-DD substring (covers seed "_ago(N)" format)
  const m = s.match(/(\d{4}-\d{2}-\d{2})/);
  return m ? new Date(m[1]).getTime() : NaN;
}

async function apiFetch(path: string) {
  const res = await fetch(`${API}${path}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function Tag({ label, color = 'zinc' }: { label: string; color?: string }) {
  const cls = color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
    : color === 'emerald' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
    : color === 'amber' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
    : color === 'violet' ? 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300'
    : color === 'red' ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'
    : color === 'cyan' ? 'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300'
    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400';
  return (
    <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${cls}`}>
      {label}
    </span>
  );
}

function catColorFor(category: string): string {
  return category === 'data_readout' ? 'blue'
    : category === 'regulatory' ? 'emerald'
    : category === 'pipeline_change' ? 'amber'
    : category === 'company_action' ? 'violet'
    : 'zinc';
}

function pipelineColorFor(type: string | null): string {
  return type === 'added' ? 'emerald'
    : type === 'licensed' ? 'cyan'
    : type === 'dropped' ? 'red'
    : type === 'deprioritised' ? 'amber'
    : 'zinc';
}

function normalizeKey(s: string | null): string {
  return (s ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

// Explicit aliases for top pharma — checked before suffix stripping so "Merck KGaA"
// and "Merck" (US) stay separate, and variants like "Genentech" → "roche" are caught.
const SPONSOR_ALIASES: [RegExp, string][] = [
  [/\bgenentech\b/i,                                          'roche'],
  [/\broche\b/i,                                             'roche'],
  [/\bjanssen\b|johnson\s*[&+]\s*johnson|johnson\s+and\s+johnson/i, 'jnj'],
  [/\bmerck\s+kgaa\b|\bemd\s+serono\b|\bemd\s+millipore\b/i, 'merckkgaa'],  // must be before generic merck
  [/\bmsd\b|\bmerck\s*&\s*co\b|\bmerck\s+sharp\b|\bmerck\b/i,'merck'],
  [/\bastrazeneca\b/i,                                        'astrazeneca'],
  [/\bsanofi\b|\bgenzyme\b|\baventis\b/i,                    'sanofi'],
  [/bristol.?myers.?squibb|\bbms\b/i,                        'bms'],
  [/\b(?:eli\s+)?lilly\b/i,                                  'lilly'],
  [/\bgsk\b|\bglaxosmithkline\b|\bglaxo\b/i,                 'gsk'],
  [/\bpfizer\b/i,                                            'pfizer'],
  [/\babbvie\b/i,                                            'abbvie'],
  [/\bnovartis\b/i,                                          'novartis'],
  [/\bamgen\b/i,                                             'amgen'],
  [/\bgilead\b/i,                                            'gilead'],
  [/\bregeneron\b/i,                                         'regeneron'],
  [/\bbiogen\b/i,                                            'biogen'],
  [/\bbayer\b/i,                                             'bayer'],
  [/\btakeda\b/i,                                            'takeda'],
  [/\bnovo\s*nordisk\b/i,                                    'novonordisk'],
  [/\bucb\b/i,                                               'ucb'],
  [/\bdaiichi\s*sankyo\b/i,                                  'daiichisankyo'],
  [/\bboehringer\b/i,                                        'boehringeringelheim'],
  [/\bmoderna\b/i,                                           'moderna'],
  [/\bbiontech\b/i,                                          'biontech'],
  [/\beisai\b/i,                                             'eisai'],
  [/\bincyte\b/i,                                            'incyte'],
  [/\bipsen\b/i,                                             'ipsen'],
];

const SPONSOR_SUFFIX = /\s+(pharmaceuticals?|pharma|biosciences?|biotechnology|biotech|therapeutics?|sciences?|oncology|biopharmaceuticals?|inc\.?|ltd\.?|corp\.?|plc\.?|llc\.?|gmbh|sa|ag)\s*$/i;

function normalizeSponsor(s: string): string {
  for (const [re, canonical] of SPONSOR_ALIASES) {
    if (re.test(s)) return canonical;
  }
  return normalizeKey(s.replace(SPONSOR_SUFFIX, '').replace(SPONSOR_SUFFIX, ''));
}

// Co-development articles ("Daiichi Sankyo / AstraZeneca", "Eisai/Biogen") carry
// multiple sponsors — split them so either company can pair with a solo-sponsor article.
function sponsorKeys(s: string | null): Set<string> {
  if (!s) return new Set();
  const keys = new Set<string>();
  for (const part of s.split(/\s*\/\s*|\s+and\s+/i)) {
    const k = normalizeSponsor(part.trim());
    if (k) keys.add(k);
  }
  return keys;
}

function sponsorsOverlap(a: string | null, b: string | null): boolean {
  const ka = sponsorKeys(a);
  const kb = sponsorKeys(b);
  for (const k of ka) if (kb.has(k)) return true;
  return false;
}

// Maps variant TA names → a canonical lowercase token for grouping.
const TA_CANONICAL: [RegExp, string][] = [
  [/melanoma|skin.?cancer|cutaneous|dermat/i, 'oncology'],
  [/lung.?cancer|nsclc|sclc/i, 'oncology'],
  [/cancer|oncol|hematol|haematol|leukemia|lymphoma|tumor|tumour/i, 'oncology'],
  [/alzheimer|parkinson|ms\b|multiple.?sclerosis|neurolog|cns\b|neural/i, 'cns'],
  [/cardiac|cardiovasc|atrial|heart.?failure|coronary/i, 'cardiovascular'],
  [/obes|glp.?1|weight.?loss|metabol|diabet|insulin/i, 'metabolic'],
  [/rare.?disease|orphan|haemophilia|hemophilia|bleeding.?disorder/i, 'raredisease'],
  [/immun|autoimmun|rheumat|lupus|crohn|ibd|inflammatory/i, 'immunology'],
  [/infect|viral|bacterial|hiv|hepatit|covid/i, 'infectiousdisease'],
];

function normalizeTa(ta: string | null): string {
  if (!ta) return '';
  for (const [re, canonical] of TA_CANONICAL) {
    if (re.test(ta)) return canonical;
  }
  return normalizeKey(ta);
}

// Synonym groups for title fingerprinting — replaces variant phrases with canonical tokens.
const TITLE_SYNONYMS: [RegExp, string][] = [
  [/\b(fda\s+approv\w*|grants?\s+(full|accelerat\w+)?\s*approv\w*|gains?\s+approv\w*|receives?\s+approv\w*|earns?\s+approv\w*|notch\w*\s+(fda\s+)?nod|us\s+regulatory\s+approv\w*|chmp\b|eu\s+(?:approv\w*|back\w*)|positive\s+opinion|ema\s+approv\w*|european\s+approv\w*|mhra\s+approv\w*)\b/gi, 'xapproved'],
  [/\b(fda\s+reject\w*|complete\s+response\s+letter|crl\b|clinical\s+hold|refuse\s+to\s+file)\b/gi, 'xfdareject'],
  [/\b(fails?\s+to\s+beat|miss(es|ed)?\b|did\s+not\s+meet|no\s+clinical\s+benefit|falls?\s+short|adds?\s+to\s+(\w+\s+)?failures?|comes?\s+up\s+short|failed?\b|disappoints?\w*|no\s+significant\s+benefit)\b/gi, 'xnegoutcome'],
  [/\b(meets?\s+(primary\s+)?endpoint\w*|beat\w*|shows?\s+significant|demonstrat\w+\s+(efficacy|benefit|survival)|positive\s+(phase|result)\w*|showed\s+promising\w*)\b/gi, 'xposoutcome'],
  [/\b(melanoma|skin\s+cancer|cutaneous\s+\w+)\b/gi, 'xskincancer'],
  [/\b(lung\s+cancer|nsclc|sclc|non.?small.?cell)\b/gi, 'xlungcancer'],
  [/\b(phase\s+[123i]{1,3}|ph\.?\s*[123])\b/gi, 'xphase'],
  [/\b(overall\s+survival|progression.?free\s+survival|overall\s+response\s+rate)\b/gi, 'xendpoint'],
];

const STOP = new Set(['that', 'with', 'from', 'have', 'this', 'they', 'will', 'been', 'were', 'said', 'after', 'into', 'adds', 'about', 'than', 'more', 'also', 'drug', 'data', 'news', 'trial', 'study']);

function titleTokens(title: string): Set<string> {
  let s = title.replace(/'s\b/g, '').toLowerCase();
  for (const [re, token] of TITLE_SYNONYMS) s = s.replace(re, ` ${token} `);
  return new Set(s.replace(/[^a-z0-9_]/g, ' ').split(/\s+/).filter(t => t.length >= 4 && !STOP.has(t)));
}

function titlesSimilar(a: string, b: string): boolean {
  const ta = titleTokens(a);
  const tb = titleTokens(b);
  let shared = 0;
  let sharedReal = 0; // shared tokens excluding synthetic synonyms (x-prefixed)
  let sharedLong = 0;
  for (const t of ta) {
    if (tb.has(t)) {
      shared++;
      if (!t.startsWith('x')) {
        sharedReal++;
        if (t.length >= 8) sharedLong++;
      }
    }
  }
  const union = new Set([...ta, ...tb]).size;
  if (union === 0) return false;
  // A shared specific token (drug name / long clinical term) is a strong anchor —
  // lower the Jaccard threshold so combo-vs-mono naming doesn't block grouping.
  // Use sharedReal for the ratio so generic synthetic tokens (xapproved, etc.)
  // don't inflate it and cause false groupings between different AZ approvals.
  if (sharedLong >= 1 && sharedReal / union >= 0.15) return true;
  return shared / union >= 0.25;
}

// True when one asset name is a substring of the other after normalisation,
// catching "fianlimab + cemiplimab" vs "fianlimab" combo/mono variants.
function assetNamesOverlap(a: string | null, b: string | null): boolean {
  if (!a || !b) return false;
  const na = normalizeKey(a);
  const nb = normalizeKey(b);
  if (!na || !nb) return false;
  return na === nb || na.includes(nb) || nb.includes(na);
}

function groupArticles(articles: Article[]): (Article | Article[])[] {
  // Build a graph of which articles should be grouped together, then find
  // connected components. This handles transitive matches correctly —
  // if A matches B and A matches C, all three end up in the same group
  // even if B and C don't directly match each other.
  const edges = new Map<number, Set<number>>();
  const ensure = (id: number) => { if (!edges.has(id)) edges.set(id, new Set()); };

  for (let i = 0; i < articles.length; i++) {
    const a = articles[i];
    if (!a.sponsor) continue;
    const taA = normalizeTa(a.therapeutic_area);

    for (let j = i + 1; j < articles.length; j++) {
      const b = articles[j];
      if (!sponsorsOverlap(a.sponsor, b.sponsor)) continue;
      if (a.source === b.source) continue;
      const taB = normalizeTa(b.therapeutic_area);
      // Sponsor + TA alone is NOT enough — different assets in the same TA must stay separate.
      // Same TA + overlapping asset names → same drug event (covers combo/mono variants).
      // Title similarity alone is sufficient when TA categorisation differs across outlets.
      const sameTA = !!(taA && taB && taA === taB);
      const assetOverlap = assetNamesOverlap(a.asset_name, b.asset_name);
      const titleSim = titlesSimilar(a.title, b.title);
      if (titleSim || (sameTA && assetOverlap)) {
        ensure(a.id); ensure(b.id);
        edges.get(a.id)!.add(b.id);
        edges.get(b.id)!.add(a.id);
      }
    }
  }

  // BFS to find connected components.
  const visited = new Set<number>();
  const byId = new Map(articles.map(a => [a.id, a]));
  const indexOf = new Map(articles.map((a, i) => [a.id, i]));
  const groups: Article[][] = [];

  for (const a of articles) {
    if (!edges.has(a.id) || visited.has(a.id)) continue;
    const group: Article[] = [];
    const queue = [a.id];
    visited.add(a.id);
    while (queue.length) {
      const id = queue.shift()!;
      group.push(byId.get(id)!);
      for (const nid of edges.get(id) ?? []) {
        if (!visited.has(nid)) { visited.add(nid); queue.push(nid); }
      }
    }
    if (group.length > 1) {
      group.sort((x, y) => indexOf.get(x.id)! - indexOf.get(y.id)!);
      groups.push(group);
    }
  }

  const groupedIds = new Set(groups.flatMap(g => g.map(a => a.id)));
  const singles = articles.filter(a => !groupedIds.has(a.id));
  // Grouped cards first (multi-source = higher signal), then singles.
  return [...groups, ...singles];
}

// ── Digest dedup ───────────────────────────────────────────────────────────────

// Returns the canonical sponsor key if the text mentions a known pharma, else ''.
function extractSponsorKey(text: string): string {
  for (const [re, canonical] of SPONSOR_ALIASES) if (re.test(text)) return canonical;
  return '';
}

// Removes one_liner entries that cover the same sponsor + asset as an earlier entry.
// For known sponsors: 1 shared token ≥9 chars (drug name) is enough to dedup.
// For unknown sponsors: requires 2 shared tokens ≥8 chars to be safe.
function dedupeOneLiners(lines: string[]): string[] {
  const byKey = new Map<string, Set<string>[]>();
  return lines.filter(line => {
    const key = extractSponsorKey(line) || '__none__';
    const toks = new Set(
      line.toLowerCase().replace(/[^a-z]/g, ' ').split(/\s+/).filter(t => t.length >= 8)
    );
    if (!byKey.has(key)) byKey.set(key, []);
    const prev = byKey.get(key)!;
    const minLen = key === '__none__' ? 8 : 9;
    const threshold = key === '__none__' ? 2 : 1;
    const isDupe = prev.some(s => {
      let n = 0;
      for (const t of toks) if (t.length >= minLen && s.has(t)) n++;
      return n >= threshold;
    });
    if (!isDupe) prev.push(toks);
    return !isDupe;
  });
}

// ── Digest panel ───────────────────────────────────────────────────────────────

function DigestPanel({ digest, mondayDate }: { digest: Digest; mondayDate: Date }) {
  const [expanded, setExpanded] = useState(false);
  const wcLabel = toDateStr(mondayDate);
  const dedupedLines = dedupeOneLiners(digest.one_liners);
  const isEmpty = digest.article_count === 0 && dedupedLines.length === 0;
  const failed = !isEmpty && dedupedLines.length === 0;
  const hasNarrative = !!(digest.narrative?.trim());
  // Show the toggle whenever there are items — expanded mode shows narrative if available,
  // otherwise shows the full untruncated bullet list (useful when no narrative yet).
  const canExpand = !isEmpty && !failed;

  return (
    <div className="rounded-2xl ring-1 ring-zinc-200/80 dark:ring-white/10 bg-white/80 dark:bg-zinc-800/80 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Weekly Digest</h3>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">w/c {wcLabel}</p>
        </div>
        {canExpand && (
          <button
            onClick={() => setExpanded(e => !e)}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            {expanded ? 'Show headlines' : 'Read full digest'}
          </button>
        )}
      </div>

      {isEmpty ? (
        <p className="text-xs text-zinc-400 dark:text-zinc-500 italic">
          No articles digested yet this week — check back as the week unfolds.
        </p>
      ) : failed ? (
        <p className="text-xs text-zinc-400 dark:text-zinc-500 italic">
          Digest could not be generated — try refreshing the feed.
        </p>
      ) : !expanded ? (
        <ul className="space-y-1.5">
          {dedupedLines.map((line, i) => (
            <li key={i} className="flex gap-2 text-xs text-zinc-600 dark:text-zinc-400">
              <span className="text-zinc-300 dark:text-zinc-600 shrink-0">·</span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
      ) : hasNarrative ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed whitespace-pre-line">
          {digest.narrative}
        </p>
      ) : (
        <ul className="space-y-1.5">
          {dedupedLines.map((line, i) => (
            <li key={i} className="flex gap-2 text-xs text-zinc-600 dark:text-zinc-400">
              <span className="text-zinc-300 dark:text-zinc-600 shrink-0">·</span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Article card ───────────────────────────────────────────────────────────────

function ArticleCard({ article }: { article: Article }) {
  const isSeed = article.link?.startsWith('https://seed.');
  const catColor = catColorFor(article.category);
  const pipelineColor = pipelineColorFor(article.pipeline_change_type);

  return (
    <div className="rounded-2xl ring-1 ring-zinc-200/80 dark:ring-white/10 bg-white/80 dark:bg-zinc-800/80 p-5 space-y-3 hover:ring-zinc-300 dark:hover:ring-white/20 transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {isSeed ? (
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 leading-snug block">
              {article.title}
            </span>
          ) : (
            <a
              href={article.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 hover:text-blue-600 dark:hover:text-blue-400 leading-snug block"
            >
              {article.title}
            </a>
          )}
          <div className="flex items-center gap-2 mt-1 text-xs text-zinc-400 dark:text-zinc-500">
            <span>{article.source}</span>
            {article.published && <><span>·</span><span>{formatPublished(article.published)}</span></>}
          </div>
        </div>
        {!isSeed && (
          <a href={article.link} target="_blank" rel="noopener noreferrer"
            className="shrink-0 text-zinc-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors">
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </div>

      {article.summary && (
        <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">{article.summary}</p>
      )}

      <div className="flex flex-wrap gap-1.5">
        <Tag label={CATEGORY_LABELS[article.category] ?? article.category} color={catColor} />
        {article.pipeline_change_type && (
          <Tag label={article.pipeline_change_type} color={pipelineColor} />
        )}
        {article.therapeutic_area && <Tag label={article.therapeutic_area} />}
        {article.indication && article.indication !== article.therapeutic_area && (
          <Tag label={article.indication} />
        )}
      </div>

      {(article.sponsor || article.asset_name) && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500 dark:text-zinc-500">
          {article.sponsor && (
            <span><span className="font-medium text-zinc-700 dark:text-zinc-300">Sponsor: </span>{article.sponsor}</span>
          )}
          {article.asset_name && (
            <span><span className="font-medium text-zinc-700 dark:text-zinc-300">Asset: </span>{article.asset_name}</span>
          )}
        </div>
      )}
    </div>
  );
}

// ── Grouped article card ───────────────────────────────────────────────────────

function GroupedArticleCard({ articles }: { articles: Article[] }) {
  const [expanded, setExpanded] = useState(false);
  const primary = articles[0];
  const extras = articles.slice(1);
  const catColor = catColorFor(primary.category);
  const pipelineColor = pipelineColorFor(primary.pipeline_change_type);

  return (
    <div className={`relative ${!expanded ? 'pb-2' : ''}`}>
      {/* Stacked card layers — peek below the main card when collapsed */}
      {!expanded && articles.length >= 3 && (
        <div className="absolute inset-x-4 top-0 -bottom-2 rounded-2xl ring-1 ring-zinc-200/40 dark:ring-white/[0.05] bg-zinc-100/60 dark:bg-zinc-900/40" />
      )}
      {!expanded && articles.length >= 2 && (
        <div className="absolute inset-x-2 top-0 -bottom-1 rounded-2xl ring-1 ring-zinc-200/60 dark:ring-white/[0.07] bg-white/70 dark:bg-zinc-800/60" />
      )}

      {/* Main card */}
      <div className="relative">
        <div className="relative rounded-2xl ring-1 ring-zinc-200/80 dark:ring-white/10 bg-white/80 dark:bg-zinc-800/80 hover:ring-zinc-300 dark:hover:ring-white/20 transition-all">
          {/* External link for primary article — sits outside the toggle button so it's valid HTML */}
          {primary.link && !primary.link.startsWith('https://seed.') && (
            <a
              href={primary.link}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute top-4 right-4 z-10 text-zinc-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}

          <button
            onClick={() => setExpanded(e => !e)}
            className="w-full text-left p-5 pr-10 space-y-3"
          >
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded font-medium shrink-0">
                  {articles.length} sources
                </span>
                <span className="text-xs text-zinc-400 dark:text-zinc-500">
                  {articles.map(a => a.source).join(' · ')}
                </span>
                {primary.published && (
                  <><span className="text-zinc-300 dark:text-zinc-600 text-xs">·</span>
                  <span className="text-xs text-zinc-400 dark:text-zinc-500">{formatPublished(primary.published)}</span></>
                )}
              </div>
              <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 leading-snug block">
                {primary.title}
              </span>
            </div>

            {primary.summary && (
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">{primary.summary}</p>
            )}

            <div className="flex flex-wrap gap-1.5">
              <Tag label={CATEGORY_LABELS[primary.category] ?? primary.category} color={catColor} />
              {primary.pipeline_change_type && <Tag label={primary.pipeline_change_type} color={pipelineColor} />}
              {primary.therapeutic_area && <Tag label={primary.therapeutic_area} />}
              {primary.indication && primary.indication !== primary.therapeutic_area && <Tag label={primary.indication} />}
            </div>

            {(primary.sponsor || primary.asset_name) && (
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500 dark:text-zinc-500">
                {primary.sponsor && <span><span className="font-medium text-zinc-700 dark:text-zinc-300">Sponsor: </span>{primary.sponsor}</span>}
                {primary.asset_name && <span><span className="font-medium text-zinc-700 dark:text-zinc-300">Asset: </span>{primary.asset_name}</span>}
              </div>
            )}

            <p className="text-xs text-blue-600 dark:text-blue-400">
              {expanded ? 'Show less ↑' : `+ ${extras.length} more source${extras.length > 1 ? 's' : ''}`}
            </p>
          </button>
        </div>

        <div className={`grid transition-all duration-300 ease-in-out ${expanded ? 'grid-rows-[1fr] opacity-100 mt-2' : 'grid-rows-[0fr] opacity-0'}`}>
          <div className="overflow-hidden space-y-2">
            {extras.map(a => <ArticleCard key={a.id} article={a} />)}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Archived digest agents (v1) ───────────────────────────────────────────────

function ArchivedDigestAgents() {
  const archiveProject = getProjectBySlug('news-digest-agents');
  if (!archiveProject) return null;

  return (
    <div className="rounded-2xl ring-1 ring-zinc-200/80 dark:ring-white/10 bg-zinc-50/80 dark:bg-zinc-800/50 p-6 space-y-6">
      <div className="space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-zinc-500 dark:text-zinc-400 px-2 py-0.5 bg-zinc-100 dark:bg-zinc-700 rounded-full">
            {formatYearRange(archiveProject.yearStart, archiveProject.yearEnd)}
          </span>
          <Pill variant="tech">Archived</Pill>
          {archiveProject.themes.map(t => <Pill key={t} variant="tech">{t}</Pill>)}
        </div>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
          {archiveProject.longDescription || archiveProject.summary}
        </p>
      </div>

      {archiveProject.sections?.map((section, idx) => (
        <div key={idx} className="space-y-3">
          <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-widest">{section.title}</h3>
          {section.bullets && (
            <ul className="space-y-1.5">
              {section.bullets.map((b, i) => (
                <li key={i} className="flex gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                  <span className="text-zinc-300 dark:text-zinc-600 shrink-0">·</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          )}
          {section.images?.map((img, imgIdx) => (
            <div key={imgIdx} className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-4">
              <a href={img.src} target="_blank" rel="noopener noreferrer" className="block">
                <img src={img.src} alt={img.alt} className="w-full h-auto rounded" />
              </a>
              {img.caption && (
                <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400 text-center">{img.caption}</p>
              )}
            </div>
          ))}
        </div>
      ))}

      {archiveProject.tags.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-widest">Technologies</h3>
          <div className="flex flex-wrap gap-1.5">
            {archiveProject.tags.map(tag => <Pill key={tag} variant="tech">{tag}</Pill>)}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function ClinicalNewsMon() {
  const project = getProjectBySlug('clinical-news-monitor');

  const [allThisWeekArticles, setAllThisWeekArticles] = useState<Article[]>([]);
  const [allLastWeekArticles, setAllLastWeekArticles] = useState<Article[]>([]);
  const [thisWeekNarrative, setThisWeekNarrative] = useState('');
  const [lastWeekNarrative, setLastWeekNarrative] = useState('');
  const [stats, setStats] = useState<Stats | null>(null);
  const [weekStats, setWeekStats] = useState<WeekStats | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [view, setView] = useState<ViewMode>('all');
  const [ta, setTa] = useState('');
  const [weekTab, setWeekTab] = useState<WeekTab>('this');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [refreshSecsLeft, setRefreshSecsLeft] = useState(0);

  useEffect(() => {
    if (!refreshing) return;
    setRefreshSecsLeft(90);
    const t = setInterval(() => setRefreshSecsLeft(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [refreshing]);
  const [showArchive, setShowArchive] = useState(false);

  const thisMonday = getMondayOfCurrentWeek();
  const lastMonday = getMondayOfLastWeek();
  const thisMondayStr = toDateStr(thisMonday);
  const lastMondayStr = toDateStr(lastMonday);
  const thisMondayTime = thisMonday.getTime();
  const lastMondayTime = lastMonday.getTime();

  // Both digests: one-liners derived from the same grouped articles shown in the feed
  // (always in sync with the correct week's articles). Narratives are fetched from the
  // backend cache for "Read full digest" but don't block the bullet list.
  const thisWeekDigest = useMemo<Digest | null>(() => {
    if (allThisWeekArticles.length === 0) return null;
    const grouped = groupArticles(allThisWeekArticles);
    const one_liners = grouped.slice(0, 10).map(item => {
      const primary = Array.isArray(item) ? item[0] : item;
      return primary.sponsor ? `${primary.sponsor}: ${primary.title}` : primary.title;
    });
    return { date: thisMondayStr, narrative: thisWeekNarrative, one_liners, article_count: allThisWeekArticles.length };
  }, [allThisWeekArticles, thisMondayStr, thisWeekNarrative]);

  const lastWeekDigest = useMemo<Digest | null>(() => {
    if (allLastWeekArticles.length === 0) return null;
    const grouped = groupArticles(allLastWeekArticles);
    const one_liners = grouped.slice(0, 10).map(item => {
      const primary = Array.isArray(item) ? item[0] : item;
      return primary.sponsor ? `${primary.sponsor}: ${primary.title}` : primary.title;
    });
    return { date: lastMondayStr, narrative: lastWeekNarrative, one_liners, article_count: allLastWeekArticles.length };
  }, [allLastWeekArticles, lastMondayStr, lastWeekNarrative]);

  // For "last week" fetch enough days to cover both weeks, then filter client-side.
  const days = weekTab === 'this' ? weekStartDays() : weekStartDays() + 7;

  const loadArticles = useCallback(async (v: ViewMode, taFilter: string) => {
    setLoading(true);
    setError('');
    try {
      const baseParams = new URLSearchParams({ limit: '200', days: String(days) });
      if (taFilter) baseParams.set('ta', taFilter);

      let fetched: Article[] = [];

      if (v === 'pipeline_regulatory') {
        const [p1, p2] = await Promise.all([
          apiFetch(`/articles?${new URLSearchParams({ ...Object.fromEntries(baseParams), category: 'pipeline_change' })}`),
          apiFetch(`/articles?${new URLSearchParams({ ...Object.fromEntries(baseParams), category: 'regulatory' })}`),
        ]);
        const merged = [...(p1.articles ?? []), ...(p2.articles ?? [])];
        merged.sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''));
        fetched = merged;
      } else {
        if (v !== 'all') baseParams.set('category', v);
        const data = await apiFetch(`/articles?${baseParams}`);
        fetched = data.articles ?? [];
      }

      fetched = fetched.filter(a => a.category !== 'other');

      if (weekTab === 'this') {
        fetched = fetched.filter(a => {
          const t = parsePublished(a.published);
          return isNaN(t) || t >= thisMondayTime; // include unparseable (assume recent)
        });
      } else {
        fetched = fetched.filter(a => {
          const t = parsePublished(a.published);
          return !isNaN(t) && t >= lastMondayTime && t < thisMondayTime; // exclude unparseable
        });
      }

      setArticles(fetched);

      // Track unfiltered articles per week so the digest always reflects all events
      // regardless of the category/TA filter the user has selected.
      if (v === 'all' && !taFilter) {
        if (weekTab === 'this') setAllThisWeekArticles(fetched);
        else setAllLastWeekArticles(fetched);
      }

      if (v === 'all') {
        setWeekStats({
          data_readout: fetched.filter(a => a.category === 'data_readout').length,
          pipeline_regulatory: fetched.filter(a => a.category === 'pipeline_change' || a.category === 'regulatory').length,
          company_action: fetched.filter(a => a.category === 'company_action').length,
        });
      }
    } catch {
      setError('Could not load articles from the backend.');
    } finally {
      setLoading(false);
    }
  }, [days, weekTab, thisMondayTime, lastMondayTime]);

  useEffect(() => {
    apiFetch('/stats').then(setStats).catch(() => null);
    // Narratives for "Read full digest" — optional, cached DB reads, don't block bullet lists.
    apiFetch(`/digest/week-of?monday=${thisMondayStr}`)
      .then(d => setThisWeekNarrative(d?.narrative || ''))
      .catch(() => null);
    apiFetch(`/digest/week-of?monday=${lastMondayStr}`)
      .then(d => setLastWeekNarrative(d?.narrative || ''))
      .catch(() => null);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadArticles('all', '');
  }, [loadArticles]);

  useEffect(() => {
    loadArticles(view, ta);
  }, [view, ta, loadArticles]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetch(`${API}/refresh`, { method: 'POST' });
      setTimeout(async () => {
        await Promise.all([
          loadArticles(view, ta),
          apiFetch('/stats').then(setStats).catch(() => null),
        ]);
        setRefreshing(false);
      }, 90000);
    } catch {
      setRefreshing(false);
    }
  };

  const viewBtns: { id: ViewMode; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'data_readout', label: 'Data Readouts' },
    { id: 'pipeline_regulatory', label: 'Pipeline Developments' },
    { id: 'company_action', label: 'M&A/Management Activities' },
  ];

  const [sponsorFilter, setSponsorFilter] = useState('');
  const [indicationFilter, setIndicationFilter] = useState('');

  const sponsorOptions = useMemo(() => {
    const s = new Set<string>();
    articles.forEach(a => { if (a.sponsor) s.add(a.sponsor); });
    return Array.from(s).sort();
  }, [articles]);

  const indicationOptions = useMemo(() => {
    const s = new Set<string>();
    articles.forEach(a => { if (a.indication) s.add(a.indication); });
    return Array.from(s).sort();
  }, [articles]);

  const filteredArticles = useMemo(() => {
    return articles.filter(a => {
      if (sponsorFilter && a.sponsor !== sponsorFilter) return false;
      if (indicationFilter && a.indication !== indicationFilter) return false;
      return true;
    });
  }, [articles, sponsorFilter, indicationFilter]);

  const taOptions = stats ? Object.keys(stats.top_therapeutic_areas) : [];

  const pipelineRegulatoryCount = stats
    ? (stats.by_category?.pipeline_change ?? 0) + (stats.by_category?.regulatory ?? 0)
    : 0;

  const displayStats = weekStats
    ? [
        { value: weekStats.data_readout, label: 'Data Readouts' },
        { value: weekStats.pipeline_regulatory, label: 'Pipeline & Regulatory Developments' },
        { value: weekStats.company_action, label: 'M&A Activities / Management Changes' },
      ]
    : [
        { value: stats?.by_category?.data_readout ?? 0, label: 'Data Readouts' },
        { value: pipelineRegulatoryCount, label: 'Pipeline & Regulatory Developments' },
        { value: stats?.by_category?.company_action ?? 0, label: 'M&A Activities / Management Changes' },
      ];

  return (
    <ProjectPageLayout title="Clinical Development Monitoring Agent" subtitle="Weekly RSS digest · LLM-extracted events">
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

        <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed text-sm">
          I built this agent to monitor every week's clinical development news from five main biopharma RSS feeds — FierceBiotech, FiercePharma, Endpoints News, Labiotech, and BioPharma Dive. LLM classifies each article into structured clinical development events: trial data readouts (Phase I–III, interim, endpoint outcomes), regulatory decisions across FDA, EMA/CHMP, UK MHRA, Japan PMDA, and China NMPA (including approvals, CRL letters, clinical holds, and label expansions), pipeline movements (assets added, in-licensed, dropped, or deprioritised), and M&A/management activities. Each article is tagged by therapeutic area, indication, sponsor, and asset. A narrative digest is generated weekly across all extracted events.
        </p>

        {/* Week tab selector */}
        <div className="flex gap-1 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 w-fit">
          {(['this', 'last'] as WeekTab[]).map(tab => {
            const monday = tab === 'this' ? thisMonday : lastMonday;
            const label = tab === 'this' ? 'This week' : 'Last week';
            const dateStr = toDateStr(monday);
            return (
              <button
                key={tab}
                onClick={() => { setWeekTab(tab); setView('all'); setTa(''); setSponsorFilter(''); setIndicationFilter(''); }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  weekTab === tab
                    ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
                }`}
              >
                {label}
                <span className="ml-1.5 text-xs font-normal opacity-60">w/c {dateStr}</span>
              </button>
            );
          })}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          {displayStats.map(s => (
            <div key={s.label} className="rounded-2xl ring-1 ring-zinc-200/80 dark:ring-white/10 bg-white/80 dark:bg-zinc-800/80 px-4 py-3 text-center">
              <div className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{s.value}</div>
              <div className="text-xs text-zinc-500 dark:text-zinc-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Digest */}
        {weekTab === 'this' && thisWeekDigest && (
          <DigestPanel digest={thisWeekDigest} mondayDate={thisMonday} />
        )}
        {weekTab === 'last' && (
          loading && allLastWeekArticles.length === 0
            ? <div className="rounded-2xl ring-1 ring-zinc-200/80 dark:ring-white/10 bg-white/80 dark:bg-zinc-800/80 p-5 h-24 animate-pulse" />
            : lastWeekDigest && <DigestPanel digest={lastWeekDigest} mondayDate={lastMonday} />
        )}

        {/* Controls — row 1: category tabs + refresh */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex gap-1.5 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800">
            {viewBtns.map(btn => (
              <button
                key={btn.id}
                onClick={() => setView(btn.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  view === btn.id
                    ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-w-[8.5rem] whitespace-nowrap"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? `Refreshing… ${refreshSecsLeft}s` : 'Refresh feed'}
          </button>
        </div>

        {/* Controls — row 2: dropdown filters (sponsors → TA → indications) */}
        <div className="flex flex-wrap gap-3 items-center">
          {sponsorOptions.length > 0 && (
            <select
              value={sponsorFilter}
              onChange={e => setSponsorFilter(e.target.value)}
              className="text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All sponsors</option>
              {sponsorOptions.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          )}

          {taOptions.length > 0 && (
            <select
              value={ta}
              onChange={e => setTa(e.target.value)}
              className="text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All therapeutic areas</option>
              {taOptions.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          )}

          {indicationOptions.length > 0 && (
            <select
              value={indicationFilter}
              onChange={e => setIndicationFilter(e.target.value)}
              className="text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All indications</option>
              {indicationOptions.map(i => <option key={i} value={i}>{i}</option>)}
            </select>
          )}
        </div>

        {/* Feed */}
        {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}

        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="rounded-2xl ring-1 ring-zinc-200/80 dark:ring-white/10 bg-white/80 dark:bg-zinc-800/80 p-5 h-28 animate-pulse" />
            ))}
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="rounded-2xl ring-1 ring-zinc-200/80 dark:ring-white/10 bg-white/80 dark:bg-zinc-800/80 p-10 text-center">
            <FlaskConical className="w-8 h-8 text-zinc-300 dark:text-zinc-600 mx-auto mb-3" />
            <p className="text-sm text-zinc-500 dark:text-zinc-500">No articles found — try a different filter.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-zinc-400 dark:text-zinc-600">{filteredArticles.length} articles</p>
            {groupArticles(filteredArticles).map(item =>
              Array.isArray(item)
                ? <GroupedArticleCard key={item.map(a => a.id).join('-')} articles={item} />
                : <ArticleCard key={item.id} article={item} />
            )}
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

        {/* Archived version */}
        {!showArchive ? (
          <button
            onClick={() => setShowArchive(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors"
          >
            <Archive className="w-4 h-4" />
            View archived version (v1 — n8n digest agents)
          </button>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Archived Version — Industry News Digest Agents (v1)</h2>
              <button
                onClick={() => setShowArchive(false)}
                className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
              >
                Hide
              </button>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              The first iteration used n8n workflows for daily RSS digest emails. This was replaced by the current tailor-built Python-LLM hybrid agent with structured extraction and a web UI.
            </p>
            <ArchivedDigestAgents />
          </div>
        )}
      </div>
    </ProjectPageLayout>
  );
}
