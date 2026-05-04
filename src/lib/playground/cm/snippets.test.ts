import { describe, test, expect } from 'vitest';
import { hoconSnippets } from './snippets';

describe('HOCON snippets', () => {
  test('exposes the snippet set', () => {
    expect(hoconSnippets.length).toBeGreaterThanOrEqual(10);
  });

  test('includes list-skeleton snippets used by catalog-source', () => {
    const labels = hoconSnippets.map((s) => s.label);
    expect(labels).toContain('item');
    expect(labels).toContain('binding');
    expect(labels).toContain('fireworkEffect');
  });

  test('each snippet has label, info, and template', () => {
    for (const s of hoconSnippets) {
      expect(typeof s.label).toBe('string');
      expect(s.label.length).toBeGreaterThan(0);
      expect(typeof s.template).toBe('string');
      expect(s.template.length).toBeGreaterThan(0);
    }
  });

  test('includes core menu skeletons', () => {
    const labels = hoconSnippets.map((s) => s.label);
    expect(labels).toContain('menu');
    expect(labels).toContain('item');
    expect(labels).toContain('clickaction');
    expect(labels).toContain('commandact');
  });

  test('labels are unique', () => {
    const labels = hoconSnippets.map((s) => s.label);
    const set = new Set(labels);
    expect(set.size).toBe(labels.length);
  });
});
