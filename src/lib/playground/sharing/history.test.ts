import { describe, test, expect, beforeEach } from 'vitest';
import {
  loadHistory,
  saveSnapshot,
  pushSnapshot,
  entryPreview,
  MAX_HISTORY_SIZE,
} from './history';
import { WORKSPACE_VERSION } from '../files/types';
import type { Workspace } from '../files/types';

const ws = (tabs: Array<{ id: string; name: string; content: string }>): Workspace => ({
  v: WORKSPACE_VERSION,
  tabs,
  activeTabId: tabs[0]?.id ?? '',
});

describe('history', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('empty by default', () => {
    expect(loadHistory()).toEqual([]);
  });

  test('saveSnapshot stores workspace, loadHistory returns v2 entries', () => {
    saveSnapshot(ws([
      { id: 'a', name: 'menu.conf', content: 'x = 1' },
      { id: 'b', name: 'tpl.conf', content: 'y = 2' },
    ]));
    const list = loadHistory();
    expect(list).toHaveLength(1);
    expect(list[0].v).toBe(2);
    expect(list[0].tabs).toHaveLength(2);
    expect(list[0].tabs[0].name).toBe('menu.conf');
    expect(list[0].tabs[1].name).toBe('tpl.conf');
    expect(typeof list[0].timestamp).toBe('number');
  });

  test('legacy v1 entries migrate lazily', () => {
    const legacy = [
      { ts: 100, content: 'old = 1', preview: 'old = 1' },
      { ts: 200, content: 'old = 2', preview: 'old = 2' },
    ];
    localStorage.setItem('am_playground_history', JSON.stringify(legacy));
    const list = loadHistory();
    expect(list).toHaveLength(2);
    expect(list[0].v).toBe(2);
    expect(list[0].tabs).toHaveLength(1);
    expect(list[0].tabs[0].name).toBe('menu.conf');
    expect(list[0].tabs[0].content).toBe('old = 1');
    expect(list[0].timestamp).toBe(100);
    expect(list[1].tabs[0].content).toBe('old = 2');
  });

  test(`FIFO: caps at MAX_HISTORY_SIZE (${MAX_HISTORY_SIZE})`, () => {
    for (let i = 0; i < MAX_HISTORY_SIZE + 3; i++) {
      saveSnapshot(ws([{ id: String(i), name: 'menu.conf', content: `v${i}` }]));
    }
    const list = loadHistory();
    expect(list).toHaveLength(MAX_HISTORY_SIZE);
    expect(list[0].tabs[0].content).toBe(`v${MAX_HISTORY_SIZE + 2}`);
    expect(list[MAX_HISTORY_SIZE - 1].tabs[0].content).toBe('v3');
  });

  test('skips snapshot when tabs identical to previous', () => {
    saveSnapshot(ws([{ id: 'a', name: 'menu.conf', content: 'foo' }]));
    saveSnapshot(ws([{ id: 'a', name: 'menu.conf', content: 'foo' }]));
    expect(loadHistory()).toHaveLength(1);
  });

  test('different content of same length still snapshotted', () => {
    saveSnapshot(ws([{ id: 'a', name: 'menu.conf', content: 'aaaa' }]));
    saveSnapshot(ws([{ id: 'a', name: 'menu.conf', content: 'bbbb' }]));
    expect(loadHistory()).toHaveLength(2);
  });

  test('skips workspace where every tab is empty', () => {
    saveSnapshot(ws([{ id: 'a', name: 'menu.conf', content: '' }]));
    expect(loadHistory()).toEqual([]);
  });

  test('entryPreview returns first non-empty line of main tab, capped', () => {
    const e = {
      v: 2 as const,
      timestamp: 1,
      tabs: [{ id: 'a', name: 'menu.conf', content: '\n\nfirst line\nsecond line\nthird' }],
    };
    expect(entryPreview(e)).toBe('first line');
    expect(entryPreview(e).length).toBeLessThanOrEqual(60);
  });

  test('mixed legacy + v2 entries both surface as v2', () => {
    const stored = [
      { v: 2, timestamp: 300, tabs: [{ id: 'x', name: 'a.conf', content: 'a' }] },
      { ts: 100, content: 'old', preview: 'old' },
    ];
    localStorage.setItem('am_playground_history', JSON.stringify(stored));
    const list = loadHistory();
    expect(list).toHaveLength(2);
    expect(list[0].tabs[0].name).toBe('a.conf');
    expect(list[1].tabs[0].name).toBe('menu.conf');
    expect(list[1].tabs[0].content).toBe('old');
  });

  test('pushSnapshot back-compat shim wraps content into one tab', () => {
    pushSnapshot('hello = 1');
    const list = loadHistory();
    expect(list).toHaveLength(1);
    expect(list[0].tabs).toHaveLength(1);
    expect(list[0].tabs[0].name).toBe('menu.conf');
    expect(list[0].tabs[0].content).toBe('hello = 1');
  });

  test('pushSnapshot skips empty content', () => {
    pushSnapshot('');
    expect(loadHistory()).toEqual([]);
  });
});
