'use client';

import { useEffect, type RefObject } from 'react';

/**
 * Fixed sheet geometry for A4 at 96 dpi.
 *
 * The sheet is deliberately a hair smaller than a real A4 page
 * (793.7 x 1122.5 CSS px) so sub-pixel rounding can never spill a
 * sliver of content onto a second page.
 */
export const A4_W = 794;
export const A4_H = 1123;
export const A4_PAD = 2;
export const CANVAS_W = A4_W - (A4_PAD * 2);
export const CANVAS_H = A4_H - (A4_PAD * 2);

export const THERMAL_W_MM = 80;
export const THERMAL_W_PX = Math.round((THERMAL_W_MM / 25.4) * 96);

export const SHEET_ID = 'printable-payment-receipt';
export const PAGE_STYLE_ID = 'atoms-ticket-page-size';

export type PaperMode = 'STANDARD_A4' | 'THERMAL_80MM';

export function isThermalSheet(el: HTMLElement | null): boolean {
  return !!el && el.getAttribute('data-paper-mode') === 'THERMAL_80MM';
}

/**
 * Zero-margin @page so the browser print engine does not inject artificial default margins
 * that push the document down and clip the bottom of A4 paper.
 */
const A4_PAGE_SIZE_CSS = '@page { size: A4 portrait; margin: 0 !important; }\n@page :first { size: A4 portrait; margin: 0 !important; }';

export function ensureSheetPageSize(mode: PaperMode): HTMLStyleElement | null {
  if (typeof document === 'undefined') return null;

  const existing = document.getElementById(PAGE_STYLE_ID) as HTMLStyleElement | null;

  if (mode === 'THERMAL_80MM') {
    existing?.remove();
    return null;
  }

  const tag = existing ?? document.createElement('style');
  if (!existing) {
    tag.id = PAGE_STYLE_ID;
    document.head.appendChild(tag);
  }
  if (tag.textContent !== A4_PAGE_SIZE_CSS) tag.textContent = A4_PAGE_SIZE_CSS;
  return tag;
}

/** Keeps the printed page size in sync with the mounted sheet. */
export function useSheetPageSize(mode: PaperMode) {
  useEffect(() => {
    const tag = ensureSheetPageSize(mode);
    return () => {
      tag?.remove();
    };
  }, [mode]);
}

/**
 * Scale the ticket canvas so its natural height fits the sheet's content box.
 *
 * The scale is applied as a CSS transform, which does not change the canvas'
 * layout box — so `scrollHeight` is always the natural (unscaled) height and
 * repeated measurements can never feed back into each other. Pagination stays
 * a single page because the sheet itself is a fixed A4-sized box.
 */
export function fitTicketCanvas(el: HTMLElement | null): number {
  if (!el || typeof window === 'undefined') return 1;
  const innerChild = el.firstElementChild as HTMLElement | null;
  const natural = Math.max(el.scrollHeight, innerChild ? innerChild.scrollHeight : 0, CANVAS_H);
  const fit = Math.max(0.2, Math.min(1, CANVAS_H / natural));
  // Floor rather than round, so rounding can never push the content past the budget.
  const next = String(Math.floor(fit * 10000) / 10000);
  if (el.style.getPropertyValue('--ticket-fit') !== next) {
    el.style.setProperty('--ticket-fit', next);
  }
  return Number(next);
}

/** Keeps the A4 canvas scaled to fit one page across content / font changes. */
export function useTicketFit(
  ref: RefObject<HTMLElement | null>,
  enabled: boolean,
  deps: unknown[] = []
) {
  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;

    let raf = 0;
    const run = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => fitTicketCanvas(el));
    };

    run();

    const observer = new ResizeObserver(run);
    observer.observe(el);
    window.addEventListener('resize', run);
    if (typeof document !== 'undefined' && document.fonts?.ready) {
      document.fonts.ready.then(run).catch(() => {});
    }

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener('resize', run);
    };
  }, [enabled, ...deps]);
}

/**
 * Scales the on-screen sheet preview to comfortably fit the available container width (up to 1.05x for natural, true-to-life A4 display).
 */
export function useSheetViewZoom(ref: RefObject<HTMLElement | null>, maxZoom: number = 1.05) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const host = el.parentElement ?? el;

    let raf = 0;
    const run = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const available = host.clientWidth || A4_W;
        // Dynamically scale up to maxZoom on desktop views to utilize available space without expanding past the screen
        const targetZoom = Math.min(maxZoom, Math.max(0.4, (available - 8) / A4_W));
        el.style.setProperty('--ticket-view', String(Number(targetZoom.toFixed(4))));
      });
    };

    run();
    const observer = new ResizeObserver(run);
    observer.observe(host);
    window.addEventListener('resize', run);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener('resize', run);
    };
  }, [ref, maxZoom]);
}
