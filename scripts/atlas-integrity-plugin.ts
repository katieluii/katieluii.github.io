// Build-time integrity gate (vite plugin). Runs at buildStart on the SYNCED client
// bundle and FAILS the build (→ CI blocks the GH-Pages deploy) if any shipped headline
// number is not in a shippable verification state, or if editorial content leaked.
//
// Three states: GREEN (verified-primary) · AMBER (sourced-unverified / secondary —
// allowed to ship, listed as the value-pass backlog) · RED (needs-verification /
// placeholder / no state / editorial leak — blocks). Exit non-zero on RED only.
//
// Shares the SAME classifier the renderer uses (classifyEndpoint) so gate and UI can't
// diverge. Only the trivial key-picking is inlined (kept in sync with pickMetricKey).

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Plugin } from 'vite';
import { classifyEndpoint } from '../src/data/atlas/soc/classify';
import { PROFILE_OVERRIDES } from '../src/data/atlas/soc/profiles';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ATLAS_DIR = path.join(HERE, '..', 'src', 'data', 'atlas');
const ETLM_DIR = path.join(ATLAS_DIR, 'etlm');

// Vocabulary is loaded from scripts/atlas-leak-markers.json so this gate and the
// Python leak_gate() share ONE list and cannot drift. Previously the two were
// hand-maintained copies and the TS side was the narrower of the two.
const MARKERS = JSON.parse(
  fs.readFileSync(path.join(HERE, 'atlas-leak-markers.json'), 'utf8'),
) as { leak_markers: string[]; editorial_patterns: string[] };

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const EDITORIAL = new RegExp(MARKERS.editorial_patterns.map(escapeRe).join('|'), 'i');

/** Substring scan for the leak vocabulary over EVERY shipped Atlas file — not just
 *  etlm/. This runs at buildStart, so unlike the Python gate it always executes in
 *  CI. Covers files the sync never produces (repo-authored data under src/data/atlas). */
function scanBundleForLeaks(): string[] {
  const hits: string[] = [];
  const walkDir = (dir: string) => {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) { walkDir(full); continue; }
      if (!/\.(json|md)$/.test(entry.name)) continue;
      const text = fs.readFileSync(full, 'utf8');
      for (const marker of MARKERS.leak_markers) {
        const idx = text.indexOf(marker);
        if (idx === -1) continue;
        const snippet = text.slice(Math.max(0, idx - 30), idx + marker.length + 30).replace(/\n/g, ' ');
        hits.push(`${path.relative(ATLAS_DIR, full)}: '${marker}' → …${snippet}…`);
      }
    }
  };
  walkDir(ATLAS_DIR);
  return hits;
}

// --- inlined key-picking (mirror of presentationProfile.pickMetricKey) ---
function weekOf(key: string): number {
  const m = key.match(/(\d+)(?!.*\d)/);
  return m ? Number(m[1]) : 0;
}
function pickMetricKey(obj: unknown, match: string, strategy = 'latest_week'): string | undefined {
  if (typeof obj !== 'object' || obj === null) return undefined;
  const o = obj as Record<string, unknown>;
  const m = match.toLowerCase();
  const keys = Object.keys(o).filter((k) => k.toLowerCase().includes(m) && typeof o[k] === 'number');
  if (!keys.length) return undefined;
  if (strategy === 'first') return keys[0];
  if (strategy === 'max') return keys.reduce((a, b) => ((o[a] as number) >= (o[b] as number) ? a : b));
  if (strategy === 'min') return keys.reduce((a, b) => ((o[a] as number) <= (o[b] as number) ? a : b));
  keys.sort((a, b) => weekOf(b) - weekOf(a));
  return keys[0];
}

type Finding = { indication: string; asset: string; column: string; key: string; state: string };

function scanEtlm(indication: string, etlm: any): { red: Finding[]; amber: Finding[]; leaks: string[] } {
  const red: Finding[] = [];
  const amber: Finding[] = [];
  const leaks: string[] = [];

  // 1) editorial-leak scan over every shipped string (fail-closed)
  const walk = (v: unknown, p: string) => {
    if (typeof v === 'string') {
      if (EDITORIAL.test(v)) leaks.push(`${indication}${p}: ${v.slice(0, 60)}`);
    } else if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${p}[${i}]`));
    else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) walk(x, `${p}.${k}`);
  };
  walk(etlm, '');

  // 2) coverage: every rendered headline metric cell must classify to a shippable state.
  // Read the profile from the repo sidecar (sync-safe) first, then any embedded copy.
  const profile = (PROFILE_OVERRIDES as Record<string, any>)[indication] ?? etlm.presentation_profile;
  const cols = profile?.headline_table?.columns ?? [];
  const src = profile?.headline_table?.source;
  const assets: any[] = Array.isArray(etlm[src]) ? etlm[src] : Array.isArray(etlm.approved_therapies_novel)
    ? etlm.approved_therapies_novel : Array.isArray(etlm.approved_therapies) ? etlm.approved_therapies : [];
  for (const asset of assets) {
    const name = String(asset.brand ?? asset.drug_name ?? asset.asset_name ?? '?');
    for (const c of cols) {
      if (c.from !== 'metric' || !c.object) continue;
      const key = pickMetricKey(asset[c.object], c.match ?? '', c.pick);
      if (!key) continue; // no value displayed for this cell (n/r) — not a shipped number
      const st = classifyEndpoint(asset, key);
      const f: Finding = { indication, asset: name, column: c.label ?? c.key, key, state: st.verification };
      if (!st.shippable) red.push(f);
      else if (st.verification !== 'verified-primary') amber.push(f);
    }
  }
  return { red, amber, leaks };
}

export function atlasIntegrityGate(): Plugin {
  return {
    name: 'atlas-integrity-gate',
    buildStart() {
      if (!fs.existsSync(ETLM_DIR)) return;
      const files = fs.readdirSync(ETLM_DIR).filter((f) => f.endsWith('.json'));
      const allRed: Finding[] = [];
      const allAmber: Finding[] = [];
      const allLeaks: string[] = [];
      for (const f of files) {
        const etlm = JSON.parse(fs.readFileSync(path.join(ETLM_DIR, f), 'utf8'));
        const { red, amber, leaks } = scanEtlm(f.replace('.json', ''), etlm);
        allRed.push(...red); allAmber.push(...amber); allLeaks.push(...leaks);
      }
      // bundle-wide leak scan (all of src/data/atlas, shared vocabulary)
      allLeaks.push(...scanBundleForLeaks());
      // AMBER backlog (informational — allowed to ship)
      if (allAmber.length) {
        console.log(`\n[atlas-integrity] ${allAmber.length} AMBER (sourced-unverified — ship-ok, value-pass backlog):`);
        for (const a of allAmber) console.log(`  ~ ${a.indication} · ${a.asset} · ${a.column} (${a.key})`);
      }
      // RED blocks the build
      if (allRed.length || allLeaks.length) {
        console.error(`\n[atlas-integrity] BUILD BLOCKED — ${allRed.length} unshippable numbers, ${allLeaks.length} editorial leaks:`);
        for (const r of allRed) console.error(`  ✗ ${r.indication} · ${r.asset} · ${r.column} (${r.key}) = ${r.state}`);
        for (const l of allLeaks) console.error(`  ✗ LEAK ${l}`);
        this.error(`atlas-integrity gate failed: ${allRed.length} RED numbers, ${allLeaks.length} leaks. Fix or gap before shipping.`);
      } else {
        console.log(`[atlas-integrity] ✓ all shipped headline numbers carry a shippable verification state (${allAmber.length} amber backlog).`);
      }
    },
  };
}
