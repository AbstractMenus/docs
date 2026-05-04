import type { Node, Diagnostic } from './types';
import type { Scope } from '../catalog/types';
import { getKeysForScope, findKeyDef, childScopeOf } from '../catalog';
import { formatDiagMessage } from './diag';

/**
 * Walk the AST and emit a warning for every entry whose key is not in the
 * catalog for its enclosing scope. Skips entries inside an `unknown` scope
 * (custom user-defined blocks where we have no schema).
 */
export function validateUnknownKeys(root: Node): Diagnostic[] {
  const warnings: Diagnostic[] = [];
  if (root.kind === 'object') walkObject(root, 'menu-root', warnings);
  return warnings;
}

function walkObject(
  obj: Extract<Node, { kind: 'object' }>,
  scope: Scope,
  warnings: Diagnostic[],
): void {
  const skipCheck = scope === 'unknown';
  const known = skipCheck ? null : new Set(getKeysForScope(scope).map((k) => k.name));

  for (const entry of obj.entries) {
    const firstKey = entry.path[0];
    if (!firstKey) continue;

    if (known && !known.has(firstKey)) {
      const params = { key: firstKey, scope };
      warnings.push({
        severity: 'warning',
        code: 'validate.unknown-key',
        params,
        message: formatDiagMessage('validate.unknown-key', params),
        line: entry.loc.line,
        column: entry.loc.column,
        offset: entry.loc.offset,
        length: firstKey.length,
      });
    }

    const childScope = childScopeFor(firstKey, scope);
    if (childScope) {
      const def = findKeyDef(firstKey);
      // Only flag "expects a list of objects" when the key actually targets
      // a structured element scope (childrenScope set). Lists of primitives
      // like `lore` (strings) or `flags` (string enum) are valueType: 'list'
      // too but legitimately hold non-objects.
      const expectsListOfObjects = def?.valueType === 'list' && !!def.childrenScope;
      visitValue(entry.value, childScope, warnings, firstKey, expectsListOfObjects);
    }
  }
}

function childScopeFor(keyName: string, parentScope: Scope): Scope | null {
  const def = findKeyDef(keyName);
  if (def?.childrenScope) return def.childrenScope;
  // Unknown key in a known scope still walks its body as `unknown` so we
  // don't cascade noise into it. Once we're already in `unknown`, stop
  // descending - we have no schema to validate against.
  if (parentScope !== 'unknown') return childScopeOf(keyName); // 'unknown'
  return null;
}

function visitValue(
  v: Node,
  scope: Scope,
  warnings: Diagnostic[],
  parentKey: string,
  expectListOfObjects: boolean,
): void {
  if (v.kind === 'object') {
    walkObject(v, scope, warnings);
    return;
  }
  if (v.kind === 'array') {
    for (const item of v.items) {
      if (item.kind === 'object') {
        walkObject(item, scope, warnings);
      } else if (expectListOfObjects && item.kind !== 'substitution' && item.kind !== 'include') {
        const params = { parentKey, itemKind: item.kind };
        warnings.push({
          severity: 'warning',
          code: 'validate.expected-list-of-objects',
          params,
          message: formatDiagMessage('validate.expected-list-of-objects', params),
          line: item.loc.line,
          column: item.loc.column,
          offset: item.loc.offset,
          length: item.loc.length,
        });
      }
    }
  }
}
