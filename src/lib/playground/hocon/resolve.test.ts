import { describe, test, expect } from 'vitest';
import { tokenizeText } from './tokenize';
import { parse } from './parser';
import { resolve } from './resolve';

function run(input: string) {
  const r = parse(tokenizeText(input), input);
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

describe('inline spread `${ref}` in object', () => {
  test('spread merges referenced object fields into enclosing object', () => {
    const r = run('defaults { material = STONE }\nitem { ${defaults} }');
    expect(r.resolved).toEqual({
      defaults: { material: 'STONE' },
      item: { material: 'STONE' },
    });
  });

  test('spread alongside explicit fields - explicit fields win on collision', () => {
    const r = run('defaults { material = STONE, slot = 0 }\nitem { ${defaults}, slot = 4 }');
    expect((r.resolved as Record<string, unknown>).item).toEqual({ material: 'STONE', slot: 4 });
  });

  test('spread inside array of items (DRY pattern)', () => {
    const r = run('defaults { material = STONE }\nitems = [{ slot = 0, ${defaults} }, { slot = 8, ${defaults} }]');
    expect((r.resolved as { items: unknown[] }).items).toEqual([
      { slot: 0, material: 'STONE' },
      { slot: 8, material: 'STONE' },
    ]);
  });

  test('multiple spreads in same object compose left-to-right', () => {
    const r = run('a { x = 1 }\nb { y = 2 }\nc { ${a}, ${b} }');
    expect((r.resolved as Record<string, unknown>).c).toEqual({ x: 1, y: 2 });
  });

  test('spread referencing non-object resolves but contributes nothing', () => {
    const r = run('scalar = 7\no { ${scalar}, real = "field" }');
    expect((r.resolved as Record<string, unknown>).o).toEqual({ real: 'field' });
  });

  test('spread of unknown reference still allows surrounding fields to resolve', () => {
    const r = run('o { ${missing}, real = "field" }');
    expect((r.resolved as Record<string, unknown>).o).toEqual({ real: 'field' });
  });

  test('spread does not produce an unknown-key warning for the spread token', () => {
    // Sanity: parsing+resolving shouldn't raise spread-related parse errors.
    const r = run('defaults { a = 1 }\nx { ${defaults} }');
    expect(r.warnings.filter((w) => w.severity === 'error')).toEqual([]);
  });
});

describe('include entries do not pollute resolved tree', () => {
  test('include entry does not pollute resolved tree with "undefined" key', () => {
    const src = 'include "a.conf"\nfoo = 1\n';
    const ast = parse(tokenizeText(src), src).ast;
    const r = resolve(ast);
    expect(Object.keys(r.resolved as object)).toEqual(['foo']);
  });
});

describe('resolve with include resolver', () => {
  function parseConf(text: string) {
    return parse(tokenizeText(text), text).ast;
  }

  test('include resolver is invoked and result is merged', () => {
    const ast = parseConf('include "defaults.conf"\nname = "main"\n');
    const r = resolve(ast, {
      lookupInclude: (target) => {
        if (target === 'defaults.conf') {
          return parseConf('size = 3\n');
        }
        return undefined;
      },
    });
    expect(r.resolved).toEqual({ size: 3, name: 'main' });
    expect(r.warnings).toEqual([]);
  });

  test('substitutions cross include boundary', () => {
    const ast = parseConf('include "tpl.conf"\ntitle = ${color}\n');
    const r = resolve(ast, {
      lookupInclude: (target) =>
        target === 'tpl.conf' ? parseConf('color = "red"\n') : undefined,
    });
    expect(r.resolved).toEqual({ color: 'red', title: 'red' });
  });

  test('missing include emits include-not-resolved warning', () => {
    const ast = parseConf('include "missing.conf"\nname = "x"\n');
    const r = resolve(ast, { lookupInclude: () => undefined });
    expect(r.warnings.some((w) => w.code === 'parser.include-not-resolved')).toBe(true);
    expect(r.resolved).toEqual({ name: 'x' });
  });

  test('no resolver provided -> include emits warning, treated as empty', () => {
    const ast = parseConf('include "x.conf"\nname = "y"\n');
    const r = resolve(ast);
    expect(r.warnings.some((w) => w.code === 'parser.include-not-resolved')).toBe(true);
    expect(r.resolved).toEqual({ name: 'y' });
  });

  test('include cycle is detected and emits warning', () => {
    const ast = parseConf('include "self.conf"\nname = "x"\n');
    const r = resolve(ast, {
      includeStack: ['main.conf', 'self.conf'],
      lookupInclude: () => parseConf('extra = 1\n'),
    });
    expect(r.warnings.some((w) => w.code === 'parser.include-cycle')).toBe(true);
  });

  test('own scalar after include overrides included scalar', () => {
    const ast = parseConf('include "d.conf"\nname = "main"\n');
    const r = resolve(ast, {
      lookupInclude: (t) => t === 'd.conf' ? parseConf('name = "default"\nsize = 3\n') : undefined,
    });
    expect(r.resolved).toEqual({ name: 'main', size: 3 });
  });

  test('include after own scalar overrides own (source-order last-wins)', () => {
    const ast = parseConf('name = "main"\ninclude "d.conf"\n');
    const r = resolve(ast, {
      lookupInclude: (t) => t === 'd.conf' ? parseConf('name = "default"\n') : undefined,
    });
    expect(r.resolved).toEqual({ name: 'default' });
  });
});
