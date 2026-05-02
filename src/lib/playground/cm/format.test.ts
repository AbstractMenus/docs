import { describe, test, expect } from 'vitest';
import { formatHocon } from './format';

describe('formatHocon', () => {
  test('top-level keys not indented', () => {
    expect(formatHocon('a = 1\nb = 2')).toBe('a = 1\nb = 2');
  });

  test('object body indented two spaces', () => {
    const input = 'a {\nb = 1\n}';
    expect(formatHocon(input)).toBe('a {\n  b = 1\n}');
  });

  test('nested object', () => {
    const input = 'a {\nb {\nc = 1\n}\n}';
    expect(formatHocon(input)).toBe('a {\n  b {\n    c = 1\n  }\n}');
  });

  test('list body indented', () => {
    const input = 'xs = [\n1\n2\n]';
    expect(formatHocon(input)).toBe('xs = [\n  1\n  2\n]');
  });

  test('preserves blank lines', () => {
    const input = 'a = 1\n\nb = 2';
    expect(formatHocon(input)).toBe('a = 1\n\nb = 2');
  });

  test('preserves comments and adjusts their indent', () => {
    const input = 'a {\n# inner comment\nb = 1\n}';
    expect(formatHocon(input)).toBe('a {\n  # inner comment\n  b = 1\n}');
  });

  test('strings with braces are not counted as brackets', () => {
    const input = 'a = "{nope}"\nb = 1';
    expect(formatHocon(input)).toBe('a = "{nope}"\nb = 1');
  });

  test('idempotent (formatting twice = once)', () => {
    const a = formatHocon('items = [\n  {\n    slot = 0\n  }\n]');
    const b = formatHocon(a);
    expect(b).toBe(a);
  });
});
