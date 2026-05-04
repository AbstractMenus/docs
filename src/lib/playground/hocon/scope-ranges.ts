import type { Node, Entry } from './types';
import { childScopeOf, arrayPositionScope } from '../catalog';
import type { Scope } from '../catalog/types';

/**
 * A single block (`{...}` object literal or element-position inside `[...]`)
 * with the scope that applies to its body.
 */
export interface ScopeRange {
  /** offset of the opening bracket (or 0 for root) */
  from: number;
  /** offset just past the closing bracket */
  to: number;
  scope: Scope;
  /** dotted key path that opened this scope (empty for root) */
  path: string[];
}

/**
 * Walk the parser AST once and emit a (from, to, scope, path) range for the
 * root, every `{ ... }`, and every list-context inside `[ ... ]`. Lets a
 * cursor-position lookup return the scope in O(n) over the ranges (already
 * sorted by depth) without re-walking the source text or duplicating the
 * bracket-balance logic.
 *
 * Exposed as a public API so future linter rules / hover-on-`{` previews /
 * cross-scope substitution checkers can share the same precomputed view of
 * the AST.
 */
export function buildScopeRanges(root: Node): ScopeRange[] {
  const out: ScopeRange[] = [];
  if (root.kind === 'object') {
    out.push({
      from: root.loc.offset,
      to: root.loc.offset + root.loc.length,
      scope: 'menu-root',
      path: [],
    });
    walkEntries(root.entries, 'menu-root', [], out);
  }
  return out;
}

function walkEntries(entries: Entry[], parentScope: Scope, parentPath: string[], out: ScopeRange[]): void {
  for (const entry of entries) {
    // Spread entries don't add a key path of their own - skip indexing.
    if (entry.spread) continue;
    const path = [...parentPath, ...entry.path];
    visitValue(entry, parentScope, path, out);
  }
}

function visitValue(entry: Entry, parentScope: Scope, fullPath: string[], out: ScopeRange[]): void {
  void parentScope;
  const v = entry.value;
  const keyName = entry.path[entry.path.length - 1];
  const childScope = childScopeOf(keyName);

  if (v.kind === 'object') {
    out.push({
      from: v.loc.offset,
      to: v.loc.offset + v.loc.length,
      scope: childScope,
      path: fullPath,
    });
    walkEntries(v.entries, childScope, fullPath, out);
    return;
  }

  if (v.kind === 'array') {
    out.push({
      from: v.loc.offset,
      to: v.loc.offset + v.loc.length,
      scope: arrayPositionScope(childScope),
      path: fullPath,
    });
    for (const item of v.items) {
      if (item.kind === 'object') {
        out.push({
          from: item.loc.offset,
          to: item.loc.offset + item.loc.length,
          scope: childScope,
          path: fullPath,
        });
        walkEntries(item.entries, childScope, fullPath, out);
      }
    }
  }
}

/**
 * Find the innermost range that contains `pos`. Ranges from buildScopeRanges
 * are emitted in walk order: nested ranges always come after their parent,
 * so iterating from the end yields the innermost match first.
 */
export function scopeAt(ranges: ScopeRange[], pos: number): { scope: Scope; path: string[] } {
  for (let i = ranges.length - 1; i >= 0; i--) {
    const r = ranges[i];
    if (r.from <= pos && pos <= r.to) return { scope: r.scope, path: r.path };
  }
  return { scope: 'menu-root', path: [] };
}
