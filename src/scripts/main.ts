import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const $ = <T extends HTMLElement>(s: string, r: ParentNode = document) => r.querySelector<T>(s);
const $$ = <T extends HTMLElement>(s: string, r: ParentNode = document) => Array.from(r.querySelectorAll<T>(s));

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

/** Run setup in small tasks so the main thread is never blocked for long. */
const queue: (() => void)[] = [];
const later = (fn: () => void) => queue.push(fn);
const drain = () => {
  const fn = queue.shift();
  if (!fn) return ScrollTrigger.refresh();
  fn();
  setTimeout(drain, 0);
};

/* ── Melbourne clock ── */
const clocks = $$<HTMLTimeElement>('[data-clock]');
if (clocks.length) {
  const fmt = new Intl.DateTimeFormat('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Australia/Melbourne' });
  const tick = () => clocks.forEach((c) => (c.textContent = fmt.format(new Date())));
  tick();
  setInterval(tick, 30_000);
}

/* ── Top bar switches to light text over dark sections ── */
later(() => {
  const bar = $('.bar');
  if (!bar) return;
  ScrollTrigger.create({ trigger: '.ladder', start: 'top 40px', end: 'bottom 40px', toggleClass: { targets: bar, className: 'inv' } });
  ScrollTrigger.create({
    trigger: 'main',
    start: 'bottom 40px',
    onEnter: () => bar.classList.add('inv', 'foot'),
    onLeaveBack: () => bar.classList.remove('inv', 'foot'),
  });
});

const rungs = $$('.rung');
const blks = $$('.blk');
const lightRungs = (n: number) => rungs.forEach((r, i) => r.classList.toggle('on', i < n));

if (reduce) {
  lightRungs(rungs.length);
} else {
  ScrollTrigger.config({ ignoreMobileResize: true });

  /* Hero first: card flips, deck fans, stage sinks; mouse tilts the whole 3D scene */
  later(() => {
    gsap.to('.progress', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.2 } });
    const hero = { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.6 };
    gsap.to('.card-flip', { rotationY: 180, ease: 'none', scrollTrigger: hero });
    gsap.to('.dk', { '--fan': 1, ease: 'none', scrollTrigger: hero });
    gsap.to('.stage', { yPercent: 14, ease: 'none', scrollTrigger: hero });

    const scene = $('.scene');
    if (!scene) return;
    if (finePointer) {
      const rx = gsap.quickTo(scene, 'rotationX', { duration: 0.8, ease: 'power3' });
      const ry = gsap.quickTo(scene, 'rotationY', { duration: 0.8, ease: 'power3' });
      gsap.set(scene, { rotationX: 6, rotationY: -14 });
      addEventListener(
        'pointermove',
        (e) => {
          ry((e.clientX / innerWidth - 0.5) * 36);
          rx(-(e.clientY / innerHeight - 0.5) * 24);
        },
        { passive: true },
      );
    } else {
      gsap.fromTo(scene, { rotationY: -16, rotationX: 6 }, { rotationY: 16, rotationX: -4, duration: 4, ease: 'sine.inOut', yoyo: true, repeat: -1 });
    }
  });

  /* Headline word reveals */
  later(() => {
    $$('.split-scroll').forEach((el) => {
      gsap.fromTo(
        $$('.wi', el),
        { yPercent: 105, opacity: 1 },
        { yPercent: 0, duration: 1, ease: 'power4.out', stagger: 0.07, scrollTrigger: { trigger: el, start: 'top 88%', once: true } },
      );
    });
  });

  /* Statement: words ink in as you read */
  later(() => {
    $$('.split-scrub').forEach((el) => {
      const words = $$('.wi', el);
      gsap.to(words, {
        color: (i: number) => (words[i].classList.contains('accent') ? '#c21e17' : '#121212'),
        ease: 'none',
        stagger: 0.1,
        scrollTrigger: { trigger: el, start: 'top 78%', end: 'bottom 50%', scrub: true },
      });
    });
  });

  /* Impact numbers count up */
  later(() => {
    $$('.stat-v').forEach((el) => {
      const v = parseFloat(el.dataset.count || '0');
      const dec = parseInt(el.dataset.dec || '0', 10);
      const { pre = '', suf = '' } = el.dataset;
      const o = { n: 0 };
      gsap.to(o, {
        n: v,
        duration: 1.6,
        ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 90%', once: true },
        onUpdate: () => (el.textContent = `${pre}${o.n.toFixed(dec)}${suf}`),
      });
    });
  });

  /* Ladder: 3D blocks rise one by one, rungs light up in sync. Pinned on desktop. */
  later(() => {
    gsap.set(blks, { '--s': 0.03 });
    const build = (pin: boolean) => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: pin ? '.ladder-pin' : '.stairs-wrap',
          start: pin ? 'top top' : 'top 75%',
          end: pin ? '+=120%' : 'bottom 25%',
          pin,
          scrub: 0.5,
          onUpdate(self) {
            lightRungs(Math.min(rungs.length, Math.floor(self.progress * rungs.length + 0.35)));
          },
        },
      });
      blks.forEach((b, i) => tl.to(b, { '--s': 1, duration: 1, ease: 'power2.out' }, i * 0.8));
      return () => tl.kill();
    };
    const mm = gsap.matchMedia();
    mm.add('(min-width: 900px)', () => build(true));
    mm.add('(max-width: 899px)', () => build(false));
  });

  /* Experience + recognition rows slide in */
  later(() => {
    $$('.row, .rc').forEach((row) => {
      gsap.from(row, { y: 40, opacity: 0, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: row, start: 'top 92%', once: true } });
    });
  });

  /* Skill panels rise in 3D */
  later(() => {
    gsap.from('.arena-in', {
      rotationX: -35,
      y: 80,
      opacity: 0,
      transformOrigin: '50% 100%',
      duration: 1.1,
      ease: 'power3.out',
      stagger: 0.12,
      clearProps: 'transform,opacity',
      scrollTrigger: { trigger: '.arenas', start: 'top 85%', once: true },
    });
  });
}

drain();
