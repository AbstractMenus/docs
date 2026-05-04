import type { Diagnostic } from './hocon/types';
import { formatDiagMessage } from './hocon/diag';
import { t, type TranslationKey } from './i18n';

type JumpListener = (line: number, column: number) => void;

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
      const loc = document.createElement('span');
      loc.className = 'pg-diag-loc';
      loc.textContent = `${d.line}:${d.column}`;
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
        for (const fn of listeners) fn(d.line, d.column);
      });
      li.appendChild(btn);
      list.appendChild(li);
    }
    panel.replaceChildren(list);
  }

  function onJump(fn: JumpListener): void { listeners.push(fn); }

  return { update, onJump };
}
