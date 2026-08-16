// Bellwether — one data source, two surfaces.
//
// The full landscape (public/demos/pharma-landscape.html) is the artefact the WS6 refresh
// loop edits and a human promotes. The React page (/pharma-landscape) used to carry a
// HAND-PORTED copy of the same numbers in src/data/pharmaLandscape.ts, so every promote
// left the two surfaces free to disagree. This script extracts the data blocks the refresh
// SOP is allowed to touch (D · POS · SIGNALS · convThemes · eras · DATA_ASOF · REFRESHED)
// out of the demo's <script> and writes src/data/bellwether.generated.json, which the
// page imports. Run:  npm run sync:bellwether   (the build gate fails if it is stale).
//
// Usage:  node scripts/sync-bellwether-data.mjs          # write the JSON
//         node scripts/sync-bellwether-data.mjs --check  # exit 1 if the JSON is stale

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..');
export const DEMO = path.join(ROOT, 'public', 'demos', 'pharma-landscape.html');
export const OUT = path.join(ROOT, 'src', 'data', 'bellwether.generated.json');

const BLOCKS = ['D', 'eras', 'convThemes', 'DATA_ASOF', 'REFRESHED', 'SIGNALS', 'POS'];

/** Return the source text of `const NAME=<expr>;` — bracket-matched, string-aware. */
function extractConst(src, name) {
  const re = new RegExp(`(^|\\n)const ${name}\\s*=`);
  const m = re.exec(src);
  if (!m) throw new Error(`sync-bellwether: const ${name} not found in ${DEMO}`);
  let i = m.index + m[0].length;
  // scalar (string) constants: read to the end of the line
  if (/["'`]/.test(src[i]) || /^\s*["'`]/.test(src.slice(i, i + 3))) {
    const end = src.indexOf('\n', i);
    return src.slice(i, end).replace(/;\s*(\/\/.*)?$/, '').trim();
  }
  const open = src[i];
  const close = open === '[' ? ']' : open === '{' ? '}' : null;
  if (!close) throw new Error(`sync-bellwether: const ${name} does not start with [ or {`);
  let depth = 0, inStr = null;
  for (let j = i; j < src.length; j++) {
    const ch = src[j];
    if (inStr) {
      if (ch === '\\') { j++; continue; }
      if (ch === inStr) inStr = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') { inStr = ch; continue; }
    if (ch === '/' && src[j + 1] === '/') { j = src.indexOf('\n', j); continue; }
    if (ch === open) depth++;
    else if (ch === close) { depth--; if (depth === 0) return src.slice(i, j + 1); }
  }
  throw new Error(`sync-bellwether: const ${name} never closes`);
}

export function extract() {
  const html = fs.readFileSync(DEMO, 'utf8');
  const script = /<script>([\s\S]*)<\/script>/.exec(html);
  if (!script) throw new Error('sync-bellwether: no <script> in the demo');
  const src = script[1];
  const ctx = {};
  vm.createContext(ctx);
  const out = {};
  for (const name of BLOCKS) {
    const expr = extractConst(src, name);
    out[name] = vm.runInContext(`(${expr})`, ctx, { timeout: 1000 });
  }
  // sanity: the shape the page relies on
  if (!Array.isArray(out.D) || out.D.length !== 13) throw new Error(`sync-bellwether: D has ${out.D && out.D.length} companies, expected the fixed 13-name roster`);
  for (const c of out.D) {
    // every key the page reads (src/data/pharmaLandscape.ts) — a dropped key must fail HERE, not in the browser
    for (const k of ['ticker', 'name', 'ccy', 'loeAsset', 'era', 'exp', 'q', 'qdate', 'rev', 'gr', 'fpe', 'ev', 'yld', 'stance', 'thesis', 'bull', 'bear', 'dev', 'ph']) {
      if (!(k in c)) throw new Error(`sync-bellwether: ${c.ticker || '?'} missing ${k}`);
    }
    if (!(c.fpe === null || typeof c.fpe === 'number')) throw new Error(`sync-bellwether: ${c.ticker} fpe must be number|null`);
    if (!Array.isArray(c.dev) || !Array.isArray(c.ph) || c.ph.length !== 5) throw new Error(`sync-bellwether: ${c.ticker} dev/ph shape`);
    if (!['high', 'med', 'low'].includes(c.exp)) throw new Error(`sync-bellwether: ${c.ticker} exp "${c.exp}"`);
    if (!(c.era in out.eras)) throw new Error(`sync-bellwether: ${c.ticker} era "${c.era}" not in eras`);
    if (!(c.ticker in out.POS)) throw new Error(`sync-bellwether: POS has no entry for ${c.ticker}`);
  }
  for (const t of out.convThemes) {
    if (t.n !== t.tk.length) throw new Error(`sync-bellwether: convergence "${t.name}" says n=${t.n} but lists ${t.tk.length} tickers`);
  }
  for (const k of ['buy', 'sell']) {
    if (!out.D.find((c) => c.ticker === out.SIGNALS[k].tk)) throw new Error(`sync-bellwether: SIGNALS.${k} names an unknown ticker`);
  }
  return {
    _generated: 'by scripts/sync-bellwether-data.mjs from public/demos/pharma-landscape.html — do not edit',
    dataAsOf: out.DATA_ASOF,
    reviewed: out.REFRESHED,
    eras: out.eras,
    companies: out.D,
    pos: out.POS,
    signals: out.SIGNALS,
    convergence: out.convThemes,
  };
}

export function serialize(data) {
  return JSON.stringify(data, null, 2) + '\n';
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const next = serialize(extract());
  const check = process.argv.includes('--check');
  const prev = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : null;
  if (check) {
    if (prev === next) { console.log('bellwether data: in sync'); process.exit(0); }
    console.error(`bellwether data: ${OUT} is stale — run: npm run sync:bellwether`);
    process.exit(1);
  }
  if (prev === next) { console.log('bellwether data: already in sync'); process.exit(0); }
  fs.writeFileSync(OUT, next);
  console.log(`bellwether data: wrote ${path.relative(ROOT, OUT)} (${extract().companies.length} companies, ${extract().dataAsOf})`);
}
