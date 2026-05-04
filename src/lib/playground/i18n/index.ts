import { en, type Dict, type TranslationKey } from './translations/en';

export type { Dict, TranslationKey };
export type LangCode = string;
export type LangDict = Partial<Dict>;

const STORAGE_KEY = 'pg-lang';
const DEFAULT_LANG: LangCode = 'en';

/**
 * Auto-discovered locale registry. Every `*.ts` file under `./translations/`
 * is loaded eagerly and its single named export (or `default`) is registered
 * by file basename - so dropping `translations/de.ts` exporting
 * `Partial<Dict>` is enough to add German.
 *
 * Files must export the dict either as a named export matching the file
 * basename (e.g. `export const ru: Partial<Dict> = ...` in `ru.ts`) or as
 * the default export.
 */
const registry: Map<LangCode, LangDict> = new Map();

registry.set('en', en);
loadCommunityLocales();

function loadCommunityLocales(): void {
  // Vite-only API. Module objects are inlined at build time, so this is a
  // zero-runtime-cost lookup, not a glob hitting the filesystem.
  const modules = import.meta.glob<Record<string, unknown>>('./translations/*.ts', {
    eager: true,
  });
  for (const [path, mod] of Object.entries(modules)) {
    const m = /\/([^/]+)\.ts$/.exec(path);
    const code = m?.[1];
    if (!code || code === 'en') continue;
    const dict = pickDict(mod, code);
    if (dict) registry.set(code, dict);
    else console.warn(`[playground i18n] could not extract dict from ${path}`);
  }
}

function pickDict(mod: Record<string, unknown>, code: string): LangDict | null {
  // Prefer named export matching the file basename (idiomatic), fall back
  // to default. Reject anything that's not a plain object.
  const candidates: unknown[] = [mod[code], mod.default];
  for (const c of candidates) {
    if (c && typeof c === 'object' && !Array.isArray(c)) return c as LangDict;
  }
  return null;
}

let activeLang: LangCode = DEFAULT_LANG;

/** Returns sorted list of available locale codes (always includes 'en'). */
export function availableLangs(): LangCode[] {
  return Array.from(registry.keys()).sort();
}

export function getLang(): LangCode {
  return activeLang;
}

/**
 * Set active language. No-op + warning if unknown. Caller is responsible
 * for re-rendering or reloading - this function does not touch the DOM.
 */
export function setLang(code: LangCode): void {
  if (!registry.has(code)) {
    console.warn(`[playground i18n] unknown lang \`${code}\`, ignored`);
    return;
  }
  activeLang = code;
  try { localStorage.setItem(STORAGE_KEY, code); } catch { /* ignore */ }
}

/**
 * Resolve initial language using a cascade. SSR-safe: if `window` is
 * undefined (build time), returns the default.
 *
 *   1. URL ?lang=xx
 *   2. localStorage `pg-lang`
 *   3. <html lang="..."> attribute
 *   4. navigator.language
 *   5. fallback 'en'
 *
 * Each step only matches if the candidate code is in the registry, so a
 * stale localStorage value or unsupported browser language gracefully
 * falls through.
 */
export function detectLang(): LangCode {
  if (typeof window === 'undefined') return DEFAULT_LANG;
  const tries: (string | null | undefined)[] = [];
  try {
    const url = new URL(window.location.href);
    tries.push(url.searchParams.get('lang'));
  } catch { /* ignore */ }
  try { tries.push(localStorage.getItem(STORAGE_KEY)); } catch { /* ignore */ }
  if (typeof document !== 'undefined') tries.push(document.documentElement.lang);
  if (typeof navigator !== 'undefined') tries.push(navigator.language?.split('-')[0]);
  for (const raw of tries) {
    if (!raw) continue;
    const code = raw.toLowerCase();
    if (registry.has(code)) return code;
  }
  return DEFAULT_LANG;
}

/** Initialize the active language on boot. Idempotent. */
export function initLang(): LangCode {
  activeLang = detectLang();
  return activeLang;
}

/**
 * Translate a key with optional `${var}` interpolation. Falls back to the
 * canonical English string if the active locale doesn't define the key,
 * and to the raw key if even English is missing (which would be a bug).
 *
 *   t('status.errors', { count: 3, plural: 's' })  // "3 errors"
 *
 * Parameter values are inserted verbatim (no HTML escaping). Callers that
 * inject results as innerHTML are responsible for escaping.
 */
export function t(key: TranslationKey, params?: Record<string, string | number>): string {
  const dict = registry.get(activeLang) ?? {};
  const raw = dict[key] ?? en[key] ?? key;
  if (!params) return raw;
  return raw.replace(/\$\{(\w+)\}/g, (whole, name: string) => {
    const v = params[name];
    // Leave `${unknown}` placeholders as-is so translation strings can
    // legitimately contain literal `${vars}` text (e.g. json.desc).
    return v === undefined || v === null ? whole : String(v);
  });
}

/**
 * Helper for English plural endings: `plural(n, 's')` -> '' or 's'.
 * For locales with more complex rules (Russian: 0/1/few/many) use the
 * dedicated helper below.
 */
export function plural(n: number, suffix = 's'): string {
  return n === 1 ? '' : suffix;
}

/**
 * Resolve a plural form per active locale. Forms are passed in the order:
 *   [one, few, many]    (Russian needs all three)
 *   [one, other]        (English-style, two forms)
 *
 * For English this collapses to [one, other]. Used by status.errors etc.
 * where English picks 's' / '' but Russian wants 'а' / 'и' / '' style endings.
 */
export function pluralForm(n: number, forms: string[]): string {
  if (activeLang === 'ru' && forms.length >= 3) {
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return forms[0];
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms[1];
    return forms[2];
  }
  return n === 1 ? forms[0] : forms[forms.length - 1];
}

/** Test-only seam to register an additional locale at runtime. */
export function _registerForTests(code: LangCode, dict: LangDict): void {
  registry.set(code, dict);
}

/** Test-only seam to reset the active lang to default. */
export function _resetForTests(): void {
  activeLang = DEFAULT_LANG;
}
