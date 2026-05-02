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

  test('renders errors and warnings', () => {
    const panel = createValidationPanel(dom());
    panel.update([
      { severity: 'error', message: 'Boom', line: 2, column: 3 },
      { severity: 'warning', message: 'Look out', line: 5, column: 1 },
    ]);
    const root = document.querySelector<HTMLElement>('[data-panel="errors"]')!;
    expect(root.querySelectorAll('.pg-diag-error').length).toBe(1);
    expect(root.querySelectorAll('.pg-diag-warning').length).toBe(1);
    expect(root.textContent).toContain('Boom');
    expect(root.textContent).toContain('2:3');
  });

  test('click fires onJump with line/col', () => {
    const panel = createValidationPanel(dom());
    let jumped: { line: number; column: number } | null = null;
    panel.onJump((line, column) => { jumped = { line, column }; });
    panel.update([{ severity: 'error', message: 'Boom', line: 7, column: 4 }]);
    document.querySelector<HTMLButtonElement>('.pg-diag')!.click();
    expect(jumped).toEqual({ line: 7, column: 4 });
  });
});
