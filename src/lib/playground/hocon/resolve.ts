import type { Node, Entry, Diagnostic, ResolveResult } from './types';
import { formatDiagMessage } from './diag';
import { extractIncludeTarget } from '../files/include-match';

export interface ResolveOptions {
  /**
   * Called for each include entry encountered during buildTree. Receives the
   * extracted target name (e.g. `"defaults.conf"` from `include classpath("defaults.conf")`)
   * and a stack of names currently being resolved (passed for caller use; cycle
   * detection itself happens in resolve.ts using `opts.includeStack`).
   *
   * Return the parsed AST of the included file, or undefined if not found.
   * Returning undefined produces a `parser.include-not-resolved` warning.
   */
  lookupInclude?: (target: string, stack: string[]) => Node | undefined;
  /**
   * Stack of include target names currently being resolved. Seeded by
   * resolve-multi.ts (Task 5). Used internally for cycle detection: if an
   * include entry's target appears in this stack, it's a cycle.
   */
  includeStack?: string[];
}

export function resolve(root: Node, opts: ResolveOptions = {}): ResolveResult {
  const warnings: Diagnostic[] = [];
  if (root.kind !== 'object') {
    return { resolved: nodeToValueNoSubs(root), warnings };
  }
  const tree = buildTree(root.entries, warnings, opts);
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

function buildTree(entries: Entry[], warnings: Diagnostic[], opts: ResolveOptions = {}): Tree {
  const tree: TreeWithSpreads = {};
  for (const e of entries) {
    if (e.value.kind === 'include') {
      handleInclude(tree, e.value, warnings, opts);
      continue;
    }
    if (e.spread) {
      const list = tree[SPREADS] ?? [];
      list.push(e.value);
      tree[SPREADS] = list;
    } else {
      setPath(tree, e.path, e.value, e.append, warnings, opts);
    }
  }
  return tree;
}

function handleInclude(
  tree: Tree,
  inc: Extract<Node, { kind: 'include' }>,
  warnings: Diagnostic[],
  opts: ResolveOptions,
): void {
  const target = extractIncludeTarget(inc.raw);
  const stack = opts.includeStack ?? [];

  // Cycle: target already in the chain of includes that led us here.
  if (target && stack.includes(target)) {
    const chain = [...stack, target].join(' -> ');
    warnings.push({
      severity: 'warning',
      code: 'parser.include-cycle',
      params: { chain },
      message: formatDiagMessage('parser.include-cycle', { chain }),
      line: inc.loc.line,
      column: inc.loc.column,
      offset: inc.loc.offset,
      length: inc.loc.length,
    });
    return;
  }

  const resolved = target && opts.lookupInclude
    ? opts.lookupInclude(target, stack)
    : undefined;
  if (!resolved || resolved.kind !== 'object') {
    // Diagnostic: enable in DevTools with `__pgDebugIncludes = true` then
    // retrigger an analysis (type any char). Helps narrow down whether the
    // failure is at extractIncludeTarget, lookup, or workspace state level.
    if (typeof console !== 'undefined' && (globalThis as { __pgDebugIncludes?: boolean }).__pgDebugIncludes) {
      console.warn('[playground] include not resolved:', {
        target,
        rawNode: inc.raw,
        hasLookup: !!opts.lookupInclude,
        resolvedKind: resolved ? resolved.kind : 'undefined',
        stackKnown: stack,
      });
    }
    warnings.push({
      severity: 'warning',
      code: 'parser.include-not-resolved',
      params: { name: target ?? inc.raw },
      message: formatDiagMessage('parser.include-not-resolved', { name: target ?? inc.raw }),
      line: inc.loc.line,
      column: inc.loc.column,
      offset: inc.loc.offset,
      length: inc.loc.length,
    });
    return;
  }

  // Recurse with target pushed onto the stack. Pushed copy is local to this
  // frame; when control returns the parent's stack is unchanged - sibling
  // includes do not see this target on the chain.
  const childOpts: ResolveOptions = {
    ...opts,
    includeStack: target ? [...stack, target] : stack,
  };
  const sub = buildTree(resolved.entries, warnings, childOpts);
  for (const k of Object.keys(sub)) {
    const av = tree[k];
    const bv = sub[k];
    if (av !== undefined && !isLeaf(av) && !isLeaf(bv)) {
      tree[k] = mergeTrees(av as Tree, bv as Tree, warnings);
    } else {
      tree[k] = bv;
    }
  }
  const incomingSpreads = (sub as TreeWithSpreads)[SPREADS];
  if (incomingSpreads) {
    const own = (tree as TreeWithSpreads)[SPREADS] ?? [];
    (tree as TreeWithSpreads)[SPREADS] = [...incomingSpreads, ...own];
  }
}

function setPath(tree: Tree, path: string[], value: Node, append: boolean, warnings: Diagnostic[], opts: ResolveOptions = {}): void {
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
    const incoming = buildTree(value.entries, warnings, opts);
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
      // opts not threaded: object literals encountered during substitution
      // resolution come from already-included trees, so any nested `include`
      // here would have been processed at top-level buildTree time. If a future
      // case puts include nodes inside object-valued substitutions and they
      // need resolving, thread opts here too.
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
