import { describe, test, expect, beforeEach } from 'vitest';
import { createHistoryDropdown } from './HistoryDropdown';
import type { HistoryEntry } from './sharing/history';

function dom(): HTMLElement {
  document.body.innerHTML = '<div data-pg-history></div>';
  return document.querySelector<HTMLElement>('[data-pg-history]')!;
}

const SAMPLE: HistoryEntry[] = [
  { v: 2, timestamp: 1000, tabs: [{ id: 'a', name: 'menu.conf', content: 'a = 1' }] },
  { v: 2, timestamp: 2000, tabs: [{ id: 'b', name: 'menu.conf', content: 'b = 2' }] },
];

const MULTI_FILE: HistoryEntry[] = [
  {
    v: 2,
    timestamp: 3000,
    tabs: [
      { id: 'a', name: 'menu.conf', content: 'main = 1' },
      { id: 'b', name: 'tpl.conf', content: 'tpl = 2' },
      { id: 'c', name: 'extra.conf', content: 'x = 3' },
    ],
  },
];

describe('HistoryDropdown', () => {
  beforeEach(() => { document.body.innerHTML = ''; });

  test('renders entries with previews', () => {
    const dd = createHistoryDropdown(dom());
    dd.update(SAMPLE);
    const items = document.querySelectorAll('.pg-history-item');
    expect(items.length).toBe(2);
    expect(document.body.textContent).toContain('a = 1');
    expect(document.body.textContent).toContain('b = 2');
  });

  test('empty state when no entries', () => {
    const dd = createHistoryDropdown(dom());
    dd.update([]);
    expect(document.body.textContent?.toLowerCase()).toContain('no history');
  });

  test('click fires onSelect with full HistoryEntry', () => {
    const dd = createHistoryDropdown(dom());
    let picked: HistoryEntry | null = null;
    dd.onSelect((e) => { picked = e; });
    dd.update(SAMPLE);
    document.querySelectorAll<HTMLButtonElement>('.pg-history-item')[1].click();
    expect(picked).not.toBeNull();
    expect(picked!.tabs[0].content).toBe('b = 2');
    expect(picked!.timestamp).toBe(2000);
  });

  test('multi-tab entry shows "+N more files" badge', () => {
    const dd = createHistoryDropdown(dom());
    dd.update(MULTI_FILE);
    const badges = document.querySelectorAll('.pg-history-extra');
    expect(badges.length).toBe(1);
    expect(badges[0].textContent).toContain('+2 more files');
    // Preview still shows main tab's first line
    expect(document.body.textContent).toContain('main = 1');
  });

  test('single-tab entry has no extra-files badge', () => {
    const dd = createHistoryDropdown(dom());
    dd.update(SAMPLE);
    const badges = document.querySelectorAll('.pg-history-extra');
    expect(badges.length).toBe(0);
  });
});
