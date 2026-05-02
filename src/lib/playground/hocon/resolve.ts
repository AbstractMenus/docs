import type { Node, Entry, Diagnostic, ResolveResult } from './types';

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

function isLeaf(v: Tree | Node): v is Node {
  return v !== null && typeof v === 'object' && 'kind' in v;
}

function buildTree(entries: Entry[], warnings: Diagnostic[]): Tree {
  const tree: Tree = {};
  for (const e of entries) setPath(tree, e.path, e.value, warnings);
  return tree;
}

function setPath(tree: Tree, path: string[], value: Node, warnings: Diagnostic[]): void {
  let cur: Tree = tree;
  for (let i = 0; i < path.length - 1; i++) {
    const k = path[i];
    if (!(k in cur) || isLeaf(cur[k])) cur[k] = {};
    cur = cur[k] as Tree;
  }
  const lastKey = path[path.length - 1];
  if (value.kind === 'object') {
    cur[lastKey] = buildTree(value.entries, warnings);
  } else {
    cur[lastKey] = value;
  }
}

function resolveSubsDeep(
  tree: Tree,
  root: Tree,
  visiting: Set<string>,
  warnings: Diagnostic[],
): unknown {
  const out: Record<string, unknown> = {};
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
          message: `Circular substitution \`\${${key}}\``,
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
            message: `Unresolved substitution \`\${${key}}\``,
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
