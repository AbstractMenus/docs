import { describe, test, expect, beforeEach } from 'vitest';
import { createResolvedJsonPanel, highlightJson } from './ResolvedJsonPanel';

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

describe('highlightJson', () => {
  test('wraps keys', () => {
    expect(highlightJson('"a": 1')).toContain('<span class="pg-json-key">"a"</span>');
  });

  test('wraps strings, numbers, booleans, null', () => {
    const out = highlightJson('{"x": "v", "n": 5, "b": true, "z": null}');
    expect(out).toContain('<span class="pg-json-str">"v"</span>');
    expect(out).toContain('<span class="pg-json-num">5</span>');
    expect(out).toContain('<span class="pg-json-bool">true</span>');
    expect(out).toContain('<span class="pg-json-null">null</span>');
  });

  test('escapes HTML in string values', () => {
    expect(highlightJson('"a": "<script>"')).toContain('&lt;script&gt;');
    expect(highlightJson('"a": "<script>"')).not.toContain('<script>');
  });

  test('preserves textContent on round-trip', () => {
    const json = '{"a": 1, "b": [true, null]}';
    const div = document.createElement('div');
    div.innerHTML = highlightJson(json);
    expect(div.textContent).toBe(json);
  });
});
