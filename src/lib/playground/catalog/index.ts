import type { KeyDef, Scope } from './types';
import { MENU_ROOT_KEYS, ITEM_KEYS, CLICK_KEYS } from './keys';
import { ACTION_KEYS } from './actions';
import { RULE_KEYS } from './rules';
import { ACTIVATOR_KEYS } from './activators';
import { MATERIALS } from './materials';
import { SOUNDS } from './sounds';
import {
  SLOT_FIELDS,
  ENCHANTMENT_FIELDS,
  FIREWORK_FIELDS,
  FIREWORK_EFFECT_FIELDS,
  POTION_EFFECT_FIELDS,
  BINDING_FIELDS,
} from './sub-scopes';

// List-context scopes (e.g. cursor inside `items = [│]`) intentionally have
// no key set - the completion source maps them to a single skeleton snippet
// instead. Keeping them here as empty arrays satisfies Record<Scope, ...>
// exhaustiveness, and any drive-by call to getKeysForScope returns [].
const ALL_KEYS_BY_SCOPE: Record<Scope, KeyDef[]> = {
  'menu-root': MENU_ROOT_KEYS,
  'item': ITEM_KEYS,
  'click': CLICK_KEYS,
  'actions': ACTION_KEYS,
  'rules': RULE_KEYS,
  'activators': ACTIVATOR_KEYS,
  'slot': SLOT_FIELDS,
  'enchantments': ENCHANTMENT_FIELDS,
  'firework': FIREWORK_FIELDS,
  'firework-effect': FIREWORK_EFFECT_FIELDS,
  'potion-effect': POTION_EFFECT_FIELDS,
  'binding': BINDING_FIELDS,
  'item-list': [],
  'binding-list': [],
  'firework-effect-list': [],
  'unknown': [],
};

let unknownFallback: KeyDef[] | null = null;
function getAllUniqueKeys(): KeyDef[] {
  if (unknownFallback) return unknownFallback;
  const seen = new Set<string>();
  const out: KeyDef[] = [];
  for (const list of Object.values(ALL_KEYS_BY_SCOPE)) {
    for (const k of list) {
      if (!seen.has(k.name)) { seen.add(k.name); out.push(k); }
    }
  }
  unknownFallback = out;
  return out;
}

export function getKeysForScope(scope: Scope): KeyDef[] {
  const list = ALL_KEYS_BY_SCOPE[scope];
  if (list && list.length > 0) return list;
  if (scope === 'unknown') return getAllUniqueKeys();
  return [];
}

export function getEnumValues(name: 'materials' | 'sounds'): readonly string[] {
  return name === 'materials' ? MATERIALS : SOUNDS;
}

const KEY_BY_NAME: Map<string, KeyDef> = new Map();
for (const list of Object.values(ALL_KEYS_BY_SCOPE)) {
  for (const k of list) if (!KEY_BY_NAME.has(k.name)) KEY_BY_NAME.set(k.name, k);
}

export function findKeyDef(name: string): KeyDef | undefined {
  return KEY_BY_NAME.get(name);
}

export type { KeyDef, Scope } from './types';
