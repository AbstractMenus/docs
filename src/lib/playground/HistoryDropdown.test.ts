import { describe, test, expect, beforeEach } from 'vitest';
import { createHistoryDropdown } from './HistoryDropdown';
import type { HistoryEntry } from './sharing/history';

function dom(): HTMLElement {
  document.body.innerHTML = '<div data-pg-history></div>';
  return document.querySelector<HTMLElement>('[data-pg-history]')!;
}

const SAMPLE: HistoryEntry[] = [
  { ts: 1000, content: 'a = 1', preview: 'a = 1' },
  { ts: 2000, content: 'b = 2', preview: 'b = 2' },
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

  test('click fires onSelect with content', () => {
    const dd = createHistoryDropdown(dom());
    let picked: string | null = null;
    dd.onSelect((c) => { picked = c; });
    dd.update(SAMPLE);
    document.querySelectorAll<HTMLButtonElement>('.pg-history-item')[1].click();
    expect(picked).toBe('b = 2');
  });
});
