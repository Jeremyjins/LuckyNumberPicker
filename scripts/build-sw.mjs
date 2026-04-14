/**
 * Post-build script: compile app/sw.ts → build/client/sw.js,
 * then inject Workbox precache manifest from build/client assets.
 */
import { build } from 'vite';
import { injectManifest } from 'workbox-build';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

// Step 1: Compile app/sw.ts to build/client/sw.js using Vite
console.log('[SW] Compiling app/sw.ts...');
await build({
  root,
  configFile: false,
  build: {
    emptyOutDir: false,
    outDir: 'build/client',
    lib: {
      entry: 'app/sw.ts',
      formats: ['es'],
      fileName: () => 'sw.js',
    },
    rollupOptions: {
      output: {
        entryFileNames: 'sw.js',
      },
    },
  },
});

// Step 2: Inject Workbox precache manifest
console.log('[SW] Injecting precache manifest...');
const { count, size } = await injectManifest({
  swSrc: resolve(root, 'build/client/sw.js'),
  swDest: resolve(root, 'build/client/sw.js'),
  globDirectory: resolve(root, 'build/client'),
  globPatterns: ['**/*.{js,css,html,png,svg,ico,woff,woff2}'],
  globIgnores: ['sw.js', 'node_modules/**/*'],
  // Do not fail on URL-unfriendly characters in filenames
  dontCacheBustURLsMatching: /\.[a-f0-9]{8}\./,
  maximumFileSizeToCacheInBytes: 3 * 1024 * 1024, // 3MB
});

console.log(`[SW] Precached ${count} files (${(size / 1024).toFixed(1)} KiB)`);
