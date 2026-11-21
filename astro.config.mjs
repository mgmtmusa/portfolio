import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://portfolio-omega-gold-33.vercel.app',
  compressHTML: true,
  build: {
    // Inline the stylesheet so CSS never blocks first paint with an extra request.
    inlineStylesheets: 'always',
  },
});
