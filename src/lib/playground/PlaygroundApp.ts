import { autocompletion } from '@codemirror/autocomplete';
import { EditorView, keymap } from '@codemirror/view';
import type { EditorState } from '@codemirror/state';
import { detectScope } from './cm/scope';
import { getKeysForScope } from './catalog';
import { createEditor, type EditorApi } from './Editor';
import { createPanels, type PanelsApi } from './Panels';
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
import { createValidationPanel, type ValidationPanelApi } from './ValidationPanel';
import { createResolvedJsonPanel, type ResolvedJsonPanelApi } from './ResolvedJsonPanel';
import { createHistoryDropdown, type HistoryDropdownApi } from './HistoryDropdown';
import { showToast } from './Toast';
import { encodeShare, decodeShare } from './sharing/share-url';
import { loadHistory, pushSnapshot } from './sharing/history';
import { listLessons, getLesson, firstLessonId } from './tutorial/lessons';
import { runCheck, loadProgress, saveProgress, markCompleted, markSkipped, bumpHint } from './tutorial/engine';
import { createTutorialPanel, type TutorialPanelApi } from './TutorialPanel';
import type { Lesson } from './tutorial/types';
import type { PlaygroundMode, TabId } from './types';

const SCOPE_SHORTCUT = 'Ctrl+space';
const HISTORY_DEBOUNCE_MS = 5000;
const ANALYSIS_DEBOUNCE_MS = 300;

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

interface DomRefs {
  root: HTMLElement;
  editorHost: HTMLElement;
  status: HTMLElement | null;
  scopeHint: HTMLElement | null;
  errorsPanel: HTMLElement | null;
  warningsPanel: HTMLElement | null;
  jsonPanel: HTMLElement | null;
  tutorialPanel: HTMLElement | null;
  historyHost: HTMLElement | null;
  errorsCount: HTMLElement | null;
  warningsCount: HTMLElement | null;
}

/**
 * Top-level playground orchestrator. Owns the editor, every controller
 * panel, and all shared state (current lesson, debounce timers).
 *
 * Design rules to keep extensibility:
 *  - Methods are grouped by concern: setupEditor, setupAnalysis, setupTutorial,
 *    setupHistory, setupToolbar. Adding a new feature should land in (or near)
 *    its own setupX method, not be sprinkled across boot().
 *  - All DOM lookup happens once in resolveDom(); methods receive the cached
 *    refs.
 *  - Cross-method state lives as private fields on the class, not as closures.
 */
export class PlaygroundApp {
  private readonly dom: DomRefs;
  private editor!: EditorApi;
  private panels!: PanelsApi;
  private validation: { errors: ValidationPanelApi | null; warnings: ValidationPanelApi | null } = { errors: null, warnings: null };
  private resolvedPanel: ResolvedJsonPanelApi | null = null;
  private historyDropdown: HistoryDropdownApi | null = null;
  private tutorialPanelApi: TutorialPanelApi | null = null;

  private currentLesson: Lesson | null = null;
  private tutorialMode = false;
  private analysisTimer: ReturnType<typeof setTimeout> | undefined;
  private historyTimer: ReturnType<typeof setTimeout> | undefined;

  constructor(root: HTMLElement) {
    this.dom = resolveDom(root);
  }

  start(): void {
    this.setupPanels();
    this.setupEditor();
    this.setupAnalysis();
    this.setupTutorial();
    this.setupHistory();
    this.setupToolbar();
    this.applyInitialUrlMode();

    (window as unknown as { __pg?: unknown }).__pg = { editor: this.editor, panels: this.panels };
  }

  // ---------- Panels (right-pane tabs) ----------

  private setupPanels(): void {
    this.validation.errors = this.dom.errorsPanel ? createValidationPanel(this.dom.errorsPanel) : null;
    this.validation.warnings = this.dom.warningsPanel ? createValidationPanel(this.dom.warningsPanel) : null;
    this.resolvedPanel = this.dom.jsonPanel ? createResolvedJsonPanel(this.dom.jsonPanel) : null;
    this.historyDropdown = this.dom.historyHost ? createHistoryDropdown(this.dom.historyHost) : null;
    this.tutorialPanelApi = this.dom.tutorialPanel ? createTutorialPanel(this.dom.tutorialPanel) : null;

    this.panels = createPanels(this.dom.root);
    this.panels.bindClicks();
    this.panels.hideTab('tutorial');
  }

  // ---------- Editor + extensions ----------

  private setupEditor(): void {
    const SNIPPETS = snippetCompletions();
    const catalogSource = createCatalogSource({ fallbackSnippets: SNIPPETS });

    this.editor = createEditor({
      parent: this.dom.editorHost,
      initialContent: this.pickInitialContent(),
      extensions: [
        ...hoconLanguage(),
        hoconLinter(),
        hoverDocs(),
        autocompletion({ override: [catalogSource] }),
        EditorView.updateListener.of((u) => {
          if (u.selectionSet || u.docChanged) this.updateScopeHint(u.state);
        }),
        keymap.of([
          {
            key: 'Mod-Shift-f',
            run: (view) => {
              const before = view.state.doc.toString();
              const after = formatHocon(before);
              if (after === before) return true;
              view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: after } });
              return true;
            },
          },
        ]),
      ],
      onChange: () => {
        this.scheduleAnalysis();
        this.scheduleHistorySnapshot();
        this.refreshTutorial();
      },
    });
  }

  private pickInitialContent(): string {
    const m = /^#config=(.+)$/.exec(window.location.hash);
    if (m) {
      const decoded = decodeShare(m[1]);
      if (decoded !== null) return decoded;
    }
    const history = loadHistory();
    if (history.length > 0) return history[0].content;
    return DEFAULT_CONTENT;
  }

  // ---------- Analysis pipeline (parse/resolve/validate -> panels) ----------

  private setupAnalysis(): void {
    this.scopeShortcutHint();
    this.scheduleAnalysis();
    this.updateScopeHint(this.editor.view.state);

    const jumpTo = (line: number, column: number) => this.jumpTo(line, column);
    this.validation.errors?.onJump(jumpTo);
    this.validation.warnings?.onJump(jumpTo);

    const scopeHint = this.dom.scopeHint;
    if (scopeHint) {
      scopeHint.addEventListener('click', () => {
        this.editor.view.focus();
        // Lazy-import to avoid pulling startCompletion through if no hint exists
        import('@codemirror/autocomplete').then((m) => m.startCompletion(this.editor.view));
      });
    }
  }

  private scheduleAnalysis(): void {
    if (this.analysisTimer) clearTimeout(this.analysisTimer);
    this.analysisTimer = setTimeout(() => this.runAnalysis(), ANALYSIS_DEBOUNCE_MS);
  }

  private runAnalysis(): void {
    const text = this.editor.getValue();
    const r = parse(tokenizeText(text));
    const res = resolve(r.ast);
    const unknown = validateUnknownKeys(r.ast);
    const all = [...r.diagnostics, ...res.warnings, ...unknown];
    const errors = all.filter((d) => d.severity === 'error');
    const warnings = all.filter((d) => d.severity === 'warning');

    this.validation.errors?.update(errors);
    this.validation.warnings?.update(warnings);
    this.resolvedPanel?.update(res.resolved);

    setTabCount(this.dom.errorsCount, errors.length, 'has-error');
    setTabCount(this.dom.warningsCount, warnings.length, 'has-warning');

    if (this.dom.status) {
      const s = this.dom.status;
      if (errors.length > 0) s.textContent = `${errors.length} error${errors.length === 1 ? '' : 's'}`;
      else if (warnings.length > 0) s.textContent = `${warnings.length} warning${warnings.length === 1 ? '' : 's'}`;
      else s.textContent = 'ok';
    }
  }

  private updateScopeHint(state: EditorState): void {
    if (!this.dom.scopeHint) return;
    const text = state.doc.toString();
    const pos = state.selection.main.head;
    const scope = detectScope(text, pos);
    const count = getKeysForScope(scope).length;
    this.dom.scopeHint.textContent = `${scope} · ${count} key${count === 1 ? '' : 's'} · ${SCOPE_SHORTCUT}`;
  }

  private scopeShortcutHint(): void {
    // Reserved for platform-specific override if Ctrl+Space ever conflicts.
  }

  private jumpTo(line: number, column: number): void {
    const doc = this.editor.view.state.doc;
    const lineNo = Math.max(1, Math.min(doc.lines, line));
    const docLine = doc.line(lineNo);
    const pos = docLine.from + Math.max(0, column - 1);
    this.editor.view.dispatch({
      selection: { anchor: pos },
      effects: EditorView.scrollIntoView(pos, { y: 'center' }),
    });
    this.editor.view.focus();
  }

  // ---------- Tutorial mode ----------

  private setupTutorial(): void {
    const t = this.tutorialPanelApi;
    if (!t) return;

    t.onHint(() => {
      if (!this.currentLesson) return;
      saveProgress(bumpHint(loadProgress(), this.currentLesson.id));
      this.loadLesson(this.currentLesson.id);
    });
    t.onReset(() => {
      if (!this.currentLesson) return;
      this.editor.setValue(this.currentLesson.starter);
    });
    t.onSkip(() => {
      if (!this.currentLesson) return;
      saveProgress(markSkipped(loadProgress(), this.currentLesson.id));
      this.advanceLessonAfter(this.currentLesson.id);
    });
    t.onNext(() => {
      if (!this.currentLesson) return;
      saveProgress(markCompleted(loadProgress(), this.currentLesson.id));
      this.advanceLessonAfter(this.currentLesson.id);
    });
  }

  private loadLesson(id: string): void {
    const t = this.tutorialPanelApi;
    if (!t) return;
    const lesson = getLesson(id);
    if (!lesson) {
      t.showCompleted("You've finished every lesson. Try the editor mode now.");
      this.currentLesson = null;
      return;
    }
    this.currentLesson = lesson;
    const progress = loadProgress();
    saveProgress({ ...progress, current: id });
    const hintsUsed = progress.hintsUsed[id] ?? 0;
    const passed = runCheck(lesson.starter, lesson.check);
    t.showLesson(lesson, { hintsUsed, passed });
    this.editor.setValue(lesson.starter);
    setUrlForLesson(id);
  }

  private advanceLessonAfter(currentId: string): void {
    const lessons = listLessons();
    const idx = lessons.findIndex((l) => l.id === currentId);
    const next = lessons[idx + 1];
    if (next) this.loadLesson(next.id);
    else this.tutorialPanelApi?.showCompleted("You've finished every lesson. Try the editor mode now.");
  }

  private refreshTutorial(): void {
    if (!this.tutorialMode || !this.currentLesson || !this.tutorialPanelApi) return;
    const passed = runCheck(this.editor.getValue(), this.currentLesson.check);
    this.tutorialPanelApi.setPassed(passed);
  }

  private enterTutorialMode(): void {
    this.tutorialMode = true;
    const url = new URL(window.location.href);
    const lessonId = url.searchParams.get('lesson') ?? loadProgress().current ?? firstLessonId();
    this.loadLesson(lessonId || firstLessonId());
    setUrlForMode('tutorial');
  }

  private leaveTutorialMode(): void {
    this.tutorialMode = false;
    this.currentLesson = null;
    setUrlForMode('editor');
  }

  // ---------- History + sharing ----------

  private setupHistory(): void {
    this.historyDropdown?.update(loadHistory());
    this.historyDropdown?.onSelect((content) => {
      this.editor.setValue(content);
      this.closeHistoryPopover();
    });
    this.bindHistoryToggle();
    this.bindShareButton();
  }

  private scheduleHistorySnapshot(): void {
    if (this.historyTimer) clearTimeout(this.historyTimer);
    this.historyTimer = setTimeout(() => {
      pushSnapshot(this.editor.getValue());
      this.historyDropdown?.update(loadHistory());
    }, HISTORY_DEBOUNCE_MS);
  }

  private bindHistoryToggle(): void {
    const btn = this.dom.root.querySelector<HTMLButtonElement>('[data-action="history-toggle"]');
    const pop = this.dom.root.querySelector<HTMLElement>('[data-pg-history]');
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

  private closeHistoryPopover(): void {
    const pop = this.dom.root.querySelector<HTMLElement>('[data-pg-history]');
    if (pop) pop.hidden = true;
  }

  private bindShareButton(): void {
    const btn = this.dom.root.querySelector<HTMLButtonElement>('[data-action="share"]');
    if (!btn) return;
    btn.addEventListener('click', async () => {
      const text = this.editor.getValue();
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
      this.historyDropdown?.update(loadHistory());
      void url;
    });
  }

  // ---------- Toolbar (mode/theme/divider/format/warning toggle) ----------

  private setupToolbar(): void {
    this.bindModeSwitch();
    this.bindThemeToggle();
    this.bindDivider();
    this.bindFormatButton();
    this.bindWarningToggle();
  }

  private bindModeSwitch(): void {
    const buttons = this.dom.root.querySelectorAll<HTMLButtonElement>('.pg-mode-btn');
    for (const btn of buttons) {
      btn.addEventListener('click', () => {
        const mode = btn.dataset.mode as PlaygroundMode;
        for (const b of buttons) {
          const isActive = b === btn;
          b.classList.toggle('is-active', isActive);
          b.setAttribute('aria-selected', String(isActive));
        }
        if (mode === 'tutorial') {
          this.panels.showTab('tutorial');
          this.panels.activate('tutorial');
          this.enterTutorialMode();
        } else {
          this.panels.hideTab('tutorial');
          this.panels.activate('errors' as TabId);
          this.leaveTutorialMode();
        }
      });
    }
  }

  private bindThemeToggle(): void {
    const btn = this.dom.root.querySelector<HTMLButtonElement>('[data-action="theme-toggle"]');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const html = document.documentElement;
      const next = html.dataset.theme === 'light' ? 'dark' : 'light';
      html.dataset.theme = next;
      try { localStorage.setItem('pg-theme', next); } catch { /* ignore */ }
    });
    try {
      const saved = localStorage.getItem('pg-theme');
      if (saved === 'light' || saved === 'dark') document.documentElement.dataset.theme = saved;
    } catch { /* ignore */ }
  }

  private bindDivider(): void {
    const main = this.dom.root.querySelector<HTMLElement>('.pg-main');
    const divider = this.dom.root.querySelector<HTMLElement>('[data-pg-divider]');
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

  private bindFormatButton(): void {
    const btn = this.dom.root.querySelector<HTMLButtonElement>('[data-action="format"]');
    if (!btn) return;
    btn.disabled = false;
    btn.title = 'Format (Cmd+Shift+F)';
    btn.addEventListener('click', () => {
      const before = this.editor.getValue();
      const after = formatHocon(before);
      if (after !== before) this.editor.setValue(after);
      this.editor.view.focus();
    });
  }

  private bindWarningToggle(): void {
    const btn = this.dom.root.querySelector<HTMLButtonElement>('[data-action="toggle-warning-squiggles"]');
    if (!btn) return;
    try {
      const stored = localStorage.getItem('pg-warning-squiggles');
      if (stored === '0') setWarningSquigglesEnabled(this.editor.view, false);
    } catch { /* ignore */ }

    const sync = (): void => {
      const on = isWarningSquigglesEnabled(this.editor.view.state);
      btn.dataset.state = on ? 'on' : 'off';
      btn.textContent = on ? 'warnings: on' : 'warnings: off';
      btn.title = on
        ? 'Hide warning squiggles in the editor (Warnings tab stays)'
        : 'Show warning squiggles in the editor';
    };
    sync();

    btn.addEventListener('click', () => {
      const next = !isWarningSquigglesEnabled(this.editor.view.state);
      setWarningSquigglesEnabled(this.editor.view, next);
      try { localStorage.setItem('pg-warning-squiggles', next ? '1' : '0'); } catch { /* ignore */ }
      sync();
    });
  }

  // ---------- Initial URL handling ----------

  private applyInitialUrlMode(): void {
    const urlMode = new URL(window.location.href).searchParams.get('mode');
    if (urlMode === 'tutorial') {
      const tutBtn = this.dom.root.querySelector<HTMLButtonElement>('.pg-mode-btn[data-mode="tutorial"]');
      tutBtn?.click();
    }
  }
}

function resolveDom(root: HTMLElement): DomRefs {
  const editorHost = root.querySelector<HTMLElement>('[data-pg-editor]');
  if (!editorHost) throw new Error('[playground] editor host not found');
  return {
    root,
    editorHost,
    status: root.querySelector<HTMLElement>('[data-pg-status]'),
    scopeHint: root.querySelector<HTMLElement>('[data-pg-scope-hint]'),
    errorsPanel: root.querySelector<HTMLElement>('[data-panel="errors"]'),
    warningsPanel: root.querySelector<HTMLElement>('[data-panel="warnings"]'),
    jsonPanel: root.querySelector<HTMLElement>('[data-panel="json"]'),
    tutorialPanel: root.querySelector<HTMLElement>('[data-panel="tutorial"]'),
    historyHost: root.querySelector<HTMLElement>('[data-pg-history]'),
    errorsCount: root.querySelector<HTMLElement>('[data-tab-count="errors"]'),
    warningsCount: root.querySelector<HTMLElement>('[data-tab-count="warnings"]'),
  };
}

function setTabCount(el: HTMLElement | null, count: number, klass: 'has-error' | 'has-warning'): void {
  if (!el) return;
  el.textContent = count > 0 ? String(count) : '';
  el.classList.toggle(klass, count > 0);
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
