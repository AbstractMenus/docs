import type { EditorApi } from '../Editor';
import type { HistoryDropdownApi } from '../HistoryDropdown';
import type { Workspace } from '../files/types';
import { WORKSPACE_VERSION, DEFAULT_TAB_NAME } from '../files/types';
import { showToast } from '../Toast';
import { buildShareUrl, MAX_SHARE_URL_LEN } from '../sharing/share-url';
import { loadHistory, saveSnapshot, type HistoryEntry } from '../sharing/history';
import { t } from '../i18n';

const SNAPSHOT_DEBOUNCE_MS = 5000;

/**
 * Hooks the host (PlaygroundApp) supplies so the controller can read +
 * replace the live workspace. Both are technically optional - the
 * controller falls back to a synthetic single-tab workspace built from the
 * editor buffer when neither is wired - but in production both should be
 * present.
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
   * exists for safety; the production wiring always supplies a real host.
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
   * tab list back; without one we drop the first tab into the editor (so
   * the legacy single-buffer path still works for tests / harnesses).
   */
  private applyEntry(entry: HistoryEntry): void {
    if (this.host.setWorkspace && entry.tabs.length > 0) {
      this.host.setWorkspace({
        v: WORKSPACE_VERSION,
        tabs: entry.tabs.map((tab) => ({ ...tab })),
        activeTabId: entry.tabs[0].id,
      });
    } else if (entry.tabs[0]) {
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
      const ws = this.currentWorkspace();
      const result = buildShareUrl(ws);
      if (!result.ok) {
        showToast(t('share.too-long', { length: result.length, max: MAX_SHARE_URL_LEN }));
        return;
      }
      const { url } = result;
      // Sync the hash so a reload re-decodes the workspace. We strip the
      // origin+pathname back to just the `#config=...` fragment because
      // history.replaceState only accepts same-document URLs and we don't
      // want to perturb the path.
      const hashIdx = url.indexOf('#');
      if (hashIdx >= 0) history.replaceState(null, '', url.slice(hashIdx));
      try {
        await navigator.clipboard.writeText(url);
        showToast(t('toast.linkCopied'));
      } catch {
        showToast(t('toast.copyFailed'));
      }
      saveSnapshot(ws);
      this.dropdown?.update(loadHistory());
    });
  }
}
