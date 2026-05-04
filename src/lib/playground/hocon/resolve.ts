import type { Node, Entry, Diagnostic, ResolveResult } from './types';
import { formatDiagMessage } from './diag';

export function resolve(root: Node): ResolveResult {
  const warnings: Diagnostic[] = [];
  if (root.kind !== 'object') {
    return { resolved: nodeToValueNoSubs(root), warnings };
  }
  const tree = buildTree(root.entries, warnings);
  const visiting = new Set<string>();
  const resolved = resolveSubsDeep(tree, tree, visiting, warnings);
  return { resolved, warnings };
}

type Tree = { [k: string]: Tree | Node };

/**
 * Symbol-keyed slot on a Tree that holds inline-spread substitutions
 * collected from `${ref}` entries. Symbol so it doesn't collide with any
 * user key and isn't enumerated by Object.keys() in resolveSubsDeep.
 */
const SPREADS = Symbol('hocon-spreads');
type TreeWithSpreads = Tree & { [SPREADS]?: Node[] };

function isLeaf(v: Tree | Node): v is Node {
  return v !== null && typeof v === 'object' && 'kind' in v;
}

function buildTree(entries: Entry[], warnings: Diagnostic[]): Tree {
  const tree: TreeWithSpreads = {};
  for (const e of entries) {
    if (e.value.kind === 'include') {
      // Includes have path: [] - calling setPath would write a literal
      // "undefined" key into the tree. Task 4 will replace this with a
      // real handler that loads and merges the referenced file.
      continue;
    }
    if (e.spread) {
      const list = tree[SPREADS] ?? [];
      list.push(e.value);
      tree[SPREADS] = list;
    } else {
      setPath(tree, e.path, e.value, e.append, warnings);
    }
  }
  return tree;
}

function setPath(tree: Tree, path: string[], value: Node, append: boolean, warnings: Diagnostic[]): void {
  let cur: Tree = tree;
  for (let i = 0; i < path.length - 1; i++) {
    const k = path[i];
    if (!(k in cur) || isLeaf(cur[k])) cur[k] = {};
    cur = cur[k] as Tree;
  }
  const lastKey = path[path.length - 1];
  if (append) {
    // `key += value` per HOCON spec. Equivalent to `key = ${?key} [value]`
    // when value is an array. We implement the common case (value is an
    // array literal) directly at build time. Substitution-valued appends
    // (`items += ${shared}`) fall back to overwrite.
    if (value.kind !== 'array') {
      cur[lastKey] = value;
      return;
    }
    const existing = cur[lastKey];
    if (existing === undefined) {
      cur[lastKey] = value;
      return;
    }
    if (isLeaf(existing) && existing.kind === 'array') {
      cur[lastKey] = { ...existing, items: [...existing.items, ...value.items] };
      return;
    }
    // existing is an object tree or a non-array leaf - fall back to overwrite.
    cur[lastKey] = value;
    return;
  }
  if (value.kind === 'object') {
    const incoming = buildTree(value.entries, warnings);
    const existing = cur[lastKey];
    // HOCON spec: when both the previous and the new value at a path are
    // objects, merge them recursively. When either is non-object, the new
    // value replaces the old (last-wins for scalars).
    if (existing !== undefined && !isLeaf(existing)) {
      cur[lastKey] = mergeTrees(existing as Tree, incoming, warnings);
    } else {
      cur[lastKey] = incoming;
    }
  } else {
    cur[lastKey] = value;
  }
}

/**
 * Recursively merge two object trees, last-wins for any non-object collision.
 * Mutates neither input - returns a fresh tree.
 */
function mergeTrees(a: Tree, b: Tree, warnings: Diagnostic[]): Tree {
  const out: Tree = { ...a };
  for (const k of Object.keys(b)) {
    const av = out[k];
    const bv = b[k];
    if (av !== undefined && !isLeaf(av) && !isLeaf(bv)) {
      out[k] = mergeTrees(av as Tree, bv as Tree, warnings);
    } else {
      out[k] = bv;
    }
  }
  return out;
}

function resolveSubsDeep(
  tree: Tree,
  root: Tree,
  visiting: Set<string>,
  warnings: Diagnostic[],
): unknown {
  const out: Record<string, unknown> = {};
  // Spread substitutions are resolved FIRST so explicit own keys (set
  // below) win on collision. Matches the typical "defaults + overrides"
  // intent rather than HOCON's strict declaration-order semantics; trade
  // documented for lesson-friendliness.
  const spreads = (tree as TreeWithSpreads)[SPREADS];
  if (spreads) {
    for (const sub of spreads) {
      const resolved = resolveNode(sub, root, visiting, warnings);
      if (resolved && typeof resolved === 'object' && !Array.isArray(resolved)) {
        Object.assign(out, resolved);
      }
    }
  }
  for (const k of Object.keys(tree)) {
    const v = tree[k];
    out[k] = isLeaf(v)
      ? resolveNode(v, root, visiting, warnings)
      : resolveSubsDeep(v as Tree, root, visiting, warnings);
  }
  return out;
}

function resolveNode(
  n: Node,
  root: Tree,
  visiting: Set<string>,
  warnings: Diagnostic[],
): unknown {
  switch (n.kind) {
    case 'string': return n.value;
    case 'number': return n.value;
    case 'bool': return n.value;
    case 'null': return null;
    case 'duration': return n.raw;
    case 'value': return n.value;
    case 'array': return n.items.map((it) => resolveNode(it, root, visiting, warnings));
    case 'object': {
      const sub = buildTree(n.entries, warnings);
      return resolveSubsDeep(sub, root, visiting, warnings);
    }
    case 'include': return null;
    case 'substitution': {
      const key = n.path.join('.');
      if (visiting.has(key)) {
        warnings.push({
          severity: 'warning',
          code: 'resolve.circular-substitution',
          params: { ref: '${' + key + '}' },
          message: formatDiagMessage('resolve.circular-substitution', { ref: '${' + key + '}' }),
          line: n.loc.line,
          column: n.loc.column,
          offset: n.loc.offset,
          length: n.loc.length,
        });
        return null;
      }
      const target = lookup(root, n.path);
      if (target === undefined) {
        if (!n.optional) {
          warnings.push({
            severity: 'warning',
            code: 'resolve.unresolved-substitution',
            params: { ref: '${' + key + '}' },
            message: formatDiagMessage('resolve.unresolved-substitution', { ref: '${' + key + '}' }),
            line: n.loc.line,
            column: n.loc.column,
            offset: n.loc.offset,
            length: n.loc.length,
          });
        }
        return null;
      }
      visiting.add(key);
      try {
        if (isLeaf(target)) return resolveNode(target, root, visiting, warnings);
        return resolveSubsDeep(target as Tree, root, visiting, warnings);
      } finally {
        visiting.delete(key);
      }
    }
  }
}

function lookup(tree: Tree, path: string[]): Tree | Node | undefined {
  let cur: Tree | Node = tree;
  for (const k of path) {
    if (isLeaf(cur)) return undefined;
    if (!(k in (cur as Tree))) return undefined;
    cur = (cur as Tree)[k];
  }
  return cur;
}

function nodeToValueNoSubs(n: Node): unknown {
  switch (n.kind) {
    case 'string': return n.value;
    case 'value': return n.value;
    case 'duration': return n.raw;
    case 'number': return n.value;
    case 'bool': return n.value;
    case 'null': return null;
    default: return null;
  }
}
