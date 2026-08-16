import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { atlasIntegrityGate } from './scripts/atlas-integrity-plugin';
import { bellwetherSyncGate } from './scripts/bellwether-sync-plugin';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

// Per-checkout dev port. Derive a deterministic port from THIS checkout's
// absolute path so parallel worktrees / dated snapshots never fight over 5173.
// Computed at server start from the config file's own dir — so a checkout made
// with bare `git worktree add` (outside any tooling) is still isolated.
// Override with `PORT=xxxx npm run dev` to force a specific port.
const projectDir = dirname(fileURLToPath(import.meta.url));
const portFromPath =
  4000 + (parseInt(createHash('sha1').update(projectDir).digest('hex').slice(0, 6), 16) % 1000);
const devPort = Number(process.env.PORT) || portFromPath;

// https://vitejs.dev/config/
export default defineConfig({
  base: '/',
  plugins: [react(), atlasIntegrityGate(), bellwetherSyncGate()],
  server: { port: devPort },
  preview: { port: devPort },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
