# Studio round 2: impeccable-finish-reviewer

**Verdict: CHANGES REQUIRED** (disposition: fix). Below-the-fold story beats not reviewed: round-4 captures are first viewport only. Needs `node scripts/qa/capture.mjs http://127.0.0.1:4322 docs/evidence/round-5/capture full` (home Path, Approach, CTA at 1440 and 390).

Round 1 items:
1. **Bend smoothness: partial.** "b" and "d" bowls now smooth in both engines. The "A" left leg still draws in hard steps; the "d" stem right edge and foot are still notched and clipped at the slab edge. Evidence: round-4/hero/chromium-1-rest.png and webkit-1-rest.png (x 600-1000, y 440-700); capture/home-1440.jpg (x 940-970, y 600-670). Code: src/scripts/bend.ts, `.slab` in Hero.astro.
2. Phone portrait dissolve: resolved.
3. iOS slab present: resolved (slab-present and rim-lit checks pass).
4. 28% marker: resolved.

New regression: **the Path light pool has a hard edge.** capture/home-1440.jpg field jumps 22 to 31 at y about 760 at the left edge (about 2 levels by the centre); same edge at y about 520 in hero/webkit-3-docked.png. Cause: `.path::before` (src/components/Path.astro:37) box starts 140px above the gradient centre but the radius is 900px, so the box top cuts the pool near full strength. Fix: box reaches past the radius on every side, or radius fits the box. Check 390 too (`max-width: 120vw` likely cuts it at x about 168).
