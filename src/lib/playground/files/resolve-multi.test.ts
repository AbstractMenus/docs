import { describe, expect, test } from 'vitest';
import { parse } from '../hocon/parser';
import { tokenizeText } from '../hocon/tokenize';
import { resolveWorkspace } from './resolve-multi';
import type { Node } from '../hocon/types';

function parseConf(text: string): Node {
  return parse(tokenizeText(text), text).ast;
}

describe('resolveWorkspace', () => {
  test('A includes B - keys merge', () => {
    const map = new Map<string, Node>([
      ['menu.conf', parseConf('include "defaults.conf"\ntitle = "Shop"\n')],
      ['defaults.conf', parseConf('size = 3\n')],
    ]);
    const r = resolveWorkspace(map, 'menu.conf');
    expect(r.resolved).toEqual({ title: 'Shop', size: 3 });
    expect(r.warnings).toEqual([]);
  });

  test('A -> B -> C chain', () => {
    const map = new Map<string, Node>([
      ['a', parseConf('include "b"\nx = 1\n')],
      ['b', parseConf('include "c"\ny = 2\n')],
      ['c', parseConf('z = 3\n')],
    ]);
    const r = resolveWorkspace(map, 'a');
    expect(r.resolved).toEqual({ x: 1, y: 2, z: 3 });
  });

  test('missing target produces warning', () => {
    const map = new Map<string, Node>([
      ['a', parseConf('include "missing"\nx = 1\n')],
    ]);
    const r = resolveWorkspace(map, 'a');
    expect(r.warnings.some((w) => w.code === 'parser.include-not-resolved')).toBe(true);
    expect(r.resolved).toEqual({ x: 1 });
  });

  test('cycle A -> B -> A produces warning, breaks loop', () => {
    const map = new Map<string, Node>([
      ['a', parseConf('include "b"\nx = 1\n')],
      ['b', parseConf('include "a"\ny = 2\n')],
    ]);
    const r = resolveWorkspace(map, 'a');
    expect(r.warnings.some((w) => w.code === 'parser.include-cycle')).toBe(true);
    // loop broken: a got y from b, but b's recursive include of a was empty
    expect(r.resolved).toEqual({ x: 1, y: 2 });
  });

  test('cross-file ${ref} resolves', () => {
    const map = new Map<string, Node>([
      ['main', parseConf('include "tpl"\ntitle = ${color}\n')],
      ['tpl', parseConf('color = "red"\n')],
    ]);
    const r = resolveWorkspace(map, 'main');
    expect(r.resolved).toEqual({ color: 'red', title: 'red' });
  });

  test('active not in map returns empty', () => {
    const map = new Map<string, Node>();
    const r = resolveWorkspace(map, 'missing');
    expect(r.resolved).toEqual({});
  });
});
