import type { Diagnostic } from './hocon/types';

type JumpListener = (line: number, column: number) => void;

export interface ValidationPanelApi {
  update(diagnostics: Diagnostic[]): void;
  onJump(fn: JumpListener): void;
}

export function createValidationPanel(panel: HTMLElement): ValidationPanelApi {
  const listeners: JumpListener[] = [];

  function update(diags: Diagnostic[]): void {
    if (diags.length === 0) {
      panel.innerHTML = '<p class="pg-empty">No errors.</p>';
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
      msg.textContent = d.message;
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
