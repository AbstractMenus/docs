import type { CheckSpec, Progress } from './types';
import { EMPTY_PROGRESS } from './types';

export { EMPTY_PROGRESS } from './types';

const KEY = 'am_playground_progress';

export function runCheck(text: string, check: CheckSpec): boolean {
  if (check.type !== 'regex') return false;
  try {
    const re = new RegExp(check.pattern, check.flags ?? '');
    return re.test(text);
  } catch {
    return false;
  }
}

export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...EMPTY_PROGRESS };
    const parsed: unknown = JSON.parse(raw);
    if (!isProgress(parsed)) return { ...EMPTY_PROGRESS };
    return parsed;
  } catch {
    return { ...EMPTY_PROGRESS };
  }
}

export function saveProgress(p: Progress): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    // ignore quota / private mode
  }
}

function isProgress(x: unknown): x is Progress {
  return typeof x === 'object' && x !== null
    && 'completed' in x && Array.isArray((x as Progress).completed)
    && 'hintsUsed' in x;
}

export function markCompleted(p: Progress, id: string): Progress {
  if (p.completed.includes(id)) return p;
  return { ...p, completed: [...p.completed, id] };
}

export function markSkipped(p: Progress, id: string): Progress {
  if (p.skipped.includes(id)) return p;
  return { ...p, skipped: [...p.skipped, id] };
}

export function bumpHint(p: Progress, id: string): Progress {
  const used = p.hintsUsed[id] ?? 0;
  return { ...p, hintsUsed: { ...p.hintsUsed, [id]: used + 1 } };
}
