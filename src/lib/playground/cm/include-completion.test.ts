import { describe, expect, test } from 'vitest';
import { EditorState } from '@codemirror/state';
import type { CompletionContext, CompletionResult } from '@codemirror/autocomplete';
import { createIncludeCompletion } from './include-completion';

function syncResult(r: CompletionResult | Promise<CompletionResult | null> | null): CompletionResult | null {
  if (r === null) return null;
  if (r instanceof Promise) throw new Error('expected sync result');
  return r;
}

function makeContext(text: string, pos: number, explicit = false): CompletionContext {
  const state = EditorState.create({ doc: text });
  return {
    state,
    pos,
    explicit,
    matchBefore: (re: RegExp) => {
      const line = state.doc.lineAt(pos);
      const before = state.doc.sliceString(line.from, pos);
      const m = re.exec(before);
      if (!m) return null;
      const from = pos - m[0].length + m.index;
      return { from, to: pos, text: m[0] };
    },
    aborted: false,
    addEventListener: () => {},
    removeEventListener: () => {},
    tokenBefore: () => null,
  } as unknown as CompletionContext;
}

describe('include completion', () => {
  test('inside include "..." emits other tab names', () => {
    const source = createIncludeCompletion(() => ({ tabs: ['menu.conf', 'defaults.conf', 'colors.conf'], current: 'menu.conf' }));
    const text = 'include "';
    const ctx = makeContext(text, text.length, true);
    const result = syncResult(source(ctx));
    expect(result).not.toBeNull();
    if (!result) return;
    const labels = result.options.map((o) => o.label);
    expect(labels).toEqual(['defaults.conf', 'colors.conf']);
  });

  test('inside include classpath("...") emits names', () => {
    const source = createIncludeCompletion(() => ({ tabs: ['a', 'b'], current: 'a' }));
    const text = 'include classpath("';
    const result = syncResult(source(makeContext(text, text.length, true)));
    expect(result?.options.map((o) => o.label)).toEqual(['b']);
  });

  test('outside include returns null', () => {
    const source = createIncludeCompletion(() => ({ tabs: ['a', 'b'], current: 'a' }));
    const text = 'name = "';
    expect(syncResult(source(makeContext(text, text.length, true)))).toBeNull();
  });

  test('only one tab -> empty list', () => {
    const source = createIncludeCompletion(() => ({ tabs: ['only.conf'], current: 'only.conf' }));
    const text = 'include "';
    const result = syncResult(source(makeContext(text, text.length, true)));
    expect(result?.options).toEqual([]);
  });
});
