import { describe, test, expect, beforeEach } from 'vitest';
import { runCheck, loadProgress, saveProgress, markCompleted, markSkipped, bumpHint, EMPTY_PROGRESS } from './engine';

describe('runCheck', () => {
  test('regex check passes', () => {
    expect(runCheck('hello world', { type: 'regex', pattern: 'world' })).toBe(true);
  });

  test('regex check fails', () => {
    expect(runCheck('hello', { type: 'regex', pattern: 'nope' })).toBe(false);
  });

  test('regex with flags', () => {
    expect(runCheck('FOO', { type: 'regex', pattern: 'foo', flags: 'i' })).toBe(true);
  });

  test('multiline regex with m flag', () => {
    const text = 'line1\n# comment\nline3';
    expect(runCheck(text, { type: 'regex', pattern: '^#', flags: 'm' })).toBe(true);
  });

  test('invalid regex returns false (does not throw)', () => {
    expect(runCheck('x', { type: 'regex', pattern: '(' })).toBe(false);
  });
});

describe('progress storage', () => {
  beforeEach(() => localStorage.clear());

  test('empty by default', () => {
    expect(loadProgress()).toEqual(EMPTY_PROGRESS);
  });

  test('saveProgress round-trip', () => {
    const p = { current: 'l1', completed: ['l0'], skipped: [], hintsUsed: { l1: 2 } };
    saveProgress(p);
    expect(loadProgress()).toEqual(p);
  });

  test('markCompleted adds id and dedupes', () => {
    const p = markCompleted(EMPTY_PROGRESS, 'l0');
    expect(p.completed).toEqual(['l0']);
    const p2 = markCompleted(p, 'l0');
    expect(p2.completed).toEqual(['l0']);
  });

  test('markSkipped adds id', () => {
    const p = markSkipped(EMPTY_PROGRESS, 'l5');
    expect(p.skipped).toEqual(['l5']);
  });

  test('bumpHint increments count', () => {
    const p1 = bumpHint(EMPTY_PROGRESS, 'l0');
    const p2 = bumpHint(p1, 'l0');
    expect(p2.hintsUsed.l0).toBe(2);
  });
});
