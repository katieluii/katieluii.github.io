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

export type ETLMIndexEntry = {
  indication_code: string;
  indication: string;
  subtitle?: string;
};

export type TPPIndexEntry = {
  slug: string;
  title: string;
  indication_code?: string;
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

function indicationCodeFromTppSlug(slug: string): string | undefined {
  // tpp_<indication>_<segment>_<date> → indication
  const match = slug.match(/^tpp_([a-z0-9_]+?)_(?:1L|2L|3L|adjuvant|pediatric|MIBC|PSROC|post|BRAF|HER2pos|HRpos|TNBC|HRD|HRP|IDHmut)/);
  return match?.[1];
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
    return {
      slug,
      title: firstHeading(md) ?? slug,
      indication_code: indicationCodeFromTppSlug(slug),
    };
  })
  .sort((a, b) => a.title.localeCompare(b.title));

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
