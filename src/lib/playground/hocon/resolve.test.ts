import { describe, test, expect } from 'vitest';
import { tokenizeText } from './tokenize';
import { parse } from './parser';
import { resolve } from './resolve';

function run(input: string) {
  const r = parse(tokenizeText(input));
  return resolve(r.ast);
}

describe('resolve', () => {
  test('flat values to plain object', () => {
    expect(run('a = 1\nb = 2').resolved).toEqual({ a: 1, b: 2 });
  });

  test('strings + booleans + null', () => {
    const r = run('a = "x"\nb = true\nc = null');
    expect(r.resolved).toEqual({ a: 'x', b: true, c: null });
  });

  test('nested object via dotted key', () => {
    expect(run('a.b.c = 1').resolved).toEqual({ a: { b: { c: 1 } } });
  });

  test('object value', () => {
    expect(run('a = { x = 1, y = 2 }').resolved).toEqual({ a: { x: 1, y: 2 } });
  });

  test('array value', () => {
    expect(run('xs = [1, 2, 3]').resolved).toEqual({ xs: [1, 2, 3] });
  });

  test('substitution resolves to referenced value', () => {
    expect(run('a = 1\nb = ${a}').resolved).toEqual({ a: 1, b: 1 });
  });

  test('substitution dotted', () => {
    expect(run('a = { x = 5 }\nb = ${a.x}').resolved).toEqual({ a: { x: 5 }, b: 5 });
  });

  test('unresolved required substitution emits warning', () => {
    const r = run('b = ${missing}');
    expect(r.warnings.some((w) => /unresolved/i.test(w.message))).toBe(true);
  });

  test('unresolved optional substitution stays null without warning', () => {
    const r = run('b = ${?missing}');
    expect(r.warnings.length).toBe(0);
    expect(r.resolved).toEqual({ b: null });
  });

  test('duration kept as string for MVP', () => {
    expect(run('t = 5s').resolved).toEqual({ t: '5s' });
  });

  test('later entry overrides earlier', () => {
    expect(run('a = 1\na = 2').resolved).toEqual({ a: 2 });
  });

  test('cycle detection emits warning', () => {
    const r = run('a = ${b}\nb = ${a}');
    expect(r.warnings.some((w) => /circular/i.test(w.message))).toBe(true);
  });
});

describe('duplicate-key object merge', () => {
  test('two object blocks at the same path merge', () => {
    const r = run('defaults { a = 1 }\ndefaults { b = 2 }');
    expect(r.resolved).toEqual({ defaults: { a: 1, b: 2 } });
  });

  test('three blocks all merge', () => {
    const r = run('o { a = 1 }\no { b = 2 }\no { c = 3 }');
    expect(r.resolved).toEqual({ o: { a: 1, b: 2, c: 3 } });
  });

  test('overlapping field within merge: last wins', () => {
    const r = run('o { a = 1, b = 2 }\no { b = 99 }');
    expect(r.resolved).toEqual({ o: { a: 1, b: 99 } });
  });

  test('merge is recursive on nested objects', () => {
    const r = run('o { sub { a = 1 } }\no { sub { b = 2 } }');
    expect(r.resolved).toEqual({ o: { sub: { a: 1, b: 2 } } });
  });

  test('non-object overwrites existing object (last wins)', () => {
    const r = run('a { b = 1 }\na = 7');
    expect(r.resolved).toEqual({ a: 7 });
  });

  test('object overwrites existing scalar (last wins)', () => {
    const r = run('a = 7\na { b = 1 }');
    expect(r.resolved).toEqual({ a: { b: 1 } });
  });

  test('scalar duplicate still last-wins (not changed by this fix)', () => {
    const r = run('size = 3\nsize = 5');
    expect(r.resolved).toEqual({ size: 5 });
  });

  test('dotted-key path also merges', () => {
    const r = run('o.a = 1\no.b = 2');
    expect(r.resolved).toEqual({ o: { a: 1, b: 2 } });
  });
});

describe('+= array append', () => {
  test('append to existing array concatenates', () => {
    const r = run('items = [{ slot = 0 }]\nitems += [{ slot = 8 }]');
    expect(r.resolved).toEqual({ items: [{ slot: 0 }, { slot: 8 }] });
  });

  test('append when key undefined treats as first assignment', () => {
    const r = run('items += [{ slot = 0 }]');
    expect(r.resolved).toEqual({ items: [{ slot: 0 }] });
  });

  test('multiple appends chain', () => {
    const r = run('xs = [1]\nxs += [2]\nxs += [3]');
    expect(r.resolved).toEqual({ xs: [1, 2, 3] });
  });

  test('append preserves item order', () => {
    const r = run('xs = [1, 2]\nxs += [3, 4]');
    expect(r.resolved).toEqual({ xs: [1, 2, 3, 4] });
  });

  test('append with non-array value falls back to overwrite', () => {
    // Rare/error case; spec would dictate string concat for strings, but
    // for menu configs you only += arrays. Keep behavior predictable.
    const r = run('xs = [1]\nxs += "oops"');
    expect(r.resolved).toEqual({ xs: 'oops' });
  });

  test('regular = still overwrites (not changed by this fix)', () => {
    const r = run('xs = [1]\nxs = [2]');
    expect(r.resolved).toEqual({ xs: [2] });
  });
});
