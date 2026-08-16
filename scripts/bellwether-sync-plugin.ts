// Build-time freshness gate (vite plugin). The Bellwether page reads
// src/data/bellwether.generated.json, which scripts/sync-bellwether-data.mjs derives from
// public/demos/pharma-landscape.html (the artefact the WS6 refresh loop edits and a human
// promotes). If the JSON is stale relative to the demo, the two surfaces would ship
// disagreeing numbers — so the build FAILS here (→ CI blocks the GH-Pages deploy) with the
// one command that fixes it. Runs at buildStart, dev and build alike.
import fs from 'node:fs';
import type { Plugin } from 'vite';

export function bellwetherSyncGate(): Plugin {
  return {
    name: 'bellwether-sync-gate',
    async buildStart() {
      const mod = await import('./sync-bellwether-data.mjs');
      const next: string = mod.serialize(mod.extract());
      const prev = fs.existsSync(mod.OUT) ? fs.readFileSync(mod.OUT, 'utf8') : null;
      if (prev !== next) {
        this.error(
          'Bellwether data out of sync: src/data/bellwether.generated.json does not match ' +
            'public/demos/pharma-landscape.html. Run: npm run sync:bellwether',
        );
      }
    },
  };
}
