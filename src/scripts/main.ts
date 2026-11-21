// Small, dependency-free enhancements. The page is complete without this file.

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

/* Hero hand: tilts gently toward the pointer. Small range and easing so stray
   mouse movement reads as life, not as a jolt. Resets when the pointer leaves. */
const hand = document.querySelector<HTMLElement>('.hand-in');
const hero = document.querySelector<HTMLElement>('.hero');
if (hand && hero && finePointer && !reduce) {
  let tx = 0;
  let ty = 0;
  let x = 0;
  let y = 0;
  let raf = 0;
  const step = () => {
    x += (tx - x) * 0.1;
    y += (ty - y) * 0.1;
    hand.style.setProperty('--ry', `${(-8 + x * 9).toFixed(2)}deg`);
    hand.style.setProperty('--rx', `${(4 - y * 5).toFixed(2)}deg`);
    raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.002 ? requestAnimationFrame(step) : 0;
  };
  const kick = () => {
    if (!raf) raf = requestAnimationFrame(step);
  };
  hero.addEventListener(
    'pointermove',
    (e) => {
      tx = Math.max(-1, Math.min(1, (e.clientX / innerWidth) * 2 - 1));
      ty = Math.max(-1, Math.min(1, (e.clientY / innerHeight) * 2 - 1));
      kick();
    },
    { passive: true },
  );
  hero.addEventListener('pointerleave', () => {
    tx = 0;
    ty = 0;
    kick();
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
