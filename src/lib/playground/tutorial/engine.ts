import type { CheckSpec, Progress, ShapeAssert } from './types';
import { EMPTY_PROGRESS } from './types';
import { tokenizeText } from '../hocon/tokenize';
import { parse } from '../hocon/parser';
import { resolve } from '../hocon/resolve';

export { EMPTY_PROGRESS } from './types';

const KEY = 'am_playground_progress';

export function runCheck(text: string, check: CheckSpec): boolean {
  if (check.type === 'regex') {
    try {
      const re = new RegExp(check.pattern, check.flags ?? '');
      return re.test(text);
    } catch {
      return false;
    }
  }
  if (check.type === 'shape') {
    let resolved: unknown;
    try {
      const parsed = parse(tokenizeText(text), text);
      // A parse error doesn't fail the check immediately - the resolver is
      // best-effort and the user might still satisfy the shape with the
      // partial AST. But if the resolved value isn't a plain object/array,
      // there's nothing to walk.
      resolved = resolve(parsed.ast).resolved;
    } catch {
      return false;
    }
    return check.asserts.every((a) => evalAssert(resolved, a));
  }
  return false;
}

function evalAssert(root: unknown, a: ShapeAssert): boolean {
  const v = getByPath(root, a.path);
  if (a.kind === 'has') return v !== undefined;
  if (a.kind === 'eq') return deepEqual(v, a.value);
  if (a.kind === 'matches') {
    if (typeof v !== 'string') return false;
    try {
      return new RegExp(a.pattern, a.flags ?? '').test(v);
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * Resolve a dotted/bracket path against a value tree.
 *   "items[0].click.message" -> root.items[0].click.message
 * Numeric segments inside `[]` index into arrays; bare identifiers are
 * object keys. Returns `undefined` for any miss along the way.
 */
export function getByPath(root: unknown, path: string): unknown {
  if (!path) return root;
  // Split on `.` and `[` to get tokens; strip trailing `]` from bracket parts.
  const parts: string[] = [];
  let buf = '';
  let inBracket = false;
  for (const ch of path) {
    if (ch === '.' && !inBracket) {
      if (buf) { parts.push(buf); buf = ''; }
    } else if (ch === '[') {
      if (buf) { parts.push(buf); buf = ''; }
      inBracket = true;
    } else if (ch === ']') {
      if (buf) { parts.push(buf); buf = ''; }
      inBracket = false;
    } else {
      buf += ch;
    }
  }
  if (buf) parts.push(buf);

  let cur: unknown = root;
  for (const p of parts) {
    if (cur === null || cur === undefined) return undefined;
    if (Array.isArray(cur)) {
      const idx = Number(p);
      if (!Number.isInteger(idx)) return undefined;
      cur = cur[idx];
    } else if (typeof cur === 'object') {
      cur = (cur as Record<string, unknown>)[p];
    } else {
      return undefined;
    }
  }
  return cur;
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null || typeof a !== typeof b) return false;
  if (Array.isArray(a)) {
    if (!Array.isArray(b) || a.length !== b.length) return false;
    return a.every((v, i) => deepEqual(v, b[i]));
  }
  if (typeof a === 'object') {
    const ao = a as Record<string, unknown>;
    const bo = b as Record<string, unknown>;
    const ak = Object.keys(ao);
    const bk = Object.keys(bo);
    if (ak.length !== bk.length) return false;
    return ak.every((k) => deepEqual(ao[k], bo[k]));
  }
  return false;
}

export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...EMPTY_PROGRESS };
    const parsed: unknown = JSON.parse(raw);
    if (!isProgress(parsed)) return { ...EMPTY_PROGRESS };
    return parsed;
  } catch {
    return { ...EMPTY_PROGRESS };
  }
}

export function saveProgress(p: Progress): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    // ignore quota / private mode
  }
}

function isProgress(x: unknown): x is Progress {
  return typeof x === 'object' && x !== null
    && 'completed' in x && Array.isArray((x as Progress).completed)
    && 'hintsUsed' in x;
}

export function markCompleted(p: Progress, id: string): Progress {
  if (p.completed.includes(id)) return p;
  return { ...p, completed: [...p.completed, id] };
}

export function markSkipped(p: Progress, id: string): Progress {
  if (p.skipped.includes(id)) return p;
  return { ...p, skipped: [...p.skipped, id] };
}

export function bumpHint(p: Progress, id: string): Progress {
  const used = p.hintsUsed[id] ?? 0;
  return { ...p, hintsUsed: { ...p.hintsUsed, [id]: used + 1 } };
}
