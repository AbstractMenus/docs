import type { EditorApi } from '../Editor';
import type { HistoryDropdownApi } from '../HistoryDropdown';
import { showToast } from '../Toast';
import { encodeShare } from '../sharing/share-url';
import { loadHistory, pushSnapshot } from '../sharing/history';
import { t } from '../i18n';

const SNAPSHOT_DEBOUNCE_MS = 5000;

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
  ) {
    this.dropdown?.update(loadHistory());
    this.dropdown?.onSelect((content) => {
      this.editor.setValue(content);
      this.closePopover();
    });
    this.bindToggleButton();
    this.bindShareButton();
  }

  scheduleSnapshot(): void {
    if (this.snapshotTimer) clearTimeout(this.snapshotTimer);
    this.snapshotTimer = setTimeout(() => {
      pushSnapshot(this.editor.getValue());
      this.dropdown?.update(loadHistory());
    }, SNAPSHOT_DEBOUNCE_MS);
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
      pushSnapshot(text);
      this.dropdown?.update(loadHistory());
    });
  }
}
