# Studio round 4: impeccable-finish-reviewer

**Verdict: APPROVED.** Scoped to the round 3 item (phone dock over the contact form).

- At rest (round-6/crops/contact-375-rest.png): no dock; "Who you are" label and field clear to the bottom edge. Original overlap fixed.
- Scrolled (contact-375-scrolled.png): content-width "Menu" pill, about 78px, centred, in the gap between fields; touches no label or input text.
- Focused (contact-375-focused.png): no dock; focus ring fully visible.
- Code: Dock.astro:32-35 visibility hidden (out of the tab order at rest); :86 shows only past 160px; :86, 95-96 hide on phones while focus is in [data-brief]; :105-106 rearm and tear down on swaps; phone pill max-width calc(100vw - 32px).
- Round 3 keep items untouched.

Non-blocking: without JS the dock shows at rest on /contact/ (accepted fallback). The fixed "Melbourne" clock in the status strip overlaps the top of a scrolled field; pre-existing, not this fix.

Material fixes: none.
