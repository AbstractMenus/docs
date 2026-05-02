import type { EditorView } from '@codemirror/view';
import { linter, type Diagnostic as CMDiagnostic } from '@codemirror/lint';
import { tokenizeText } from '../hocon/tokenize';
import { parse } from '../hocon/parser';
import { resolve } from '../hocon/resolve';
import type { Diagnostic } from '../hocon/types';

export function hoconLinter() {
  return linter((view) => {
    const text = view.state.doc.toString();
    const r = parse(tokenizeText(text));
    const res = resolve(r.ast);
    const all = [...r.diagnostics, ...res.warnings];
    return all.map((d) => toCm(view, d, text.length));
  }, { delay: 300 });
}

function toCm(view: EditorView, d: Diagnostic, docLen: number): CMDiagnostic {
  const doc = view.state.doc;
  const lineNo = Math.max(1, Math.min(doc.lines, d.line));
  const docLine = doc.line(lineNo);
  const baseFrom = (d.offset !== undefined && d.offset >= 0)
    ? Math.min(d.offset, docLen)
    : docLine.from + Math.max(0, d.column - 1);
  const length = d.length ?? 1;
  const to = Math.min(docLen, baseFrom + length);
  return {
    from: Math.min(baseFrom, to),
    to,
    severity: d.severity,
    message: d.message,
  };
}
