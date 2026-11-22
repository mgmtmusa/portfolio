# Lighter v2: summary

Branch: `upgrade/lighter-v2` (from `redesign/the-seam`). Not merged into `main`; `main` was not pushed.

## What changed

1. **Portrait-lens hero.** The homepage hero now leads with the headline **"I sell like a human. I measure like a machine."**, with name and role above it.
   - On a mouse or trackpad, a lens follows the pointer over the studio portrait and reveals the robot render (`robot.png`) inside a circle. It's built with a CSS mask, so there's no canvas and no library. Total JS on the page is still about 0.2 KB.
   - On touch screens, a **Machine view** switch reveals the whole robot layer, and so does tapping the portrait. Keyboard and reduced-motion users get the same switch, and with reduced motion the change is instant. Each change is announced to screen readers.
   - Without JavaScript the visitor just sees the portrait, and the switch stays hidden.
   - The robot image is a 27 KB WebP. It loads only when the page is idle or the visitor shows intent, so it's never on the critical path.
2. **Studio portrait** is served through `astro:assets` as responsive WebP (15 to 75 KB depending on screen), loaded eagerly at high priority. Alt text: *"Studio portrait of Musa Abdullah Walid: a bearded man with swept-back black hair and gold wire-framed glasses, in a navy pinstripe double-breasted suit, white shirt and patterned tie, against a plain grey backdrop."* It's also added as `image` in the Person JSON-LD.
3. **Work rights.** "Full Australian working rights" is replaced everywhere with *"Full work rights until January 2028 (subclass 485 visa), open to employer sponsorship."* It now appears in the hero and in the contact footer. The sentence is stored once, as `site.workRights` in `src/data/site.ts`.
4. **Download CV.** There are buttons in the hero and the contact footer, linking to `/cv/Musa-Walid-CV.pdf`. That file is a valid one-page "CV coming soon" placeholder.
   - **To swap:** replace `public/cv/Musa-Walid-CV.pdf` with the final PDF, keeping the same name, and push. No code change is needed. The README explains this too.
   - No phone number or home address was on the site. A new test now checks every page for them.
5. **Em-dashes** are removed from all site copy, page titles and the og:image alt text, replaced with commas, colons or full stops. A test checks every page's source for them.
6. **Vercel Web Analytics:** `@vercel/analytics` is installed and its Astro component is in the base layout.
7. **iPhone cards.** The three top cards are now a flat 2D fan under the portrait. On phones each card becomes a full-width row, so all its text is readable and the whole row is the tap target. The old 3D layers (which once painted over card text in Safari) and the pointer tilt are gone. Hover styles only apply on devices that really hover, so on iPhone a single tap opens the card.

## Build and test results

- `npm run build`: passes (5 pages). `astro check`: 0 errors, 0 warnings.
- Playwright (`npm run test:e2e`): **173 passed, 0 failed, 67 skipped**, with the same result on two full runs. The skips are by design: some tests run only on desktop or only in Chromium. Before these changes the suite stood at 113 passed and 63 skipped.
  - Tests updated because the intended behaviour changed:
    - The h1 is now the headline rather than the name.
    - The card tap tests scroll each card into view first, since on phones the cards now sit below the portrait.
    - The card screenshot baselines are regenerated for the flat hand. I checked them by eye in Chromium, WebKit and iPhone.
  - New tests:
    - Lens: alt text, toggle and its announcement, pointer lens, touch fallback, reduced motion, no-JS, and the robot image staying off the critical path.
    - iPhone: every card's text is visible and not covered by anything else.
    - CV: the PDF is served correctly.
    - The 485 wording is present.
    - Analytics: the script is requested.
    - Every page: no em-dashes, phone numbers or street addresses.
- Lighthouse on the local production build (`scripts/qa/lighthouse.mjs`, median of 3):

  | | Perf | A11y | Best practices | SEO | LCP | CLS | Total weight |
  |---|---|---|---|---|---|---|---|
  | Mobile | 100 | 100 | 96 | 100 | 1.28 s | 0 | 102 KB |
  | Desktop | 100 | 100 | 96 | 100 | 0.32 s | 0 | 102 KB |

  The only Best Practices failure is a console 404 for `/_vercel/insights/script.js`. That file only exists on Vercel once Web Analytics is turned on for the project, so a local preview always gets the 404. One of the three mobile runs scored 72 because of a one-off 2-second spike in blocking time. The other two runs were at 0 and 37 ms, so I treated it as noise from the machine.

## Left undone / needs Musa

- **Turn on Web Analytics in the Vercel dashboard:** Project, then Analytics, then Enable (free on Hobby). Until it's on, the script 404s in production too and no data is collected. I didn't change any Vercel settings.
- **Final CV:** replace the placeholder PDF when it's ready, as described in item 4.
- **Real iPhone check:** I tested in Playwright's iPhone 14 (WebKit) emulation, not on a physical phone. A quick look on a real iPhone after the preview deploys is worth doing.
- **Kept out of scope on purpose:** the prototype's annotations, telemetry strip, dark machine theme and scroll-driven "turn" video belong to the full rebuild.
- `docs/evidence/prod/case/` was already untracked before this work. I left it alone.

## New commits on this branch

```
4132b3d Add a QA script that screenshots the lens hero across devices
7081cf4 Update hero tests for the lens and add lens coverage
6cb1b9f Bring the portrait lens into the homepage hero
dc0f0d9 Enable Vercel Web Analytics
65ef581 Test the CV download, 485 wording and copy hygiene on every page
2c89464 Add Download CV buttons with a swappable placeholder PDF
717189b State work rights as subclass 485 until January 2028, open to sponsorship
da78ea5 Remove em-dashes from site copy and page titles
```

(Plus the commit that adds this summary.)
