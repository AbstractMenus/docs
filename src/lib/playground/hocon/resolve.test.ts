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
