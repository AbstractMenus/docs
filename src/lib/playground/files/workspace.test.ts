import { describe, expect, test, beforeEach } from 'vitest';
import {
  loadWorkspace,
  saveWorkspace,
  makeDefaultWorkspace,
  newTabFile,
} from './workspace';
import { WS_LOCAL_STORAGE_KEY, WS_LEGACY_KEY, DEFAULT_TAB_NAME } from './types';

describe('workspace', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('makeDefaultWorkspace returns single-tab menu.conf', () => {
    const ws = makeDefaultWorkspace('hello');
    expect(ws.tabs).toHaveLength(1);
    expect(ws.tabs[0].name).toBe(DEFAULT_TAB_NAME);
    expect(ws.tabs[0].content).toBe('hello');
    expect(ws.activeTabId).toBe(ws.tabs[0].id);
  });

  test('save then load round-trip', () => {
    const a = newTabFile('menu.conf', 'a = 1');
    const b = newTabFile('defaults.conf', 'b = 2');
    saveWorkspace({ v: 2, tabs: [a, b], activeTabId: b.id });
    const ws = loadWorkspace('fallback');
    expect(ws.tabs.map((t) => t.name)).toEqual(['menu.conf', 'defaults.conf']);
    expect(ws.activeTabId).toBe(b.id);
  });

  test('legacy key migrated lazily', () => {
    localStorage.setItem(WS_LEGACY_KEY, 'legacy content');
    const ws = loadWorkspace('default');
    expect(ws.tabs).toHaveLength(1);
    expect(ws.tabs[0].name).toBe(DEFAULT_TAB_NAME);
    expect(ws.tabs[0].content).toBe('legacy content');
    expect(localStorage.getItem(WS_LEGACY_KEY)).toBeNull();
    expect(localStorage.getItem(WS_LOCAL_STORAGE_KEY)).not.toBeNull();
  });

  test('empty storage returns default with fallback content', () => {
    const ws = loadWorkspace('hello world');
    expect(ws.tabs[0].content).toBe('hello world');
  });

  test('garbage in storage falls through to default', () => {
    localStorage.setItem(WS_LOCAL_STORAGE_KEY, '{not json');
    const ws = loadWorkspace('fallback');
    expect(ws.tabs[0].content).toBe('fallback');
  });

  test('newTabFile generates unique ids', () => {
    const a = newTabFile('x', '');
    const b = newTabFile('x', '');
    expect(a.id).not.toBe(b.id);
  });
});
