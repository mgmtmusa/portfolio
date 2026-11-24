// Places each footnote popover next to its marker (anchor positioning isn't in every engine yet).
// A marker inside a hero figure group opens below that whole group (figures and labels), aligned to its column,
// so the note never covers the figures it explains; it flips above only when it would come within 24u of "Abdullah".
function capTopOfLine1(): number | null {
  const l1 = document.querySelector<HTMLElement>('.mast [data-line="1"]');
  if (!l1) return null;
  const probe = document.createElement('span');
  probe.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline';
  l1.appendChild(probe);
  const baseline = probe.getBoundingClientRect().bottom;
  probe.remove();
  const cs = getComputedStyle(l1);
  const c = document.createElement('canvas').getContext('2d');
  if (!c) return null;
  c.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
  return baseline - c.measureText('H').actualBoundingBoxAscent;
}

function place(pop: HTMLElement) {
  const btn = document.querySelector<HTMLElement>(`[popovertarget="${pop.id}"]`);
  if (!btn) return;
  const b = btn.getBoundingClientRect();
  const w = pop.offsetWidth, h = pop.offsetHeight, m = 16;
  const group = btn.closest<HTMLElement>('.hero .proof > li');
  if (group) {
    const g = group.getBoundingClientRect();
    const hero = document.querySelector<HTMLElement>('[data-hero]')!.getBoundingClientRect();
    const u = Math.min(1, hero.width / 1440);
    const left = Math.min(Math.max(m, g.left), innerWidth - w - m);
    let top = g.bottom + 8;
    const cap = innerWidth >= 640 ? capTopOfLine1() : null;
    const limit = Math.min(innerHeight - 96, cap === null ? Infinity : cap - 24 * u);
    if (top + h > limit) top = Math.max(m + 32, g.top - h - 8);
    pop.style.left = `${left}px`;
    pop.style.top = `${top}px`;
    return;
  }
  const left = Math.min(Math.max(m, b.left - 12), innerWidth - w - m);
  let top = b.bottom + 10;
  if (top + h > innerHeight - 96) top = Math.max(m + 32, b.top - h - 10);
  pop.style.left = `${left}px`;
  pop.style.top = `${top}px`;
}
function wire() {
  document.querySelectorAll<HTMLElement>('.fn-pop').forEach((pop) => {
    if (pop.dataset.wired) return;
    pop.dataset.wired = '1';
    pop.addEventListener('toggle', (e) => { if ((e as ToggleEvent).newState === 'open') { openedAt = scrollY; place(pop); } });
  });
}
wire();
document.addEventListener('astro:page-load', wire);
// A note closes once the page has really moved on (not on the scroll that brought its marker into view).
let openedAt = 0;
addEventListener('scroll', () => { if (Math.abs(scrollY - openedAt) > 48) document.querySelectorAll<HTMLElement>('.fn-pop:popover-open').forEach((p) => p.hidePopover()); }, { passive: true });

export {};
