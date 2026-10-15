import { readFileSync, readdirSync } from 'node:fs';
import { defineConfig } from 'vite';

const { version } = JSON.parse(readFileSync('package.json', 'utf8'));
const buildId = String(Date.now());

// The website polls version.json to notice a newer deploy (see src/status.js).
const versionFile = {
  name: 'version-file',
  generateBundle() {
    this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify({ build: buildId }) });
  },
};

// The website's service worker (src/sw.js), with the list of files to keep for offline use.
const serviceWorker = {
  name: 'service-worker',
  generateBundle(_, bundle) {
    const files = ['./', ...Object.keys(bundle), ...readdirSync('public')];
    const source = readFileSync('src/sw.js', 'utf8')
      .replace('__FILES__', JSON.stringify(files))
      .replace('__BUILD_ID__', JSON.stringify(buildId));
    this.emitFile({ type: 'asset', fileName: 'sw.js', source });
  },
};

// Relative paths so the same build works on GitHub Pages, in Electron (file://) and in Capacitor.
// The Windows and Android builds use `--mode app`, which checks GitHub releases for updates instead.
export default defineConfig({
  base: './',
  define: { __APP_VERSION__: JSON.stringify(version), __BUILD_ID__: JSON.stringify(buildId) },
  plugins: [versionFile, serviceWorker],
});
