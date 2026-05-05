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
import { createIncludeCompletion } from './cm/include-completion';
import { hoverDocs } from './cm/hover-docs';
import { formatHocon } from './cm/format';
import { tokenizeText } from './hocon/tokenize';
import { parse } from './hocon/parser';
import { resolveWorkspace } from './files/resolve-multi';
import { validateUnknownKeys } from './hocon/unknown-keys';
import type { Diagnostic, Node } from './hocon/types';
import { createValidationPanel, type ValidationPanelApi } from './ValidationPanel';
import { createResolvedJsonPanel, type ResolvedJsonPanelApi } from './ResolvedJsonPanel';
import { createHistoryDropdown, type HistoryDropdownApi } from './HistoryDropdown';
import { createTabBar, type TabBarApi, type TabBarItem, type RenameResult } from './TabBar';
import { decodeWorkspace } from './sharing/share-url';
import { createTutorialPanel, type TutorialPanelApi } from './TutorialPanel';
import { TutorialController } from './controllers/TutorialController';
import type { Workspace, TabFile } from './files/types';
import { makeDefaultWorkspace, newTabFile, loadWorkspace, saveWorkspace } from './files/workspace';
import { HistoryController } from './controllers/HistoryController';
import { ToolbarController } from './controllers/ToolbarController';
import { showToast } from './Toast';
import type { PlaygroundMode, TabId } from './types';
import { initLang, t, pluralForm, getLang, setLang, availableLangs } from './i18n';
import { hydrateI18n } from './i18n/dom';

const SCOPE_SHORTCUT = 'Ctrl+space';
const ANALYSIS_DEBOUNCE_MS = 300;
const SAVE_DEBOUNCE_MS = 200;

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
  tabbarHost: HTMLElement | null;
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
 *  - the multi-file workspace + tab bar
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
  private tabBar: TabBarApi | null = null;

  private tutorial: TutorialController | null = null;
  private history: HistoryController | null = null;

  private analysisTimer: ReturnType<typeof setTimeout> | undefined;
  private saveTimer: ReturnType<typeof setTimeout> | undefined;

  /**
   * Source of truth for the editor's multi-file state. Initialized from the
   * URL hash (#config=) / localStorage / DEFAULT_CONTENT in setupEditor.
   * Replaced wholesale via replaceWorkspace() when a tutorial lesson loads,
   * a history snapshot is restored, or the user clicks Reset.
   */
  private workspace: Workspace = makeDefaultWorkspace('');

  /**
   * Snapshot of the editor-mode workspace captured when the user switches
   * to tutorial mode. Restored on the way back so toggling between modes
   * doesn't clobber the user's edits.
   */
  private editorWorkspaceSnapshot: Workspace | null = null;

  /** Per-tab diagnostics (keyed by tab name). Drives the tab-bar status dots. */
  private diagnosticsByFile = new Map<string, Diagnostic[]>();

  private currentMode: PlaygroundMode = 'editor';

  constructor(root: HTMLElement) {
    this.dom = resolveDom(root);
  }

  /**
   * Order is load-bearing:
   *  - setupPanels constructs right-pane API objects that setupAnalysis wires
   *    its callbacks into.
   *  - setupEditor must run before any controller that touches `this.editor`.
   *  - setupTabBar runs after setupEditor so the workspace is populated.
   *  - bindModeSwitch must attach before applyInitialUrlMode triggers
   *    switchMode().
   */
  start(): void {
    initLang();
    document.documentElement.lang = getLang();
    hydrateI18n(this.dom.root);
    this.setupPanels();
    this.setupEditor();
    this.setupTabBar();
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
    // Bind the include-completion source to a thunk so it always sees the
    // current workspace (tab adds / renames / removes don't require us to
    // tear down the CM extension).
    const includeCompletion = createIncludeCompletion(() => ({
      tabs: this.workspace.tabs.map((t) => t.name),
      current: this.activeTab().name,
    }));

    this.workspace = this.pickInitialWorkspace();
    const active = this.activeTab();

    // Feed the in-editor linter a snapshot of the workspace so include
    // resolution matches what the validation panel sees. Without this, every
    // `include "other.conf"` line in the active tab lights up as
    // "include not resolved", contradicting the panel which resolves it
    // against the sibling tab.
    const lintWorkspace = () => {
      const asts = new Map<string, Node>();
      for (const tab of this.workspace.tabs) {
        asts.set(tab.name, parse(tokenizeText(tab.content), tab.content).ast);
      }
      return { asts, activeName: this.activeTab().name };
    };

    this.editor = createEditor({
      parent: this.dom.editorHost,
      initialContent: active.content,
      initialTabId: active.id,
      extensions: [
        ...hoconLanguage(),
        hoconLinter(lintWorkspace),
        hoverDocs(),
        autocompletion({ override: [includeCompletion, catalogSource] }),
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
      onChange: (text, tabId) => {
        const tab = this.workspace.tabs.find((t) => t.id === tabId);
        if (tab) tab.content = text;
        this.scheduleSave();
        this.scheduleAnalysis();
        this.history?.scheduleSnapshot();
        this.tutorial?.refresh();
      },
    });

    // Seed CM states for non-active tabs so switching to one doesn't throw.
    for (const tab of this.workspace.tabs) {
      if (tab.id !== active.id) this.editor.addTab(tab.id, tab.content);
    }
  }

  private pickInitialWorkspace(): Workspace {
    const m = /^#config=(.+)$/.exec(window.location.hash);
    if (m) {
      const decoded = decodeWorkspace(m[1]);
      if (decoded) return decoded;
    }
    return loadWorkspace(DEFAULT_CONTENT);
  }

  private activeTab(): TabFile {
    return this.workspace.tabs.find((t) => t.id === this.workspace.activeTabId) ?? this.workspace.tabs[0];
  }

  private scheduleSave(): void {
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => saveWorkspace(this.workspace), SAVE_DEBOUNCE_MS);
  }

  // ---------- Tab bar ----------

  private setupTabBar(): void {
    if (!this.dom.tabbarHost) return;
    this.tabBar = createTabBar({
      host: this.dom.tabbarHost,
      tabs: this.tabBarItems(),
      activeId: this.workspace.activeTabId,
      onSelect: (id) => this.switchTab(id),
      onCreate: () => this.createTab(),
      onClose: (id) => this.closeTab(id),
      onRename: (id, name) => this.renameTab(id, name),
    });
  }

  private tabBarItems(): TabBarItem[] {
    return this.workspace.tabs.map((t) => {
      const diags = this.diagnosticsByFile.get(t.name) ?? [];
      return {
        id: t.id,
        name: t.name,
        errors: diags.filter((d) => d.severity === 'error').length,
        warnings: diags.filter((d) => d.severity === 'warning').length,
      };
    });
  }

  private switchTab(id: string): void {
    if (id === this.workspace.activeTabId) return;
    if (!this.workspace.tabs.find((t) => t.id === id)) return;
    this.workspace.activeTabId = id;
    this.editor.setActiveTab(id);
    this.tabBar?.update(this.tabBarItems(), id);
    this.scheduleAnalysis();
    this.scheduleSave();
  }

  private createTab(): void {
    const used = new Set(this.workspace.tabs.map((t) => t.name));
    let n = 1;
    while (used.has(`NewMenu (${n}).conf`)) n++;
    const tab = newTabFile(`NewMenu (${n}).conf`, '');
    this.workspace.tabs.push(tab);
    this.editor.addTab(tab.id, '');
    this.switchTab(tab.id);
  }

  private closeTab(id: string): void {
    if (this.workspace.tabs.length <= 1) return;
    const idx = this.workspace.tabs.findIndex((t) => t.id === id);
    if (idx < 0) return;
    const wasActive = id === this.workspace.activeTabId;
    this.workspace.tabs.splice(idx, 1);
    let fallback = this.workspace.activeTabId;
    if (wasActive) {
      fallback = this.workspace.tabs[Math.max(0, idx - 1)].id;
      this.workspace.activeTabId = fallback;
    }
    this.editor.removeTab(id, fallback);
    this.tabBar?.update(this.tabBarItems(), this.workspace.activeTabId);
    this.scheduleAnalysis();
    this.scheduleSave();
  }

  private renameTab(id: string, newName: string): RenameResult {
    const trimmed = newName.trim();
    if (!trimmed) {
      showToast(t('tab.rename.error.empty'));
      return { ok: false, error: 'empty' };
    }
    if (this.workspace.tabs.some((tab) => tab.id !== id && tab.name === trimmed)) {
      showToast(t('tab.rename.error.duplicate'));
      return { ok: false, error: 'duplicate' };
    }
    const tab = this.workspace.tabs.find((t) => t.id === id);
    if (!tab) return { ok: false, error: 'empty' };
    tab.name = trimmed;
    this.tabBar?.update(this.tabBarItems(), this.workspace.activeTabId);
    this.scheduleAnalysis();
    this.scheduleSave();
    return { ok: true };
  }

  // ---------- Analysis (parse/resolve/validate -> panels) ----------

  private setupAnalysis(): void {
    this.scheduleAnalysis();
    this.updateScopeHint(this.editor.view.state);

    // Cross-tab jump: switch the active tab if the diagnostic came from a
    // different file, then jump to the location.
    const jumpTo = (file: string, line: number, column: number) => {
      if (file) {
        const tab = this.workspace.tabs.find((t) => t.name === file);
        if (tab && tab.id !== this.workspace.activeTabId) this.switchTab(tab.id);
      }
      this.jumpTo(line, column);
    };
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
    const parsedAsts = new Map<string, Node>();
    const allDiagnostics: Diagnostic[] = [];

    for (const tab of this.workspace.tabs) {
      const r = parse(tokenizeText(tab.content), tab.content);
      parsedAsts.set(tab.name, r.ast);
      const unknown = validateUnknownKeys(r.ast);
      for (const d of [...r.diagnostics, ...unknown]) {
        allDiagnostics.push({ ...d, file: d.file ?? tab.name });
      }
    }

    const active = this.activeTab();
    const res = resolveWorkspace(parsedAsts, active.name);
    for (const w of res.warnings) {
      allDiagnostics.push({ ...w, file: w.file ?? active.name });
    }

    this.diagnosticsByFile.clear();
    for (const d of allDiagnostics) {
      const key = d.file ?? '';
      const list = this.diagnosticsByFile.get(key) ?? [];
      list.push(d);
      this.diagnosticsByFile.set(key, list);
    }

    const errors = allDiagnostics.filter((d) => d.severity === 'error');
    const warnings = allDiagnostics.filter((d) => d.severity === 'warning');

    this.validation.errors?.update(errors);
    this.validation.warnings?.update(warnings);
    this.resolvedPanel?.update(res.resolved);

    setTabCount(this.dom.errorsCount, errors.length, 'has-error');
    setTabCount(this.dom.warningsCount, warnings.length, 'has-warning');
    this.tabBar?.update(this.tabBarItems(), this.workspace.activeTabId);

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
        {
          setWorkspace: (ws) => this.replaceWorkspace(ws),
          getWorkspace: () => this.workspace,
        },
        this.tutorialPanelApi,
        (id) => setUrlForLesson(id),
      );
    }
    this.history = new HistoryController(
      this.dom.root,
      this.editor,
      this.historyDropdown,
      {
        getWorkspace: () => this.workspace,
        setWorkspace: (ws) => this.replaceWorkspace(ws),
      },
    );
    new ToolbarController(this.dom.root, this.editor, {
      onResetEditor: () => this.resetEditorToDefault(),
    });
    // Initial mode is editor; sync visibility of mode-only chrome up front.
    this.applyModeVisibility('editor');
  }

  /**
   * Replace the entire workspace - editor CM states, active tab, and the
   * tab bar - in one shot. Used by tutorial lesson loads, history restore,
   * the Reset button, and the editor<->tutorial mode swap.
   *
   * Adds CM states for any new tab id, switches active before removing old
   * ids (so the editor never points at a removed state), then drops orphans.
   */
  private replaceWorkspace(ws: Workspace): void {
    const oldIds = this.workspace.tabs.map((t) => t.id);
    this.workspace = ws;

    // 1. Make sure every new tab id has a CM state, with up-to-date content.
    for (const tab of ws.tabs) {
      this.editor.addTab(tab.id, tab.content);
      this.editor.updateTabContent(tab.id, tab.content);
    }

    // 2. Switch active. addTab() above is a no-op if the id was already in
    //    the editor, so we know the target state exists.
    this.editor.setActiveTab(ws.activeTabId);

    // 3. Drop CM states for tabs that disappeared.
    for (const oid of oldIds) {
      if (!ws.tabs.find((t) => t.id === oid)) {
        this.editor.removeTab(oid, ws.activeTabId);
      }
    }

    this.tabBar?.update(this.tabBarItems(), ws.activeTabId);
    this.scheduleAnalysis();
    this.scheduleSave();
  }

  /**
   * Replace the editor content with the canonical default template, drop
   * the editor draft, and clear any share hash so the URL no longer points
   * at someone else's snippet. Confirmation lives in the toolbar callback.
   */
  private resetEditorToDefault(): void {
    const ws = makeDefaultWorkspace(DEFAULT_CONTENT);
    this.replaceWorkspace(ws);
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
   *  - Switching FROM editor: snapshot the workspace into editorWorkspaceSnapshot.
   *  - Switching TO editor:   restore that snapshot via replaceWorkspace.
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
      // Snapshot editor workspace before tutorial replaces it.
      this.editorWorkspaceSnapshot = cloneWorkspace(this.workspace);
      this.panels.showTab('tutorial');
      this.panels.activate('tutorial');
      const lessonId = new URL(window.location.href).searchParams.get('lesson');
      this.tutorial?.enter(lessonId);
      setUrlForMode('tutorial');
    } else {
      // Let TutorialController snapshot its lesson draft, then restore the
      // editor workspace (or default if there's somehow nothing saved).
      this.tutorial?.leave();
      const restore = this.editorWorkspaceSnapshot ?? makeDefaultWorkspace(DEFAULT_CONTENT);
      this.replaceWorkspace(restore);
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

/**
 * Deep-ish clone of a workspace. We need a fresh tab list so subsequent
 * mutations to `this.workspace.tabs[i].content` don't leak into the
 * snapshot. structuredClone would also work, but tabs hold only POD so a
 * targeted spread is faster and avoids the need for happy-dom support.
 */
function cloneWorkspace(ws: Workspace): Workspace {
  return { v: ws.v, activeTabId: ws.activeTabId, tabs: ws.tabs.map((t) => ({ ...t })) };
}

function resolveDom(root: HTMLElement): DomRefs {
  const editorHost = root.querySelector<HTMLElement>('[data-pg-editor]');
  if (!editorHost) throw new Error('[playground] editor host not found');
  return {
    root,
    editorHost,
    tabbarHost: root.querySelector<HTMLElement>('[data-pg-tabbar]'),
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
