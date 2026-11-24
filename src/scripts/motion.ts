// Smooth scrolling for the whole visit (outside the swapped DOM). Off under reduced motion, live.
import Lenis from 'lenis';

let lenis: Lenis | null = null;
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.motion === 'reduce';

function start() {
  if (lenis || reduced()) return;
  lenis = new Lenis({ autoRaf: true, lerp: 0.12, smoothWheel: true });
}
function stop() { lenis?.destroy(); lenis = null; }

start();
window.addEventListener('motionchange', () => (reduced() ? stop() : start()));
matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', () => (reduced() ? stop() : start()));
// Keep the browser's restored position after a swap; never force the top.
document.addEventListener('astro:after-swap', () => { lenis?.resize(); lenis?.scrollTo(window.scrollY, { immediate: true, force: true }); });
// The ⌘K dialog and footnotes are modal-ish: pause smoothing while a dialog is open.
document.addEventListener('toggle', () => (document.querySelector('dialog[open]') ? lenis?.stop() : lenis?.start()), true);
// Strip scroll-edge mask once the page has moved.
const strip = () => document.querySelector<HTMLElement>('.strip');
const onScroll = () => { const s = strip(); if (s) scrollY > 8 ? (s.dataset.scrolled = '') : delete s.dataset.scrolled; };
window.addEventListener('scroll', onScroll, { passive: true });
document.addEventListener('astro:page-load', onScroll);
