import { EditorState, type Extension } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { bracketMatching, indentOnInput, foldGutter, foldKeymap } from '@codemirror/language';
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search';

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
    keymap.of([...defaultKeymap, ...historyKeymap, ...searchKeymap, ...foldKeymap, indentWithTab]),
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
