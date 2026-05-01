import { describe, test, expect, beforeEach } from 'vitest';
import { createPanels } from './Panels';
import type { TabId } from './types';

function setupDom(): HTMLElement {
  document.body.innerHTML = `
    <div data-pg-root>
      <button class="pg-tab is-active" data-tab="errors" aria-selected="true"></button>
      <button class="pg-tab" data-tab="json" aria-selected="false"></button>
      <button class="pg-tab is-hidden" data-tab="tutorial" aria-selected="false"></button>
      <div class="pg-tab-panel is-active" data-panel="errors"></div>
      <div class="pg-tab-panel" data-panel="json"></div>
      <div class="pg-tab-panel" data-panel="tutorial"></div>
    </div>`;
  return document.querySelector<HTMLElement>('[data-pg-root]')!;
}

describe('Panels', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  test('activate switches active tab and panel', () => {
    const root = setupDom();
    const panels = createPanels(root);
    panels.activate('json');
    expect(root.querySelector('.pg-tab.is-active')!.getAttribute('data-tab')).toBe('json');
    expect(root.querySelector('.pg-tab-panel.is-active')!.getAttribute('data-panel')).toBe('json');
  });

  test('activate sets aria-selected on tabs', () => {
    const root = setupDom();
    const panels = createPanels(root);
    panels.activate('json');
    const tabs = Array.from(root.querySelectorAll<HTMLButtonElement>('.pg-tab'));
    const selected: Record<string, string> = {};
    for (const t of tabs) selected[t.dataset.tab!] = t.getAttribute('aria-selected') ?? '';
    expect(selected.json).toBe('true');
    expect(selected.errors).toBe('false');
    expect(selected.tutorial).toBe('false');
  });

  test('showTab unhides a hidden tab button', () => {
    const root = setupDom();
    const panels = createPanels(root);
    panels.showTab('tutorial');
    const btn = root.querySelector<HTMLButtonElement>('.pg-tab[data-tab="tutorial"]')!;
    expect(btn.classList.contains('is-hidden')).toBe(false);
  });

  test('hideTab hides a tab button', () => {
    const root = setupDom();
    const panels = createPanels(root);
    panels.hideTab('json');
    const btn = root.querySelector<HTMLButtonElement>('.pg-tab[data-tab="json"]')!;
    expect(btn.classList.contains('is-hidden')).toBe(true);
  });

  test('clicking a tab activates it', () => {
    const root = setupDom();
    const panels = createPanels(root);
    panels.bindClicks();
    const jsonBtn = root.querySelector<HTMLButtonElement>('.pg-tab[data-tab="json"]')!;
    jsonBtn.click();
    expect(root.querySelector('.pg-tab.is-active')!.getAttribute('data-tab')).toBe('json');
  });

  test('onChange callback fires on activate', () => {
    const root = setupDom();
    const panels = createPanels(root);
    let captured: TabId | null = null;
    panels.onChange((id) => { captured = id; });
    panels.activate('tutorial');
    expect(captured).toBe('tutorial');
  });
});
