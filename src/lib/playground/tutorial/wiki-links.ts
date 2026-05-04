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
  // --- menu-structure.md sections ---
  // Click handling (item.click block, scope: click)
  click: {
    en: '/docs/en/general/menu-structure/#click-processing',
    ru: '/docs/ru/general/menu-structure/#обработка-кликов',
  },
  // Items array (top-level "buttons" section)
  items: {
    en: '/docs/en/general/menu-structure/#buttons',
    ru: '/docs/ru/general/menu-structure/#кнопки',
  },
  // Menu-level properties (size, title, updateInterval, ...)
  size: {
    en: '/docs/en/general/menu-structure/#menu-properties',
    ru: '/docs/ru/general/menu-structure/#свойства-меню',
  },
  // Per-item display rules (visibility gating)
  'display-rules': {
    en: '/docs/en/general/menu-structure/#display-rules',
    ru: '/docs/ru/general/menu-structure/#правила-отображения',
  },
  // Bindings: per-player property swap based on rules
  bindings: {
    en: '/docs/en/general/menu-structure/#binding-button-properties-to-rules',
    ru: '/docs/ru/general/menu-structure/#привязка-свойств-кнопки-к-правилам',
  },

  // --- item-format.md sections ---
  // Item format root (all per-item fields)
  'item-format': {
    en: '/docs/en/general/item-format/',
    ru: '/docs/ru/general/item-format/',
  },
  // Slot positions (4 forms - index, range, x/y, matrix)
  slot: {
    en: '/docs/en/general/item-format/#slot',
    ru: '/docs/ru/general/item-format/#слот',
  },
  // count + cooldown (and other slot-adjacent fields)
  cooldown: {
    en: '/docs/en/general/item-format/#slot-and-cooldown',
    ru: '/docs/ru/general/item-format/#слот-и-кулдаун',
  },
  // Display section: name, lore, material, flags
  display: {
    en: '/docs/en/general/item-format/#display',
    ru: '/docs/ru/general/item-format/#отображение',
  },
  // Mechanics: enchantments, effects, firework, etc.
  mechanics: {
    en: '/docs/en/general/item-format/#mechanics',
    ru: '/docs/ru/general/item-format/#механики',
  },

  // --- standalone reference pages ---
  actions: {
    en: '/docs/en/general/actions/',
    ru: '/docs/ru/general/actions/',
  },
  rules: {
    en: '/docs/en/general/rules/',
    ru: '/docs/ru/general/rules/',
  },
  variables: {
    en: '/docs/en/general/variables/',
    ru: '/docs/ru/general/variables/',
  },
  placeholders: {
    en: '/docs/en/general/placeholders/',
    ru: '/docs/ru/general/placeholders/',
  },
  activators: {
    en: '/docs/en/general/activators/',
    ru: '/docs/ru/general/activators/',
  },
  // HOCON syntax overview (covers include, value types, etc.)
  hocon: {
    en: '/docs/en/start/hocon/',
    ru: '/docs/ru/start/hocon/',
  },
  // Templates / DRY patterns (defaults, includes)
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
