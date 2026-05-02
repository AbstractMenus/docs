import { describe, test, expect, beforeEach, vi } from 'vitest';
import { TutorialController } from './TutorialController';
import type { EditorApi } from '../Editor';
import type { TutorialPanelApi } from '../TutorialPanel';
import type { Lesson } from '../tutorial/types';

/**
 * The controller wires the tutorial UI to the editor; we mock both sides
 * and assert the state-machine behavior. We focus on draft preservation
 * and reset confirmation - everything else (engine progress, hint counter)
 * is covered by tutorial/engine.test.ts.
 */

function fakeEditor(initial = ''): EditorApi & { __doc: string } {
  let doc = initial;
  return {
    view: {} as EditorApi['view'],
    getValue: () => doc,
    setValue: (t: string) => { doc = t; },
    destroy: () => {},
    get __doc() { return doc; },
  };
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

describe('TutorialController draft preservation', () => {
  test('leave + enter on the SAME lesson restores in-flight edits', () => {
    const editor = fakeEditor();
    const panel = fakePanel();
    const ctl = new TutorialController(editor, panel, () => {});

    ctl.enter('00-introduction');
    expect(editor.__doc).toMatch(/title/); // starter loaded

    editor.setValue('title = "MY EDITED VALUE"');
    ctl.leave();

    // Simulate user round-tripping through editor mode
    editor.setValue('something completely different');

    ctl.enter('00-introduction');
    expect(editor.__doc).toBe('title = "MY EDITED VALUE"');
  });

  test('leave + enter on a DIFFERENT lesson loads its starter (drops draft)', () => {
    const editor = fakeEditor();
    const panel = fakePanel();
    const ctl = new TutorialController(editor, panel, () => {});

    ctl.enter('00-introduction');
    editor.setValue('drafted lesson 0');
    ctl.leave();

    ctl.enter('01-comments');
    // 01-comments starter contains `title = "My menu"` and `size = 3`
    expect(editor.__doc).toContain('My menu');
    expect(editor.__doc).not.toContain('drafted lesson 0');
  });

  test('reset asks for confirm and only clears on yes', () => {
    const editor = fakeEditor();
    const panel = fakePanel();
    let onReset!: () => void;
    panel.onReset = vi.fn((fn: () => void) => { onReset = fn; });
    const ctl = new TutorialController(editor, panel, () => {});

    ctl.enter('00-introduction');
    editor.setValue('user edits');

    // confirm denied -> editor untouched
    const spy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    onReset();
    expect(editor.__doc).toBe('user edits');

    // confirm accepted -> back to starter, draft cleared
    spy.mockReturnValue(true);
    onReset();
    expect(editor.__doc).toMatch(/title = ""/);

    // verify draft is actually cleared: a leave/re-enter must NOT bring back 'user edits'
    ctl.leave();
    editor.setValue('intermediate');
    ctl.enter('00-introduction');
    expect(editor.__doc).not.toBe('user edits');

    spy.mockRestore();
  });

  test('refresh is a no-op outside tutorial mode', () => {
    const editor = fakeEditor('anything');
    const panel = fakePanel();
    const ctl = new TutorialController(editor, panel, () => {});
    // Never entered -> no current lesson
    ctl.refresh();
    expect(panel.setPassed).not.toHaveBeenCalled();
  });
});

describe('TutorialController navigation (Prev / Jump)', () => {
  test('Prev navigates to previous lesson without marking progress', () => {
    const editor = fakeEditor();
    const panel = fakePanel();
    let onPrev!: () => void;
    panel.onPrev = vi.fn((fn: () => void) => { onPrev = fn; });
    const ctl = new TutorialController(editor, panel, () => {});

    ctl.enter('01-comments');
    expect(editor.__doc).toContain('My menu'); // 01 starter

    onPrev();
    expect(editor.__doc).toMatch(/title = ""/); // 00 starter
    // Progress not mutated by Prev: localStorage progress should not list 01 as completed
    const progress = JSON.parse(localStorage.getItem('pg-tutorial-progress') ?? '{}');
    expect(progress.completed ?? []).not.toContain('01-comments');
    expect(progress.skipped ?? []).not.toContain('01-comments');
  });

  test('Prev is a no-op at the first lesson', () => {
    const editor = fakeEditor();
    const panel = fakePanel();
    let onPrev!: () => void;
    panel.onPrev = vi.fn((fn: () => void) => { onPrev = fn; });
    const ctl = new TutorialController(editor, panel, () => {});

    ctl.enter('00-introduction');
    const before = editor.__doc;
    onPrev();
    expect(editor.__doc).toBe(before);
  });

  test('Jump loads target lesson without marking progress', () => {
    const editor = fakeEditor();
    const panel = fakePanel();
    let onJump!: (id: string) => void;
    panel.onJump = vi.fn((fn: (id: string) => void) => { onJump = fn; });
    const ctl = new TutorialController(editor, panel, () => {});

    ctl.enter('00-introduction');
    onJump('01-comments');
    expect(editor.__doc).toContain('My menu');

    const progress = JSON.parse(localStorage.getItem('pg-tutorial-progress') ?? '{}');
    expect(progress.completed ?? []).not.toContain('00-introduction');
  });

  test('Jump to current lesson is a no-op', () => {
    const editor = fakeEditor();
    const panel = fakePanel();
    let onJump!: (id: string) => void;
    panel.onJump = vi.fn((fn: (id: string) => void) => { onJump = fn; });
    const ctl = new TutorialController(editor, panel, () => {});

    ctl.enter('00-introduction');
    editor.setValue('user changes');
    onJump('00-introduction');
    expect(editor.__doc).toBe('user changes'); // not reloaded
  });
});
