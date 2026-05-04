import { describe, test, expect } from 'vitest';
import { tokenizeText } from './tokenize';
import { parse } from './parser';
import { buildScopeRanges, scopeAt } from './scope-ranges';

function rangesFor(input: string) {
  const r = parse(tokenizeText(input));
  return buildScopeRanges(r.ast);
}

describe('buildScopeRanges', () => {
  test('root menu-root range covers entire doc', () => {
    const r = rangesFor('title = "x"');
    expect(r[0].scope).toBe('menu-root');
    expect(r[0].from).toBe(0);
  });

  test('items array yields item-list scope', () => {
    const r = rangesFor('items = [\n  { slot = 0 }\n]');
    expect(r.some((x) => x.scope === 'item-list')).toBe(true);
  });

  test('item object inside items array yields item scope', () => {
    const r = rangesFor('items = [\n  { slot = 0 }\n]');
    expect(r.some((x) => x.scope === 'item')).toBe(true);
  });

  test('enchantments object yields enchantments scope', () => {
    const r = rangesFor('items = [{ enchantments { SHARPNESS = 5 } }]');
    expect(r.some((x) => x.scope === 'enchantments')).toBe(true);
  });

  test('unknown parent key yields unknown scope', () => {
    const r = rangesFor('myCustom { foo = 1 }');
    expect(r.some((x) => x.scope === 'unknown')).toBe(true);
  });

  test('path is recorded for inner ranges', () => {
    const r = rangesFor('items = [{ click { left { } } }]');
    const click = r.find((x) => x.scope === 'click');
    expect(click).toBeDefined();
    expect(click!.path).toContain('click');
  });
});

describe('scopeAt', () => {
  test('top-level cursor returns menu-root', () => {
    const text = 'title = "x"';
    const r = rangesFor(text);
    expect(scopeAt(r, 0).scope).toBe('menu-root');
  });

  test('cursor inside item object returns item', () => {
    const text = 'items = [\n  {\n    slot = 0\n  }\n]';
    const r = rangesFor(text);
    const cursorInsideItem = text.indexOf('slot');
    expect(scopeAt(r, cursorInsideItem).scope).toBe('item');
  });

  test('cursor in items array but outside any object returns item-list', () => {
    const text = 'items = [\n  \n  { slot = 0 }\n]';
    const r = rangesFor(text);
    const cursorBeforeItem = text.indexOf('\n  \n') + 3;
    expect(scopeAt(r, cursorBeforeItem).scope).toBe('item-list');
  });

  test('cursor inside enchantments returns enchantments', () => {
    const text = 'items = [{ enchantments {\n  SHARPNESS\n} }]';
    const r = rangesFor(text);
    const cursorInEnch = text.indexOf('SHARPNESS');
    expect(scopeAt(r, cursorInEnch).scope).toBe('enchantments');
  });

  test('innermost wins when ranges nest', () => {
    const text = 'items = [{ click { actions { message = "x" } } }]';
    const r = rangesFor(text);
    const cursorInActions = text.indexOf('message');
    expect(scopeAt(r, cursorInActions).scope).toBe('actions');
  });
});
