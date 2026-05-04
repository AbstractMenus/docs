import { describe, test, expect, beforeEach } from 'vitest';
import { resolveWikiUrl, hasWikiConcept } from './wiki-links';
import { setLang, _resetForTests } from '../i18n';

beforeEach(() => { _resetForTests(); });

describe('resolveWikiUrl', () => {
  test('returns en URL by default', () => {
    expect(resolveWikiUrl('click')).toContain('/docs/en/');
  });

  test('returns ru URL when active lang is ru', () => {
    setLang('ru');
    expect(resolveWikiUrl('click')).toContain('/docs/ru/');
  });

  test('falls back to en if ru entry missing', () => {
    setLang('ru');
    // `items` may not have a ru-specific entry distinct from en, but it
    // should still return a URL (either ru fallback to en path).
    const url = resolveWikiUrl('items');
    expect(url).not.toBeNull();
    expect(url).toContain('/docs/');
  });

  test('returns null for unknown concept', () => {
    expect(resolveWikiUrl('does-not-exist')).toBeNull();
  });

  test('cyrillic anchor is percent-encoded in href', () => {
    setLang('ru');
    const url = resolveWikiUrl('click')!;
    // Russian anchor "обработка-кликов" should appear as %D0%BE...
    expect(url).toContain('%D0%BE');
    expect(url).not.toContain('обработка');
  });

  test('hasWikiConcept reflects registry membership', () => {
    expect(hasWikiConcept('click')).toBe(true);
    expect(hasWikiConcept('not-a-thing')).toBe(false);
  });
});
