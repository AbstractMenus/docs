import type { HistoryEntry } from './sharing/history';
import { t } from './i18n';

type SelectListener = (content: string) => void;

export interface HistoryDropdownApi {
  update(entries: HistoryEntry[]): void;
  onSelect(fn: SelectListener): void;
}

export function createHistoryDropdown(host: HTMLElement): HistoryDropdownApi {
  const listeners: SelectListener[] = [];

  function update(entries: HistoryEntry[]): void {
    if (entries.length === 0) {
      const span = document.createElement('span');
      span.className = 'pg-empty';
      span.textContent = t('empty.history');
      host.replaceChildren(span);
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
      preview.textContent = e.preview || t('history.empty');
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
  if (mins < 1) return t('history.justNow');
  if (mins < 60) return t('history.minutes', { n: mins });
  const hours = Math.round(mins / 60);
  if (hours < 24) return t('history.hours', { n: hours });
  const days = Math.round(hours / 24);
  return t('history.days', { n: days });
}
