import type { KeyDef } from './types';

export const ACTIVATOR_KEYS: KeyDef[] = [
  { name: 'command', scope: 'activators', valueType: 'any', description: 'Open via /command. String, list, or { command, aliases }.' },
  { name: 'chat', scope: 'activators', valueType: 'any', description: 'Open via chat trigger (full word, partial, or symbol).' },
  { name: 'regionJoin', scope: 'activators', valueType: 'string', description: 'WorldGuard: open when entering this region.' },
  { name: 'regionLeave', scope: 'activators', valueType: 'string', description: 'WorldGuard: open when leaving this region.' },
  { name: 'clickItem', scope: 'activators', valueType: 'object', description: 'Open when clicking a specific item.' },
  { name: 'clickNPC', scope: 'activators', valueType: 'string', description: 'Citizens NPC click trigger.' },
  { name: 'clickEntity', scope: 'activators', valueType: 'object', description: 'Open when clicking a specific entity type.' },
  { name: 'shiftClickEntity', scope: 'activators', valueType: 'object', description: 'Open on shift-click on an entity.' },
  { name: 'clickBlock', scope: 'activators', valueType: 'object', description: 'Open on click of a block at coordinates.' },
  { name: 'clickBlockType', scope: 'activators', valueType: 'string', description: 'Open on click of any block of this material.' },
  { name: 'button', scope: 'activators', valueType: 'object', description: 'Open on button press.' },
  { name: 'lever', scope: 'activators', valueType: 'object', description: 'Open on lever toggle.' },
  { name: 'plate', scope: 'activators', valueType: 'object', description: 'Open on pressure-plate step.' },
  { name: 'table', scope: 'activators', valueType: 'object', description: 'Open on sign click.' },
  { name: 'swapItems', scope: 'activators', valueType: 'object', description: 'Open on hotbar swap (F key).' },
];
