import type { TabFile, Workspace } from '../files/types';
import { DEFAULT_TAB_NAME } from '../files/types';

const KEY = 'am_playground_history';
export const MAX_HISTORY_SIZE = 5;
const PREVIEW_LEN = 60;

/**
 * v2 history entry: a workspace snapshot. Stores the full tab list at the
 * moment of snapshot, not just a single editor buffer. v1 entries written by
 * earlier playground builds (`{ ts, content, preview }`) are migrated lazily
 * on read - see {@link migrateLegacy}. We never rewrite localStorage on
 * migration; the next `saveSnapshot` overwrites the array with v2 shape.
 */
export interface HistoryEntry {
  v: 2;
  /** Unix ms when the snapshot was captured. */
  timestamp: number;
  /** Full tab list at snapshot time. First tab is treated as "main" for preview. */
  tabs: TabFile[];
}

export function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    return migrateLegacy(JSON.parse(raw)) ?? [];
  } catch {
    return [];
  }
}

/**
 * Convert a parsed localStorage payload into a HistoryEntry[]. Accepts:
 *  - already-v2 entries (passthrough),
 *  - v1 entries `{ ts | timestamp, content, preview? }` (wrap content in a
 *    single synthetic tab so the rest of the pipeline doesn't care).
 * Anything we don't recognise is dropped silently.
 */
function migrateLegacy(parsed: unknown): HistoryEntry[] | null {
  if (!Array.isArray(parsed)) return null;
  const out: HistoryEntry[] = [];
  for (const item of parsed) {
    if (!item || typeof item !== 'object') continue;
    const o = item as Record<string, unknown>;
    if (o.v === 2 && Array.isArray(o.tabs)) {
      const tabs = o.tabs.filter(isTabFile);
      if (tabs.length === 0) continue;
      out.push({
        v: 2,
        timestamp: typeof o.timestamp === 'number' ? o.timestamp : Date.now(),
        tabs,
      });
    } else if (typeof o.content === 'string') {
      const ts = typeof o.timestamp === 'number'
        ? o.timestamp
        : (typeof o.ts === 'number' ? o.ts : Date.now());
      out.push({
        v: 2,
        timestamp: ts,
        tabs: [{
          id: 't' + Math.random().toString(36).slice(2),
          name: DEFAULT_TAB_NAME,
          content: o.content,
        }],
      });
    }
  }
  return out;
}

function isTabFile(x: unknown): x is TabFile {
  if (!x || typeof x !== 'object') return false;
  const o = x as Record<string, unknown>;
  return typeof o.id === 'string' && typeof o.name === 'string' && typeof o.content === 'string';
}

/**
 * Persist a workspace snapshot. Skips no-ops where the new snapshot has the
 * same tab list (by name + content) as the most recent one - prevents the
 * 5s debounce from chewing through history slots while the user is idle.
 */
export function saveSnapshot(ws: Workspace): void {
  if (ws.tabs.length === 0) return;
  if (ws.tabs.every((t) => t.content === '')) return;
  const cur = loadHistory();
  const prev = cur[0];
  if (prev && tabsEqual(prev.tabs, ws.tabs)) return;
  const entry: HistoryEntry = {
    v: 2 as const,
    timestamp: Date.now(),
    tabs: ws.tabs.map((t) => ({ id: t.id, name: t.name, content: t.content })),
  };
  const next = [entry, ...cur].slice(0, MAX_HISTORY_SIZE);
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // quota / private mode - ignore
  }
}

/** First non-empty line of an entry's main tab, capped at PREVIEW_LEN. */
export function entryPreview(entry: HistoryEntry): string {
  const main = entry.tabs[0];
  if (!main) return '';
  for (const line of main.content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed) return trimmed.slice(0, PREVIEW_LEN);
  }
  return '';
}

function tabsEqual(a: TabFile[], b: TabFile[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i].name !== b[i].name || a[i].content !== b[i].content) return false;
  }
  return true;
}
