import { getLang } from '../i18n';

/**
 * Concept -> per-locale documentation URL. Used by lesson markdown via the
 * `[label](wiki:concept)` syntax, resolved at render time against the
 * active language so a Russian-locale user lands on the Russian doc page,
 * etc.
 *
 * URLs include the `/docs/<lang>/` base. Anchor fragments are encoded
 * (Cyrillic anchors must be percent-encoded for href correctness).
 *
 * Add a new entry here whenever a lesson wants to deep-link to a wiki
 * concept; missing locale variants gracefully fall back to `en`.
 */
export interface WikiEntry {
  en: string;
  ru?: string;
}

const PERCENT_ENCODE_ANCHOR = (s: string): string =>
  s.replace(/#(.+)$/, (_, anchor) => '#' + encodeURIComponent(anchor));

const RAW: Record<string, WikiEntry> = {
  // Click handling (item.click block, scope: click)
  click: {
    en: '/docs/en/general/menu-structure/#click-handling',
    ru: '/docs/ru/general/menu-structure/#обработка-кликов',
  },
  // Slot positions / numbering
  slot: {
    en: '/docs/en/general/menu-structure/#slots',
    ru: '/docs/ru/general/menu-structure/#слоты',
  },
  // Items array (top-level)
  items: {
    en: '/docs/en/general/menu-structure/#items',
    ru: '/docs/ru/general/menu-structure/#items',
  },
  // Item format - all per-item fields (material, name, lore, ...)
  'item-format': {
    en: '/docs/en/general/item-format/',
    ru: '/docs/ru/general/item-format/',
  },
  // Actions reference (message, command, sound, ...)
  actions: {
    en: '/docs/en/general/actions/',
    ru: '/docs/ru/general/actions/',
  },
  // Rules reference (permission, world, gamemode, ...)
  rules: {
    en: '/docs/en/general/rules/',
    ru: '/docs/ru/general/rules/',
  },
  // ${var} substitution variables
  variables: {
    en: '/docs/en/general/variables/',
    ru: '/docs/ru/general/variables/',
  },
  // %placeholder% (PlaceholderAPI)
  placeholders: {
    en: '/docs/en/general/placeholders/',
    ru: '/docs/ru/general/placeholders/',
  },
  // How players open menus (commands, regions, click triggers)
  activators: {
    en: '/docs/en/general/activators/',
    ru: '/docs/ru/general/activators/',
  },
  // HOCON syntax overview (covers include, value types, etc.)
  hocon: {
    en: '/docs/en/start/hocon/',
    ru: '/docs/ru/start/hocon/',
  },
  // Templates / DRY patterns (defaults, bindings, includes)
  templates: {
    en: '/docs/en/advanced/templates/',
    ru: '/docs/ru/advanced/templates/',
  },
};

const REGISTRY: Record<string, WikiEntry> = Object.fromEntries(
  Object.entries(RAW).map(([k, v]) => [k, {
    en: PERCENT_ENCODE_ANCHOR(v.en),
    ru: v.ru ? PERCENT_ENCODE_ANCHOR(v.ru) : undefined,
  }]),
);

/**
 * Look up a concept and return the URL for the active language. Falls back
 * to English if the locale-specific URL isn't seeded. Returns null for
 * unknown concepts (lesson author probably typo'd).
 */
export function resolveWikiUrl(concept: string): string | null {
  const entry = REGISTRY[concept];
  if (!entry) return null;
  const lang = getLang();
  return (entry as Record<string, string | undefined>)[lang] ?? entry.en;
}

/** Whether a concept exists in the registry (for tests / sanity checks). */
export function hasWikiConcept(concept: string): boolean {
  return concept in REGISTRY;
}
