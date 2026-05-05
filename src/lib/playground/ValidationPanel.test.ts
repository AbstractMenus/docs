import { describe, test, expect, beforeEach } from 'vitest';
import { createValidationPanel } from './ValidationPanel';

function dom(): HTMLElement {
  document.body.innerHTML = '<div data-panel="errors"></div>';
  return document.querySelector<HTMLElement>('[data-panel="errors"]')!;
}

describe('ValidationPanel', () => {
  beforeEach(() => { document.body.innerHTML = ''; });

  test('empty state when no diagnostics', () => {
    const panel = createValidationPanel(dom());
    panel.update([]);
    const root = document.querySelector<HTMLElement>('[data-panel="errors"]')!;
    expect(root.querySelector('.pg-empty')).not.toBeNull();
  });

  test('renders errors and warnings (rendered via t() per code)', () => {
    const panel = createValidationPanel(dom());
    panel.update([
      // unknown-key code with params -> en text "Unknown key `foo` in menu-root scope"
      { severity: 'error', code: 'validate.unknown-key', params: { key: 'foo', scope: 'menu-root' }, message: '', line: 2, column: 3 },
      { severity: 'warning', code: 'parser.expected-closing-brace', message: '', line: 5, column: 1 },
    ]);
    const root = document.querySelector<HTMLElement>('[data-panel="errors"]')!;
    expect(root.querySelectorAll('.pg-diag-error').length).toBe(1);
    expect(root.querySelectorAll('.pg-diag-warning').length).toBe(1);
    expect(root.textContent).toContain('Unknown key `foo`');
    expect(root.textContent).toContain('2:3');
  });

  test('click fires onJump with file/line/col', () => {
    const panel = createValidationPanel(dom());
    let jumped: { file: string; line: number; column: number } | null = null;
    panel.onJump((file, line, column) => { jumped = { file, line, column }; });
    panel.update([{ severity: 'error', code: 'parser.expected-closing-brace', message: '', line: 7, column: 4 }]);
    document.querySelector<HTMLButtonElement>('.pg-diag')!.click();
    // No `file` on the diagnostic -> empty string falls through (Task 15
    // teaches PlaygroundApp to interpret '' as "current tab").
    expect(jumped).toEqual({ file: '', line: 7, column: 4 });
  });

  test('row prefix is [file:line:col] when diagnostic has file', () => {
    const panel = createValidationPanel(dom());
    panel.update([
      { severity: 'error', code: 'parser.unexpected-token', message: 'oops', line: 5, column: 3, file: 'menu.conf' },
    ]);
    const loc = document.querySelector<HTMLElement>('.pg-diag-loc')!;
    expect(loc.textContent).toBe('[menu.conf:5:3]');
  });

  test('row prefix falls back to line:col when diagnostic has no file', () => {
    const panel = createValidationPanel(dom());
    panel.update([
      { severity: 'error', code: 'parser.unexpected-token', message: 'oops', line: 7, column: 2 },
    ]);
    const loc = document.querySelector<HTMLElement>('.pg-diag-loc')!;
    expect(loc.textContent).toBe('7:2');
  });

  test('onJump fires with file extracted from row dataset', () => {
    const panel = createValidationPanel(dom());
    panel.update([
      { severity: 'error', code: 'parser.unexpected-token', message: 'X', line: 5, column: 3, file: 'menu.conf' },
    ]);
    const captured: { file: string; line: number; column: number }[] = [];
    panel.onJump((file, line, column) => captured.push({ file, line, column }));
    document.querySelector<HTMLButtonElement>('.pg-diag')!.click();
    expect(captured).toEqual([{ file: 'menu.conf', line: 5, column: 3 }]);
  });
});
