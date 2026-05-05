import { describe, test, expect, beforeEach, vi } from 'vitest';
import { TutorialController, type WorkspaceHost } from './TutorialController';
import type { TutorialPanelApi } from '../TutorialPanel';
import type { Workspace } from '../files/types';
import { WORKSPACE_VERSION } from '../files/types';

/**
 * The controller wires the tutorial UI to a workspace host (multi-tab
 * abstraction over the editor + tab bar). We mock both sides and assert the
 * state-machine behavior: per-lesson draft preservation, reset semantics,
 * and the contract that lessons with extraFiles produce multi-tab
 * workspaces.
 */

class StubHost implements WorkspaceHost {
  workspace: Workspace = { v: WORKSPACE_VERSION, tabs: [], activeTabId: '' };
  setWorkspace(ws: Workspace): void { this.workspace = ws; }
  getWorkspace(): Workspace { return this.workspace; }
  // Helper to mutate the menu.conf (first) tab content as if the user typed.
  editMain(content: string): void {
    const tabs = this.workspace.tabs.map((tab, i) => i === 0 ? { ...tab, content } : tab);
    this.workspace = { ...this.workspace, tabs };
  }
}

function fakePanel(): TutorialPanelApi & { __passed: boolean } {
  return {
    showLesson: vi.fn(),
    showCompleted: vi.fn(),
    setPassed: vi.fn(function (this: { __passed: boolean }, p: boolean) { this.__passed = p; }),
    onHint: vi.fn(),
    onReset: vi.fn(),
    onSkip: vi.fn(),
    onNext: vi.fn(),
    onPrev: vi.fn(),
    onJump: vi.fn(),
    __passed: false,
  } as unknown as TutorialPanelApi & { __passed: boolean };
}

beforeEach(() => {
  try { localStorage.clear(); } catch { /* ignore */ }
});

describe('TutorialController workspace contract', () => {
  test('enter loads lesson starter into menu.conf tab', () => {
    const host = new StubHost();
    const tc = new TutorialController(host, fakePanel(), () => {});
    tc.enter('01-introduction');
    expect(host.workspace.tabs.length).toBe(1);
    expect(host.workspace.tabs[0].name).toBe('menu.conf');
    expect(host.workspace.tabs[0].content).toMatch(/title/);
    expect(host.workspace.activeTabId).toBe(host.workspace.tabs[0].id);
  });

  test('enter on lesson 21 loads main + defaults.conf', () => {
    const host = new StubHost();
    const tc = new TutorialController(host, fakePanel(), () => {});
    tc.enter('21-include');
    const names = host.workspace.tabs.map((t) => t.name);
    expect(names).toEqual(['menu.conf', 'defaults.conf']);
    expect(host.workspace.activeTabId).toBe(host.workspace.tabs[0].id);
    // defaults.conf seeded from the lesson's extraFiles entry
    expect(host.workspace.tabs[1].content).toContain('cooldown');
  });

  test('switching lessons preserves per-lesson drafts', () => {
    const host = new StubHost();
    const tc = new TutorialController(host, fakePanel(), () => {});

    tc.enter('01-introduction');
    host.editMain('title = "EDITED LESSON 01"');
    tc.leave();

    tc.enter('02-comments');
    // 02-comments starter, NOT lesson 01's draft
    expect(host.workspace.tabs[0].content).toContain('My menu');
    expect(host.workspace.tabs[0].content).not.toContain('EDITED LESSON 01');
    tc.leave();

    tc.enter('01-introduction');
    // Lesson 01's draft is restored
    expect(host.workspace.tabs[0].content).toBe('title = "EDITED LESSON 01"');
  });

  test('reset restores starter + extraFiles for the current lesson', () => {
    const host = new StubHost();
    const tc = new TutorialController(host, fakePanel(), () => {});
    tc.enter('21-include');
    // Simulate user editing both tabs
    host.workspace = {
      ...host.workspace,
      tabs: host.workspace.tabs.map((tab, i) => ({ ...tab, content: i === 1 ? 'mangled' : tab.content })),
    };
    tc.reset();
    expect(host.workspace.tabs.map((t) => t.name)).toEqual(['menu.conf', 'defaults.conf']);
    expect(host.workspace.tabs[1].content).toContain('cooldown');
    expect(host.workspace.tabs[1].content).not.toBe('mangled');
  });
});

describe('TutorialController draft preservation', () => {
  test('leave + enter on the SAME lesson restores in-flight edits', () => {
    const host = new StubHost();
    const tc = new TutorialController(host, fakePanel(), () => {});

    tc.enter('01-introduction');
    expect(host.workspace.tabs[0].content).toMatch(/title/); // starter loaded

    host.editMain('title = "MY EDITED VALUE"');
    tc.leave();

    // Simulate user round-tripping through editor mode (workspace replaced
    // with something unrelated by the editor side).
    host.setWorkspace({ v: WORKSPACE_VERSION, tabs: [], activeTabId: '' });

    tc.enter('01-introduction');
    expect(host.workspace.tabs[0].content).toBe('title = "MY EDITED VALUE"');
  });

  test('leave + enter on a DIFFERENT lesson loads its starter', () => {
    const host = new StubHost();
    const tc = new TutorialController(host, fakePanel(), () => {});

    tc.enter('01-introduction');
    host.editMain('drafted lesson 0');
    tc.leave();

    tc.enter('02-comments');
    // 02-comments starter contains `title = "My menu"` and `size = 3`
    expect(host.workspace.tabs[0].content).toContain('My menu');
    expect(host.workspace.tabs[0].content).not.toContain('drafted lesson 0');
  });

  test('reset asks for confirm and only clears on yes', () => {
    const host = new StubHost();
    const panel = fakePanel();
    let onReset!: () => void;
    panel.onReset = vi.fn((fn: () => void) => { onReset = fn; });
    const tc = new TutorialController(host, panel, () => {});

    tc.enter('01-introduction');
    host.editMain('user edits');

    // confirm denied -> workspace untouched
    const spy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    onReset();
    expect(host.workspace.tabs[0].content).toBe('user edits');

    // confirm accepted -> back to starter, draft cleared
    spy.mockReturnValue(true);
    onReset();
    expect(host.workspace.tabs[0].content).toMatch(/title = ""/);

    // verify draft is actually cleared: a leave/re-enter must NOT bring back 'user edits'
    tc.leave();
    host.setWorkspace({ v: WORKSPACE_VERSION, tabs: [], activeTabId: '' });
    tc.enter('01-introduction');
    expect(host.workspace.tabs[0].content).not.toBe('user edits');

    spy.mockRestore();
  });

  test('refresh is a no-op outside tutorial mode', () => {
    const host = new StubHost();
    const panel = fakePanel();
    const tc = new TutorialController(host, panel, () => {});
    // Never entered -> no current lesson
    tc.refresh();
    expect(panel.setPassed).not.toHaveBeenCalled();
  });
});

describe('TutorialController navigation (Prev / Jump)', () => {
  test('Prev navigates to previous lesson without marking progress', () => {
    const host = new StubHost();
    const panel = fakePanel();
    let onPrev!: () => void;
    panel.onPrev = vi.fn((fn: () => void) => { onPrev = fn; });
    const tc = new TutorialController(host, panel, () => {});

    tc.enter('02-comments');
    expect(host.workspace.tabs[0].content).toContain('My menu'); // 02 starter

    onPrev();
    expect(host.workspace.tabs[0].content).toMatch(/title = ""/); // 01 starter
    // Progress not mutated by Prev: localStorage progress should not list 02 as completed
    const progress = JSON.parse(localStorage.getItem('am_playground_progress') ?? '{}');
    expect(progress.completed ?? []).not.toContain('02-comments');
    expect(progress.skipped ?? []).not.toContain('02-comments');
  });

  test('Prev is a no-op at the first lesson', () => {
    const host = new StubHost();
    const panel = fakePanel();
    let onPrev!: () => void;
    panel.onPrev = vi.fn((fn: () => void) => { onPrev = fn; });
    const tc = new TutorialController(host, panel, () => {});

    tc.enter('01-introduction');
    const before = host.workspace.tabs[0].content;
    onPrev();
    expect(host.workspace.tabs[0].content).toBe(before);
  });

  test('Jump loads target lesson without marking progress', () => {
    const host = new StubHost();
    const panel = fakePanel();
    let onJump!: (id: string) => void;
    panel.onJump = vi.fn((fn: (id: string) => void) => { onJump = fn; });
    const tc = new TutorialController(host, panel, () => {});

    tc.enter('01-introduction');
    onJump('02-comments');
    expect(host.workspace.tabs[0].content).toContain('My menu');

    const progress = JSON.parse(localStorage.getItem('am_playground_progress') ?? '{}');
    expect(progress.completed ?? []).not.toContain('01-introduction');
  });

  test('Jump to current lesson is a no-op', () => {
    const host = new StubHost();
    const panel = fakePanel();
    let onJump!: (id: string) => void;
    panel.onJump = vi.fn((fn: (id: string) => void) => { onJump = fn; });
    const tc = new TutorialController(host, panel, () => {});

    tc.enter('01-introduction');
    host.editMain('user changes');
    onJump('01-introduction');
    expect(host.workspace.tabs[0].content).toBe('user changes'); // not reloaded
  });

  test('enter() falls back to first lesson when saved id is stale', () => {
    const host = new StubHost();
    const panel = fakePanel();
    const tc = new TutorialController(host, panel, () => {});

    // Simulate a leftover progress entry pointing at a removed lesson.
    localStorage.setItem('am_playground_progress', JSON.stringify({
      current: '99-was-removed', completed: [], skipped: [], hintsUsed: {},
    }));
    tc.enter();

    // Should land on the first real lesson (01-introduction starter), NOT
    // show the "course complete" screen.
    expect(panel.showCompleted).not.toHaveBeenCalled();
    expect(host.workspace.tabs[0].content).toMatch(/title = ""/); // 01-introduction starter
  });

  test('enter() with explicit unknown id also falls back', () => {
    const host = new StubHost();
    const panel = fakePanel();
    const tc = new TutorialController(host, panel, () => {});

    tc.enter('does-not-exist');
    expect(panel.showCompleted).not.toHaveBeenCalled();
    expect(host.workspace.tabs[0].content).toMatch(/title = ""/);
  });
});
