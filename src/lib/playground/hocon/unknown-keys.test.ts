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
});
