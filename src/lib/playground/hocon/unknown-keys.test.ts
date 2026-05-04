import { describe, test, expect } from 'vitest';
import { tokenizeText } from './tokenize';
import { parse } from './parser';
import { validateUnknownKeys } from './unknown-keys';

function check(input: string) {
  const r = parse(tokenizeText(input));
  return validateUnknownKeys(r.ast);
}

describe('validateUnknownKeys', () => {
  test('clean menu-root passes', () => {
    expect(check('title = "x"\nsize = 3')).toEqual([]);
  });

  test('unknown top-level key warns', () => {
    const w = check('blubber = 1');
    expect(w).toHaveLength(1);
    expect(w[0].severity).toBe('warning');
    expect(w[0].message).toContain('blubber');
    expect(w[0].message).toContain('menu-root');
  });

  test('unknown key inside enchantments warns', () => {
    const w = check('items = [{ enchantments { AQUA_AFFINITY = 1, slot = 1 } }]');
    const slotWarn = w.find((d) => d.message.includes('slot'));
    expect(slotWarn).toBeDefined();
    expect(slotWarn!.message).toContain('enchantments');
  });

  test('known enchantment passes', () => {
    const w = check('items = [{ enchantments { SHARPNESS = 5 } }]');
    expect(w.filter((d) => d.message.includes('SHARPNESS'))).toEqual([]);
  });

  test('valid item inside items array passes', () => {
    expect(check('items = [\n  { slot = 0, material = STONE }\n]')).toEqual([]);
  });

  test('unknown key inside item warns', () => {
    const w = check('items = [\n  { fooBar = 1 }\n]');
    expect(w.some((d) => d.message.includes('fooBar') && d.message.includes('item'))).toBe(true);
  });

  test('unknown parent key skips its body (no cascade)', () => {
    const w = check('myCustom {\n  whatever = 1\n  another = 2\n}');
    expect(w.some((d) => d.message.includes('myCustom'))).toBe(true);
    expect(w.some((d) => d.message.includes('whatever'))).toBe(false);
    expect(w.some((d) => d.message.includes('another'))).toBe(false);
  });

  test('warning carries line and column', () => {
    const w = check('title = "x"\nblubber = 1');
    const d = w[0];
    expect(d.line).toBe(2);
    expect(d.column).toBe(1);
  });

  test('binding rules + props are scope-validated', () => {
    const w = check('bindings = [\n  { rules { permission = "x" }, props { material = STONE, badKey = 1 } }\n]');
    expect(w.some((d) => d.message.includes('badKey'))).toBe(true);
  });

  test('items list rejects bare value (semantic warning)', () => {
    // Wrap raw value `5` as a single number element (no `slot:` prefix; that
    // would be a parser error). We verify that even a syntactically valid
    // bare value triggers a "list of objects" warning.
    const w = check('items = [\n  5\n  { slot = 0, material = STONE }\n]');
    expect(w.some((d) => /items.*list of objects.*number/i.test(d.message))).toBe(true);
  });

  test('items list with all objects passes', () => {
    const w = check('items = [\n  { slot = 0, material = STONE }\n  { slot = 4, material = DIAMOND }\n]');
    expect(w.filter((d) => /list of objects/i.test(d.message))).toEqual([]);
  });

  test('substitution in items list is allowed (template expansion)', () => {
    const w = check('items = [\n  ${borderTop}\n  { slot = 0 }\n]');
    expect(w.filter((d) => /list of objects/i.test(d.message))).toEqual([]);
  });

  test('list of strings (lore) does NOT trigger list-of-objects warning', () => {
    const w = check('items = [{ slot = 0, lore = ["one", "two"] }]');
    expect(w.filter((d) => /list of objects/i.test(d.message))).toEqual([]);
  });

  test('list of strings (flags) does NOT trigger list-of-objects warning', () => {
    const w = check('items = [{ slot = 0, flags = ["HIDE_ENCHANTS"] }]');
    expect(w.filter((d) => /list of objects/i.test(d.message))).toEqual([]);
  });
});
