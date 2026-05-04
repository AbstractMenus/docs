import { childScopeOf, arrayPositionScope } from '../catalog';
import type { Scope } from '../catalog/types';
import { stripStringsAndComments } from './text-utils';

interface Frame {
  bracket: '{' | '[';
  key?: string;
}

/**
 * Determine which set of keys is meaningful at the given cursor position.
 *
 * Strip strings/comments first (so brackets nested in `"..."` or after `#`
 * don't open frames), then walk the safe copy: push a stack frame on every
 * `{`/`[`, remembering the last seen identifier-followed-by-separator (the
 * key that opened this block). On `}`/`]` pop.
 *
 * Resolution rules:
 *  - The innermost open `{` whose key has a `childrenScope` defined wins.
 *  - For `[` (arrays of objects, e.g. `items = [{...}]`), an inner `{`
 *    inherits the parent array's `childrenScope`.
 *  - A frame whose key is unknown (or known but without `childrenScope`)
 *    yields `unknown` - the autocomplete falls back to all keys.
 *  - Empty stack means top-level: `menu-root`.
 */
export function detectScope(text: string, pos: number): Scope {
  const safe = stripStringsAndComments(text);
  const end = Math.min(pos, safe.length);
  const stack: Frame[] = [];
  let lastKey: string | undefined;
  let i = 0;

  while (i < end) {
    const ch = safe[i];

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

    const idMatch = /^[A-Za-z_][\w-]*/.exec(safe.slice(i));
    if (idMatch) {
      const id = idMatch[0];
      const after = safe.slice(i + id.length).replace(/^[ \t]+/, '');
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
      return arrayPositionScope(childScopeOf(frame.key));
    }

    if (frame.bracket === '{') {
      // If parent is an array of objects, e.g. items = [{...}], inherit
      // the array key's childrenScope.
      const parent = stack[j - 1];
      if (parent && parent.bracket === '[' && parent.key) {
        return childScopeOf(parent.key);
      }
      if (frame.key) return childScopeOf(frame.key);
      return 'unknown';
    }
  }

  return 'menu-root';
}
