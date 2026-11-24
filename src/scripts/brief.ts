// The brief's live preview and composed mailto (Task 8). Without this file the form still works: its action is a
// plain mailto: with the fields in the body. This adds the typeset preview, the exact error copy, and a subject and
// body composed by src/lib/brief.ts. Built per page load, torn down before every swap (the hero.ts pattern).
import { briefModel, mailtoHref, BRIEF_LABELS, type BriefFields, type BriefModel } from '../lib/brief';
import { aimToReplyBy, formatReplyBy } from '../lib/reply-by';

type Key = keyof BriefFields;
const KEYS: Key[] = ['who', 'role', 'timeline', 'source'];
const REQUIRED = ['who', 'role'] as const;
const isKey = (k: string | null): k is Key => !!k && (KEYS as string[]).includes(k);

let teardown: (() => void) | null = null;
let wired = false;

/** Fires an event through chrome.ts's delegated [data-track] listener, so its analytics gate and safeProps apply.
 *  An empty data-from leaves the event with no properties at all: never a field value. */
function track(name: 'contact_start' | 'contact_send') {
  const el = document.createElement('span');
  el.hidden = true;
  el.dataset.track = name;
  el.dataset.from = '';
  document.body.append(el);
  el.click();
  el.remove();
}

/** Opens the composed mailto, exactly as following a link to it would. */
function openMail(href: string) {
  const a = document.createElement('a');
  a.setAttribute('href', href);
  a.hidden = true;
  document.body.append(a);
  a.click();
  a.remove();
}

function init() {
  teardown?.();
  teardown = null;
  const form = document.querySelector<HTMLFormElement>('form[data-brief]');
  if (!form) return;
  const preview = form.querySelector<HTMLElement>('[data-preview]')!;
  const body = preview.querySelector<HTMLElement>('[data-preview-body]')!;
  const empty = preview.querySelector<HTMLElement>('[data-empty]')!;
  const title = preview.querySelector<HTMLElement>('[data-title]')!;
  const date = preview.querySelector<HTMLElement>('[data-reply-date]')!;
  const field = (k: Key) => form.elements.namedItem(k) as HTMLInputElement | HTMLTextAreaElement;
  const row = (k: Key) => preview.querySelector<HTMLElement>(`[data-line="${k}"]`)!;
  const email = form.dataset.email ?? '';
  const ac = new AbortController();
  const opt = { signal: ac.signal };
  let started = false;
  let tried = false;

  const read = (): BriefFields => ({ who: field('who').value, role: field('role').value, timeline: field('timeline').value, source: field('source').value });

  const render = (m: BriefModel, now: Date) => {
    const text = new Map(m.lines.map((l) => [l.label, l.text]));
    empty.hidden = m.lines.length > 0;
    title.hidden = m.lines.length === 0;
    const who = text.get(BRIEF_LABELS.who);
    title.textContent = who ? `Brief from ${who}` : 'Brief';
    for (const k of KEYS) {
      const t = text.get(BRIEF_LABELS[k]) ?? '';
      const r = row(k);
      r.hidden = !t;
      r.querySelector('dd')!.textContent = t;
    }
    date.textContent = formatReplyBy(aimToReplyBy(now));
    body.toggleAttribute('data-lenis-prevent', body.scrollHeight > body.clientHeight + 1);
  };

  const showErrors = (m: BriefModel) => {
    for (const k of REQUIRED) {
      const msg = tried ? m.errors[k] ?? '' : '';
      const el = form.querySelector<HTMLElement>(`[data-error="${k}"]`)!;
      el.textContent = msg;
      el.hidden = !msg;
      if (msg) field(k).setAttribute('aria-invalid', 'true');
      else field(k).removeAttribute('aria-invalid');
    }
  };

  const update = () => {
    const now = new Date();
    const m = briefModel(read(), now);
    render(m, now);
    showErrors(m);
    return m;
  };

  // Keep the line being typed in view when a long brief scrolls inside the pinned page (desktop).
  const keepInView = (el: HTMLElement) => {
    if (el.hidden || body.scrollHeight <= body.clientHeight) return;
    const top = el.offsetTop, bottom = top + el.offsetHeight, st = body.scrollTop, view = body.clientHeight;
    if (bottom > st + view) body.scrollTop = bottom - view + 16;
    else if (top < st) body.scrollTop = Math.max(0, top - 16);
  };
  const setActive = (k: Key | null) => KEYS.forEach((key) => row(key).toggleAttribute('data-active', key === k));

  form.noValidate = true; // the exact error copy replaces the browser's own messages
  form.addEventListener('input', (e) => {
    if (!started) { started = true; track('contact_start'); }
    update();
    const k = (e.target as HTMLElement).getAttribute('name');
    if (isKey(k)) keepInView(row(k));
  }, opt);
  form.addEventListener('focusin', (e) => { const k = (e.target as HTMLElement).getAttribute('name'); setActive(isKey(k) ? k : null); }, opt);
  form.addEventListener('focusout', () => setActive(null), opt);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    tried = true;
    const m = update();
    if (!m.complete) {
      const first = REQUIRED.find((k) => m.errors[k]);
      if (first) field(first).focus();
      return;
    }
    track('contact_send');
    openMail(mailtoHref(m, email));
  }, opt);

  update(); // the date, and any values the browser restored
  preview.dataset.ready = '';
  form.dataset.ready = '';
  teardown = () => ac.abort();
}

/** Called once when the module loads (after first paint); later navigations re-run init on astro:page-load. */
export function start() {
  if (!wired) {
    wired = true;
    document.addEventListener('astro:page-load', init);
    document.addEventListener('astro:before-swap', () => { teardown?.(); teardown = null; });
  }
  init();
}
