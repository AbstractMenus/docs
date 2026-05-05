import { describe, expect, test } from 'vitest';
import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { forEachDiagnostic, type Diagnostic as CMDiagnostic } from '@codemirror/lint';
import { hoconLinter, type WorkspaceLookup } from './hocon-lint';
import { parse } from '../hocon/parser';
import { tokenizeText } from '../hocon/tokenize';
import type { Node } from '../hocon/types';

/**
 * The linter is async (debounced). We wait one tick + a microtask flush so
 * the dispatched diagnostics land before we read them. 50ms covers the 300ms
 * debounce when we call forceLinting first.
 */
async function runLint(text: string, workspace?: WorkspaceLookup): Promise<CMDiagnostic[]> {
  const parent = document.createElement('div');
  document.body.appendChild(parent);
  const view = new EditorView({
    state: EditorState.create({
      doc: text,
      extensions: [hoconLinter(workspace)],
    }),
    parent,
  });
  const { forceLinting } = await import('@codemirror/lint');
  forceLinting(view);
  // Linter is async even after forceLinting; let microtasks settle.
  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));
  const out: CMDiagnostic[] = [];
  forEachDiagnostic(view.state, (d) => { out.push(d); });
  view.destroy();
  parent.remove();
  return out;
}

function parseAst(text: string): Node {
  return parse(tokenizeText(text), text).ast;
}

describe('hoconLinter', () => {
  test('without workspace lookup: drops include warnings (workspace-level concern)', async () => {
    // Simulates the lesson 21 flow: user typed the 3 include forms from the
    // lesson intro into menu.conf. Pre-fix the linter ran resolve() with no
    // lookup and emitted 3 `parser.include-not-resolved` warnings. Post-fix
    // those codes are filtered out so the editor doesn't lie about workspace
    // state when it has no workspace context wired in.
    const text = [
      'include "defaults.conf"',
      'include classpath("defaults.conf")',
      'include required("defaults.conf")',
      'title = "Shop"',
    ].join('\n');
    const diags = await runLint(text);
    const messages = diags.map((d) => d.message);
    expect(messages.some((m) => /include not resolved/i.test(m))).toBe(false);
  });

  test('with workspace lookup: include resolves against sibling tab AST', async () => {
    // Mirrors the wired-up case in PlaygroundApp - the linter uses the same
    // parsed-tab map the validation panel sees, so cross-file includes do
    // not raise editor squiggles.
    const menuText = 'include "defaults.conf"\ntitle = "Shop"\n';
    const defaultsText = 'defaults {\n  cooldown = 5s\n}\n';
    const lookup: WorkspaceLookup = () => ({
      asts: new Map<string, Node>([
        ['menu.conf', parseAst(menuText)],
        ['defaults.conf', parseAst(defaultsText)],
      ]),
      activeName: 'menu.conf',
    });
    const diags = await runLint(menuText, lookup);
    expect(diags.some((d) => /include not resolved/i.test(d.message))).toBe(false);
  });

  test('with workspace lookup: missing target still reports unresolved', async () => {
    // The fix doesn't suppress legitimate misses - if the named file isn't
    // in the workspace, the warning is correct and should still fire.
    const menuText = 'include "missing.conf"\n';
    const lookup: WorkspaceLookup = () => ({
      asts: new Map<string, Node>([['menu.conf', parseAst(menuText)]]),
      activeName: 'menu.conf',
    });
    const diags = await runLint(menuText, lookup);
    expect(diags.some((d) => /include not resolved/i.test(d.message))).toBe(true);
  });

  test('parse errors still reach the linter (single-file path)', async () => {
    // Sanity: filtering only targets include codes; ordinary parse errors
    // must remain visible even without a workspace lookup.
    const text = 'title = \nbad';
    const diags = await runLint(text);
    expect(diags.length).toBeGreaterThan(0);
  });
});
