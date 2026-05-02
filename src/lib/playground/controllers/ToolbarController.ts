import type { EditorApi } from '../Editor';
import { createDivider } from '../Divider';
import { formatHocon } from '../cm/format';
import { setWarningSquigglesEnabled, isWarningSquigglesEnabled } from '../cm/hocon-lint';

/**
 * Owns the buttons and widgets in the page chrome that don't belong to a
 * single right-pane: theme toggle, the resizable split divider, the format
 * button, and the warning-squiggle visibility toggle.
 *
 * Mode switching stays in the host (PlaygroundApp) because it has to
 * coordinate the tutorial controller; this class would otherwise need a
 * back-reference.
 */
export class ToolbarController {
  constructor(
    private readonly root: HTMLElement,
    private readonly editor: EditorApi,
  ) {
    this.bindThemeToggle();
    this.bindDivider();
    this.bindFormatButton();
    this.bindWarningToggle();
  }

  private bindThemeToggle(): void {
    const btn = this.root.querySelector<HTMLButtonElement>('[data-action="theme-toggle"]');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const html = document.documentElement;
      const next = html.dataset.theme === 'light' ? 'dark' : 'light';
      html.dataset.theme = next;
      try { localStorage.setItem('pg-theme', next); } catch { /* ignore */ }
    });
    try {
      const saved = localStorage.getItem('pg-theme');
      if (saved === 'light' || saved === 'dark') document.documentElement.dataset.theme = saved;
    } catch { /* ignore */ }
  }

  private bindDivider(): void {
    const main = this.root.querySelector<HTMLElement>('.pg-main');
    const divider = this.root.querySelector<HTMLElement>('[data-pg-divider]');
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

  private bindFormatButton(): void {
    const btn = this.root.querySelector<HTMLButtonElement>('[data-action="format"]');
    if (!btn) return;
    btn.disabled = false;
    btn.title = 'Format (Cmd+Shift+F)';
    btn.addEventListener('click', () => {
      const before = this.editor.getValue();
      const after = formatHocon(before);
      if (after !== before) this.editor.setValue(after);
      this.editor.view.focus();
    });
  }

  private bindWarningToggle(): void {
    const btn = this.root.querySelector<HTMLButtonElement>('[data-action="toggle-warning-squiggles"]');
    if (!btn) return;
    try {
      const stored = localStorage.getItem('pg-warning-squiggles');
      if (stored === '0') setWarningSquigglesEnabled(this.editor.view, false);
    } catch { /* ignore */ }

    const sync = (): void => {
      const on = isWarningSquigglesEnabled(this.editor.view.state);
      btn.dataset.state = on ? 'on' : 'off';
      btn.textContent = on ? 'warnings: on' : 'warnings: off';
      btn.title = on
        ? 'Hide warning squiggles in the editor (Warnings tab stays)'
        : 'Show warning squiggles in the editor';
    };
    sync();

    btn.addEventListener('click', () => {
      const next = !isWarningSquigglesEnabled(this.editor.view.state);
      setWarningSquigglesEnabled(this.editor.view, next);
      try { localStorage.setItem('pg-warning-squiggles', next ? '1' : '0'); } catch { /* ignore */ }
      sync();
    });
  }
}
