import type { KeyDef } from './types';

export const MENU_ROOT_KEYS: KeyDef[] = [
  { name: 'title', scope: 'menu-root', valueType: 'string', description: 'Menu title shown at the top of the inventory.' },
  { name: 'size', scope: 'menu-root', valueType: 'integer', description: 'Number of inventory rows (1-6).' },
  { name: 'activators', scope: 'menu-root', valueType: 'object', childrenScope: 'activators', description: 'How players open this menu (commands, clicks, regions, etc.).' },
  { name: 'items', scope: 'menu-root', valueType: 'list', childrenScope: 'item', description: 'List of items rendered in the menu.' },
  { name: 'denyActions', scope: 'menu-root', valueType: 'object', childrenScope: 'actions', description: 'Default deny-actions block when click rules fail.' },
  { name: 'updateInterval', scope: 'menu-root', valueType: 'duration', description: 'How often the menu re-renders dynamic items (e.g. 20t, 1s).' },
  { name: 'requirements', scope: 'menu-root', valueType: 'object', childrenScope: 'rules', description: 'Open-time requirements (rules that must pass to open the menu).' },
  { name: 'pages', scope: 'menu-root', valueType: 'integer', description: 'For paginated menus: number of pages.' },
  { name: 'menus', scope: 'menu-root', valueType: 'list', childrenScope: 'item', description: 'For animated menus: list of frame definitions.' },
  { name: 'metaList', scope: 'menu-root', valueType: 'list', description: 'Initial player-meta values to set on open.' },
  { name: 'closeActions', scope: 'menu-root', valueType: 'object', childrenScope: 'actions', description: 'Actions to fire when the menu closes.' },
  { name: 'matrix', scope: 'menu-root', valueType: 'list', description: 'Layout matrix for generated menus (each row a string of slot codes).' },
  // `defaults` is a community convention rather than a hard AbstractMenus
  // field: it's the canonical name for "shared item template I substitute
  // into each item via ${defaults}". Recognising it here keeps the DRY
  // pattern lessons (05-dotted-keys, 22-object-merge, 23-defaults-merge)
  // free of spurious unknown-key warnings.
  { name: 'defaults', scope: 'menu-root', valueType: 'object', childrenScope: 'item', description: 'Shared item template; reused via ${defaults} substitution.' },
];

export const ITEM_KEYS: KeyDef[] = [
  { name: 'slot', scope: 'item', valueType: 'any', childrenScope: 'slot', description: 'Inventory slot. Single (0), range "0-8", coordinates "1,2", or matrix (object).' },
  { name: 'material', scope: 'item', valueType: 'enum', enumRef: 'materials', description: 'Bukkit material name. Type "IRON" for IRON_INGOT, IRON_BLOCK, ...' },
  { name: 'name', scope: 'item', valueType: 'string', description: 'Item display name (legacy color codes & supported).' },
  { name: 'lore', scope: 'item', valueType: 'list', description: 'Lore lines.' },
  { name: 'count', scope: 'item', valueType: 'integer', description: 'Stack size (1-64).' },
  { name: 'click', scope: 'item', valueType: 'object', childrenScope: 'click', description: 'Click handler: which buttons fire which actions.' },
  { name: 'rules', scope: 'item', valueType: 'object', childrenScope: 'rules', description: 'Visibility/click rules attached to this item.' },
  { name: 'sound', scope: 'item', valueType: 'enum', enumRef: 'sounds', description: 'Sound to play when interacting with the item.' },
  { name: 'texture', scope: 'item', valueType: 'string', description: 'Custom head texture (URL, hash, or base64).' },
  { name: 'skullOwner', scope: 'item', valueType: 'string', description: 'Player name whose skin to use for PLAYER_HEAD.' },
  { name: 'flags', scope: 'item', valueType: 'list', description: 'ItemFlag list (HIDE_ENCHANTS, HIDE_ATTRIBUTES, ...).' },
  { name: 'enchantments', scope: 'item', valueType: 'object', childrenScope: 'enchantments', description: 'Map of enchantment name to level (e.g. { SHARPNESS = 5 }).' },
  { name: 'color', scope: 'item', valueType: 'any', description: 'Color (RGB list, named, or HEX) for leather armor / potions.' },
  { name: 'cooldown', scope: 'item', valueType: 'duration', description: 'Click cooldown for this item (e.g. 5s).' },
  { name: 'placedItem', scope: 'item', valueType: 'object', childrenScope: 'item', description: 'Item placed into anvil/crafting slot (input mode menus).' },
  { name: 'updateInterval', scope: 'item', valueType: 'duration', description: 'Per-item update interval (overrides menu-level).' },
  { name: 'bindings', scope: 'item', valueType: 'list', childrenScope: 'binding', description: 'Rules-gated property overrides.' },
  { name: 'item', scope: 'item', valueType: 'object', childrenScope: 'item', description: 'Override an existing item template by reference.' },
  { name: 'effect', scope: 'item', valueType: 'object', childrenScope: 'potion-effect', description: 'Potion effect data (POTION/SPLASH_POTION items).' },
  { name: 'firework', scope: 'item', valueType: 'object', childrenScope: 'firework', description: 'Firework explosion data.' },
];

export const CLICK_KEYS: KeyDef[] = [
  { name: 'left', scope: 'click', valueType: 'object', childrenScope: 'click', description: 'Left-click handler (actions/rules/denyActions).' },
  { name: 'right', scope: 'click', valueType: 'object', childrenScope: 'click', description: 'Right-click handler.' },
  { name: 'middle', scope: 'click', valueType: 'object', childrenScope: 'click', description: 'Middle-click handler.' },
  { name: 'drop', scope: 'click', valueType: 'object', childrenScope: 'click', description: 'Drop-key (Q) handler.' },
  { name: 'shiftLeft', scope: 'click', valueType: 'object', childrenScope: 'click', description: 'Shift+Left click handler.' },
  { name: 'shiftRight', scope: 'click', valueType: 'object', childrenScope: 'click', description: 'Shift+Right click handler.' },
  { name: 'actions', scope: 'click', valueType: 'object', childrenScope: 'actions', description: 'Actions fired on this click (when rules pass).' },
  { name: 'rules', scope: 'click', valueType: 'object', childrenScope: 'rules', description: 'Rules that gate the actions.' },
  { name: 'denyActions', scope: 'click', valueType: 'object', childrenScope: 'actions', description: 'Actions fired when rules fail.' },
];
