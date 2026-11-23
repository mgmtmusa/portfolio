// Places each footnote popover next to its marker (anchor positioning isn't in every engine yet).
function place(pop: HTMLElement) {
  const btn = document.querySelector<HTMLElement>(`[popovertarget="${pop.id}"]`);
  if (!btn) return;
  const b = btn.getBoundingClientRect();
  const w = pop.offsetWidth, h = pop.offsetHeight, m = 16;
  let left = Math.min(Math.max(m, b.left - 12), innerWidth - w - m);
  let top = b.bottom + 10;
  if (top + h > innerHeight - 96) top = Math.max(m + 32, b.top - h - 10);
  pop.style.left = `${left}px`;
  pop.style.top = `${top}px`;
}
function wire() {
  document.querySelectorAll<HTMLElement>('.fn-pop').forEach((pop) => {
    if (pop.dataset.wired) return;
    pop.dataset.wired = '1';
    pop.addEventListener('toggle', (e) => { if ((e as ToggleEvent).newState === 'open') place(pop); });
  });
}
wire();
document.addEventListener('astro:page-load', wire);
addEventListener('scroll', () => document.querySelectorAll<HTMLElement>('.fn-pop:popover-open').forEach((p) => p.hidePopover()), { passive: true });
