# Round 4 review: head of engineering

Date: 25 November 2026, from 17:00. Branch `redesign/v3-dark`. The review covers `src`, `scripts` and `tests` at 7e017fe. HEAD is now dd3b127, but nothing in `src` or `scripts` has changed since 7e017fe. The round 3 HoE never reported, so this run covers the full section 9 gate set, plus a code review of the round 3 changes (`git diff f3e0c4c..HEAD`). All measurements ran against the current `dist/` (built 16:37; it contains the round 3 markup: `decoding="sync"`, the Dock script, "Download CV (PDF)"), served at http://127.0.0.1:4330. Scratch output is in the session scratchpad (`lh/`, `perf/`, `probe.cjs`, `p2.cjs`, `p3.cjs`).

## Verdict: APPROVED

Every gate passes. Round 2 fix 1 (the light pool's hard edge) is closed: both pools now drop `max-width` and use `closest-side` (`Path.astro:20-21`, `CaseTeasers.astro:54-61`). None of the round 3 code changes has an engineering defect. The items under Low below do not block.

## Gates

| Gate | Measured | Source |
|---|---|---|
| Build | OK | coordinator, reused |
| Types | `astro check` 0 errors | coordinator, reused |
| Unit | 99/99 | coordinator, reused |
| Facts | PASS | coordinator, reused |
| Playwright, 4 projects | 938 passed, 0 failed, 110 skipped | coordinator, reused (`--workers=2`) |
| Lighthouse mobile, home, median of 5 | **100 / 100 / 100 / 100**. LCP 1503ms, CLS 0, TBT 0, FCP 1204ms | `node scripts/qa/lighthouse.mjs http://127.0.0.1:4330/ <scratch>/lh 5 mobile` |
| Lighthouse desktop, home, median of 5 | **100 / 100 / 100 / 100**. LCP 363ms, CLS 0, TBT 0 | same, `desktop` |
| Lighthouse mobile, `/contact/`, median of 3 | 100 / 100 / 100 / 100. LCP 1205ms, CLS 0 | same URL, `3 mobile` (the Dock change lands here) |
| Lighthouse mobile, `/work/evitech/`, median of 3 | 100 / 100 / 100 / 100. LCP 1355ms, CLS 0 | same URL, `3 mobile` |
| JS before `load`, gzipped | **8.0 KB** home, 7.7 KB contact (limit 150). Lazy 23.8 KB | Lighthouse runs above |
| INP, 4× CPU | worst **80ms** over 20 interactions (⌘K open, typing and close, footnote open and close, slab press, slab drag, Copy email). Limit 200. Round 2 was 56 | `node scripts/qa/perf.mjs http://127.0.0.1:4330 <scratch>/perf` |
| Frames, headed wheel scroll | 120Hz, limit 12.5ms: 100% of 602 frames within it, 0 long tasks | same |
| Bend build | not re-measured: `bend.ts` is unchanged since round 2 (cold 5.1 / warm 1.5 / land 9.2ms desktop). `perf.mjs` reports null without a dev URL, as expected | |
| Glass, visible `backdrop-filter` | max **2** visible at once, across 8 pages × 4 scroll depths, on Chromium 1440 and WebKit iPhone 14 (limit 4). The contact dock, hidden, does not count (`visibility: hidden`) | `probe.cjs` |
| Glass, solid fallbacks | `prefers-reduced-transparency` rules ship (`glass.css`, in `dist/index.html`, `contact`, `404`). `glass.spec` passes on 4 projects | grep, plus the coordinator Playwright run |
| No-JS | all 8 pages render their content (home 680 words, evitech 956, contact 135). Hidden without JS: only footnote numerals in closed popovers, the contact live preview and reply-by line, and the CV "Copy email" button. All of these are JS-only by design. `nojs.spec` passes | `probe.cjs` with `javaScriptEnabled: false` |
| Console errors | **0** on 8 pages in Chromium and WebKit, including a client-router round trip from contact to about and back | `probe.cjs` |
| Em dash, phone, address | 0 U+2014, 0 `&mdash;`, 0 phone patterns, 0 `tel:`, 0 street or state-postcode patterns in `dist/` HTML, JS, txt and xml | grep |
| View-transition names | no duplicate computed `view-transition-name` on any page (checked for the new `lbl-*` names) | `p3.cjs` |
| LCP preload parity | the preload's `imagesrcset`, `imagesizes` and `type` match the AVIF `<source>` exactly. The img is `eager` / `fetchpriority=high` / `decoding=sync` | node check on `dist/index.html` |
| Safety | No branch switch, commit, push or deploy by me. The only file written is this one | |

## Round 3 code review

- **`Dock.astro:74-106` (contact dock script). Sound.**
  - `arm()` runs on `astro:page-load`, which fires on first load and after every client navigation. It calls the previous `stop()` first, so a second page-load cannot stack listeners.
  - `astro:before-swap` removes all four listeners (window scroll, the `matchMedia` change, form `focusin` and `focusout`) and clears `data-up` on the persisted dock.
  - Measured on WebKit iPhone 14 at contact:
    - rest: hidden, opacity 0
    - scrolled 400: up
    - field focused: hidden
    - blurred: up
  - After navigating to `/about/` and scrolling, the dock is visible with no `data-up`, so no stale contact state survives. Back to contact restores it to up.
  - `focusout` uses `relatedTarget`, so tabbing between fields does not flicker the dock.
  - `visibility` is delayed by `--dur-ui` on the way out, so the fade is not cut short.
- **`Path.astro:100-124` (first-callback placement). Sound.**
  - The rung is placed instantly at script time from geometry. It is re-placed in the observer's guaranteed first callback, with the transition still `none` and a forced reflow before the transition is restored, so a restored scroll position cannot animate.
  - `reading()` uses the same band edge (45%) as the observer's `rootMargin` bottom (-55%), so the two cannot disagree.
- **`Hero.astro:50` plus `Base.astro:63` (`decoding="sync"` with preload). Sound.**
  - The preload matches the AVIF source character for character, so the bytes are reused.
  - Sync decode of a 29 to 48 KB AVIF costs no measurable main-thread time: TBT 0, and mobile LCP is the same 1503ms as round 2.
- **Also checked:**
  - The `lbl-*` view-transition names are unique per page, and only the non-inert covers get one.
  - The `:only-child` fades cover the no-twin case.
  - `command.ts`, the footer label and the `Footnote.astro` padding are trivial.

## Material fixes

None.

## Low (not blocking)

1. **`/contact/` has no site navigation at rest.**
   - **Cause:** there is no header; the dock is the only primary navigation. `Dock.astro:32-35` with `REST = 160` (`:76`, `:86`) hides it on every width until the reader scrolls past 160px.
   - **Measured:** on iPhone 14 at load, I found no visible link or button outside the form.
   - **Exits that remain:**
     - scrolling down
     - browser Back
     - the footer links
     - ⌘K (desktop keyboard only)
   - **Context:** this is the creative director's r3 ruling, so it stays unless design reverses it.
   - **Cheapest softening:** apply the rest rule only at `max-width: 639px`. On desktop the dock does not sit over the form fields.
2. **Phone portrait is still over F9's 40 KB.** At DPR 2.625 and 3, the browser picks the 1240w AVIF, which is 48,092 bytes. This is carried from round 2 Low 1. LCP is healthy (1503ms), with 300ms headroom.
3. **INP worst rose from 56ms to 80ms.** It is well inside 200ms, and the run-to-run noise on this memory-starved machine is about that size. I am noting it only so the next round can compare.
4. **Risks carried from round 2:**
   - R1, the shared light-pool class: still copied in two files, though both copies are now correct.
   - R3, pinning the frame limit to `min(16.7, 1.5 × vsync)`: this run was at 120Hz, so the limit was 12.5ms.
   - R4, real macOS Safari: still not run.
