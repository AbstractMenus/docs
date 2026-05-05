import type { EditorView } from '@codemirror/view';
import { Facet, type EditorState, StateEffect, StateField } from '@codemirror/state';
import { linter, forceLinting, type Diagnostic as CMDiagnostic } from '@codemirror/lint';
import { tokenizeText } from '../hocon/tokenize';
import { parse } from '../hocon/parser';
import { resolve } from '../hocon/resolve';
import { validateUnknownKeys } from '../hocon/unknown-keys';
import type { Diagnostic, Node } from '../hocon/types';

/**
 * Thunk the host wires in so the in-editor linter can resolve cross-file
 * includes the same way the workspace-level analysis does. Without it the
 * linter only sees the active doc, so any `include "x.conf"` line lights up
 * as "include not resolved" even when `x.conf` lives in another tab. The
 * thunk returns:
 *   - a Map of tab name -> parsed AST (so `lookupInclude(target)` can hit it)
 *   - the active tab's name (seeds includeStack for cycle detection)
 *
 * Returning `null` (no host wired) keeps the linter purely single-file:
 * include warnings are filtered out so they don't lie about workspace state.
 */
export type WorkspaceLookup = () => { asts: Map<string, Node>; activeName: string } | null;

/**
 * Per-editor toggle for the warning subset of diagnostics. Stored as a
 * StateField so a transaction can flip it; a Facet then exposes the current
 * value to the linter callback. Result: toggling re-runs the linter
 * reactively, no manual setDiagnostics dispatch from the toolbar code.
 */
export const setWarningSquigglesEffect = StateEffect.define<boolean>();

// Declared before the StateField that references it - StateField.provide is
// evaluated at module-init, which means the Facet must already exist or we
// hit a `Cannot access ... before initialization` TDZ error.
const warningSquigglesFacet = Facet.define<boolean, boolean>({
  // Only the StateField below feeds this facet today. If a future extension
  // also writes the facet, treat any opt-out as authoritative (any `false`
  // wins) so explicit "hide" preferences aren't silently overridden by
  // late-loaded extensions defaulting to `true`.
  combine: (values) => values.every((v) => v),
});

const warningSquigglesField = StateField.define<boolean>({
  create: () => true,
  update(value, tr) {
    for (const e of tr.effects) {
      if (e.is(setWarningSquigglesEffect)) return e.value;
    }
    return value;
  },
  provide: (f) => warningSquigglesFacet.from(f),
});

export function isWarningSquigglesEnabled(state: EditorState): boolean {
  return state.facet(warningSquigglesFacet);
}

export function setWarningSquigglesEnabled(view: EditorView, enabled: boolean): void {
  // Order matters: dispatch must commit the new facet value before
  // forceLinting reads it, otherwise the linter callback sees the old value.
  view.dispatch({ effects: setWarningSquigglesEffect.of(enabled) });
  forceLinting(view);
}

export function hoconLinter(workspace?: WorkspaceLookup) {
  return [
    warningSquigglesField,
    linter(
      (view) => {
        const text = view.state.doc.toString();
        const r = parse(tokenizeText(text), text);
        const ws = workspace?.() ?? null;
        const res = ws
          ? resolve(r.ast, {
              lookupInclude: (target) => ws.asts.get(target),
              includeStack: [ws.activeName],
            })
          : resolve(r.ast);
        // Without a workspace lookup the linter can't honestly say whether an
        // include resolves; drop those codes so we don't surface stale
        // warnings (the workspace-level analysis owns that judgement).
        const includeCodes = new Set(['parser.include-not-resolved', 'parser.include-cycle']);
        const resolveWarnings = ws
          ? res.warnings
          : res.warnings.filter((d) => !includeCodes.has(d.code));
        const unknown = validateUnknownKeys(r.ast);
        const all = [...r.diagnostics, ...resolveWarnings, ...unknown];
        const showWarnings = view.state.facet(warningSquigglesFacet);
        const filtered = showWarnings ? all : all.filter((d) => d.severity !== 'warning');
        return filtered.map((d) => toCm(view, d, text.length));
      },
      { delay: 300 },
    ),
  ];
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
