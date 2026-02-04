import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { execSync } from 'child_process';

// Stamp the last git commit time into the bundle at build/dev-start time.
// Falls back to "now" if git isn't available (e.g. fresh clone with no history).
let buildTime;
try {
  buildTime = execSync('git log -1 --format=%ci', { encoding: 'utf8' }).trim();
} catch {
  buildTime = new Date().toISOString();
}

export default defineConfig({
  plugins: [react()],
  define: {
    __BUILD_TIME__: JSON.stringify(buildTime)
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  }
});
