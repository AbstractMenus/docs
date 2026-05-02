import type { Scope } from '../catalog/types';

interface Frame {
  bracket: '{' | '[';
  key?: string;
}

const KEY_TO_SCOPE: Record<string, Scope> = {
  click: 'click',
  actions: 'actions',
  denyActions: 'actions',
  closeActions: 'actions',
  rules: 'rules',
  requirements: 'rules',
  activators: 'activators',
  left: 'click',
  right: 'click',
  middle: 'click',
  drop: 'click',
  shiftLeft: 'click',
  shiftRight: 'click',
};

export function detectScope(text: string, pos: number): Scope {
  const stack: Frame[] = [];
  let lastKey: string | undefined;
  let inString = false;
  let inTriple = false;
  let i = 0;
  const end = Math.min(pos, text.length);

  while (i < end) {
    const ch = text[i];

    if (inTriple) {
      if (ch === '"' && text[i + 1] === '"' && text[i + 2] === '"') { inTriple = false; i += 3; continue; }
      i++; continue;
    }
    if (inString) {
      if (ch === '\\') { i += 2; continue; }
      if (ch === '"') { inString = false; }
      i++; continue;
    }

    if (ch === '#' || (ch === '/' && text[i + 1] === '/')) {
      while (i < end && text[i] !== '\n') i++;
      continue;
    }

    if (ch === '"' && text[i + 1] === '"' && text[i + 2] === '"') { inTriple = true; i += 3; continue; }
    if (ch === '"') { inString = true; i++; continue; }

    if (ch === '{' || ch === '[') {
      stack.push({ bracket: ch as '{' | '[', key: lastKey });
      lastKey = undefined;
      i++; continue;
    }
    if (ch === '}' || ch === ']') {
      stack.pop();
      lastKey = undefined;
      i++; continue;
    }

    const idMatch = /^[A-Za-z_][\w-]*/.exec(text.slice(i));
    if (idMatch) {
      const id = idMatch[0];
      const after = text.slice(i + id.length).replace(/^[ \t]+/, '');
      if (after.startsWith('=') || after.startsWith(':') || after.startsWith('+=') || after.startsWith('{') || after.startsWith('[')) {
        lastKey = id;
      }
      i += id.length;
      continue;
    }

    i++;
  }

  for (let j = stack.length - 1; j >= 0; j--) {
    const frame = stack[j];
    if (frame.bracket === '[' && frame.key === 'items') return 'item';
    if (frame.bracket === '{') {
      const parent = stack[j - 1];
      if (parent && parent.bracket === '[' && parent.key === 'items') return 'item';
      const k = frame.key;
      if (k && KEY_TO_SCOPE[k]) return KEY_TO_SCOPE[k];
    }
  }

  return 'menu-root';
}
