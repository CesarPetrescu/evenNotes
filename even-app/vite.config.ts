import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true
  },
  plugins: [
    {
      name: 'copy-even-app-manifest',
      generateBundle() {
        this.emitFile({
          type: 'asset',
          fileName: 'app.json',
          source: readFileSync(resolve(__dirname, 'app.json'), 'utf8')
        });
      }
    }
  ]
});
