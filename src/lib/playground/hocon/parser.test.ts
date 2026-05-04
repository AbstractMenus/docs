import { describe, test, expect } from 'vitest';
import { parse } from './parser';
import { tokenizeText } from './tokenize';
import type { Node, Entry } from './types';

function parseString(input: string) {
  return parse(tokenizeText(input), input);
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

  test('include is preserved in the AST as a top-level entry', () => {
    const r = parseString('include "defaults.conf"\na = 1');
    expect(r.diagnostics.filter((d) => d.severity === 'error')).toEqual([]);
    if (r.ast.kind !== 'object') throw new Error('expected object root');
    const includeEntry = r.ast.entries.find((e) => e.value.kind === 'include');
    expect(includeEntry).toBeDefined();
    expect(includeEntry!.path).toEqual([]);
    if (includeEntry!.value.kind !== 'include') throw new Error('shape');
    expect(includeEntry!.value.raw).toContain('"defaults.conf"');
    const aEntry = r.ast.entries.find((e) => e.path[0] === 'a');
    expect(aEntry).toBeDefined();
  });

  test('include with classpath wrapper preserves raw', () => {
    const r = parseString('include classpath("base")\n');
    if (r.ast.kind !== 'object') throw new Error('expected object root');
    const inc = r.ast.entries.find((e) => e.value.kind === 'include');
    expect(inc).toBeDefined();
    if (inc!.value.kind !== 'include') throw new Error('shape');
    expect(inc!.value.raw).toContain('classpath("base")');
  });

  test('include preserves whitespace inside wrapper', () => {
    const r = parseString('include classpath( "base" )\n');
    if (r.ast.kind !== 'object') throw new Error('expected object root');
    const inc = r.ast.entries.find((e) => e.value.kind === 'include');
    expect(inc).toBeDefined();
    if (inc!.value.kind !== 'include') throw new Error('shape');
    expect(inc!.value.raw).toBe('classpath( "base" )');
  });

  test('include with trailing comment does NOT include comment in raw', () => {
    const r = parseString('include "a.conf" # trailing\nfoo = 1\n');
    if (r.ast.kind !== 'object') throw new Error('shape');
    const inc = r.ast.entries.find((e) => e.value.kind === 'include');
    expect(inc).toBeDefined();
    if (inc!.value.kind !== 'include') throw new Error('shape');
    expect(inc!.value.raw).toBe('"a.conf"');
  });

  test('bare include with no args emits a diagnostic and is not preserved', () => {
    const r = parseString('include\nfoo = 1\n');
    expect(r.diagnostics.length).toBeGreaterThan(0);
    if (r.ast.kind !== 'object') throw new Error('shape');
    const inc = r.ast.entries.find((e) => e.value.kind === 'include');
    expect(inc).toBeUndefined();
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

  test('quoted dotted key is a single literal key, not a path', () => {
    const r = parseString('"a.b" = 1');
    expect(r.diagnostics).toEqual([]);
    const e = getEntries(r.ast);
    expect(e[0].path).toEqual(['a.b']);
  });

  test('triple-quoted string value parses', () => {
    const r = parseString('s = """multi"""');
    expect(r.diagnostics).toEqual([]);
    const e = getEntries(r.ast);
    expect(e[0].value.kind).toBe('string');
    if (e[0].value.kind === 'string') {
      expect(e[0].value.value).toBe('multi');
    }
  });

  test('trailing comma in array is harmless', () => {
    const r = parseString('xs = [1, 2, 3,]');
    expect(r.diagnostics.filter((d) => d.severity === 'error')).toEqual([]);
  });

  test('self-referential substitution parses', () => {
    const r = parseString('a = ${a}');
    expect(r.diagnostics).toEqual([]);
    const v = getEntries(r.ast)[0].value;
    expect(v.kind).toBe('substitution');
  });

  test('plain numbers list passes (no false-positive)', () => {
    const r = parseString('xs = [1, 2, 3]');
    expect(r.diagnostics.filter((d) => d.severity === 'error')).toEqual([]);
  });
});
