import { t } from './i18n';

/**
 * One tab in the bar. `errors` / `warnings` drive the status dot - red wins
 * over yellow, both at zero hides the dot.
 */
export interface TabBarItem {
  id: string;
  name: string;
  errors: number;
  warnings: number;
}

/**
 * Result of an `onRename` callback. The caller (PlaygroundApp) owns the
 * validation policy (empty / duplicate / reserved names) and decides whether
 * the rename commits. On `ok: false` the bar reverts to the old name and
 * the caller is expected to show its own toast.
 */
export interface RenameResult {
  ok: boolean;
  error?: 'empty' | 'duplicate';
}

export interface TabBarOptions {
  host: HTMLElement;
  tabs: TabBarItem[];
  activeId: string;
  onSelect?: (id: string) => void;
  onCreate?: () => void;
  onClose?: (id: string) => void;
  onRename?: (id: string, newName: string) => RenameResult;
}

export interface TabBarApi {
  update(tabs: TabBarItem[], activeId: string): void;
  startRename(id: string): void;
  destroy(): void;
}

/**
 * Standalone tab bar. Owns its DOM and the kebab-menu / inline-rename UI
 * state but is otherwise stateless - the caller passes the source of truth
 * via `update(tabs, activeId)` and reacts to events.
 *
 * Single-tab mode hides the close button; the `+` is always visible.
 */
export function createTabBar(opts: TabBarOptions): TabBarApi {
  let { tabs, activeId } = opts;
  let openMenuFor: string | null = null;
  // Tracks an in-flight rename. Cleared whenever the underlying tab disappears
  // (closed externally) so that a stray blur from the orphaned input becomes a
  // no-op instead of firing onRename for a tab that no longer exists.
  let editing: { id: string; input: HTMLInputElement } | null = null;

  const root = document.createElement('div');
  root.className = 'pg-tabbar';
  opts.host.appendChild(root);

  function render(): void {
    if (editing && !tabs.find((t) => t.id === editing!.id)) {
      editing = null;
    }
    root.innerHTML = '';
    const list = document.createElement('div');
    list.className = 'pg-tabbar__list';
    const single = tabs.length === 1;

    for (const tab of tabs) {
      const el = document.createElement('div');
      el.className = 'pg-filetab';
      if (tab.id === activeId) el.classList.add('is-active');
      if (tab.errors > 0) el.classList.add('has-errors');
      else if (tab.warnings > 0) el.classList.add('has-warnings');
      el.dataset.tabId = tab.id;

      const name = document.createElement('span');
      name.className = 'pg-filetab__name';
      name.dataset.tabName = '';
      name.textContent = tab.name;
      el.appendChild(name);

      const kebab = document.createElement('button');
      kebab.className = 'pg-filetab__kebab';
      kebab.dataset.tabKebab = '';
      kebab.type = 'button';
      kebab.setAttribute('aria-label', t('tab.menu.aria'));
      kebab.textContent = '⋮'; // vertical ellipsis
      kebab.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleMenu(tab.id);
      });
      el.appendChild(kebab);

      if (!single) {
        const close = document.createElement('button');
        close.className = 'pg-filetab__close';
        close.dataset.tabClose = '';
        close.type = 'button';
        close.setAttribute('aria-label', t('tab.close.aria'));
        close.textContent = '×'; // multiplication sign
        close.addEventListener('click', (e) => {
          e.stopPropagation();
          opts.onClose?.(tab.id);
        });
        el.appendChild(close);
      }

      el.addEventListener('click', () => opts.onSelect?.(tab.id));

      if (openMenuFor === tab.id) {
        const menu = document.createElement('div');
        menu.className = 'pg-filetab__menu';
        const renameItem = document.createElement('button');
        renameItem.className = 'pg-filetab__menu-item';
        renameItem.dataset.tabRename = '';
        renameItem.type = 'button';
        renameItem.textContent = t('tab.menu.rename');
        renameItem.addEventListener('click', (e) => {
          e.stopPropagation();
          openMenuFor = null;
          startRename(tab.id);
        });
        menu.appendChild(renameItem);
        el.appendChild(menu);
      }

      list.appendChild(el);
    }
    root.appendChild(list);

    const add = document.createElement('button');
    add.className = 'pg-tabbar__add';
    add.dataset.tabAdd = '';
    add.type = 'button';
    add.setAttribute('aria-label', t('tab.add.aria'));
    add.textContent = '+';
    add.addEventListener('click', (e) => {
      e.stopPropagation();
      opts.onCreate?.();
    });
    root.appendChild(add);
  }

  function toggleMenu(id: string): void {
    openMenuFor = openMenuFor === id ? null : id;
    render();
  }

  function startRename(id: string): void {
    const tab = tabs.find((x) => x.id === id);
    if (!tab) return;
    // Make sure we render in non-rename state first, then swap the name span
    // for an input. Doing it through a re-render keeps render() the single
    // source of truth for tab DOM.
    openMenuFor = null;
    render();
    const tabEl = root.querySelector<HTMLElement>(`[data-tab-id="${cssEscape(id)}"]`);
    if (!tabEl) return;
    const nameEl = tabEl.querySelector<HTMLElement>('[data-tab-name]');
    if (!nameEl) return;

    const input = document.createElement('input');
    input.type = 'text';
    input.value = tab.name;
    input.maxLength = 64;
    input.className = 'pg-filetab__rename-input';
    nameEl.replaceWith(input);
    input.focus();
    input.select();
    editing = { id, input };

    let settled = false;
    function commit(): void {
      if (settled) return;
      // If the tab was closed externally mid-rename, render() already cleared
      // `editing`; a stray blur arriving after that must not fire onRename.
      if (!editing || editing.id !== id) return;
      settled = true;
      const newName = input.value;
      editing = null;
      const result = opts.onRename?.(id, newName);
      if (result && !result.ok) {
        // Caller emits its own toast; we just re-render with the original name.
        render();
        return;
      }
      // No callback installed, or callback accepted: persist locally and re-render.
      tab!.name = newName.trim();
      render();
    }
    function cancel(): void {
      if (settled) return;
      if (!editing || editing.id !== id) return;
      settled = true;
      editing = null;
      render();
    }

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); commit(); }
      else if (e.key === 'Escape') { e.preventDefault(); cancel(); }
    });
    input.addEventListener('blur', () => commit());
  }

  // Close the kebab menu when clicking anywhere outside it. The kebab's own
  // click handler calls stopPropagation, so opening the menu doesn't trip
  // this. The menu item also stopPropagates, so picking Rename doesn't
  // close-then-reopen.
  const outsideClickHandler = (): void => {
    if (openMenuFor !== null) {
      openMenuFor = null;
      render();
    }
  };
  document.addEventListener('click', outsideClickHandler);

  render();

  return {
    update(newTabs, newActiveId) {
      tabs = newTabs;
      activeId = newActiveId;
      if (editing && !tabs.find((t) => t.id === editing!.id)) {
        editing = null;
      }
      render();
    },
    startRename,
    destroy() {
      document.removeEventListener('click', outsideClickHandler);
      root.remove();
    },
  };
}

/**
 * Minimal CSS.escape shim - happy-dom has it but older test envs may not.
 * Tab ids are caller-provided so we can't assume safe selectors.
 */
function cssEscape(s: string): string {
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') return CSS.escape(s);
  return s.replace(/["\\]/g, '\\$&');
}
