import type { KeyDef } from './types';

export const RULE_KEYS: KeyDef[] = [
  { name: 'permission', scope: 'rules', valueType: 'string', description: 'Player must have this permission.' },
  { name: 'money', scope: 'rules', valueType: 'integer', description: 'Player must have at least this Vault balance.' },
  { name: 'levels', scope: 'rules', valueType: 'integer', description: 'Player must have at least this XP level.' },
  { name: 'gamemode', scope: 'rules', valueType: 'string', description: 'Player must be in this gamemode.' },
  { name: 'world', scope: 'rules', valueType: 'string', description: 'Player must be in this world.' },
  { name: 'region', scope: 'rules', valueType: 'string', description: 'WorldGuard: player must be in this region.' },
  { name: 'inventoryItems', scope: 'rules', valueType: 'object', description: 'Player must have these items in inventory.' },
  { name: 'heldItem', scope: 'rules', valueType: 'object', description: 'Player must hold this item.' },
  { name: 'varExisting', scope: 'rules', valueType: 'object', description: 'Variable must exist with given value.' },
  { name: 'bungeeOnline', scope: 'rules', valueType: 'string', description: 'BungeeCord server must be online.' },
  { name: 'if', scope: 'rules', valueType: 'object', description: 'Conditional rule: { left, op, right }.' },
  { name: 'js', scope: 'rules', valueType: 'string', description: 'JavaScript predicate (returns truthy to pass).' },
  { name: 'placeholder', scope: 'rules', valueType: 'object', description: 'PlaceholderAPI value comparison.' },
  { name: 'time', scope: 'rules', valueType: 'object', description: 'In-world time of day comparison.' },
  { name: 'cooldown', scope: 'rules', valueType: 'duration', description: 'Per-player cooldown gate.' },
];
