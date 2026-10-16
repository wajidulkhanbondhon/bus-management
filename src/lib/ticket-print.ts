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
export const A4_PAD = 0;
export const CANVAS_W = A4_W;
export const CANVAS_H = A4_H;

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

    const onBeforePrint = () => {
      ensureSheetPageSize(mode);
    };
    window.addEventListener('beforeprint', onBeforePrint);

    return () => {
      window.removeEventListener('beforeprint', onBeforePrint);
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
  const natural = Math.max(el.scrollHeight, innerChild ? innerChild.scrollHeight : 0);

  // If content naturally fits in the budget, lock fit to 1
  if (natural <= CANVAS_H + 6) {
    if (el.style.getPropertyValue('--ticket-fit') !== '1') {
      el.style.setProperty('--ticket-fit', '1');
    }
    return 1;
  }

  const fit = Math.max(0.65, Math.min(1, CANVAS_H / natural));
  // Round to 2 decimal places to avoid sub-pixel jitter
  const next = String(Math.floor(fit * 100) / 100);
  const current = el.style.getPropertyValue('--ticket-fit');
  if (!current || Math.abs(Number(current) - Number(next)) >= 0.02) {
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

    // Re-check when web fonts finish rendering
    if (typeof document !== 'undefined' && document.fonts?.ready) {
      document.fonts.ready.then(run).catch(() => {});
    }

    // Window resize (device orientation or screen zoom changes)
    window.addEventListener('resize', run);

    return () => {
      cancelAnimationFrame(raf);
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
    let lastZoom = -1;

    const run = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;
        const hostWidth = host.clientWidth || A4_W;
        const available = Math.min(viewportWidth - 24, hostWidth);
        // On desktop and screens that fit A4 naturally (>= 794px), lock to 1.0 to guarantee perfect centered alignment.
        // On narrow mobile devices, scale down gracefully to fit screen.
        const targetZoom = available >= A4_W ? 1.0 : Math.max(0.35, Math.floor(((available - 12) / A4_W) * 100) / 100);
        const rounded = Math.floor(targetZoom * 100) / 100;

        if (Math.abs(rounded - lastZoom) >= 0.02) {
          lastZoom = rounded;
          el.style.setProperty('--ticket-view', String(rounded));
        }
      });
    };

    run();
    window.addEventListener('resize', run);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', run);
    };
  }, [ref, maxZoom]);
}
