const KEY = 'am_playground_history';
export const MAX_HISTORY_SIZE = 5;
const PREVIEW_LEN = 60;

export interface HistoryEntry {
  ts: number;
  content: string;
  preview: string;
}

export function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isEntry) : [];
  } catch {
    return [];
  }
}

function isEntry(x: unknown): x is HistoryEntry {
  return typeof x === 'object' && x !== null && 'ts' in x && 'content' in x;
}

export function pushSnapshot(content: string): void {
  if (!content) return;
  const list = loadHistory();
  const prev = list[0];
  if (prev && prev.content === content) return;
  const entry: HistoryEntry = {
    ts: Date.now(),
    content,
    preview: makePreview(content),
  };
  const next = [entry, ...list].slice(0, MAX_HISTORY_SIZE);
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // quota / private mode - ignore
  }
}

function makePreview(content: string): string {
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed) return trimmed.slice(0, PREVIEW_LEN);
  }
  return '';
}
