import type { Diagnostic } from './hocon/types';
import { formatDiagMessage } from './hocon/diag';
import { t, type TranslationKey } from './i18n';

type JumpListener = (file: string, line: number, column: number) => void;

export interface ValidationPanelApi {
  update(diagnostics: Diagnostic[]): void;
  onJump(fn: JumpListener): void;
}

export function createValidationPanel(
  panel: HTMLElement,
  emptyKey: TranslationKey = 'empty.errors',
): ValidationPanelApi {
  const listeners: JumpListener[] = [];

  function update(diags: Diagnostic[]): void {
    if (diags.length === 0) {
      const p = document.createElement('p');
      p.className = 'pg-empty';
      p.textContent = t(emptyKey);
      panel.replaceChildren(p);
      return;
    }
    const list = document.createElement('ul');
    list.className = 'pg-diag-list';
    for (const d of diags) {
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `pg-diag pg-diag-${d.severity}`;
      // Stash the source file on the row so the click handler can pull it
      // back out without closing over `d` (and so tests can assert it).
      btn.dataset.file = d.file ?? '';
      const loc = document.createElement('span');
      loc.className = 'pg-diag-loc';
      // When the diagnostic carries a source file (multi-file pipeline),
      // prefix with `[file:line:col]` so the user can tell which tab the
      // problem came from. Single-file path keeps the existing `line:col`
      // (unbracketed) so legacy DOM/text assertions still match.
      loc.textContent = d.file ? `[${d.file}:${d.line}:${d.column}]` : `${d.line}:${d.column}`;
      const msg = document.createElement('span');
      msg.className = 'pg-diag-msg';
      // Re-render via the active locale every time. Diagnostics carry the
      // pre-formatted English message too, but the locale may have changed
      // since emit time (rare in practice - lang switch reloads the page -
      // but cheap to do right).
      msg.textContent = formatDiagMessage(d.code, d.params);
      btn.appendChild(loc);
      btn.appendChild(document.createTextNode(' '));
      btn.appendChild(msg);
      btn.addEventListener('click', () => {
        const file = btn.dataset.file ?? '';
        for (const fn of listeners) fn(file, d.line, d.column);
      });
      li.appendChild(btn);
      list.appendChild(li);
    }
    panel.replaceChildren(list);
  }

  function onJump(fn: JumpListener): void { listeners.push(fn); }

  return { update, onJump };
}
