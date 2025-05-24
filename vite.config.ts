import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import path from 'path';
import { fileURLToPath } from 'url';
import { build as viteBuild } from 'vite';

// ES modules fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2020',
    minify: 'esbuild',
    sourcemap: false,
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      input: {
        content: path.resolve(__dirname, 'src/content.ts'),
      },
      output: {
        entryFileNames: 'content.js',
        format: 'iife',
        inlineDynamicImports: true,
      },
    },
  },
  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: 'manifest.json',
          dest: '',
        },
        {
          src: 'icons/*.png',
          dest: 'icons',
        },
        {
          src: 'icons/*.svg',
          dest: 'icons',
        },
        {
          src: 'src/options.html',
          dest: '',
        },
      ],
    }),
    {
      name: 'build-options-script',
      apply: 'build',
      async closeBundle() {
        try {
          await viteBuild({
            configFile: false,
            root: __dirname,
            build: {
              outDir: path.resolve(__dirname, 'dist'),
              target: 'es2020',
              minify: 'esbuild',
              sourcemap: false,
              emptyOutDir: false,
              rollupOptions: {
                input: {
                  options: path.resolve(__dirname, 'src/options.ts'),
                },
                output: {
                  entryFileNames: 'options.js',
                  format: 'es',
                },
              },
            },
            plugins: [],
          });
        } catch (error) {
          console.error('Failed to build options.js:', error);
          throw error;
        }
      }
    }
  ],
}); 