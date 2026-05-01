import type { TabId } from './types';

type ChangeListener = (id: TabId) => void;

export interface PanelsApi {
  activate(id: TabId): void;
  showTab(id: TabId): void;
  hideTab(id: TabId): void;
  bindClicks(): void;
  onChange(fn: ChangeListener): void;
}

export function createPanels(root: HTMLElement): PanelsApi {
  const tabs = (): NodeListOf<HTMLButtonElement> => root.querySelectorAll<HTMLButtonElement>('.pg-tab');
  const panels = (): NodeListOf<HTMLElement> => root.querySelectorAll<HTMLElement>('.pg-tab-panel');
  const listeners: ChangeListener[] = [];

  function activate(id: TabId): void {
    for (const t of tabs()) {
      const isActive = t.dataset.tab === id;
      t.classList.toggle('is-active', isActive);
      t.setAttribute('aria-selected', String(isActive));
    }
    for (const p of panels()) {
      p.classList.toggle('is-active', p.dataset.panel === id);
    }
    for (const fn of listeners) fn(id);
  }

  function showTab(id: TabId): void {
    const btn = root.querySelector<HTMLButtonElement>(`.pg-tab[data-tab="${id}"]`);
    if (btn) btn.classList.remove('is-hidden');
  }

  function hideTab(id: TabId): void {
    const btn = root.querySelector<HTMLButtonElement>(`.pg-tab[data-tab="${id}"]`);
    if (btn) btn.classList.add('is-hidden');
  }

  function bindClicks(): void {
    for (const t of tabs()) {
      t.addEventListener('click', () => activate(t.dataset.tab as TabId));
    }
  }

  function onChange(fn: ChangeListener): void {
    listeners.push(fn);
  }

  return { activate, showTab, hideTab, bindClicks, onChange };
}
