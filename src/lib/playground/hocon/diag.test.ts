import { describe, test, expect } from 'vitest';
import { formatDiagMessage } from './diag';
import type { DiagCode } from './types';
import { en } from '../i18n/translations/en';

/**
 * The DiagCode union and the en translation table must stay in sync. If
 * this test fails, you either added a new code without translating it, or
 * removed a code without dropping its translation key.
 */
const ALL_CODES: DiagCode[] = [
  'parser.unexpected-token',
  'parser.expected-value-after-sep',
  'parser.expected-key-separator',
  'parser.expected-closing-brace',
  'parser.unexpected-after-array-element',
  'parser.unexpected-in-array',
  'parser.expected-closing-bracket',
  'parser.include-not-resolved',
  'parser.include-cycle',
  'resolve.circular-substitution',
  'resolve.unresolved-substitution',
  'validate.unknown-key',
  'validate.expected-list-of-objects',
];

describe('diag.ts', () => {
  test('every DiagCode has an en translation', () => {
    const missing = ALL_CODES.filter((code) => !(`diag.${code}` in en));
    expect(missing).toEqual([]);
  });

  test('en table has no orphan diag.* keys (all keys are reachable from DiagCode)', () => {
    const expected = new Set(ALL_CODES.map((c) => `diag.${c}`));
    const orphans = Object.keys(en).filter((k) => k.startsWith('diag.') && !expected.has(k));
    expect(orphans).toEqual([]);
  });

  test('formatDiagMessage interpolates params', () => {
    expect(formatDiagMessage('validate.unknown-key', { key: 'foo', scope: 'menu-root' }))
      .toBe('Unknown key `foo` in menu-root scope');
  });

  test('formatDiagMessage falls back to the key for unknown codes', () => {
    // Cast through unknown to simulate runtime drift between code and table.
    const result = formatDiagMessage('does.not.exist' as DiagCode);
    expect(result).toBe('diag.does.not.exist');
  });
});
