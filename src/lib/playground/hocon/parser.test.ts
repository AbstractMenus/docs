import { describe, test, expect } from 'vitest';
import { parse } from './parser';
import { tokenizeText } from './tokenize';
import type { Node, Entry } from './types';

function parseString(input: string) {
  return parse(tokenizeText(input));
}

function getEntries(root: Node): Entry[] {
  if (root.kind !== 'object') throw new Error('root not object');
  return root.entries;
}

describe('parser - happy path', () => {
  test('single key=value', () => {
    const r = parseString('size = 3');
    expect(r.diagnostics).toEqual([]);
    const e = getEntries(r.ast);
    expect(e).toHaveLength(1);
    expect(e[0].path).toEqual(['size']);
    expect(e[0].value).toMatchObject({ kind: 'number', value: 3 });
  });

  test('colon separator', () => {
    const r = parseString('a: 1');
    expect(r.diagnostics).toEqual([]);
    expect(getEntries(r.ast)[0].value).toMatchObject({ kind: 'number', value: 1 });
  });

  test('string value', () => {
    const r = parseString('title = "Hello"');
    expect(r.diagnostics).toEqual([]);
    expect(getEntries(r.ast)[0].value).toMatchObject({ kind: 'string', value: 'Hello' });
  });

  test('boolean and null', () => {
    const r = parseString('a = true\nb = null');
    expect(r.diagnostics).toEqual([]);
    const entries = getEntries(r.ast);
    expect(entries[0].value).toMatchObject({ kind: 'bool', value: true });
    expect(entries[1].value).toMatchObject({ kind: 'null' });
  });

  test('object value with `=`', () => {
    const r = parseString('outer = { a = 1 }');
    expect(r.diagnostics).toEqual([]);
    expect(getEntries(r.ast)[0].value.kind).toBe('object');
  });

  test('object value without separator', () => {
    const r = parseString('outer { a = 1 }');
    expect(r.diagnostics).toEqual([]);
    expect(getEntries(r.ast)[0].value.kind).toBe('object');
  });

  test('array value', () => {
    const r = parseString('xs = [1, 2, 3]');
    expect(r.diagnostics).toEqual([]);
    const v = getEntries(r.ast)[0].value;
    expect(v.kind).toBe('array');
    if (v.kind === 'array') expect(v.items).toHaveLength(3);
  });

  test('dotted key path', () => {
    const r = parseString('a.b.c = 1');
    expect(r.diagnostics).toEqual([]);
    expect(getEntries(r.ast)[0].path).toEqual(['a', 'b', 'c']);
  });

  test('substitution value', () => {
    const r = parseString('x = ${a.b}');
    expect(r.diagnostics).toEqual([]);
    const v = getEntries(r.ast)[0].value;
    expect(v.kind).toBe('substitution');
    if (v.kind === 'substitution') {
      expect(v.path).toEqual(['a', 'b']);
      expect(v.optional).toBe(false);
    }
  });

  test('optional substitution', () => {
    const r = parseString('x = ${?a}');
    const v = getEntries(r.ast)[0].value;
    if (v.kind === 'substitution') expect(v.optional).toBe(true);
  });

  test('multiple entries on multiple lines', () => {
    const r = parseString('a = 1\nb = 2\nc = 3');
    expect(r.diagnostics).toEqual([]);
    expect(getEntries(r.ast)).toHaveLength(3);
  });

  test('nested object', () => {
    const r = parseString('a {\n  b = 1\n  c = 2\n}');
    expect(r.diagnostics).toEqual([]);
    const v = getEntries(r.ast)[0].value;
    expect(v.kind).toBe('object');
    if (v.kind === 'object') expect(v.entries).toHaveLength(2);
  });

  test('comments are ignored', () => {
    const r = parseString('# header comment\na = 1 # inline\n# trailing');
    expect(r.diagnostics).toEqual([]);
    expect(getEntries(r.ast)).toHaveLength(1);
  });

  test('+= append marker', () => {
    const r = parseString('xs += 1');
    expect(r.diagnostics).toEqual([]);
    expect(getEntries(r.ast)[0].append).toBe(true);
  });

  test('include emitted as warning, parse continues', () => {
    const r = parseString('include file("a.conf")\na = 1');
    expect(r.diagnostics.some((d) => d.severity === 'warning' && /include/i.test(d.message))).toBe(true);
    expect(getEntries(r.ast)).toHaveLength(1);
  });
});

describe('parser - errors', () => {
  test('missing value after `=`', () => {
    const r = parseString('a =');
    expect(r.diagnostics.some((d) => d.severity === 'error' && /value/i.test(d.message))).toBe(true);
  });

  test('unmatched `{`', () => {
    const r = parseString('a {\n  b = 1');
    expect(r.diagnostics.some((d) => d.severity === 'error' && /\}/.test(d.message))).toBe(true);
  });

  test('unmatched `[`', () => {
    const r = parseString('xs = [1, 2');
    expect(r.diagnostics.some((d) => d.severity === 'error' && /\]/.test(d.message))).toBe(true);
  });

  test('error has line and column', () => {
    const r = parseString('a = ');
    const err = r.diagnostics.find((d) => d.severity === 'error');
    expect(err).toBeDefined();
    expect(err!.line).toBeGreaterThanOrEqual(1);
    expect(err!.column).toBeGreaterThanOrEqual(1);
  });

  test('object-field syntax inside array errors', () => {
    // `slot: 5` is a key:value pair, only valid in objects. In an array
    // context HOCON wants either a value or a wrapped `{ slot: 5 }`.
    const r = parseString('items = [\n  slot: 5\n  { slot = 0 }\n]');
    expect(r.diagnostics.some((d) => d.severity === 'error' && /array/i.test(d.message))).toBe(true);
  });

  test('value followed by `:` inside array errors', () => {
    // After parsing `5` as a number, the next `:` is illegal here.
    const r = parseString('xs = [5 : 10]');
    expect(r.diagnostics.some((d) => d.severity === 'error' && /after array element/i.test(d.message))).toBe(true);
  });

  test('plain numbers list passes (no false-positive)', () => {
    const r = parseString('xs = [1, 2, 3]');
    expect(r.diagnostics.filter((d) => d.severity === 'error')).toEqual([]);
  });
});
