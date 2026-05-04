import { describe, test, expect, beforeEach } from 'vitest';
import { runCheck, loadProgress, saveProgress, markCompleted, markSkipped, bumpHint, EMPTY_PROGRESS, getByPath } from './engine';

describe('runCheck', () => {
  test('regex check passes', () => {
    expect(runCheck('hello world', { type: 'regex', pattern: 'world' })).toBe(true);
  });

  test('regex check fails', () => {
    expect(runCheck('hello', { type: 'regex', pattern: 'nope' })).toBe(false);
  });

  test('regex with flags', () => {
    expect(runCheck('FOO', { type: 'regex', pattern: 'foo', flags: 'i' })).toBe(true);
  });

  test('multiline regex with m flag', () => {
    const text = 'line1\n# comment\nline3';
    expect(runCheck(text, { type: 'regex', pattern: '^#', flags: 'm' })).toBe(true);
  });

  test('invalid regex returns false (does not throw)', () => {
    expect(runCheck('x', { type: 'regex', pattern: '(' })).toBe(false);
  });
});

describe('runCheck shape', () => {
  test('has - top-level key present', () => {
    const ok = runCheck('title = "x"', {
      type: 'shape',
      asserts: [{ kind: 'has', path: 'title' }],
    });
    expect(ok).toBe(true);
  });

  test('has - missing key', () => {
    const ok = runCheck('size = 3', {
      type: 'shape',
      asserts: [{ kind: 'has', path: 'title' }],
    });
    expect(ok).toBe(false);
  });

  test('eq - string value', () => {
    const ok = runCheck('title = "Shop"', {
      type: 'shape',
      asserts: [{ kind: 'eq', path: 'title', value: 'Shop' }],
    });
    expect(ok).toBe(true);
  });

  test('eq - number value', () => {
    const ok = runCheck('size = 6', {
      type: 'shape',
      asserts: [{ kind: 'eq', path: 'size', value: 6 }],
    });
    expect(ok).toBe(true);
  });

  test('matches - regex against string at path', () => {
    const ok = runCheck('title = "Hello world"', {
      type: 'shape',
      asserts: [{ kind: 'matches', path: 'title', pattern: '^Hello' }],
    });
    expect(ok).toBe(true);
  });

  test('matches against non-string returns false', () => {
    const ok = runCheck('size = 3', {
      type: 'shape',
      asserts: [{ kind: 'matches', path: 'size', pattern: '\\d' }],
    });
    expect(ok).toBe(false);
  });

  test('nested object path', () => {
    const txt = 'enchantments { SHARPNESS = 5 }';
    const ok = runCheck(txt, {
      type: 'shape',
      asserts: [{ kind: 'eq', path: 'enchantments.SHARPNESS', value: 5 }],
    });
    expect(ok).toBe(true);
  });

  test('array index path', () => {
    const txt = 'items = [{ slot = 0, material = STONE }]';
    const ok = runCheck(txt, {
      type: 'shape',
      asserts: [
        { kind: 'eq', path: 'items[0].slot', value: 0 },
        { kind: 'eq', path: 'items[0].material', value: 'STONE' },
      ],
    });
    expect(ok).toBe(true);
  });

  test('all asserts must pass (and-semantics)', () => {
    const txt = 'title = "x"';
    const ok = runCheck(txt, {
      type: 'shape',
      asserts: [
        { kind: 'has', path: 'title' },
        { kind: 'has', path: 'size' },
      ],
    });
    expect(ok).toBe(false);
  });

  test('substitution-resolved value satisfies assert', () => {
    const txt = 'prefix = "[Shop]"\nname = ${prefix}';
    const ok = runCheck(txt, {
      type: 'shape',
      asserts: [{ kind: 'eq', path: 'name', value: '[Shop]' }],
    });
    expect(ok).toBe(true);
  });

  test('shape with malformed input returns false (does not throw)', () => {
    const ok = runCheck('totally broken {{{', {
      type: 'shape',
      asserts: [{ kind: 'has', path: 'title' }],
    });
    expect(ok).toBe(false);
  });
});

describe('getByPath', () => {
  const root = {
    title: 'x',
    size: 3,
    items: [
      { slot: 0, material: 'STONE' },
      { slot: 4, material: 'DIAMOND' },
    ],
    nested: { a: { b: { c: 42 } } },
  };

  test('returns root for empty path', () => {
    expect(getByPath(root, '')).toBe(root);
  });

  test('top-level key', () => {
    expect(getByPath(root, 'size')).toBe(3);
  });

  test('nested object', () => {
    expect(getByPath(root, 'nested.a.b.c')).toBe(42);
  });

  test('array index', () => {
    expect(getByPath(root, 'items[1].material')).toBe('DIAMOND');
  });

  test('missing key returns undefined', () => {
    expect(getByPath(root, 'missing')).toBeUndefined();
  });

  test('dive into primitive returns undefined', () => {
    expect(getByPath(root, 'size.foo')).toBeUndefined();
  });

  test('non-numeric array index returns undefined', () => {
    expect(getByPath(root, 'items[abc]')).toBeUndefined();
  });
});

describe('progress storage', () => {
  beforeEach(() => localStorage.clear());

  test('empty by default', () => {
    expect(loadProgress()).toEqual(EMPTY_PROGRESS);
  });

  test('saveProgress round-trip', () => {
    const p = { current: 'l1', completed: ['l0'], skipped: [], hintsUsed: { l1: 2 } };
    saveProgress(p);
    expect(loadProgress()).toEqual(p);
  });

  test('markCompleted adds id and dedupes', () => {
    const p = markCompleted(EMPTY_PROGRESS, 'l0');
    expect(p.completed).toEqual(['l0']);
    const p2 = markCompleted(p, 'l0');
    expect(p2.completed).toEqual(['l0']);
  });

  test('markSkipped adds id', () => {
    const p = markSkipped(EMPTY_PROGRESS, 'l5');
    expect(p.skipped).toEqual(['l5']);
  });

  test('bumpHint increments count', () => {
    const p1 = bumpHint(EMPTY_PROGRESS, 'l0');
    const p2 = bumpHint(p1, 'l0');
    expect(p2.hintsUsed.l0).toBe(2);
  });
});
