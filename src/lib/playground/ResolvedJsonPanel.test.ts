import { describe, test, expect, beforeEach } from 'vitest';
import { createResolvedJsonPanel } from './ResolvedJsonPanel';

function dom(): HTMLElement {
  document.body.innerHTML = '<div data-panel="json"></div>';
  return document.querySelector<HTMLElement>('[data-panel="json"]')!;
}

describe('ResolvedJsonPanel', () => {
  beforeEach(() => { document.body.innerHTML = ''; });

  test('renders pretty-printed JSON', () => {
    const panel = createResolvedJsonPanel(dom());
    panel.update({ a: 1, b: [2, 3] });
    const pre = document.querySelector<HTMLElement>('.pg-json')!;
    expect(pre.textContent).toContain('"a": 1');
    expect(pre.textContent).toContain('"b": [\n');
  });

  test('copy button exists', () => {
    const panel = createResolvedJsonPanel(dom());
    panel.update({ a: 1 });
    const btn = document.querySelector('[data-action="copy-json"]');
    expect(btn).not.toBeNull();
  });

  test('null value renders as null', () => {
    const panel = createResolvedJsonPanel(dom());
    panel.update(null);
    expect(document.querySelector('.pg-json')!.textContent).toBe('null');
  });
});
