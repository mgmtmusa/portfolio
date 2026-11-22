# Personal brand portfolio

Astro + GSAP. All content lives in `src/data/site.ts`.

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # static output in dist/
```

**CV:** the "Download CV" buttons link to `public/cv/Musa-Walid-CV.pdf`. It's a "CV coming soon"
placeholder for now. To publish the real CV, replace that file with the final PDF under the same
name and push. No code change needed.

Deploys to Vercel with zero config (framework preset: Astro).

Live: https://portfolio-omega-gold-33.vercel.app. Every push to `main` deploys automatically.
