import { EditorState, Prec, type Extension } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { bracketMatching, indentOnInput, foldGutter, foldKeymap } from '@codemirror/language';
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search';
import { closeBrackets, closeBracketsKeymap, completionStatus, startCompletion } from '@codemirror/autocomplete';
import { colorSwatches } from './cm/color-widget';

const PAIRS: Record<string, string> = { '{': '}', '[': ']', '(': ')' };

function scheduleCompletion(view: EditorView): void {
  // Defer past the current dispatch so the autocomplete plugin sees the
  // updated doc state.
  setTimeout(() => startCompletion(view), 0);
}

function stripStringsAndComments(line: string): string {
  let out = '';
  let inString = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inString) {
      if (c === '\\') { i++; continue; }
      if (c === '"') inString = false;
      continue;
    }
    if (c === '"') { inString = true; continue; }
    if (c === '#') break;
    if (c === '/' && line[i + 1] === '/') break;
    out += c;
  }
  return out;
}

/**
 * Custom Enter handler. Replaces the default insertNewlineAndIndent for HOCON
 * to give predictable behavior on every line:
 *
 * - if an autocomplete popup is open, defer (popup accepts the completion)
 * - if cursor sits between empty bracket pair `{│}`, expand into
 *     {
 *       │
 *     }
 *   with cursor indented one level deeper than the opener
 * - if line text before cursor (ignoring strings/comments) ends with `{` or `[`,
 *   insert newline + (current line indent + 2 spaces)
 * - otherwise, insert newline + (current line indent)
 *
 * This avoids relying on the indent service, which was getting overridden by
 * autocomplete keymap on the first Enter and producing inconsistent indents
 * on lines deep inside a block.
 */
const smartEnter = keymap.of([
  {
    key: 'Enter',
    run: (view) => {
      const { state } = view;
      if (completionStatus(state) === 'active') return false;
      const sel = state.selection.main;
      if (sel.from !== sel.to) return false;

      const line = state.doc.lineAt(sel.from);
      const baseIndent = /^[ \t]*/.exec(line.text)![0];
      const before = state.doc.sliceString(Math.max(0, sel.from - 1), sel.from);
      const after = state.doc.sliceString(sel.from, Math.min(state.doc.length, sel.from + 1));
      const closing = PAIRS[before];

      if (closing && after === closing) {
        const inner = baseIndent + '  ';
        view.dispatch({
          changes: { from: sel.from, to: sel.from, insert: '\n' + inner + '\n' + baseIndent },
          selection: { anchor: sel.from + 1 + inner.length },
          userEvent: 'input',
        });
        // Brand-new empty body of a block - perfect spot for "what keys can I put here?"
        scheduleCompletion(view);
        return true;
      }

      const lineUpToCursor = state.doc.sliceString(line.from, sel.from);
      const trimmedBefore = stripStringsAndComments(lineUpToCursor).trimEnd();
      const opensBlock = /[{[]$/.test(trimmedBefore);
      const newIndent = opensBlock ? baseIndent + '  ' : baseIndent;

      view.dispatch({
        changes: { from: sel.from, to: sel.from, insert: '\n' + newIndent },
        selection: { anchor: sel.from + 1 + newIndent.length },
        userEvent: 'input',
      });
      if (opensBlock) scheduleCompletion(view);
      return true;
    },
  },
]);

export interface EditorApi {
  view: EditorView;
  getValue(): string;
  setValue(text: string): void;
  destroy(): void;
}

export interface CreateEditorOptions {
  parent: HTMLElement;
  initialContent?: string;
  onChange?: (text: string) => void;
  extensions?: Extension[];
}

export function createEditor(opts: CreateEditorOptions): EditorApi {
  const baseExtensions: Extension[] = [
    lineNumbers(),
    foldGutter(),
    highlightActiveLine(),
    highlightActiveLineGutter(),
    highlightSelectionMatches(),
    history(),
    bracketMatching(),
    indentOnInput(),
    closeBrackets(),
    colorSwatches(),
    Prec.highest(smartEnter),
    keymap.of([...closeBracketsKeymap, ...defaultKeymap, ...historyKeymap, ...searchKeymap, ...foldKeymap, indentWithTab]),
    EditorView.lineWrapping,
    EditorView.updateListener.of((u) => {
      if (u.docChanged && opts.onChange) {
        opts.onChange(u.state.doc.toString());
      }
    }),
  ];

  const state = EditorState.create({
    doc: opts.initialContent ?? '',
    extensions: [...baseExtensions, ...(opts.extensions ?? [])],
  });

  const view = new EditorView({ state, parent: opts.parent });

  return {
    view,
    getValue: () => view.state.doc.toString(),
    setValue: (text) => {
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: text },
      });
    },
    destroy: () => view.destroy(),
  };
}
