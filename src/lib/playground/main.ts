import { createEditor } from './Editor';
import { createPanels } from './Panels';
import { createDivider } from './Divider';
import type { PlaygroundMode, TabId } from './types';

const DEFAULT_CONTENT = `# Welcome to the AbstractMenus HOCON Playground.
# Type your menu config below. Validation lands at M.3.

title = "Example Menu"
size = 3
`;

export function boot(): void {
  const root = document.querySelector<HTMLElement>('[data-pg-root]');
  if (!root) {
    console.warn('[playground] root not found');
    return;
  }

  const editorHost = root.querySelector<HTMLElement>('[data-pg-editor]');
  if (!editorHost) {
    console.warn('[playground] editor host not found');
    return;
  }

  const status = root.querySelector<HTMLElement>('[data-pg-status]');

  const editor = createEditor({
    parent: editorHost,
    initialContent: DEFAULT_CONTENT,
    onChange: () => {
      if (status) status.textContent = 'edited';
    },
  });

  const panels = createPanels(root);
  panels.bindClicks();
  panels.hideTab('tutorial');

  bindModeSwitch(root, panels);
  bindThemeToggle(root);
  bindDivider(root);

  (window as unknown as { __pg?: unknown }).__pg = { editor, panels };
}

function bindDivider(root: HTMLElement): void {
  const main = root.querySelector<HTMLElement>('.pg-main');
  const divider = root.querySelector<HTMLElement>('[data-pg-divider]');
  if (!main || !divider) return;
  const isMobile = window.matchMedia('(max-width: 768px)').matches;
  createDivider({
    main,
    divider,
    axis: isMobile ? 'vertical' : 'horizontal',
    minPct: 20,
    maxPct: 80,
  });
}

function bindModeSwitch(root: HTMLElement, panels: ReturnType<typeof createPanels>): void {
  const buttons = root.querySelectorAll<HTMLButtonElement>('.pg-mode-btn');
  for (const btn of buttons) {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.mode as PlaygroundMode;
      for (const b of buttons) {
        const isActive = b === btn;
        b.classList.toggle('is-active', isActive);
        b.setAttribute('aria-selected', String(isActive));
      }
      if (mode === 'tutorial') {
        panels.showTab('tutorial');
        panels.activate('tutorial');
      } else {
        panels.hideTab('tutorial');
        panels.activate('errors' as TabId);
      }
    });
  }
}

function bindThemeToggle(root: HTMLElement): void {
  const btn = root.querySelector<HTMLButtonElement>('[data-action="theme-toggle"]');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const html = document.documentElement;
    const next = html.dataset.theme === 'light' ? 'dark' : 'light';
    html.dataset.theme = next;
    try {
      localStorage.setItem('pg-theme', next);
    } catch {
      // ignore
    }
  });
  try {
    const saved = localStorage.getItem('pg-theme');
    if (saved === 'light' || saved === 'dark') {
      document.documentElement.dataset.theme = saved;
    }
  } catch {
    // ignore
  }
}
