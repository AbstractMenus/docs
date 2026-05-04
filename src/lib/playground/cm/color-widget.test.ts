import { describe, test, expect } from 'vitest';
import { findColorMatches, parseColorValue, formatColorValue } from './color-widget';

describe('parseColorValue', () => {
  test('hex string', () => {
    expect(parseColorValue('"#ff6432"')).toEqual({ hex: '#ff6432', kind: 'hex-quoted' });
  });

  test('hex uppercase normalises to lower', () => {
    expect(parseColorValue('"#FF6432"')).toEqual({ hex: '#ff6432', kind: 'hex-quoted' });
  });

  test('rgb list', () => {
    expect(parseColorValue('[255, 100, 50]')).toEqual({ hex: '#ff6432', kind: 'rgb-list' });
  });

  test('rgb list clamps overflow', () => {
    expect(parseColorValue('[300, 100, 50]')).toEqual({ hex: '#ff6432', kind: 'rgb-list' });
  });

  test('returns null for unparseable', () => {
    expect(parseColorValue('RED')).toBeNull();
  });
});

describe('formatColorValue', () => {
  test('hex-quoted round-trip', () => {
    expect(formatColorValue('#abcdef', 'hex-quoted')).toBe('"#abcdef"');
  });

  test('rgb-list round-trip', () => {
    expect(formatColorValue('#ff6432', 'rgb-list')).toBe('[255, 100, 50]');
  });
});

describe('findColorMatches', () => {
  test('quoted hex on item', () => {
    const matches = findColorMatches('color = "#ff6432"');
    expect(matches).toHaveLength(1);
    expect(matches[0].hex).toBe('#ff6432');
    expect(matches[0].kind).toBe('hex-quoted');
  });

  test('rgb list', () => {
    const matches = findColorMatches('color: [10, 20, 30]');
    expect(matches).toHaveLength(1);
    expect(matches[0].hex).toBe('#0a141e');
    expect(matches[0].kind).toBe('rgb-list');
  });

  test('multiple colors in same buffer', () => {
    const m = findColorMatches('color = "#ffffff"\ncolor = [0, 0, 0]');
    expect(m).toHaveLength(2);
  });

  test('match offsets correspond to value, not key', () => {
    const text = 'color = "#ff6432"';
    const m = findColorMatches(text)[0];
    expect(text.slice(m.from, m.to)).toBe('"#ff6432"');
  });

  test('shorthand hex still skipped (only 6-char supported)', () => {
    expect(findColorMatches('color = "#fff"')).toHaveLength(0);
  });

  test('named color leaves no swatch', () => {
    expect(findColorMatches('color = RED')).toHaveLength(0);
  });

  test('empty value emits placeholder swatch with from === to', () => {
    const text = 'color = ';
    const m = findColorMatches(text);
    expect(m).toHaveLength(1);
    expect(m[0].kind).toBe('empty');
    expect(m[0].from).toBe(m[0].to);
    expect(m[0].hex).toMatch(/^#[0-9a-f]{6}$/);
  });

  test('value followed by inline comment treated as empty', () => {
    const m = findColorMatches('color = # not yet');
    expect(m).toHaveLength(1);
    expect(m[0].kind).toBe('empty');
  });

  test('formatColorValue empty kind writes hex (priority)', () => {
    expect(formatColorValue('#abcdef', 'empty')).toBe('"#abcdef"');
  });

  test('baseOffset added to from/to', () => {
    const m = findColorMatches('color = "#ff6432"', 100);
    expect(m[0].from).toBeGreaterThan(100);
  });

  test('color = inside a string literal is ignored', () => {
    const text = 'lore = "click for color = pink"\nmaterial = STONE';
    expect(findColorMatches(text)).toHaveLength(0);
  });

  test('color = on a commented-out line is ignored', () => {
    expect(findColorMatches('# color = "#ff0000"\nname = "x"')).toHaveLength(0);
  });
});
