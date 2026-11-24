# Portrait grading (on-device, no AI edits)

The site shows one real photo: `src/assets/portrait/musa-portrait.jpg` (1254×1254). It is graded, never altered.

1. `mask.swift` makes a subject matte with Apple's Vision person segmentation (`person-mask.png`). Nothing leaves the Mac.
2. `grade.swift` grades the whole image once and writes `musa-portrait-graded.webp` (lossless master; Astro makes the AVIF and WebP sizes).

```bash
swiftc -O scripts/portrait/grade.swift -o /tmp/grade
ERODE=1 HI_T=0.84 HI_S=0.85 KEY_LOW=0.90 POOL_R=13 POOL_G=11 POOL_B=9 POOL_X=0.38 POOL_Y=0.18 POOL_S=0.09 \
  /tmp/grade src/assets/portrait/musa-portrait.jpg scripts/portrait/person-mask.png /tmp/photo.png photo
cwebp -lossless -z 6 /tmp/photo.png -o src/assets/portrait/musa-portrait-graded.webp
```

What the `photo` mode does: exposure 0.90, mids gamma 1.06, highlights rolled off above 0.84, warmth R×1.05 B×0.90 eased toward neutral in the highlights (so the shirt stays white), navy pulled 35% toward luminance, a luminance-only key falloff from the upper left (no colour on the face), black mapped exactly to the page colour #121110, the grey backdrop darkened toward a warm wall (#1F1C19 near his head, falling to the page colour) through the matte with edge decontamination, and an elliptical dissolve to transparent at the frame plus a bottom fade, so no rectangle shows. The edge band takes the darkest quarter of hair pixels at least 2px inside the matte (or the hair's base tone), a 4×4 ordered dither breaks up contours in the falloff, shadows keep R ≥ G ≥ B, and a final pass replaces isolated grey backdrop specks on the hair outline (neutral, bright, within 3px of the wall, not continuing inward as a strand) with the hair 6 to 10px inward.
