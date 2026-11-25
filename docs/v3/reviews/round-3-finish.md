# Studio round 3: impeccable-finish-reviewer

**Verdict: CHANGES REQUIRED** (disposition: fix; ceiling reached). Scoring pass on the named items.

Resolved: "A" leg smooth in both engines (round-5/hero/*-1-rest.png); "d" stem and foot (no notch or clip; ~3px tilt in the bend band is plausible, leave it); Path and CaseTeasers pools (only round banding rings at 12x stretch, no straight cuts at 1440/1024/390). Held: phone dissolve, iOS slab (gate PASS, rim lit), 28% marker. Below the fold at 1440 and 390: Path, Approach, CTA read cleanly.

Capture caveat (not a finding): full-page captures seam at viewport height because `.field` is `position: fixed; inset: 0` (src/styles/global.css:43).

Material fix:
1. **Phone dock sits on the contact form label at rest.** capture/contact-375.jpg y 600-655: the pill spans x 20-355 over "The role or project" and its hint. Not a stitching artefact: the dock is fixed at bottom 24px. Fix `.dock` (src/components/Dock.astro:21) at ≤480px: content-width pill, centred, and hidden while focus is inside the BriefForm. Body text under glass on the conversion page breaks the DESIGN glass rule.

Keep: the 4-pass supersampled bend and the round pools exactly as they are.
