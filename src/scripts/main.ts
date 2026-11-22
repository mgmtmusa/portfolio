// Small, dependency-free enhancements. The page is complete without this file.

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

/* Portrait lens: a circle over the photo shows the same portrait redrawn as a machine.
   - Mouse or trackpad (and motion allowed): the lens follows the pointer over the photo.
   - Touch, keyboard, reduced motion: the Human / Machine button reveals the whole machine layer.
   - No JavaScript: just the portrait, with the button left hidden.
   The machine image is only fetched once the page is idle, or on first intent, whichever comes first. */
const lens = document.querySelector<HTMLElement>('[data-lens]');
if (lens) {
  const stage = lens.querySelector<HTMLElement>('.lens-stage')!;
  const machine = lens.querySelector<HTMLImageElement>('.lens-machine')!;
  const toggle = lens.querySelector<HTMLButtonElement>('.lens-toggle')!;
  const hint = lens.querySelector<HTMLElement>('.lens-hint')!;
  const status = lens.querySelector<HTMLElement>('[data-lens-status]')!;
  const pointerLens = finePointer && !reduce;
  let on = false;

  const load = () => {
    if (!machine.getAttribute('src') && machine.dataset.src) machine.src = machine.dataset.src;
  };
  addEventListener('load', () => ('requestIdleCallback' in window ? requestIdleCallback(load, { timeout: 3000 }) : setTimeout(load, 1500)), { once: true });

  toggle.hidden = false;
  hint.textContent = pointerLens
    ? 'Move the lens across the portrait, or turn on Machine view.'
    : 'Tap the portrait or turn on Machine view to see it redrawn as a robot.';

  const place = (x: string, y: string) => {
    stage.style.setProperty('--lx', x);
    stage.style.setProperty('--ly', y);
  };
  const setMachine = (next: boolean) => {
    on = next;
    load();
    toggle.setAttribute('aria-pressed', String(on));
    stage.classList.remove('is-lens');
    stage.classList.toggle('is-machine', on);
    if (on) place('50%', '50%');
    status.textContent = on ? 'Machine view: the same portrait, redrawn as a robot.' : 'Human view: the studio portrait.';
  };
  toggle.addEventListener('click', () => setMachine(!on));
  // On touch screens a tap on the photo does the same as the button.
  if (!pointerLens) stage.addEventListener('click', () => setMachine(!on));

  if (pointerLens) {
    stage.classList.add('can-lens');
    let raf = 0;
    let px = 0;
    let py = 0;
    stage.addEventListener('pointerenter', load, { passive: true });
    stage.addEventListener(
      'pointermove',
      (e) => {
        if (on || e.pointerType === 'touch') return;
        const r = stage.getBoundingClientRect();
        px = e.clientX - r.left;
        py = e.clientY - r.top;
        if (!raf)
          raf = requestAnimationFrame(() => {
            raf = 0;
            place(`${px}px`, `${py}px`);
            stage.classList.add('is-lens');
          });
      },
      { passive: true },
    );
    stage.addEventListener('pointerleave', () => stage.classList.remove('is-lens'));
  } else {
    toggle.addEventListener('pointerdown', load, { passive: true });
  }
}

/* Direct anchor loads (e.g. /#career): the web font can arrive after the browser
   has jumped to the target and shift it. Re-align once fonts are ready, unless the
   visitor has already started scrolling. */
if (location.hash.length > 1 && 'fonts' in document) {
  let touched = false;
  const stop = () => (touched = true);
  for (const ev of ['wheel', 'touchstart', 'keydown', 'pointerdown']) addEventListener(ev, stop, { once: true, passive: true });
  document.fonts.ready.then(() => {
    const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (target && !touched) target.scrollIntoView({ block: 'start', behavior: 'instant' as ScrollBehavior });
  });
}

/* Career staircase: blocks rise once when the section comes into view.
   Without JS (or with reduced motion) the staircase is simply drawn complete. */
const career = document.querySelector<HTMLElement>('.career');
if (career) {
  if (!('IntersectionObserver' in window)) {
    career.classList.add('risen');
  } else {
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          career.classList.add('risen');
          io.disconnect();
        }
      },
      { threshold: 0.25 },
    );
    io.observe(career.querySelector('.stairs-wrap') ?? career);
  }
}
