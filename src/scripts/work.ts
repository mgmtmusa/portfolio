// The work index and the case sheet, on top of HTML that already works without JavaScript (Tasks 6 and 7).
// Index: announces the filter count. Sheet: Close, Escape and a click outside the sheet go back to /work/ (history
// back when that is the previous entry, otherwise /work/#case-<slug>); the inert index under the sheet keeps the
// scroll offset /work/ had; sheet to sheet slides; focus moves to the sheet, and back to the opened case.
// Wired once; each page is set up on astro:page-load and torn down before the next swap (as in hero.ts).
import { cases } from '../data/site';
import { closeHref, countText, isWorkIndex, slideDirection, slugFromPath } from '../lib/work';

const SLUGS = cases.map((c) => c.slug);
const KEY_Y = 'work:y'; // scroll offset of /work/ when a case opened from it
const KEY_OPENED = 'work:opened'; // the case last opened, so focus can return to its cover
let teardown: (() => void) | null = null;
let arrivedByNav = false; // this page came from a client-side navigation (not a cold load)
let cameFromSheet = false; // ...and from a case sheet to /work/

const store = {
  get: (k: string) => { try { return sessionStorage.getItem(k); } catch { return null; } },
  set: (k: string, v: string) => { try { sessionStorage.setItem(k, v); } catch { /* private mode */ } },
  del: (k: string) => { try { sessionStorage.removeItem(k); } catch { /* private mode */ } },
};
type WorkState = { workBack?: boolean };
const state = () => (history.state ?? {}) as WorkState;

function applyUnderOffset() {
  const inner = document.querySelector<HTMLElement>('[data-under-in]');
  if (!inner) return;
  const y = Number(store.get(KEY_Y) ?? 0) || 0;
  inner.style.setProperty('--under-y', String(Math.max(0, y)));
}

function closeSheet(slug: string) {
  if (state().workBack) { history.back(); return; }
  const link = document.querySelector<HTMLAnchorElement>('[data-sheet-close]');
  if (link) link.click(); // the router takes it to /work/#case-<slug>
  else location.assign(closeHref(slug));
}

function initIndex(root: HTMLElement) {
  const live = root.querySelector<HTMLElement>('[data-work-count]');
  const covers = [...root.querySelectorAll<HTMLElement>('[data-cover]')];
  const onChange = (e: Event) => {
    const input = e.target as HTMLInputElement;
    if (!input.matches('.chip-in')) return;
    const tag = input.value;
    const shown = covers.filter((c) => tag === 'all' || (c.dataset.tags ?? '').split(' ').includes(tag)).length;
    if (live) live.textContent = countText(shown, covers.length);
  };
  root.addEventListener('change', onChange);

  // Coming back from a sheet (Back, Close or Escape): focus the case that was opened, without scrolling.
  const fromHash = location.hash.match(/^#case-([a-z0-9-]+)$/)?.[1];
  const opened = fromHash ?? (cameFromSheet ? store.get(KEY_OPENED) : null);
  if (opened) {
    const link = root.querySelector<HTMLElement>(`#case-${CSS.escape(opened)} [data-case-link]`);
    if (link) requestAnimationFrame(() => link.focus({ preventScroll: true }));
    store.del(KEY_OPENED);
  }
  return () => root.removeEventListener('change', onChange);
}

function initSheet(sheet: HTMLElement) {
  const slug = sheet.dataset.sheet!;
  if (!arrivedByNav) store.set(KEY_Y, '0'); // a cold load or reload shows the index from its top
  applyUnderOffset();
  if (arrivedByNav) sheet.querySelector<HTMLElement>('#sheet-h')?.focus({ preventScroll: true });

  const close = sheet.querySelector<HTMLAnchorElement>('[data-sheet-close]');
  const onClose = (e: MouseEvent) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (state().workBack) { e.preventDefault(); history.back(); }
    // Otherwise the link itself goes to /work/#case-<slug>.
  };
  close?.addEventListener('click', onClose);

  const onKey = (e: KeyboardEvent) => {
    if (e.key !== 'Escape' || e.defaultPrevented) return;
    if (document.querySelector('dialog[open], :popover-open')) return; // ⌘K or a footnote closes first
    e.preventDefault();
    closeSheet(slug);
  };
  document.addEventListener('keydown', onKey);

  const wrap = document.querySelector<HTMLElement>('[data-sheet-wrap]');
  const onWrap = (e: MouseEvent) => { if (e.target === wrap) closeSheet(slug); };
  wrap?.addEventListener('click', onWrap);

  return () => {
    close?.removeEventListener('click', onClose);
    document.removeEventListener('keydown', onKey);
    wrap?.removeEventListener('click', onWrap);
  };
}

let initBody: HTMLElement | null = null;
function init() {
  // start() and astro:page-load can both reach here for one page; set each page up once.
  if (document.body === initBody) return;
  initBody = document.body;
  teardown?.();
  teardown = null;
  const index = document.querySelector<HTMLElement>('[data-work-index="live"]');
  const sheet = document.querySelector<HTMLElement>('[data-sheet]');
  const offs: (() => void)[] = [];
  if (index) offs.push(initIndex(index));
  if (sheet) {
    offs.push(initSheet(sheet));
    // Mark this history entry when it was reached from /work/, so Close can simply go back.
    if (store.get('work:from-index') === location.pathname) {
      history.replaceState({ ...history.state, workBack: true }, '');
    }
    store.del('work:from-index');
  }
  arrivedByNav = false;
  cameFromSheet = false;
  document.documentElement.dataset.work = 'ready'; // tests wait on this
  teardown = () => offs.forEach((f) => f());
}

// Navigation bookkeeping. Runs for link clicks and for Back and Forward.
function onBeforePreparation(e: Event) {
  const ev = e as Event & { from: URL; to: URL; direction: string; navigationType: string };
  const fromSlug = slugFromPath(ev.from.pathname, SLUGS);
  const toSlug = slugFromPath(ev.to.pathname, SLUGS);
  arrivedByNav = true;
  cameFromSheet = !!fromSlug && isWorkIndex(ev.to.pathname);
  if (toSlug && isWorkIndex(ev.from.pathname)) {
    store.set(KEY_Y, String(Math.round(scrollY)));
    store.set(KEY_OPENED, toSlug);
    if (ev.navigationType !== 'traverse') store.set('work:from-index', ev.to.pathname);
  } else if (toSlug && fromSlug) {
    // Sheet to sheet: keep the index offset, slide the sheet, and let the figures ride inside it.
    store.set(KEY_OPENED, toSlug);
    if (ev.navigationType !== 'traverse') ev.direction = slideDirection(fromSlug, toSlug, SLUGS) === 'back' ? 'back' : 'forward';
    document.documentElement.classList.add('vt-sheet-swap');
  } else if (toSlug) {
    store.set(KEY_Y, '0');
    store.set(KEY_OPENED, toSlug);
  }
}

function onBeforeSwap(e: Event) {
  teardown?.();
  teardown = null;
  const vt = (e as Event & { viewTransition?: ViewTransition }).viewTransition;
  const root = document.documentElement;
  if (root.classList.contains('vt-sheet-swap')) {
    const clear = () => root.classList.remove('vt-sheet-swap');
    if (vt) vt.finished.finally(clear); else setTimeout(clear, 0);
  }
}

// Before the new page is captured for the transition, put the inert index where /work/ was.
function onAfterSwap() {
  if (document.querySelector('[data-sheet]')) applyUnderOffset();
}

let wired = false;
/** Called once when the module loads (after first paint); later navigations re-run init on astro:page-load. */
export function start() {
  if (!wired) {
    wired = true;
    document.addEventListener('astro:before-preparation', onBeforePreparation);
    document.addEventListener('astro:before-swap', onBeforeSwap);
    document.addEventListener('astro:after-swap', onAfterSwap);
    document.addEventListener('astro:page-load', init);
  }
  init();
}
