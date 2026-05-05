import {
  WORKSPACE_VERSION,
  type TabFile,
  type Workspace,
  WS_LOCAL_STORAGE_KEY,
  WS_LEGACY_KEY,
  DEFAULT_TAB_NAME,
} from './types';

function genId(): string {
  // crypto.randomUUID exists in modern browsers and happy-dom test env.
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback - good enough for tests that don't need real uniqueness guarantees.
  return 'tab-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function newTabFile(name: string, content: string): TabFile {
  return { id: genId(), name, content };
}

export function makeDefaultWorkspace(content: string): Workspace {
  const tab = newTabFile(DEFAULT_TAB_NAME, content);
  return { v: WORKSPACE_VERSION, tabs: [tab], activeTabId: tab.id };
}

/**
 * Load the current workspace from LocalStorage. Migrates a legacy
 * single-string draft (`playground.editor.draft`) one-shot into v2 shape
 * if encountered. Returns a default workspace seeded with `fallbackContent`
 * if nothing usable is in storage.
 */
export function loadWorkspace(fallbackContent: string): Workspace {
  const raw = localStorage.getItem(WS_LOCAL_STORAGE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Workspace;
      if (parsed.v === WORKSPACE_VERSION && Array.isArray(parsed.tabs) && parsed.tabs.length > 0) {
        return parsed;
      }
    } catch {
      // fall through to legacy / default
    }
  }

  const legacy = localStorage.getItem(WS_LEGACY_KEY);
  if (legacy !== null) {
    const ws = makeDefaultWorkspace(legacy);
    saveWorkspace(ws);
    localStorage.removeItem(WS_LEGACY_KEY);
    return ws;
  }

  return makeDefaultWorkspace(fallbackContent);
}

export function saveWorkspace(ws: Workspace): void {
  localStorage.setItem(WS_LOCAL_STORAGE_KEY, JSON.stringify(ws));
}
