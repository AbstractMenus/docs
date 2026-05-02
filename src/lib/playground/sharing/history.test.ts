import { describe, test, expect, beforeEach } from 'vitest';
import { loadHistory, pushSnapshot, MAX_HISTORY_SIZE } from './history';

describe('history', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('empty by default', () => {
    expect(loadHistory()).toEqual([]);
  });

  test('push adds entry to front', () => {
    pushSnapshot('foo');
    const h = loadHistory();
    expect(h).toHaveLength(1);
    expect(h[0].content).toBe('foo');
    expect(typeof h[0].ts).toBe('number');
  });

  test('FIFO: caps at MAX_HISTORY_SIZE', () => {
    for (let i = 0; i < MAX_HISTORY_SIZE + 3; i++) {
      pushSnapshot(`v${i}-` + 'x'.repeat(60));
    }
    const h = loadHistory();
    expect(h).toHaveLength(MAX_HISTORY_SIZE);
    expect(h[0].content).toContain(`v${MAX_HISTORY_SIZE + 2}`);
  });

  test('skips push when identical to previous snapshot', () => {
    pushSnapshot('foo');
    pushSnapshot('foo');
    expect(loadHistory()).toHaveLength(1);
  });

  test('different content of same length still pushed', () => {
    pushSnapshot('aaaa');
    pushSnapshot('bbbb');
    expect(loadHistory()).toHaveLength(2);
  });

  test('preview is first 60 chars of first non-empty line', () => {
    pushSnapshot('first line\nsecond line\nthird');
    expect(loadHistory()[0].preview.length).toBeLessThanOrEqual(60);
  });

  test('skips empty content', () => {
    pushSnapshot('');
    expect(loadHistory()).toEqual([]);
  });
});
