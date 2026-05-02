import { findKeyDef } from '../catalog';
import type { Scope } from '../catalog/types';

interface Frame {
  bracket: '{' | '[';
  key?: string;
}

/**
 * Determine which set of keys is meaningful at the given cursor position.
 *
 * Algorithm: walk source until pos, push a stack frame on every `{`/`[`,
 * remembering the last seen identifier-followed-by-separator (the key that
 * opened this block). On `}`/`]` pop. Strings and comments are skipped.
 *
 * Resolution rules:
 *  - The innermost open `{` whose key has a `childrenScope` defined wins.
 *  - For `[` (arrays of objects, e.g. `items = [{...}]`), an inner `{` inherits
 *    the parent array's `childrenScope`.
 *  - A frame whose key is unknown (or known but without `childrenScope`)
 *    yields `unknown` - the autocomplete falls back to all keys.
 *  - Empty stack means top-level: `menu-root`.
 */
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

    if (frame.bracket === '[' && frame.key) {
      const def = findKeyDef(frame.key);
      const child = def?.childrenScope;
      if (child) return arrayPositionScope(child);
      return 'unknown';
    }

    if (frame.bracket === '{') {
      // If parent is an array of objects, e.g. items = [{...}], inherit
      // the array key's childrenScope.
      const parent = stack[j - 1];
      if (parent && parent.bracket === '[' && parent.key) {
        const parentDef = findKeyDef(parent.key);
        if (parentDef?.childrenScope) return parentDef.childrenScope;
      }
      const k = frame.key;
      if (k) {
        const def = findKeyDef(k);
        if (def?.childrenScope) return def.childrenScope;
        return 'unknown';
      }
      return 'unknown';
    }
  }

  return 'menu-root';
}

/**
 * When the cursor sits inside an array (between `[` and `{`/value), the
 * meaningful suggestion is "an object literal of the right shape", not the
 * keys that go inside that object. We map the element scope to a list-context
 * scope so the completion source can offer a single skeleton snippet instead
 * of dumping all object fields.
 */
function arrayPositionScope(elementScope: Scope): Scope {
  switch (elementScope) {
    case 'item': return 'item-list';
    case 'binding': return 'binding-list';
    case 'firework-effect': return 'firework-effect-list';
    default: return elementScope;
  }
}
