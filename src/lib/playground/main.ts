import { autocompletion, type CompletionContext, type CompletionResult } from '@codemirror/autocomplete';
import { EditorView } from '@codemirror/view';
import { createEditor } from './Editor';
import { createPanels } from './Panels';
import { createDivider } from './Divider';
import { hoconLanguage } from './cm/hocon-language';
import { hoconLinter } from './cm/hocon-lint';
import { snippetCompletions } from './cm/snippets';
import { tokenizeText } from './hocon/tokenize';
import { parse } from './hocon/parser';
import { resolve } from './hocon/resolve';
import { createValidationPanel } from './ValidationPanel';
import { createResolvedJsonPanel } from './ResolvedJsonPanel';
import type { PlaygroundMode, TabId } from './types';

const SNIPPETS = snippetCompletions();

function hoconCompletions(context: CompletionContext): CompletionResult | null {
  const word = context.matchBefore(/\w*/);
  if (!word || (word.from === word.to && !context.explicit)) return null;
  return {
    from: word.from,
    options: SNIPPETS,
    validFor: /^\w*$/,
  };
}

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
  const errorsEl = root.querySelector<HTMLElement>('[data-panel="errors"]');
  const jsonEl = root.querySelector<HTMLElement>('[data-panel="json"]');

  const validation = errorsEl ? createValidationPanel(errorsEl) : null;
  const resolved = jsonEl ? createResolvedJsonPanel(jsonEl) : null;

  let timer: ReturnType<typeof setTimeout> | undefined;
  let editorRef: ReturnType<typeof createEditor> | null = null;

  function refreshAnalysis(): void {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      if (!editorRef) return;
      const text = editorRef.getValue();
      const r = parse(tokenizeText(text));
      const res = resolve(r.ast);
      const all = [...r.diagnostics, ...res.warnings];
      validation?.update(all);
      resolved?.update(res.resolved);
      if (status) {
        const errCount = all.filter((d) => d.severity === 'error').length;
        const warnCount = all.length - errCount;
        if (errCount > 0) status.textContent = `${errCount} error${errCount === 1 ? '' : 's'}`;
        else if (warnCount > 0) status.textContent = `${warnCount} warning${warnCount === 1 ? '' : 's'}`;
        else status.textContent = 'ok';
      }
    }, 300);
  }

  const editor = createEditor({
    parent: editorHost,
    initialContent: DEFAULT_CONTENT,
    extensions: [
      ...hoconLanguage(),
      hoconLinter(),
      autocompletion({ override: [hoconCompletions] }),
    ],
    onChange: () => { refreshAnalysis(); },
  });
  editorRef = editor;

  validation?.onJump((line, column) => {
    const doc = editor.view.state.doc;
    const lineNo = Math.max(1, Math.min(doc.lines, line));
    const docLine = doc.line(lineNo);
    const pos = docLine.from + Math.max(0, column - 1);
    editor.view.dispatch({
      selection: { anchor: pos },
      effects: EditorView.scrollIntoView(pos, { y: 'center' }),
    });
    editor.view.focus();
  });

  refreshAnalysis();

  const panels = createPanels(root);
  panels.bindClicks();
  panels.hideTab('tutorial');

  bindModeSwitch(root, panels);
  bindThemeToggle(root);
  bindDivider(root);

  (window as unknown as { __pg?: unknown }).__pg = { editor, panels };
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

function bindModeSwitch(root: HTMLElement, panels: ReturnType<typeof createPanels>): void {
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
      } else {
        panels.hideTab('tutorial');
        panels.activate('errors' as TabId);
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
