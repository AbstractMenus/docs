import { describe, test, expect } from 'vitest';
import { findEnumContextAtCursor } from './catalog-source';

describe('findEnumContextAtCursor', () => {
  test('material with no partial', () => {
    const text = 'material = ';
    expect(findEnumContextAtCursor(text, text.length)).toEqual({
      enumName: 'materials',
      from: text.length,
      to: text.length,
    });
  });

  test('material with partial', () => {
    const text = 'material = IRO';
    const r = findEnumContextAtCursor(text, text.length);
    expect(r?.enumName).toBe('materials');
    expect(text.slice(r!.from, r!.to)).toBe('IRO');
  });

  test('sound key', () => {
    const text = 'sound = UI';
    const r = findEnumContextAtCursor(text, text.length);
    expect(r?.enumName).toBe('sounds');
  });

  test('non-enum key returns null', () => {
    expect(findEnumContextAtCursor('title = ', 8)).toBeNull();
  });

  test('quoted enum value', () => {
    const text = 'material = "DIA';
    const r = findEnumContextAtCursor(text, text.length);
    expect(r?.enumName).toBe('materials');
    expect(text.slice(r!.from, r!.to)).toBe('DIA');
  });
});
