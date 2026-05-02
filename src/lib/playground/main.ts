import { autocompletion, startCompletion } from '@codemirror/autocomplete';
import { EditorView, keymap } from '@codemirror/view';
import type { EditorState } from '@codemirror/state';
import { detectScope } from './cm/scope';
import { getKeysForScope } from './catalog';
import { createEditor } from './Editor';
import { createPanels } from './Panels';
import { createDivider } from './Divider';
import { hoconLanguage } from './cm/hocon-language';
import { hoconLinter, setWarningSquigglesEnabled, isWarningSquigglesEnabled } from './cm/hocon-lint';
import { snippetCompletions } from './cm/snippets';
import { createCatalogSource } from './cm/catalog-source';
import { hoverDocs } from './cm/hover-docs';
import { formatHocon } from './cm/format';
import { tokenizeText } from './hocon/tokenize';
import { parse } from './hocon/parser';
import { resolve } from './hocon/resolve';
import { validateUnknownKeys } from './hocon/unknown-keys';
import { createValidationPanel } from './ValidationPanel';
import { createResolvedJsonPanel } from './ResolvedJsonPanel';
import { createHistoryDropdown } from './HistoryDropdown';
import { showToast } from './Toast';
import { encodeShare, decodeShare } from './sharing/share-url';
import { loadHistory, pushSnapshot } from './sharing/history';
import { listLessons, getLesson, firstLessonId } from './tutorial/lessons';
import { runCheck, loadProgress, saveProgress, markCompleted, markSkipped, bumpHint } from './tutorial/engine';
import { createTutorialPanel } from './TutorialPanel';
import type { Lesson } from './tutorial/types';
import type { PlaygroundMode, TabId } from './types';

const SNIPPETS = snippetCompletions();
const catalogSource = createCatalogSource({ fallbackSnippets: SNIPPETS });

const DEFAULT_CONTENT = `# Welcome to the AbstractMenus HOCON Playground.
# Edit below to see live validation and resolved JSON on the right.

title = "Example Menu"
size = 3

defaults {
  cooldown = 5s
}

items = [
  { slot = 0, material = STONE, name = "Stone" }
  { slot = 4, material = DIAMOND, name = \${title} }
]
`;

export function boot(): void {
  const root = document.querySelector<HTMLElement>('[data-pg-root]');
  if (!root) {
    console.warn('[playground] root not found');
    return;
  }

  const editorHost = root.querySelector<HTMLElement>('[data-pg-editor]');
  if (!editorHost) {
    console.warn('[playground] editor host not found');
    return;
  }

  const status = root.querySelector<HTMLElement>('[data-pg-status]');
  const scopeHintEl = root.querySelector<HTMLElement>('[data-pg-scope-hint]');
  const errorsEl = root.querySelector<HTMLElement>('[data-panel="errors"]');
  const warningsEl = root.querySelector<HTMLElement>('[data-panel="warnings"]');
  const jsonEl = root.querySelector<HTMLElement>('[data-panel="json"]');
  const historyHost = root.querySelector<HTMLElement>('[data-pg-history]');
  const errorsCountEl = root.querySelector<HTMLElement>('[data-tab-count="errors"]');
  const warningsCountEl = root.querySelector<HTMLElement>('[data-tab-count="warnings"]');

  const tutorialEl = root.querySelector<HTMLElement>('[data-panel="tutorial"]');

  // Ctrl+Space on every platform - Cmd+Space on macOS is system Spotlight,
  // never reaches the page. CM6 wires this binding via completionKeymap.
  const scopeShortcut = 'Ctrl+space';

  const errorsPanel = errorsEl ? createValidationPanel(errorsEl) : null;
  const warningsPanel = warningsEl ? createValidationPanel(warningsEl) : null;
  const resolved = jsonEl ? createResolvedJsonPanel(jsonEl) : null;
  const historyDropdown = historyHost ? createHistoryDropdown(historyHost) : null;
  const tutorial = tutorialEl ? createTutorialPanel(tutorialEl) : null;

  const initial = pickInitialContent();

  let currentLesson: Lesson | null = null;
  let tutorialMode = false;

  let timer: ReturnType<typeof setTimeout> | undefined;
  let historyTimer: ReturnType<typeof setTimeout> | undefined;
  let editorRef: ReturnType<typeof createEditor> | null = null;

  function snapshotHistory(): void {
    if (historyTimer) clearTimeout(historyTimer);
    historyTimer = setTimeout(() => {
      if (!editorRef) return;
      pushSnapshot(editorRef.getValue());
      historyDropdown?.update(loadHistory());
    }, 5000);
  }

  function refreshAnalysis(): void {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      if (!editorRef) return;
      const text = editorRef.getValue();
      const r = parse(tokenizeText(text));
      const res = resolve(r.ast);
      const unknown = validateUnknownKeys(r.ast);
      const all = [...r.diagnostics, ...res.warnings, ...unknown];
      const errors = all.filter((d) => d.severity === 'error');
      const warnings = all.filter((d) => d.severity === 'warning');

      errorsPanel?.update(errors);
      warningsPanel?.update(warnings);
      resolved?.update(res.resolved);

      updateTabCount(errorsCountEl, errors.length, 'has-error');
      updateTabCount(warningsCountEl, warnings.length, 'has-warning');

      if (status) {
        if (errors.length > 0) status.textContent = `${errors.length} error${errors.length === 1 ? '' : 's'}`;
        else if (warnings.length > 0) status.textContent = `${warnings.length} warning${warnings.length === 1 ? '' : 's'}`;
        else status.textContent = 'ok';
      }
    }, 300);
  }

  function updateScopeHint(state: EditorState): void {
    if (!scopeHintEl) return;
    const text = state.doc.toString();
    const pos = state.selection.main.head;
    const scope = detectScope(text, pos);
    const count = getKeysForScope(scope).length;
    scopeHintEl.textContent = `${scope} · ${count} key${count === 1 ? '' : 's'} · ${scopeShortcut}`;
  }

  const editor = createEditor({
    parent: editorHost,
    initialContent: initial,
    extensions: [
      ...hoconLanguage(),
      hoconLinter(),
      hoverDocs(),
      autocompletion({ override: [catalogSource] }),
      EditorView.updateListener.of((u) => {
        if (u.selectionSet || u.docChanged) updateScopeHint(u.state);
      }),
      keymap.of([
        {
          key: 'Mod-Shift-f',
          run: (view) => {
            const before = view.state.doc.toString();
            const after = formatHocon(before);
            if (after === before) return true;
            view.dispatch({
              changes: { from: 0, to: view.state.doc.length, insert: after },
            });
            return true;
          },
        },
      ]),
    ],
    onChange: () => {
      refreshAnalysis();
      snapshotHistory();
      refreshTutorial();
    },
  });
  editorRef = editor;

  function refreshTutorial(): void {
    if (!tutorialMode || !currentLesson || !tutorial) return;
    const passed = runCheck(editor.getValue(), currentLesson.check);
    tutorial.setPassed(passed);
  }

  function loadLesson(id: string): void {
    if (!tutorial) return;
    const lesson = getLesson(id);
    if (!lesson) {
      tutorial.showCompleted("You've finished every lesson. Try the editor mode now.");
      currentLesson = null;
      return;
    }
    currentLesson = lesson;
    const progress = loadProgress();
    saveProgress({ ...progress, current: id });
    const hintsUsed = progress.hintsUsed[id] ?? 0;
    const passed = runCheck(lesson.starter, lesson.check);
    tutorial.showLesson(lesson, { hintsUsed, passed });
    editor.setValue(lesson.starter);
    setUrlForLesson(id);
  }

  function nextLesson(currentId: string): void {
    const lessons = listLessons();
    const idx = lessons.findIndex((l) => l.id === currentId);
    const next = lessons[idx + 1];
    if (next) loadLesson(next.id);
    else tutorial?.showCompleted("You've finished every lesson. Try the editor mode now.");
  }

  tutorial?.onHint(() => {
    if (!currentLesson) return;
    const p = bumpHint(loadProgress(), currentLesson.id);
    saveProgress(p);
    loadLesson(currentLesson.id);
  });
  tutorial?.onReset(() => {
    if (!currentLesson) return;
    editor.setValue(currentLesson.starter);
  });
  tutorial?.onSkip(() => {
    if (!currentLesson) return;
    saveProgress(markSkipped(loadProgress(), currentLesson.id));
    nextLesson(currentLesson.id);
  });
  tutorial?.onNext(() => {
    if (!currentLesson) return;
    saveProgress(markCompleted(loadProgress(), currentLesson.id));
    nextLesson(currentLesson.id);
  });

  historyDropdown?.update(loadHistory());
  historyDropdown?.onSelect((content) => {
    editor.setValue(content);
    closeHistoryPopover(root);
  });

  function jumpTo(line: number, column: number): void {
    const doc = editor.view.state.doc;
    const lineNo = Math.max(1, Math.min(doc.lines, line));
    const docLine = doc.line(lineNo);
    const pos = docLine.from + Math.max(0, column - 1);
    editor.view.dispatch({
      selection: { anchor: pos },
      effects: EditorView.scrollIntoView(pos, { y: 'center' }),
    });
    editor.view.focus();
  }

  errorsPanel?.onJump(jumpTo);
  warningsPanel?.onJump(jumpTo);

  refreshAnalysis();

  const panels = createPanels(root);
  panels.bindClicks();
  panels.hideTab('tutorial');

  // Warning squiggle toggle. Persists across reloads. Doesn't affect the
  // Warnings tab - that always shows the full list.
  try {
    const stored = localStorage.getItem('pg-warning-squiggles');
    if (stored === '0') setWarningSquigglesEnabled(editor.view, false);
  } catch { /* ignore */ }
  bindWarningToggle(root, editor.view);

  bindModeSwitch(root, panels, {
    onEnterTutorial: () => {
      tutorialMode = true;
      const url = new URL(window.location.href);
      const lessonId = url.searchParams.get('lesson') ?? loadProgress().current ?? firstLessonId();
      loadLesson(lessonId || firstLessonId());
      setUrlForMode('tutorial');
    },
    onLeaveTutorial: () => {
      tutorialMode = false;
      currentLesson = null;
      setUrlForMode('editor');
    },
  });
  bindThemeToggle(root);
  bindDivider(root);
  bindFormatButton(root, editor);
  bindHistoryToggle(root);
  bindShareButton(root, editor, historyDropdown);

  // Initial mode from URL (?mode=tutorial)
  const urlMode = new URL(window.location.href).searchParams.get('mode');
  if (urlMode === 'tutorial') {
    const tutBtn = root.querySelector<HTMLButtonElement>('.pg-mode-btn[data-mode="tutorial"]');
    tutBtn?.click();
  }

  (window as unknown as { __pg?: unknown }).__pg = { editor, panels };
}

function setUrlForMode(mode: PlaygroundMode): void {
  const url = new URL(window.location.href);
  if (mode === 'tutorial') {
    url.searchParams.set('mode', 'tutorial');
  } else {
    url.searchParams.delete('mode');
    url.searchParams.delete('lesson');
  }
  history.replaceState(null, '', url.toString());
}

function setUrlForLesson(id: string): void {
  const url = new URL(window.location.href);
  url.searchParams.set('mode', 'tutorial');
  url.searchParams.set('lesson', id);
  history.replaceState(null, '', url.toString());
}

function updateTabCount(el: HTMLElement | null, count: number, klass: 'has-error' | 'has-warning'): void {
  if (!el) return;
  el.textContent = count > 0 ? String(count) : '';
  el.classList.toggle(klass, count > 0);
}

function bindWarningToggle(root: HTMLElement, view: EditorView): void {
  const btn = root.querySelector<HTMLButtonElement>('[data-action="toggle-warning-squiggles"]');
  if (!btn) return;

  function sync(): void {
    const on = isWarningSquigglesEnabled(view.state);
    btn!.dataset.state = on ? 'on' : 'off';
    btn!.textContent = on ? 'warnings: on' : 'warnings: off';
    btn!.title = on
      ? 'Hide warning squiggles in the editor (Warnings tab stays)'
      : 'Show warning squiggles in the editor';
  }
  sync();

  btn.addEventListener('click', () => {
    const next = !isWarningSquigglesEnabled(view.state);
    setWarningSquigglesEnabled(view, next);
    try { localStorage.setItem('pg-warning-squiggles', next ? '1' : '0'); } catch { /* ignore */ }
    sync();
  });
}

function pickInitialContent(): string {
  const hash = window.location.hash;
  const m = /^#config=(.+)$/.exec(hash);
  if (m) {
    const decoded = decodeShare(m[1]);
    if (decoded !== null) return decoded;
  }
  const history = loadHistory();
  if (history.length > 0) return history[0].content;
  return DEFAULT_CONTENT;
}

function bindHistoryToggle(root: HTMLElement): void {
  const btn = root.querySelector<HTMLButtonElement>('[data-action="history-toggle"]');
  const pop = root.querySelector<HTMLElement>('[data-pg-history]');
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

function closeHistoryPopover(root: HTMLElement): void {
  const pop = root.querySelector<HTMLElement>('[data-pg-history]');
  if (pop) pop.hidden = true;
}

function bindShareButton(
  root: HTMLElement,
  editor: ReturnType<typeof createEditor>,
  dropdown: ReturnType<typeof createHistoryDropdown> | null,
): void {
  const btn = root.querySelector<HTMLButtonElement>('[data-action="share"]');
  if (!btn) return;
  btn.addEventListener('click', async () => {
    const text = editor.getValue();
    const enc = encodeShare(text);
    const url = `${window.location.origin}${window.location.pathname}#config=${enc}`;
    history.replaceState(null, '', `#config=${enc}`);
    try {
      await navigator.clipboard.writeText(url);
      showToast('Link copied');
    } catch {
      showToast('Copy failed');
    }
    pushSnapshot(text);
    dropdown?.update(loadHistory());
  });
}

function bindFormatButton(root: HTMLElement, editor: ReturnType<typeof createEditor>): void {
  const btn = root.querySelector<HTMLButtonElement>('[data-action="format"]');
  if (!btn) return;
  btn.disabled = false;
  btn.title = 'Format (Cmd+Shift+F)';
  btn.addEventListener('click', () => {
    const before = editor.getValue();
    const after = formatHocon(before);
    if (after !== before) editor.setValue(after);
    editor.view.focus();
  });
}

function bindDivider(root: HTMLElement): void {
  const main = root.querySelector<HTMLElement>('.pg-main');
  const divider = root.querySelector<HTMLElement>('[data-pg-divider]');
  if (!main || !divider) return;
  const isMobile = window.matchMedia('(max-width: 768px)').matches;
  createDivider({
    main,
    divider,
    axis: isMobile ? 'vertical' : 'horizontal',
    minPct: 20,
    maxPct: 80,
  });
}

interface ModeCallbacks {
  onEnterTutorial?(): void;
  onLeaveTutorial?(): void;
}

function bindModeSwitch(
  root: HTMLElement,
  panels: ReturnType<typeof createPanels>,
  cb: ModeCallbacks = {},
): void {
  const buttons = root.querySelectorAll<HTMLButtonElement>('.pg-mode-btn');
  for (const btn of buttons) {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.mode as PlaygroundMode;
      for (const b of buttons) {
        const isActive = b === btn;
        b.classList.toggle('is-active', isActive);
        b.setAttribute('aria-selected', String(isActive));
      }
      if (mode === 'tutorial') {
        panels.showTab('tutorial');
        panels.activate('tutorial');
        cb.onEnterTutorial?.();
      } else {
        panels.hideTab('tutorial');
        panels.activate('errors' as TabId);
        cb.onLeaveTutorial?.();
      }
    });
  }
}

function bindThemeToggle(root: HTMLElement): void {
  const btn = root.querySelector<HTMLButtonElement>('[data-action="theme-toggle"]');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const html = document.documentElement;
    const next = html.dataset.theme === 'light' ? 'dark' : 'light';
    html.dataset.theme = next;
    try {
      localStorage.setItem('pg-theme', next);
    } catch {
      // ignore
    }
  });
  try {
    const saved = localStorage.getItem('pg-theme');
    if (saved === 'light' || saved === 'dark') {
      document.documentElement.dataset.theme = saved;
    }
  } catch {
    // ignore
  }
}
