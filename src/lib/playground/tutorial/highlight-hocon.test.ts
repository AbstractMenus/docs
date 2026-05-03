import { describe, test, expect } from 'vitest';
import { highlightHocon } from './highlight-hocon';

describe('highlightHocon', () => {
  test('wraps each token in a class span', () => {
    const out = highlightHocon('title = "x"');
    expect(out).toContain('cm-tk-key');
    expect(out).toContain('cm-tk-operator');
    expect(out).toContain('cm-tk-string');
  });

  test('preserves newlines between lines', () => {
    const out = highlightHocon('a = 1\nb = 2');
    expect(out).toMatch(/\n/);
  });

  test('escapes HTML in token text', () => {
    const out = highlightHocon('title = "<script>"');
    expect(out).toContain('&lt;script&gt;');
    expect(out).not.toContain('<script>');
  });

  test('comments get their own class', () => {
    const out = highlightHocon('# hello\nsize = 3');
    expect(out).toContain('cm-tk-comment');
  });

  test('substitutions get their own class', () => {
    const out = highlightHocon('name = ${prefix}');
    expect(out).toContain('cm-tk-substitution');
  });
});
