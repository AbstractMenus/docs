import type { KeyDef, Scope } from './types';
import { MENU_ROOT_KEYS, ITEM_KEYS, CLICK_KEYS } from './keys';
import { ACTION_KEYS } from './actions';
import { RULE_KEYS } from './rules';
import { ACTIVATOR_KEYS } from './activators';
import { MATERIALS } from './materials';
import { SOUNDS } from './sounds';

const ALL_KEYS_BY_SCOPE: Record<Scope, KeyDef[]> = {
  'menu-root': MENU_ROOT_KEYS,
  'item': ITEM_KEYS,
  'click': CLICK_KEYS,
  'actions': ACTION_KEYS,
  'rules': RULE_KEYS,
  'activators': ACTIVATOR_KEYS,
};

export function getKeysForScope(scope: Scope): KeyDef[] {
  return ALL_KEYS_BY_SCOPE[scope] ?? [];
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
