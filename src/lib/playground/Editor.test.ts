import { describe, expect, test, beforeEach } from 'vitest';
import { createEditor, type EditorApi } from './Editor';

describe('Editor multi-tab API', () => {
  let host: HTMLElement;
  let editor: EditorApi;

  beforeEach(() => {
    document.body.innerHTML = '<div id="host"></div>';
    host = document.getElementById('host')!;
    editor = createEditor({ parent: host, initialContent: 'a = 1', initialTabId: 't1' });
  });

  test('initial tab is active', () => {
    expect(editor.activeTabId()).toBe('t1');
    expect(editor.getValue()).toBe('a = 1');
  });

  test('addTab + setActiveTab swaps doc', () => {
    editor.addTab('t2', 'b = 2');
    editor.setActiveTab('t2');
    expect(editor.activeTabId()).toBe('t2');
    expect(editor.getValue()).toBe('b = 2');
  });

  test('switching back preserves t1 content', () => {
    editor.addTab('t2', 'b = 2');
    editor.setActiveTab('t2');
    editor.setActiveTab('t1');
    expect(editor.getValue()).toBe('a = 1');
  });

  test('removeTab gone, activate falls back', () => {
    editor.addTab('t2', 'b = 2');
    editor.setActiveTab('t2');
    editor.removeTab('t2', 't1');
    expect(editor.activeTabId()).toBe('t1');
    expect(editor.getValue()).toBe('a = 1');
  });

  test('updateTabContent for non-active tab does not flip active', () => {
    editor.addTab('t2', 'b = 2');
    editor.updateTabContent('t2', 'b = 22');
    expect(editor.activeTabId()).toBe('t1');
    expect(editor.getTabContent('t2')).toBe('b = 22');
  });
});
