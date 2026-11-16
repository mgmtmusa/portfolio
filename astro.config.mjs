import { defineConfig } from 'astro/config';

// Zero UI-framework runtime: pure static HTML + one tiny GSAP module.
export default defineConfig({
  compressHTML: true,
  build: {
    // Inline the (small) stylesheet so CSS never blocks first paint with an extra request.
    inlineStylesheets: 'always',
  },
});
