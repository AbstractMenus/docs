import { getLang } from '../i18n';
import type { KeyDef } from './types';

/**
 * Per-locale overrides for catalog `description` text. Keys are
 * `<scope>.<name>` (e.g. `menu-root.title`); values are the translated
 * description.
 *
 * Translation files live in `./translations/<lang>.ts` and are auto-loaded
 * via import.meta.glob - dropping a new file there registers the locale.
 * Each file exports either a default object or a named export matching
 * the file basename. A locale is free to translate only a subset; missing
 * keys fall back to the canonical English `description` on the KeyDef.
 */
const modules = import.meta.glob<Record<string, unknown>>('./translations/*.ts', { eager: true });
const registry = new Map<string, Record<string, string>>();

for (const [path, mod] of Object.entries(modules)) {
  const code = /\/([^/]+)\.ts$/.exec(path)?.[1];
  if (!code) continue;
  const dict = pickDict(mod, code);
  if (dict) registry.set(code, dict);
}

function pickDict(mod: Record<string, unknown>, code: string): Record<string, string> | null {
  for (const candidate of [mod[code], mod.default]) {
    if (candidate && typeof candidate === 'object' && !Array.isArray(candidate)) {
      return candidate as Record<string, string>;
    }
  }
  return null;
}

export function describeKeyDef(def: KeyDef): string {
  const dict = registry.get(getLang());
  if (dict) {
    const translated = dict[`${def.scope}.${def.name}`];
    if (translated) return translated;
  }
  return def.description;
}
