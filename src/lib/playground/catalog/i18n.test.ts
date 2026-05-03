import { describe, test, expect, beforeEach } from 'vitest';
import { describeKeyDef } from './i18n';
import { setLang, _resetForTests } from '../i18n';
import type { KeyDef } from './types';

const TITLE: KeyDef = {
  name: 'title',
  scope: 'menu-root',
  valueType: 'string',
  description: 'Menu title shown at the top of the inventory.',
};

const UNSEEDED: KeyDef = {
  name: 'completelyMadeUpKey',
  scope: 'menu-root',
  valueType: 'string',
  description: 'English fallback only.',
};

beforeEach(() => {
  _resetForTests();
});

describe('describeKeyDef', () => {
  test('returns canonical English description by default', () => {
    expect(describeKeyDef(TITLE)).toBe('Menu title shown at the top of the inventory.');
  });

  test('returns ru translation when active lang is ru', () => {
    setLang('ru');
    expect(describeKeyDef(TITLE)).toContain('Заголовок меню');
  });

  test('falls back to English when ru lacks the key', () => {
    setLang('ru');
    expect(describeKeyDef(UNSEEDED)).toBe('English fallback only.');
  });

  test('switching back to en uses English again', () => {
    setLang('ru');
    setLang('en');
    expect(describeKeyDef(TITLE)).toBe('Menu title shown at the top of the inventory.');
  });
});
