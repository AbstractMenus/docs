import type { KeyDef } from './types';

export const SLOT_FIELDS: KeyDef[] = [
  { name: 'matrix', scope: 'slot', valueType: 'list', description: 'List of strings, one per menu row. Non-"-" characters mark selected cells.' },
  { name: 'symbol', scope: 'slot', valueType: 'string', description: 'Character used in the matrix to mark a selected cell.' },
];

export const FIREWORK_FIELDS: KeyDef[] = [
  { name: 'power', scope: 'firework', valueType: 'integer', description: 'Firework flight duration (1-3 typical).' },
  { name: 'effects', scope: 'firework', valueType: 'list', childrenScope: 'firework-effect', description: 'List of firework effects.' },
];

export const FIREWORK_EFFECT_FIELDS: KeyDef[] = [
  { name: 'type', scope: 'firework-effect', valueType: 'string', description: 'Effect shape: BALL, BURST, BALL_LARGE, STAR, CREEPER.' },
  { name: 'colors', scope: 'firework-effect', valueType: 'list', description: 'Primary colors (list of RGB lists or color names).' },
  { name: 'fadeColors', scope: 'firework-effect', valueType: 'list', description: 'Fade colors.' },
  { name: 'flicker', scope: 'firework-effect', valueType: 'boolean', description: 'Add flicker effect.' },
  { name: 'trail', scope: 'firework-effect', valueType: 'boolean', description: 'Add trail effect.' },
];

export const POTION_EFFECT_FIELDS: KeyDef[] = [
  { name: 'type', scope: 'potion-effect', valueType: 'string', description: 'Effect type (SPEED, REGENERATION, NIGHT_VISION, ...).' },
  { name: 'duration', scope: 'potion-effect', valueType: 'duration', description: 'Effect duration (e.g. 30s).' },
  { name: 'amplifier', scope: 'potion-effect', valueType: 'integer', description: 'Amplifier level (0 = level I).' },
  { name: 'ambient', scope: 'potion-effect', valueType: 'boolean', description: 'Reduce particle alpha (beacon-style).' },
  { name: 'particles', scope: 'potion-effect', valueType: 'boolean', description: 'Show particles around player.' },
  { name: 'icon', scope: 'potion-effect', valueType: 'boolean', description: 'Show effect icon in HUD.' },
];

export const BINDING_FIELDS: KeyDef[] = [
  { name: 'rules', scope: 'binding', valueType: 'object', childrenScope: 'rules', description: 'Rules that gate this binding (must pass for props to apply).' },
  { name: 'props', scope: 'binding', valueType: 'object', childrenScope: 'item', description: 'Item properties to apply when rules pass (any item-scope key).' },
];

const ENCHANT_NAMES = [
  'SHARPNESS', 'SMITE', 'BANE_OF_ARTHROPODS', 'KNOCKBACK', 'FIRE_ASPECT', 'LOOTING', 'SWEEPING_EDGE',
  'EFFICIENCY', 'SILK_TOUCH', 'UNBREAKING', 'FORTUNE',
  'POWER', 'PUNCH', 'FLAME', 'INFINITY',
  'LUCK_OF_THE_SEA', 'LURE',
  'AQUA_AFFINITY', 'RESPIRATION', 'DEPTH_STRIDER', 'FROST_WALKER',
  'PROTECTION', 'FIRE_PROTECTION', 'BLAST_PROTECTION', 'PROJECTILE_PROTECTION', 'FEATHER_FALLING',
  'THORNS', 'SOUL_SPEED', 'SWIFT_SNEAK',
  'MULTISHOT', 'QUICK_CHARGE', 'PIERCING',
  'MENDING', 'CURSE_OF_VANISHING', 'CURSE_OF_BINDING',
  'RIPTIDE', 'LOYALTY', 'IMPALING', 'CHANNELING',
];

export const ENCHANTMENT_FIELDS: KeyDef[] = ENCHANT_NAMES.map((name) => ({
  name,
  scope: 'enchantments' as const,
  valueType: 'integer' as const,
  description: `${name.toLowerCase().replace(/_/g, ' ')} enchantment level.`,
}));
