import type { EditorApi } from '../Editor';
import { createDivider } from '../Divider';
import { formatHocon } from '../cm/format';
import { setWarningSquigglesEnabled, isWarningSquigglesEnabled } from '../cm/hocon-lint';
import { t } from '../i18n';

/**
 * Owns the buttons and widgets in the page chrome that don't belong to a
 * single right-pane: theme toggle, the resizable split divider, the format
 * button, and the warning-squiggle visibility toggle.
 *
 * Mode switching stays in the host (PlaygroundApp) because it has to
 * coordinate the tutorial controller; this class would otherwise need a
 * back-reference.
 */
export interface ToolbarControllerOptions {
  /**
   * Called when the user confirms "Reset" in editor mode. The controller
   * only owns the button + the confirmation dialog; what "reset" actually
   * means (DEFAULT_CONTENT, hash clearing, draft clearing) lives in the
   * host so this class doesn't need to know about app-wide state.
   */
  onResetEditor: () => void;
}

export class ToolbarController {
  constructor(
    private readonly root: HTMLElement,
    private readonly editor: EditorApi,
    private readonly opts: ToolbarControllerOptions,
  ) {
    this.bindThemeToggle();
    this.bindDivider();
    this.bindFormatButton();
    this.bindWarningToggle();
    this.bindResetEditorButton();
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
    btn.title = t('btn.format.title');
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
      btn.textContent = on ? t('btn.warnings.on') : t('btn.warnings.off');
      btn.title = on ? t('btn.warnings.title.on') : t('btn.warnings.title.off');
    };
    sync();

    btn.addEventListener('click', () => {
      const next = !isWarningSquigglesEnabled(this.editor.view.state);
      setWarningSquigglesEnabled(this.editor.view, next);
      try { localStorage.setItem('pg-warning-squiggles', next ? '1' : '0'); } catch { /* ignore */ }
      sync();
    });
  }

  private bindResetEditorButton(): void {
    const btn = this.root.querySelector<HTMLButtonElement>('[data-action="reset-editor"]');
    if (!btn) return;
    btn.title = t('btn.reset.title');
    btn.addEventListener('click', () => {
      // Native confirm is good enough here: it's modal, accessible, and
      // doesn't introduce a custom-modal dependency. The string is i18n'd.
      if (window.confirm(t('confirm.reset.editor'))) this.opts.onResetEditor();
    });
  }
}
