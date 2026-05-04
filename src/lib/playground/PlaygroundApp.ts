import { autocompletion, startCompletion } from '@codemirror/autocomplete';
import { EditorView, keymap } from '@codemirror/view';
import type { EditorState } from '@codemirror/state';
import { detectScope } from './cm/scope';
import { getKeysForScope } from './catalog';
import { createEditor, type EditorApi } from './Editor';
import { createPanels, type PanelsApi } from './Panels';
import { hoconLanguage } from './cm/hocon-language';
import { hoconLinter } from './cm/hocon-lint';
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
import { decodeShare } from './sharing/share-url';
import { loadHistory } from './sharing/history';
import { createTutorialPanel, type TutorialPanelApi } from './TutorialPanel';
import { TutorialController } from './controllers/TutorialController';
import { HistoryController } from './controllers/HistoryController';
import { ToolbarController } from './controllers/ToolbarController';
import type { PlaygroundMode, TabId } from './types';
import { initLang, t, pluralForm, getLang, setLang, availableLangs } from './i18n';
import { hydrateI18n } from './i18n/dom';

const SCOPE_SHORTCUT = 'Ctrl+space';
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
 * Top-level playground orchestrator. Owns:
 *  - DOM resolution (cached refs)
 *  - the editor and the tabbed right-pane (panels)
 *  - the debounced analysis pipeline (parse / resolve / validate -> panels)
 *  - mode switching (because it cross-cuts toolbar + tutorial controller)
 *
 * Per-feature wiring lives in dedicated controllers under `./controllers/`:
 *  - TutorialController - lesson state machine + tutorial panel handlers
 *  - HistoryController  - share button, history dropdown, snapshot scheduler
 *  - ToolbarController  - theme, divider, format, warning-squiggle toggle
 *
 * Adding a new toolbar item / panel / mode should land in the right
 * controller (or warrant a new one), not bloat this class.
 */
export class PlaygroundApp {
  private readonly dom: DomRefs;
  private editor!: EditorApi;
  private panels!: PanelsApi;

  private validation: { errors: ValidationPanelApi | null; warnings: ValidationPanelApi | null } = { errors: null, warnings: null };
  private resolvedPanel: ResolvedJsonPanelApi | null = null;
  private historyDropdown: HistoryDropdownApi | null = null;
  private tutorialPanelApi: TutorialPanelApi | null = null;

  private tutorial: TutorialController | null = null;
  private history: HistoryController | null = null;

  private analysisTimer: ReturnType<typeof setTimeout> | undefined;

  /**
   * In-flight document for editor mode. Captured when switching to tutorial
   * mode so toggling back doesn't silently overwrite the user's edits with
   * the lesson's content. Initialized to the first content shown in the
   * editor (default template, share hash, or last history snapshot) so the
   * first switch tutorial -> editor restores the right thing.
   */
  private editorDraft: string | null = null;
  private currentMode: PlaygroundMode = 'editor';

  constructor(root: HTMLElement) {
    this.dom = resolveDom(root);
  }

  /**
   * Order is load-bearing:
   *  - setupPanels constructs right-pane API objects that setupAnalysis wires
   *    its callbacks into.
   *  - setupEditor must run before any controller that touches `this.editor`.
   *  - bindModeSwitch must attach before applyInitialUrlMode triggers
   *    switchMode().
   */
  start(): void {
    initLang();
    document.documentElement.lang = getLang();
    hydrateI18n(this.dom.root);
    this.setupPanels();
    this.setupEditor();
    this.setupAnalysis();
    this.setupControllers();
    this.bindModeSwitch();
    this.bindLangSelector();
    this.applyInitialUrlMode();

    (window as unknown as { __pg?: unknown }).__pg = { editor: this.editor, panels: this.panels };
  }

  // ---------- DOM-derived UI factories ----------

  private setupPanels(): void {
    this.validation.errors = this.dom.errorsPanel ? createValidationPanel(this.dom.errorsPanel, 'empty.errors') : null;
    this.validation.warnings = this.dom.warningsPanel ? createValidationPanel(this.dom.warningsPanel, 'empty.warnings') : null;
    this.resolvedPanel = this.dom.jsonPanel ? createResolvedJsonPanel(this.dom.jsonPanel) : null;
    this.historyDropdown = this.dom.historyHost ? createHistoryDropdown(this.dom.historyHost) : null;
    this.tutorialPanelApi = this.dom.tutorialPanel ? createTutorialPanel(this.dom.tutorialPanel) : null;

    this.panels = createPanels(this.dom.root);
    this.panels.bindClicks();
    this.panels.hideTab('tutorial');
  }

  private setupEditor(): void {
    const SNIPPETS = snippetCompletions();
    const catalogSource = createCatalogSource({ fallbackSnippets: SNIPPETS });
    const initialContent = this.pickInitialContent();
    // Seed the editor-mode draft so a tutorial->editor switch (without prior
    // editor edits) restores what the user originally saw, not "" or
    // DEFAULT_CONTENT.
    this.editorDraft = initialContent;

    this.editor = createEditor({
      parent: this.dom.editorHost,
      initialContent,
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
        this.history?.scheduleSnapshot();
        this.tutorial?.refresh();
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

  // ---------- Analysis (parse/resolve/validate -> panels) ----------

  private setupAnalysis(): void {
    this.scheduleAnalysis();
    this.updateScopeHint(this.editor.view.state);

    const jumpTo = (line: number, column: number) => this.jumpTo(line, column);
    this.validation.errors?.onJump(jumpTo);
    this.validation.warnings?.onJump(jumpTo);

    if (this.dom.scopeHint) {
      this.dom.scopeHint.addEventListener('click', () => {
        this.editor.view.focus();
        startCompletion(this.editor.view);
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
      if (errors.length > 0) s.textContent = formatCount('errors', errors.length);
      else if (warnings.length > 0) s.textContent = formatCount('warnings', warnings.length);
      else s.textContent = t('status.ok');
    }
  }

  private updateScopeHint(state: EditorState): void {
    if (!this.dom.scopeHint) return;
    const text = state.doc.toString();
    const pos = state.selection.main.head;
    const scope = detectScope(text, pos);
    const count = getKeysForScope(scope).length;
    // Locale plural suffixes for "key": en two-form, ru three-form.
    const plural = getLang() === 'ru'
      ? pluralForm(count, ['', 'а', 'ей'])
      : pluralForm(count, ['', 's']);
    this.dom.scopeHint.textContent = t('scope.hint.body', {
      scope,
      count,
      plural,
      shortcut: SCOPE_SHORTCUT,
    });
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

  // ---------- Controllers ----------

  private setupControllers(): void {
    if (this.tutorialPanelApi) {
      this.tutorial = new TutorialController(
        this.editor,
        this.tutorialPanelApi,
        (id) => setUrlForLesson(id),
      );
    }
    this.history = new HistoryController(this.dom.root, this.editor, this.historyDropdown);
    new ToolbarController(this.dom.root, this.editor, {
      onResetEditor: () => this.resetEditorToDefault(),
    });
    // Initial mode is editor; sync visibility of mode-only chrome up front.
    this.applyModeVisibility('editor');
  }

  /**
   * Replace the editor content with the canonical default template, drop
   * the editor draft, and clear any share hash so the URL no longer points
   * at someone else's snippet. Confirmation lives in the toolbar callback.
   */
  private resetEditorToDefault(): void {
    this.editorDraft = DEFAULT_CONTENT;
    this.editor.setValue(DEFAULT_CONTENT);
    if (window.location.hash) history.replaceState(null, '', window.location.pathname + window.location.search);
    this.editor.view.focus();
  }

  /**
   * Toggle visibility of any element marked `data-mode-only="<mode>"` based
   * on the current mode. Lets us hide the editor-only Reset button (and any
   * future mode-scoped chrome) without coupling each controller to mode
   * state.
   */
  private applyModeVisibility(mode: PlaygroundMode): void {
    for (const el of this.dom.root.querySelectorAll<HTMLElement>('[data-mode-only]')) {
      el.classList.toggle('is-hidden', el.dataset.modeOnly !== mode);
    }
  }

  // ---------- Mode switching ----------

  private bindModeSwitch(): void {
    const buttons = this.dom.root.querySelectorAll<HTMLButtonElement>('.pg-mode-btn');
    for (const btn of buttons) {
      btn.addEventListener('click', () => this.switchMode(btn.dataset.mode as PlaygroundMode));
    }
  }

  /**
   * Single source of truth for mode switching - both user clicks and
   * URL-driven init come through here, so toolbar-button semantics never
   * diverge from programmatic init.
   *
   * Each mode owns its own document buffer:
   *  - Switching FROM editor: snapshot editor.getValue() into editorDraft.
   *  - Switching TO editor:   restore editorDraft into the editor.
   *  - Tutorial side is symmetric and lives in TutorialController.
   *
   * No-op when the requested mode equals the current one (avoids losing a
   * draft to a redundant click on the active tab button).
   */
  private switchMode(mode: PlaygroundMode): void {
    if (mode === this.currentMode) return;
    const buttons = this.dom.root.querySelectorAll<HTMLButtonElement>('.pg-mode-btn');
    for (const b of buttons) {
      const isActive = b.dataset.mode === mode;
      b.classList.toggle('is-active', isActive);
      b.setAttribute('aria-selected', String(isActive));
    }
    if (mode === 'tutorial') {
      // Snapshot editor content before tutorial overwrites the doc.
      this.editorDraft = this.editor.getValue();
      this.panels.showTab('tutorial');
      this.panels.activate('tutorial');
      const lessonId = new URL(window.location.href).searchParams.get('lesson');
      this.tutorial?.enter(lessonId);
      setUrlForMode('tutorial');
    } else {
      // Let TutorialController snapshot its lesson draft, then restore the
      // editor draft (or DEFAULT_CONTENT if there's somehow nothing saved).
      this.tutorial?.leave();
      this.editor.setValue(this.editorDraft ?? DEFAULT_CONTENT);
      this.panels.hideTab('tutorial');
      this.panels.activate('errors' as TabId);
      setUrlForMode('editor');
    }
    this.currentMode = mode;
    this.applyModeVisibility(mode);
  }

  private applyInitialUrlMode(): void {
    const urlMode = new URL(window.location.href).searchParams.get('mode');
    if (urlMode === 'tutorial') this.switchMode('tutorial');
  }

  // ---------- Language selector ----------

  /**
   * Populate the `<select data-pg-lang>` with available locales (auto-loaded
   * via `import.meta.glob` in i18n/index.ts) and reload the page on change.
   * Reload over reactive re-render because every panel caches translated
   * strings on construction; a hard reload is one line and never drifts.
   */
  private bindLangSelector(): void {
    const select = this.dom.root.querySelector<HTMLSelectElement>('[data-pg-lang]');
    if (!select) return;
    select.innerHTML = '';
    for (const code of availableLangs()) {
      const opt = document.createElement('option');
      opt.value = code;
      opt.textContent = LANG_LABELS[code] ?? code.toUpperCase();
      if (code === getLang()) opt.selected = true;
      select.appendChild(opt);
    }
    select.addEventListener('change', () => {
      setLang(select.value);
      window.location.reload();
    });
  }
}

const LANG_LABELS: Record<string, string> = {
  en: 'English',
  ru: 'Русский',
};

function formatCount(kind: 'errors' | 'warnings', n: number): string {
  // English plural collapses to "" / "s". Russian needs three forms.
  // Falls through to English-style "s" suffix for any other locale until
  // a community contributor wires plural rules for it.
  let plural: string;
  if (getLang() === 'ru') {
    plural = kind === 'errors'
      ? pluralForm(n, ['а', 'и', 'ок'])  // 1 ошибка / 2 ошибки / 5 ошибок
      : pluralForm(n, ['е', 'я', 'й']);  // 1 предупреждение / 2 предупреждения / 5 предупреждений
  } else {
    plural = pluralForm(n, ['', 's']);
  }
  return t(kind === 'errors' ? 'status.errors' : 'status.warnings', { count: n, plural });
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
