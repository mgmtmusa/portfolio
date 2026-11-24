// Persistent chrome: the Melbourne clock, the ⌘K menu, toasts, copy email, the reduce-motion switch and
// analytics events. Runs once per visit; the elements it wires persist across view transitions.
import { track as vercelTrack } from '@vercel/analytics';
import { commandItems, searchCommands } from '../lib/command';
import { site } from '../data/site';
import { safeProps, type EventProps } from '../lib/analytics';

const ITEMS = commandItems();

function track(name: string, props: EventProps = {}) {
  if (document.documentElement.dataset.analytics !== 'on') return;
  vercelTrack(name, safeProps(props));
}

function startClock() {
  const fmt = new Intl.DateTimeFormat('en-AU', { timeZone: 'Australia/Melbourne', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const tick = () => document.querySelectorAll<HTMLTimeElement>('[data-clock]').forEach((el) => (el.textContent = fmt.format(new Date())));
  tick();
  setInterval(tick, 1000);
}

export function toast(message: string) {
  const region = document.querySelector<HTMLElement>('[data-toasts]');
  if (!region) return;
  const t = document.createElement('p');
  t.className = 'toast glass';
  t.textContent = message;
  region.append(t);
  setTimeout(() => t.classList.add('toast-out'), 2400);
  setTimeout(() => t.remove(), 2800);
}

async function copyEmail(from: string) {
  try {
    await navigator.clipboard.writeText(site.email);
    toast('Email address copied.');
  } catch {
    toast(`Email: ${site.email}`);
  }
  track('email_copy', { from });
}

function setReducedMotion(on: boolean) {
  document.documentElement.dataset.motion = on ? 'reduce' : '';
  try { localStorage.setItem('motion', on ? 'reduce' : ''); } catch { /* storage may be unavailable */ }
  window.dispatchEvent(new CustomEvent('motionchange', { detail: { reduce: on } }));
  toast(on ? 'Motion reduced.' : 'Motion restored.');
}

function wireCommandMenu() {
  const dialog = document.querySelector<HTMLDialogElement>('#cmdk');
  const input = document.querySelector<HTMLInputElement>('#cmdk-q');
  if (!dialog || !input) return;
  const options = () => [...dialog.querySelectorAll<HTMLElement>('.cmdk-item')].filter((o) => !o.hidden);
  let active = 0;
  let opener: HTMLElement | null = null;

  const highlight = (i: number) => {
    const list = options();
    if (!list.length) { input.removeAttribute('aria-activedescendant'); return; }
    active = (i + list.length) % list.length;
    list.forEach((o, j) => o.setAttribute('aria-selected', String(j === active)));
    input.setAttribute('aria-activedescendant', list[active].id);
    list[active].scrollIntoView({ block: 'nearest' });
  };
  const filter = () => {
    const found = searchCommands(ITEMS, input.value);
    const ids = new Set(found.map((f) => f.id));
    const list = dialog.querySelector('#cmdk-list')!;
    dialog.querySelectorAll<HTMLElement>('.cmdk-item').forEach((o) => (o.hidden = !ids.has(o.dataset.id!)));
    // Ranked order inside each group; groups keep their order.
    dialog.querySelectorAll<HTMLElement>('.cmdk-group').forEach((g) => {
      const kids = [...g.querySelectorAll<HTMLElement>('.cmdk-item')];
      kids.sort((a, b) => found.findIndex((f) => f.id === a.dataset.id) - found.findIndex((f) => f.id === b.dataset.id)).forEach((k) => g.append(k));
      g.hidden = kids.every((k) => k.hidden);
    });
    if (input.value.trim()) {
      // A query ranks across groups: move the best match's group first.
      const first = found[0] && dialog.querySelector(`[data-id="${found[0].id}"]`)?.closest('.cmdk-group');
      if (first) list.prepend(first);
    } else {
      ['Pages', 'Cases', 'Actions'].forEach((g) => list.append(dialog.querySelector(`[data-group="${g}"]`)!));
    }
    dialog.querySelector<HTMLElement>('.cmdk-empty')!.hidden = found.length > 0;
    highlight(0);
  };
  const open = (from: HTMLElement | null) => {
    if (dialog.open) return;
    opener = from;
    input.value = '';
    filter();
    dialog.showModal();
    input.focus();
  };
  const close = () => dialog.open && dialog.close();

  dialog.addEventListener('close', () => opener?.focus());
  dialog.addEventListener('click', (e) => { if (e.target === dialog) close(); });
  input.addEventListener('input', filter);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); highlight(active + 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); highlight(active - 1); }
    else if (e.key === 'Enter') { e.preventDefault(); options()[active]?.click(); }
  });
  dialog.addEventListener('click', (e) => {
    const item = (e.target as HTMLElement).closest<HTMLElement>('.cmdk-item');
    if (!item) return;
    const action = item.dataset.action;
    if (action === 'copy-email') copyEmail('command');
    if (action === 'reduce-motion') setReducedMotion(document.documentElement.dataset.motion !== 'reduce');
    close();
  });
  document.addEventListener('keydown', (e) => {
    const t = e.target as HTMLElement;
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable;
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); dialog.open ? close() : open(document.activeElement as HTMLElement); }
    else if (e.key === '/' && !typing && !dialog.open) { e.preventDefault(); open(document.activeElement as HTMLElement); }
  });
  document.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-cmdk-open]');
    if (btn) open(btn);
  });
  if (!/Mac|iPhone|iPad/.test(navigator.platform)) document.querySelectorAll('kbd.dock-k').forEach((k) => (k.textContent = 'Ctrl K'));
}

function wireAnalytics() {
  // Events carry names and places only, never anything a visitor typed.
  document.addEventListener('click', (e) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>('[data-track]');
    if (!el) return;
    const name = el.dataset.track!;
    const from = el.dataset.from ?? location.pathname;
    if (name === 'case_open') track('case_open', { slug: el.dataset.slug ?? '', from });
    else if (name === 'copy_email') copyEmail(from);
    else if (name !== 'contact_click') track(name, { from });
  });
}

/** Tests and the dock wait on this; set once chrome is wired. */
function signalReady() { document.documentElement.dataset.chrome = 'ready'; }

function markCurrent() {
  const path = location.pathname;
  document.querySelectorAll<HTMLAnchorElement>('.dock-link').forEach((a) => {
    const here = path === a.pathname || (a.pathname !== '/' && path.startsWith(a.pathname));
    here ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current');
  });
}

startClock();
wireCommandMenu();
signalReady();
wireAnalytics();
markCurrent();
document.addEventListener('astro:page-load', markCurrent);
