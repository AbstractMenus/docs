import type { HistoryEntry } from './sharing/history';

type SelectListener = (content: string) => void;

export interface HistoryDropdownApi {
  update(entries: HistoryEntry[]): void;
  onSelect(fn: SelectListener): void;
}

export function createHistoryDropdown(host: HTMLElement): HistoryDropdownApi {
  const listeners: SelectListener[] = [];

  function update(entries: HistoryEntry[]): void {
    if (entries.length === 0) {
      host.innerHTML = '<span class="pg-empty">No history yet.</span>';
      return;
    }
    const list = document.createElement('ul');
    list.className = 'pg-history-list';
    for (const e of entries) {
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'pg-history-item';
      const preview = document.createElement('span');
      preview.className = 'pg-history-preview';
      preview.textContent = e.preview || '(empty)';
      const ts = document.createElement('span');
      ts.className = 'pg-history-ts';
      ts.textContent = formatRelative(e.ts);
      btn.appendChild(preview);
      btn.appendChild(ts);
      btn.addEventListener('click', () => {
        for (const fn of listeners) fn(e.content);
      });
      li.appendChild(btn);
      list.appendChild(li);
    }
    host.replaceChildren(list);
  }

  function onSelect(fn: SelectListener): void {
    listeners.push(fn);
  }

  return { update, onSelect };
}

function formatRelative(ts: number): string {
  const diff = Math.max(0, Date.now() - ts);
  const mins = Math.round(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}
