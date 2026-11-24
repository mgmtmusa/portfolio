// Task 4 and F2, F13, F14: persistent chrome, the command menu, carry-over across view transitions, CV link counts.
import { test, expect, type Page } from '@playwright/test';
import { allPages, prepPage, tabKey, CV, LINKEDIN } from './helpers';

async function go(page: Page, path: string) {
  await prepPage(page);
  await page.goto(path);
  await page.waitForSelector('html[data-chrome="ready"]', { timeout: 10000 });
}
const isPhone = (page: Page) => (page.viewportSize()?.width ?? 1440) < 640;
/** Dock link by label; on phones the dock shows Menu and Get in touch only, so go through the menu. */
async function dockTo(page: Page, label: 'Work' | 'About' | 'Contact', href: string) {
  if (isPhone(page)) {
    await page.locator('.dock-menu').click();
    await page.locator('#cmdk-q').fill(label);
    await page.keyboard.press('Enter');
  } else {
    await page.locator('.dock-link', { hasText: label }).click();
  }
  await expect(page).toHaveURL(new RegExp(`${href}$`));
  await page.waitForTimeout(500);
}

test.describe('persistent chrome', () => {
  test('dock, strip and menu keep their DOM node across a view transition', async ({ page }) => {
    await go(page, '/about/');
    await page.evaluate(() => {
      const w = window as unknown as { __n: Record<string, Element | null> };
      w.__n = { dock: document.querySelector('[data-dock]'), strip: document.querySelector('.strip'), cmdk: document.querySelector('#cmdk') };
    });
    await dockTo(page, 'Work', '/work/');
    const same = await page.evaluate(() => {
      const w = window as unknown as { __n: Record<string, Element | null> };
      return {
        dock: w.__n.dock === document.querySelector('[data-dock]'),
        strip: w.__n.strip === document.querySelector('.strip'),
        cmdk: w.__n.cmdk === document.querySelector('#cmdk'),
      };
    });
    expect(same).toEqual({ dock: true, strip: true, cmdk: true });
    await expect(page.locator('[data-dock]')).toBeVisible();
  });

  test('F2: html.js and data-motion survive two dock navigations and a reload', async ({ page }) => {
    await go(page, '/about/');
    await page.keyboard.press('ControlOrMeta+K');
    await page.locator('#cmdk-q').fill('reduce');
    await page.keyboard.press('Enter');
    await expect(page.locator('html')).toHaveAttribute('data-motion', 'reduce');
    await dockTo(page, 'Work', '/work/');
    await dockTo(page, 'Contact', '/contact/');
    const html = page.locator('html');
    await expect(html).toHaveClass(/\bjs\b/);
    await expect(html).toHaveAttribute('data-motion', 'reduce');
    await expect(page.locator('.dock-menu')).toBeVisible();
    await page.reload();
    await expect(html).toHaveClass(/\bjs\b/);
    await expect(html).toHaveAttribute('data-motion', 'reduce');
  });
});

test.describe('command menu', () => {
  for (const combo of ['Meta+K', 'Control+K']) {
    test(`${combo} opens it, filters, Enter navigates`, async ({ page }) => {
      await go(page, '/about/');
      await page.keyboard.press(combo);
      await expect(page.locator('#cmdk')).toBeVisible();
      await expect(page.locator('#cmdk-q')).toBeFocused();
      await page.locator('#cmdk-q').fill('evi');
      await expect(page.locator('.cmdk-item:visible')).toHaveCount(1);
      await page.keyboard.press('Enter');
      await expect(page).toHaveURL(/\/work\/evitech\/$/);
    });
  }

  test('the menu lists the conversion actions, and Escape restores focus', async ({ page }) => {
    await go(page, '/about/');
    const opener = page.locator('.dock-menu');
    await opener.focus();
    await page.keyboard.press('Control+K');
    for (const l of ['Download CV', 'Copy email', 'LinkedIn']) await expect(page.locator('#cmdk .cmdk-item', { hasText: l })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('#cmdk')).toBeHidden();
    await expect(opener).toBeFocused();
  });

  test('Copy email shows its toast', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'clipboard', { value: { writeText: () => Promise.resolve() }, configurable: true });
    });
    await go(page, '/about/');
    await page.keyboard.press('Control+K');
    await page.locator('#cmdk-q').fill('copy email');
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-toasts] .toast')).toHaveText('Email address copied.');
  });

  test('"/" opens it when nothing is being typed', async ({ page }) => {
    await go(page, '/about/');
    await page.keyboard.press('/');
    await expect(page.locator('#cmdk')).toBeVisible();
  });
});

test.describe('F13: the dock when hidden', () => {
  test('Tab at hero rest never lands on an invisible control; the dock is inert until shown', async ({ page, browserName }) => {
    await prepPage(page);
    await page.goto('/');
    await page.waitForTimeout(2200);
    const dock = page.locator('[data-dock]');
    const hidden = await dock.evaluate((el) => getComputedStyle(el).opacity === '0');
    if (hidden) await expect(dock).toHaveAttribute('inert', '');
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press(tabKey(browserName));
      const bad = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        if (!el || el === document.body) return false;
        for (let n: HTMLElement | null = el; n; n = n.parentElement) if (getComputedStyle(n).opacity === '0') return `${el.tagName}.${el.className}`;
        return false;
      });
      expect(bad, 'focus on an invisible control').toBe(false);
    }
  });

  test('home to /work/ shows the dock, and home again re-arms it', async ({ page }) => {
    await go(page, '/');
    await page.goto('/work/');
    await expect(page.locator('[data-dock]')).toBeVisible();
    await expect(page.locator('[data-dock]')).not.toHaveAttribute('inert', '');
    const dock = page.locator('[data-dock]');
    expect(await dock.evaluate((el) => getComputedStyle(el).opacity)).toBe('1');
    await page.goto('/');
    await page.waitForTimeout(1500);
    const rest = await dock.evaluate((el) => ({ op: getComputedStyle(el).opacity, inert: el.hasAttribute('inert') }));
    // At hero rest the dock is either not yet shown (hidden and inert) or already on screen (visible and live).
    expect(rest.op === '0' ? rest.inert : !rest.inert).toBe(true);
  });
});

test.describe('F14: conversion path', () => {
  // Counts of Download CV links outside the (closed) menu, per page. Home has the hero, the next step and the footer.
  const EXPECT_CV: Record<string, [number, number]> = { '/': [3, 3], '/for/example-company/': [3, 3] };
  for (const path of allPages()) {
    test(`${path}: Get in touch in the dock, CV links counted, footer carries CV and LinkedIn`, async ({ page }) => {
      await go(page, path);
      await expect(page.locator('[data-dock] .dock-cta')).toHaveAttribute('href', '/contact/');
      const cv = await page.locator(`a[href="${CV}"]:not(#cmdk a)`).count();
      const [lo, hi] = EXPECT_CV[path] ?? [1, 2];
      expect(cv, `CV links on ${path}`).toBeGreaterThanOrEqual(lo);
      expect(cv, `CV links on ${path}`).toBeLessThanOrEqual(hi);
      await expect(page.locator(`.foot a[href="${CV}"]`)).toHaveCount(1);
      await expect(page.locator(`.foot a[href="${LINKEDIN}"]`)).toHaveCount(1);
    });
  }

  test('home carries Get in touch and Download CV in the hero itself, and all three in the next step', async ({ page }) => {
    await go(page, '/');
    await expect(page.locator('[data-hero] a[href="/contact/"]')).toHaveCount(1);
    await expect(page.locator(`[data-hero] a[href="${CV}"]`)).toHaveCount(1);
    for (const href of ['/contact/', CV, LINKEDIN]) expect(await page.locator(`main a[href="${href}"]`).count()).toBeGreaterThan(0);
  });

  test('the contact page carries email, CV and LinkedIn', async ({ page }) => {
    await go(page, '/contact/');
    await expect(page.locator(`main a[href="${CV}"]`)).toHaveCount(1);
    await expect(page.locator(`main a[href="${LINKEDIN}"]`)).toHaveCount(1);
    expect(await page.locator('main a[href^="mailto:"]').count()).toBeGreaterThan(0);
  });

  test('the dock stays reachable mid-scroll', async ({ page }) => {
    await go(page, '/about/');
    await page.evaluate(() => window.scrollTo(0, 900));
    await page.waitForTimeout(500);
    await expect(page.locator('[data-dock] .dock-cta')).toBeVisible();
  });
});
