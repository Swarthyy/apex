import { defineConfig } from 'vite'
import * as path from 'path'
import * as os from 'os'

export default defineConfig({
  // Use temp directory for cache to avoid iCloud Drive issues
  cacheDir: path.join(os.tmpdir(), 'apex-vite-cache'),

  server: {
    watch: {
      // Use polling instead of native file system events
      // This is critical for iCloud Drive compatibility
      usePolling: true,
      interval: 500,
      // Ignore node_modules to reduce overhead
      ignored: ['**/node_modules/**', '**/.git/**'],
    },
    // Prevent timeout during startup
    hmr: {
      overlay: true,
      protocol: 'ws',
      host: 'localhost',
    },
    // Disable auto-open to avoid browser launch delays
    open: false,
    // Force port to ensure consistency
    port: 5173,
    strictPort: false,
  },
  // Optimize dependency pre-bundling with temp directory
  optimizeDeps: {
    // Force dependency re-bundling
    force: false,
    // Exclude problematic dependencies
    exclude: [],
  },
  // Ensure proper path resolution
  root: '.',
  publicDir: false, // No public dir in this project

  // Build settings to use temp directory
  build: {
    outDir: 'dist',
  },
})
