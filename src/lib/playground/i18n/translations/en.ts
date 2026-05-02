/**
 * Canonical English dictionary. Source of truth for translation keys -
 * every other locale is `Partial<typeof en>` and falls back here on missing
 * keys, so the UI is never empty even if a community translation drifts.
 *
 * Keys use dot-namespaces by feature area (tab.*, btn.*, tutorial.*, etc.).
 * `${var}` placeholders are interpolated by `t(key, params)`.
 */
export const en = {
  // Brand / shell
  'brand.sub': 'Playground',

  // Mode switch
  'mode.editor': 'Editor',
  'mode.tutorial': 'Tutorial',
  'mode.aria': 'Playground mode',

  // Theme + lang
  'theme.toggle.aria': 'Toggle theme',
  'lang.select.aria': 'Language',

  // Tabs
  'tab.errors': 'Errors',
  'tab.warnings': 'Warnings',
  'tab.json': 'Resolved JSON',
  'tab.tutorial': 'Tutorial',

  // Empty states
  'empty.errors': 'No errors.',
  'empty.warnings':
    'No warnings. Warnings flag suspicious but valid configs (unknown keys, unresolved substitutions). They do not stop the menu from loading.',
  'empty.json': 'Resolved JSON appears here once the parser is wired up.',
  'empty.tutorial': 'Tutorial mode lands at M.6.',
  'empty.history': 'No history yet.',

  // Footer / status
  'status.ready': 'ready',
  'status.ok': 'ok',
  'status.errors': '${count} error${plural}',
  'status.warnings': '${count} warning${plural}',
  'scope.hint.placeholder': '- keys -',
  'scope.hint.title': 'Show suggestions for the current scope',
  'scope.hint.body': '${scope} · ${count} key${plural} · ${shortcut}',

  // Buttons
  'btn.history': 'History',
  'btn.format': 'Format',
  'btn.format.title': 'Format (Cmd+Shift+F)',
  'btn.share': 'Share',
  'btn.copy': 'Copy',
  'btn.warnings.on': 'warnings: on',
  'btn.warnings.off': 'warnings: off',
  'btn.warnings.title.on': 'Hide warning squiggles in the editor (Warnings tab stays)',
  'btn.warnings.title.off': 'Show warning squiggles in the editor',

  // Toasts
  'toast.linkCopied': 'Link copied',
  'toast.copyFailed': 'Copy failed',

  // Resolved JSON description
  'json.desc':
    'How AbstractMenus sees your config after HOCON resolves substitutions, dotted keys, and overrides. Use this to verify that ${vars} expand correctly and that nested objects flatten the way you expect.',

  // Tutorial
  'tutorial.goalLabel': 'Goal: ',
  'tutorial.passed': '✓ Goal reached',
  'tutorial.btn.hint': 'Hint',
  'tutorial.btn.reset': 'Reset',
  'tutorial.btn.skip': 'Skip',
  'tutorial.btn.next': 'Next',
  'tutorial.done.title': '🎉 Course complete',
  'tutorial.done.body': "You've finished every lesson. Try the editor mode now.",

  // History
  'history.empty': '(empty)',
  'history.justNow': 'just now',
  'history.minutes': '${n}m ago',
  'history.hours': '${n}h ago',
  'history.days': '${n}d ago',

  // Page meta (only used if astro page is rendered server-side in this lang)
  'page.title': 'HOCON Playground - AbstractMenus',
  'page.description':
    'Browser playground for AbstractMenus HOCON menu configs. Validate, share, learn.',
} as const;

/**
 * `typeof en` infers literal types per value (e.g. 'Editor' instead of
 * `string`), which would force every locale's value to equal the English
 * string. Re-cast to a plain `Record<key, string>` for the public types.
 */
export type TranslationKey = keyof typeof en;
export type Dict = Record<TranslationKey, string>;
