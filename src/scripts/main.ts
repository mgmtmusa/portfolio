import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const $ = <T extends HTMLElement>(s: string, r: ParentNode = document) => r.querySelector<T>(s);
const $$ = <T extends HTMLElement>(s: string, r: ParentNode = document) => Array.from(r.querySelectorAll<T>(s));

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

/* ── Live local-time clock (works even with reduced motion) ── */
const clock = $<HTMLTimeElement>('[data-clock]');
const tz = $<HTMLElement>('[data-tz]')?.dataset.tz;
if (clock && tz) {
  const fmt = new Intl.DateTimeFormat('en-AU', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: tz });
  const tick = () => (clock.textContent = fmt.format(new Date()));
  tick();
  setInterval(tick, 30_000);
}

/* ── Live section label in the nav pill ── */
const secN = $('[data-sec-n]');
const secT = $('[data-sec-t]');
const labelled = $$('[data-label]');
let current = -1;
const setLabel = (i: number, text: string) => {
  if (!secN || !secT || i === current) return;
  const dir = i > current ? 1 : -1;
  current = i;
  const swap = () => {
    secN.textContent = String(i).padStart(2, '0');
    secT.textContent = text;
  };
  if (reduce) return swap();
  gsap.to(secT, {
    yPercent: -120 * dir, opacity: 0, duration: 0.22, ease: 'power2.in',
    onComplete() {
      swap();
      gsap.fromTo(secT, { yPercent: 120 * dir, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.35, ease: 'power3.out' });
    },
  });
};
labelled.forEach((sec, i) => {
  ScrollTrigger.create({
    trigger: sec,
    start: 'top 50%',
    end: 'bottom 50%',
    onToggle: (self) => self.isActive && setLabel(i, sec.dataset.label || ''),
  });
});
// Footer is fixed on desktop, so detect "contact" from the end of <main>.
ScrollTrigger.create({
  trigger: 'main',
  start: 'bottom 50%',
  onEnter: () => setLabel(labelled.length, 'Contact'),
  onLeaveBack: () => setLabel(labelled.length - 1, labelled[labelled.length - 1]?.dataset.label || ''),
});

/* ── Floating contact card: visible between hero and footer ── */
const floatCta = $('.float-cta');
if (floatCta) {
  ScrollTrigger.create({
    trigger: '.hero',
    start: 'bottom 70%',
    endTrigger: 'main',
    end: 'bottom bottom',
    onToggle: (self) => floatCta.classList.toggle('show', self.isActive),
  });
}

if (!reduce) {
  ScrollTrigger.config({ ignoreMobileResize: true });

  /* ── Scroll progress bar ── */
  gsap.to('.progress', {
    scaleX: 1,
    ease: 'none',
    scrollTrigger: { start: 0, end: 'max', scrub: 0.2 },
  });

  /* ── Hero: copy drifts up + fades as you leave ── */
  gsap.to('.hero-copy', {
    yPercent: -18,
    opacity: 0.1,
    ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
  });

  /* ── Generic parallax: any [data-speed] moves relative to its section ── */
  $$('[data-speed]').forEach((el) => {
    const s = parseFloat(el.dataset.speed || '0');
    const k = el.classList.contains('tile') ? 70 : 18; // tiles get deeper, Floema-style drift
    gsap.fromTo(
      el,
      { yPercent: -s * k },
      {
        yPercent: s * k,
        ease: 'none',
        scrollTrigger: { trigger: el.closest('section') || el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true },
      },
    );
  });

  /* ── Word-mask reveals on scroll ── */
  $$('.split-scroll').forEach((el) => {
    gsap.fromTo($$('.wi', el), { yPercent: 115, opacity: 1 }, {
      yPercent: 0,
      duration: 1.1,
      ease: 'power4.out',
      stagger: 0.06,
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
    });
  });

  /* ── Statement: words light up as you scroll ── */
  $$('.split-scrub').forEach((el) => {
    gsap.to($$('.wi', el), {
      opacity: 1,
      ease: 'none',
      stagger: 0.12,
      scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 45%', scrub: true },
    });
  });

  /* ── Marquee reacts to scroll speed + direction ── */
  const track = $('.marquee-track');
  const anim = track?.getAnimations()[0];
  if (anim) {
    let target = 1;
    let rate = 1;
    ScrollTrigger.create({
      onUpdate(self) {
        const v = Math.min(Math.abs(self.getVelocity()) / 350, 6);
        target = self.direction * (1 + v);
      },
    });
    gsap.ticker.add(() => {
      target += (Math.sign(target) - target) * 0.04; // ease back to ±1
      rate += (target - rate) * 0.1;
      anim.playbackRate = rate;
    });
  }

  /* ── Work cards: stack, scale back and reveal ── */
  const cards = $$('.card');
  cards.forEach((card, i) => {
    const inner = $('.card-inner', card)!;
    gsap.fromTo(
      inner,
      { clipPath: 'inset(8% 6% 0% 6% round 28px)' },
      {
        clipPath: 'inset(0% 0% 0% 0% round 28px)',
        ease: 'none',
        scrollTrigger: { trigger: card, start: 'top 95%', end: 'top 25%', scrub: true },
      },
    );
    const next = cards[i + 1];
    if (next) {
      gsap.to(inner, {
        scale: 0.92,
        opacity: 0.45,
        ease: 'none',
        scrollTrigger: { trigger: next, start: 'top 85%', end: 'top 12%', scrub: true },
      });
    }
  });

  /* ── Process: pinned horizontal scroll on desktop only ── */
  const mm = gsap.matchMedia();
  mm.add('(min-width: 900px)', () => {
    const wrap = $('.process-pin');
    const rail = $('.track');
    if (!wrap || !rail) return;
    const dist = () => Math.max(0, rail.scrollWidth - window.innerWidth + 40);
    gsap.to(rail, {
      x: () => -dist(),
      ease: 'none',
      scrollTrigger: {
        trigger: wrap,
        pin: true,
        scrub: 0.6,
        start: 'top top',
        end: () => '+=' + dist(),
        invalidateOnRefresh: true,
        anticipatePin: 1,
      },
    });
    gsap.from('.step-n', {
      xPercent: 30,
      opacity: 0.2,
      ease: 'none',
      stagger: 0.1,
      scrollTrigger: { trigger: wrap, start: 'top 60%', end: 'top top', scrub: true },
    });
  });

  /* ── Footer title rises ── */
  gsap.from('.footer .mail', {
    y: 40,
    opacity: 0,
    duration: 0.9,
    ease: 'power3.out',
    scrollTrigger: { trigger: '.footer', start: 'top 40%', once: true },
  });

  /* ── Pointer-driven effects (desktop) ── */
  if (finePointer) {
    // Custom cursor
    const cursor = $('.cursor')!;
    const label = $('span', cursor)!;
    const cx = gsap.quickTo(cursor, 'x', { duration: 0.25, ease: 'power3' });
    const cy = gsap.quickTo(cursor, 'y', { duration: 0.25, ease: 'power3' });
    addEventListener(
      'pointermove',
      (e) => {
        cursor.classList.add('on');
        cx(e.clientX);
        cy(e.clientY);
      },
      { passive: true },
    );
    document.addEventListener('pointerleave', () => cursor.classList.remove('on'));
    $$('[data-cursor]').forEach((el) => {
      el.addEventListener('pointerenter', () => {
        label.textContent = el.dataset.cursor || '';
        cursor.classList.add('big');
      });
      el.addEventListener('pointerleave', () => {
        label.textContent = '';
        cursor.classList.remove('big');
      });
    });

    // Magnetic buttons
    $$('[data-magnetic]').forEach((el) => {
      const mx = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3' });
      const my = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3' });
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        mx((e.clientX - (r.left + r.width / 2)) * 0.3);
        my((e.clientY - (r.top + r.height / 2)) * 0.3);
      });
      el.addEventListener('pointerleave', () => {
        mx(0);
        my(0);
      });
    });

    // Hero orbs follow the mouse (separate wrappers via CSS translate so they don't fight scroll parallax)
    const orbs = $$('.hero-bg [data-mouse]');
    const movers = orbs.map((o) => ({
      x: gsap.quickTo(o, 'x', { duration: 1.2, ease: 'power3' }),
      y: gsap.quickTo(o, 'y', { duration: 1.2, ease: 'power3' }),
      k: parseFloat(o.dataset.mouse || '0'),
    }));
    addEventListener(
      'pointermove',
      (e) => {
        const nx = e.clientX / innerWidth - 0.5;
        const ny = e.clientY / innerHeight - 0.5;
        movers.forEach((m) => {
          m.x(nx * m.k * 4);
          m.y(ny * m.k * 4);
        });
      },
      { passive: true },
    );
  }
}
