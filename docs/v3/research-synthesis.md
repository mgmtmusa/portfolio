# Research synthesis: the two references and Liquid Glass

One page. Internal screenshots live in `docs/v3/research/` (git- and Vercel-ignored, never shipped).

## What we looked at

- **carterogunsola.com** live at 1440×900 and iPhone 14: home index, ⌘K menu, status strip, chrome.
- **unanim.studio** live at 1440×900 and iPhone 14: hero, studio statement, checkerboard work, floating pill, footer.
- **Liquid Glass** through the `apple-design` skill (materials, depth, restraint) and the Appendix B recipe.

## Findings

1. **Both sites feel lived in because the chrome tells the truth.** Carter's strip shows build facts (LCP, FPS, booking slot); Unanim shows a clock and "1 slot left". The family trait is *honest, live metadata in mono at the edge of the screen*. For Musa that's Melbourne time, availability and reply time, which are real and need no service.
2. **Confidence comes from scale contrast, not decoration.** Unanim sets one giant word against a quiet field; Carter sets a small centred title in a vast dark room. Neither uses gradients, cards or icon rows on the first screen. Big type plus a lot of dark space is the shared move.
3. **Their imagery carries the page; Musa has none.** Both lean on client work. Musa's ad accounts belong to his employers, so his numbers have to *become* the imagery, set as display type. This confirms the brief's "every number footnoted" idea as the right translation, not a compromise.
4. **One persistent control surface.** Carter: a top pill nav plus ⌘K. Unanim: a bottom-centre pill that opens upward, plus a follow-along booking card. On a phone both put the control in thumb reach. The family trait is *one floating, rounded control object that never leaves*.
5. **Sheets over an index keep context.** Unanim opens a case as a sheet over the work list with a counter and Close. It suits a visitor comparing three cases in 90 seconds.
6. **Selling the whole way down.** Unanim's booking card follows the scroll. For a hiring audience the equivalent is the dock's "Get in touch" plus Download CV, one action from anywhere.
7. **Glass only works over something.** Carter's ⌘K panel over the dark 3D index reads as glass because tiles sit behind it; over flat black it would be a grey box. Liquid Glass is mostly clear: a lit rim, edge bending, minimal fill.

## Signatures we will not use

Carter: the lanyard badge, postage stamp, animal-name cursors, letter-and-receipt contact form, floating 3D tile index, lab wheel, `KEY::VALUE` labels, "N°" counter, Oracle and PP Neue Montreal Mono, his copy. Unanim: the checkerboard grid, pixel-resolve images, edge-to-edge wordmark treatment, Saans, their copy. Shared patterns we *may* use: a status strip, a floating dock, ⌘K, a sheet over an index, filter chips with counts, a name set large.

## Translation into Musa's own objects

| Their idea | Musa's version |
|---|---|
| Project imagery as the hero | Results set as display numerals, each with a footnote marker that opens its scope note |
| Live build stats in the strip | Melbourne time with seconds, availability, reply time |
| Booking card that follows you | The dock's "Get in touch", and an aim-to-reply-by date on the contact brief |
| Letter-style contact | A client brief that typesets itself as you write (no letter, no receipt) |
| 3D tiles / checkerboard work | Each case's headline figure plus one chart drawn from `site.ts` |
| Wordmark edge to edge | Musa's name as a masthead behind and around a graded portrait, crossed by one glass pane |

## Implications for the build

- Design the layer behind the glass first: the graded portrait, the masthead and a fixed warm light field.
- One rounded glass control object (the dock), one glass sheet, one glass ⌘K. Nothing else is glass.
- Mono for live metadata and footnotes only; a confident grotesk for display; Geist for reading.
- Motion: slow for the three signature moments, instant for everything a visitor repeats.
