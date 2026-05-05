import type { EditorApi } from '../Editor';
import type { HistoryDropdownApi } from '../HistoryDropdown';
import type { Workspace } from '../files/types';
import { WORKSPACE_VERSION, DEFAULT_TAB_NAME } from '../files/types';
import { showToast } from '../Toast';
import { encodeShare } from '../sharing/share-url';
import { loadHistory, saveSnapshot, type HistoryEntry } from '../sharing/history';
import { t } from '../i18n';

const SNAPSHOT_DEBOUNCE_MS = 5000;

/**
 * Optional hooks the host can supply to give the controller a workspace
 * view + a way to restore one. Until Task 15 wires the real WorkspaceHost,
 * PlaygroundApp passes stubs that round-trip the single-buffer editor.
 */
export interface HistoryControllerHost {
  getWorkspace?: () => Workspace;
  setWorkspace?: (ws: Workspace) => void;
}

/**
 * Owns share-by-URL flow + LocalStorage history snapshots + the history
 * dropdown popover. Wires its own buttons; the host only triggers
 * `scheduleSnapshot()` on doc change.
 */
export class HistoryController {
  private snapshotTimer: ReturnType<typeof setTimeout> | undefined;

  constructor(
    private readonly root: HTMLElement,
    private readonly editor: EditorApi,
    private readonly dropdown: HistoryDropdownApi | null,
    private readonly host: HistoryControllerHost = {},
  ) {
    this.dropdown?.update(loadHistory());
    this.dropdown?.onSelect((entry) => this.applyEntry(entry));
    this.bindToggleButton();
    this.bindShareButton();
  }

  scheduleSnapshot(): void {
    if (this.snapshotTimer) clearTimeout(this.snapshotTimer);
    this.snapshotTimer = setTimeout(() => {
      saveSnapshot(this.currentWorkspace());
      this.dropdown?.update(loadHistory());
    }, SNAPSHOT_DEBOUNCE_MS);
  }

  /**
   * Read the active workspace from the host, or fall back to a synthetic
   * single-tab workspace built from the editor buffer. The fallback path
   * disappears once Task 15 lands a real WorkspaceHost everywhere.
   */
  private currentWorkspace(): Workspace {
    if (this.host.getWorkspace) return this.host.getWorkspace();
    const content = this.editor.getValue();
    return {
      v: WORKSPACE_VERSION,
      tabs: [{ id: 'editor', name: DEFAULT_TAB_NAME, content }],
      activeTabId: 'editor',
    };
  }

  /**
   * Restore a snapshot entry. With a real WorkspaceHost we hand the full
   * tab list back; without one we drop everything but the first tab into
   * the editor (Task 15 finishes the multi-file restore path).
   */
  private applyEntry(entry: HistoryEntry): void {
    if (this.host.setWorkspace && entry.tabs.length > 0) {
      this.host.setWorkspace({
        v: WORKSPACE_VERSION,
        tabs: entry.tabs.map((tab) => ({ ...tab })),
        activeTabId: entry.tabs[0].id,
      });
    } else if (entry.tabs[0]) {
      // TODO(Task 15): restore the full tab list, not just the main file.
      this.editor.setValue(entry.tabs[0].content);
    }
    this.closePopover();
  }

  private bindToggleButton(): void {
    const btn = this.root.querySelector<HTMLButtonElement>('[data-action="history-toggle"]');
    const pop = this.root.querySelector<HTMLElement>('[data-pg-history]');
    if (!btn || !pop) return;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      pop.hidden = !pop.hidden;
    });
    document.addEventListener('click', (e) => {
      const within = (e.target as Element)?.closest?.('[data-pg-history-wrap]');
      if (!within) pop.hidden = true;
    });
  }

  private closePopover(): void {
    const pop = this.root.querySelector<HTMLElement>('[data-pg-history]');
    if (pop) pop.hidden = true;
  }

  private bindShareButton(): void {
    const btn = this.root.querySelector<HTMLButtonElement>('[data-action="share"]');
    if (!btn) return;
    btn.addEventListener('click', async () => {
      const text = this.editor.getValue();
      const enc = encodeShare(text);
      const url = `${window.location.origin}${window.location.pathname}#config=${enc}`;
      history.replaceState(null, '', `#config=${enc}`);
      try {
        await navigator.clipboard.writeText(url);
        showToast(t('toast.linkCopied'));
      } catch {
        showToast(t('toast.copyFailed'));
      }
      saveSnapshot(this.currentWorkspace());
      this.dropdown?.update(loadHistory());
    });
  }
}
