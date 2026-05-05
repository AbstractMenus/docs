export const WORKSPACE_VERSION = 2 as const;

export interface TabFile {
  /** Stable internal id (random). Survives rename. Decoupled from name. */
  id: string;
  /** User-visible filename, e.g. "menu.conf". */
  name: string;
  content: string;
}

export interface Workspace {
  v: typeof WORKSPACE_VERSION;
  tabs: TabFile[];
  activeTabId: string;
}

export const WS_LOCAL_STORAGE_KEY = 'playground.workspace';

/**
 * Placeholder legacy key. The pre-tabs playground never actually persisted
 * the editor buffer to localStorage (the only persisted things were
 * `am_playground_history`, `am_playground_progress`, `pg-lang`, `pg-theme`,
 * `pg-warning-squiggles`). `editorDraft` was an in-memory field on
 * PlaygroundApp only. We still wire a one-shot migration path under this
 * key so future external imports / older branches that did write here can
 * be picked up gracefully on first load.
 */
export const WS_LEGACY_KEY = 'playground.editor.draft';

export const DEFAULT_TAB_NAME = 'menu.conf';
