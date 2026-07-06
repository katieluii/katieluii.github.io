import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { atlasIntegrityGate } from './scripts/atlas-integrity-plugin';

// https://vitejs.dev/config/
export default defineConfig({
  base: '/',
  plugins: [react(), atlasIntegrityGate()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
