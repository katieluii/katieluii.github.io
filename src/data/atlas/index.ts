// Aggregator for synced Atlas content. The sync script
// (`scripts/sync-atlas-content.py`) writes:
//   - etlm/<indication>.json
//   - tpp/<slug>.md
//   - theme/<slug>.md
//   - ecosystem.md
//   - cross_link_map.json
//
// Vite's import.meta.glob discovers them at build time. This module
// surfaces the indexes the landing page consumes; the viewer pages
// pick the file they need by route param.

import { INDICATION_DISPLAY, indicationDisplay } from './taxonomy';

export type ETLMIndexEntry = {
  indication_code: string;
  indication: string;
  subtitle?: string;
};

export type TPPIndexEntry = {
  slug: string;
  title: string; // raw first heading (may be generic, e.g. "Target Product Profile")
  indication_code?: string;
  indication_display: string;
  segment: string; // short primary segment label
  segment_full: string; // full segment text
  date?: string;
};

export type ThemeIndexEntry = {
  slug: string;
  title: string;
  indications_touched?: string[];
};

const etlmModules = import.meta.glob('./etlm/*.json', { eager: true }) as Record<
  string,
  { default: Record<string, unknown> }
>;

const tppModules = import.meta.glob('./tpp/*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;

const themeModules = import.meta.glob('./theme/*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;

const ecosystemModule = import.meta.glob('./ecosystem.md', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;

function slugFromPath(path: string): string {
  const name = path.split('/').pop() ?? path;
  return name.replace(/\.(json|md)$/, '');
}

function firstHeading(md: string): string | undefined {
  const match = md.match(/^#\s+(.+?)\s*$/m);
  return match?.[1];
}

// Resolve indication code by longest known-code prefix match on the slug
// (handles multi-underscore codes like nhl_dlbcl). Falls back to the legacy
// segment-token heuristic.
function indicationCodeFromTppSlug(slug: string): string | undefined {
  const codes = Object.keys(INDICATION_DISPLAY).sort((a, b) => b.length - a.length);
  for (const code of codes) {
    if (slug.startsWith(`tpp_${code}_`)) return code;
  }
  const match = slug.match(/^tpp_([a-z0-9_]+?)_(?:1L|2L|3L|adjuvant|pediatric|MIBC|PSROC|post|BRAF|HER2pos|HRpos|TNBC|HRD|HRP|IDHmut)/);
  return match?.[1];
}

// Parse "TPP — {IND} — {SEGMENT} ({DATE})" titles; fall back to slug-derived
// segment when the heading is generic (e.g. "# Target Product Profile").
function parseTpp(
  slug: string,
  md: string,
): { indication_code?: string; indication_display: string; segment: string; segment_full: string; date?: string } {
  const code = indicationCodeFromTppSlug(slug);
  const date = slug.match(/(\d{4}-\d{2}-\d{2})/)?.[1];
  const heading = firstHeading(md) ?? '';
  const titleMatch = heading.match(/^TPP\s*[—-]\s*(.+?)\s*[—-]\s*(.+?)\s*(?:\(\d{4}-\d{2}-\d{2}\))?\s*$/);

  let segmentFull: string;
  let displayFromTitle: string | undefined;
  if (titleMatch) {
    displayFromTitle = titleMatch[1].trim();
    segmentFull = titleMatch[2].trim();
  } else {
    // Derive segment from slug: strip tpp_<code>_ prefix and _<date> suffix.
    const stripped = slug
      .replace(/^tpp_/, '')
      .replace(code ? new RegExp(`^${code}_`) : /^/, '')
      .replace(/_\d{4}-\d{2}-\d{2}$/, '')
      .replace(/_/g, ' ');
    segmentFull = stripped.replace(/\bcart\b/gi, 'CAR-T').replace(/\b\w/g, (c) => c.toUpperCase());
  }

  // Short label: first clause before a comma / em-dash / colon, capped.
  const segment = (segmentFull.split(/\s*[,—:]\s*/)[0] || segmentFull).slice(0, 70).trim();

  return {
    indication_code: code,
    indication_display: indicationDisplay(code, displayFromTitle),
    segment,
    segment_full: segmentFull,
    date,
  };
}

function indicationsTouchedFromThemeMd(md: string): string[] | undefined {
  // Look for a "Indications touched" / "Indications affected" line near the top
  const match = md.match(/^(?:Indications? (?:touched|affected|covered)):\s*(.+)$/im);
  if (!match) return undefined;
  return match[1]
    .split(/[,;]/)
    .map((s) => s.trim().toLowerCase().replace(/\s+/g, '_'))
    .filter(Boolean);
}

export const etlmIndex: ETLMIndexEntry[] = Object.entries(etlmModules)
  .map(([path, mod]) => {
    const code = slugFromPath(path);
    const data = mod.default as Record<string, unknown>;
    return {
      indication_code: (data.indication_code as string) ?? code,
      indication: (data.indication as string) ?? code.toUpperCase(),
      subtitle: (data.therapeutic_area as string) ?? undefined,
    };
  })
  .sort((a, b) => a.indication.localeCompare(b.indication));

export const tppIndex: TPPIndexEntry[] = Object.entries(tppModules)
  .map(([path, md]) => {
    const slug = slugFromPath(path);
    const parsed = parseTpp(slug, md);
    return {
      slug,
      title: firstHeading(md) ?? slug,
      ...parsed,
    };
  })
  .sort((a, b) => a.segment.localeCompare(b.segment));

export const themeIndex: ThemeIndexEntry[] = Object.entries(themeModules)
  .map(([path, md]) => {
    const slug = slugFromPath(path);
    return {
      slug,
      title: firstHeading(md) ?? slug,
      indications_touched: indicationsTouchedFromThemeMd(md),
    };
  })
  .sort((a, b) => a.title.localeCompare(b.title));

export const hasEcosystem = Object.keys(ecosystemModule).length > 0;

export function getETLM(indication_code: string): Record<string, unknown> | undefined {
  for (const [path, mod] of Object.entries(etlmModules)) {
    if (slugFromPath(path) === indication_code) return mod.default;
  }
  return undefined;
}

export function getTPP(slug: string): string | undefined {
  for (const [path, md] of Object.entries(tppModules)) {
    if (slugFromPath(path) === slug) return md;
  }
  return undefined;
}

export function getTheme(slug: string): string | undefined {
  for (const [path, md] of Object.entries(themeModules)) {
    if (slugFromPath(path) === slug) return md;
  }
  return undefined;
}

export function getEcosystem(): string | undefined {
  const entries = Object.values(ecosystemModule);
  return entries[0];
}

// Cross-link map (built by sync script).
// Shape:
//   {
//     "etlm_to_tpps": { "nsclc": ["tpp_nsclc_1L_..."] },
//     "etlm_to_themes": { "nsclc": ["adc_class_state_..."] },
//     "tpp_to_etlm": { "tpp_nsclc_1L_...": "nsclc" },
//     "theme_to_indications": { "adc_class_state_...": ["nsclc", "breast", ...] }
//   }
export type CrossLinkMap = {
  etlm_to_tpps?: Record<string, string[]>;
  etlm_to_themes?: Record<string, string[]>;
  tpp_to_etlm?: Record<string, string>;
  theme_to_indications?: Record<string, string[]>;
};

const crossLinkModules = import.meta.glob('./cross_link_map.json', {
  eager: true,
}) as Record<string, { default: CrossLinkMap }>;

const _crossLinkEntries = Object.values(crossLinkModules);
export const crossLinks: CrossLinkMap =
  _crossLinkEntries.length > 0 ? _crossLinkEntries[0].default : {};
