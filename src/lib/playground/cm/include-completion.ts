import type { CompletionContext, CompletionResult, CompletionSource } from '@codemirror/autocomplete';

/**
 * Snapshot of the workspace as the editor sees it. The factory takes a
 * thunk so the CM extension stays alive across tab swaps - we always read
 * the current set of tab names at completion time.
 */
export interface WorkspaceSnapshot {
  /** All tab names, including the currently active one. */
  tabs: string[];
  /** Name of the active (current) tab. Excluded from completions. */
  current: string;
}

const INCLUDE_RE = /include\s+(?:classpath\(|required\(|file\()*"[^"]*$/;

export function createIncludeCompletion(getSnapshot: () => WorkspaceSnapshot): CompletionSource {
  return (ctx: CompletionContext): CompletionResult | null => {
    const m = ctx.matchBefore(INCLUDE_RE);
    if (!m) return null;
    const snap = getSnapshot();
    const candidates = snap.tabs.filter((n) => n !== snap.current);
    // The trigger range is the partial inside the quotes - find the last `"`.
    const lastQuote = m.text.lastIndexOf('"');
    const from = m.from + lastQuote + 1;
    return {
      from,
      to: ctx.pos,
      options: candidates.map((name) => ({ label: name, type: 'text' })),
      validFor: /^[^"]*$/,
    };
  };
}
