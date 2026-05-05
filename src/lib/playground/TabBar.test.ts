import { describe, expect, test, beforeEach, vi } from 'vitest';
import { createTabBar } from './TabBar';

describe('TabBar', () => {
  let host: HTMLElement;
  beforeEach(() => {
    document.body.innerHTML = '<div id="host"></div>';
    host = document.getElementById('host')!;
  });

  test('renders tabs and active state', () => {
    const bar = createTabBar({
      host,
      tabs: [
        { id: 'a', name: 'menu.conf', errors: 0, warnings: 0 },
        { id: 'b', name: 'defaults.conf', errors: 0, warnings: 0 },
      ],
      activeId: 'a',
    });
    const tabs = host.querySelectorAll('[data-tab-id]');
    expect(tabs).toHaveLength(2);
    expect(host.querySelector('[data-tab-id="a"]')!.classList.contains('is-active')).toBe(true);
    bar.destroy();
  });

  test('clicking a tab fires onSelect', () => {
    const onSelect = vi.fn();
    const bar = createTabBar({
      host,
      tabs: [
        { id: 'a', name: 'menu.conf', errors: 0, warnings: 0 },
        { id: 'b', name: 'x.conf', errors: 0, warnings: 0 },
      ],
      activeId: 'a',
      onSelect,
    });
    const tabB = host.querySelector('[data-tab-id="b"]') as HTMLElement;
    tabB.click();
    expect(onSelect).toHaveBeenCalledWith('b');
    bar.destroy();
  });

  test('+ button fires onCreate', () => {
    const onCreate = vi.fn();
    const bar = createTabBar({
      host,
      tabs: [{ id: 'a', name: 'menu.conf', errors: 0, warnings: 0 }],
      activeId: 'a',
      onCreate,
    });
    const addBtn = host.querySelector('[data-tab-add]') as HTMLElement;
    addBtn.click();
    expect(onCreate).toHaveBeenCalled();
    bar.destroy();
  });

  test('× hidden when only one tab', () => {
    createTabBar({
      host,
      tabs: [{ id: 'a', name: 'menu.conf', errors: 0, warnings: 0 }],
      activeId: 'a',
    });
    expect(host.querySelector('[data-tab-close]')).toBeNull();
  });

  test('× fires onClose with id', () => {
    const onClose = vi.fn();
    createTabBar({
      host,
      tabs: [
        { id: 'a', name: 'menu.conf', errors: 0, warnings: 0 },
        { id: 'b', name: 'x.conf', errors: 0, warnings: 0 },
      ],
      activeId: 'a',
      onClose,
    });
    const closeBtn = host.querySelector('[data-tab-id="b"] [data-tab-close]') as HTMLElement;
    closeBtn.click();
    expect(onClose).toHaveBeenCalledWith('b');
  });

  test('kebab opens menu, Rename starts inline edit', () => {
    createTabBar({
      host,
      tabs: [
        { id: 'a', name: 'menu.conf', errors: 0, warnings: 0 },
        { id: 'b', name: 'x.conf', errors: 0, warnings: 0 },
      ],
      activeId: 'a',
    });
    const kebab = host.querySelector('[data-tab-id="a"] [data-tab-kebab]') as HTMLElement;
    kebab.click();
    const renameItem = host.querySelector('[data-tab-rename]') as HTMLElement;
    expect(renameItem).not.toBeNull();
    renameItem.click();
    const input = host.querySelector('[data-tab-id="a"] input') as HTMLInputElement;
    expect(input).not.toBeNull();
  });

  test('rename empty name rejected via onRename returning error', () => {
    const onRename = vi.fn().mockImplementation((_id, name) => {
      if (!name.trim()) return { ok: false, error: 'empty' };
      return { ok: true };
    });
    const bar = createTabBar({
      host,
      tabs: [
        { id: 'a', name: 'menu.conf', errors: 0, warnings: 0 },
        { id: 'b', name: 'x.conf', errors: 0, warnings: 0 },
      ],
      activeId: 'a',
      onRename,
    });
    bar.startRename('a');
    const input = host.querySelector('[data-tab-id="a"] input') as HTMLInputElement;
    input.value = '';
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(onRename).toHaveBeenCalledWith('a', '');
    // Tab name not updated since rename returned error
    expect(host.querySelector('[data-tab-id="a"] [data-tab-name]')!.textContent).toBe('menu.conf');
  });

  test('badge classes reflect errors / warnings', () => {
    createTabBar({
      host,
      tabs: [
        { id: 'a', name: 'menu.conf', errors: 2, warnings: 0 },
        { id: 'b', name: 'x.conf', errors: 0, warnings: 1 },
        { id: 'c', name: 'y.conf', errors: 0, warnings: 0 },
      ],
      activeId: 'a',
    });
    expect(host.querySelector('[data-tab-id="a"]')!.classList.contains('has-errors')).toBe(true);
    expect(host.querySelector('[data-tab-id="b"]')!.classList.contains('has-warnings')).toBe(true);
    expect(host.querySelector('[data-tab-id="c"]')!.classList.contains('has-errors')).toBe(false);
    expect(host.querySelector('[data-tab-id="c"]')!.classList.contains('has-warnings')).toBe(false);
  });
});
