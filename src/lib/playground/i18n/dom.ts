import { t, type TranslationKey } from './index';

/**
 * Walk the subtree and apply translations declared via data attributes:
 *
 *   <button data-i18n="btn.format">Format</button>          // textContent
 *   <button data-i18n-title="btn.format.title">...</button> // title attr
 *   <button data-i18n-aria="theme.toggle.aria">...</button> // aria-label
 *
 * Initial English text in the markup serves as a no-JS fallback; this
 * function overwrites it once the active language is known. Safe to run
 * multiple times - it always reads fresh translations from `t()`.
 */
export function hydrateI18n(root: ParentNode = document): void {
  for (const el of root.querySelectorAll<HTMLElement>('[data-i18n]')) {
    const key = el.dataset.i18n as TranslationKey | undefined;
    if (key) el.textContent = t(key);
  }
  for (const el of root.querySelectorAll<HTMLElement>('[data-i18n-title]')) {
    const key = el.dataset.i18nTitle as TranslationKey | undefined;
    if (key) el.title = t(key);
  }
  for (const el of root.querySelectorAll<HTMLElement>('[data-i18n-aria]')) {
    const key = el.dataset.i18nAria as TranslationKey | undefined;
    if (key) el.setAttribute('aria-label', t(key));
  }
}
