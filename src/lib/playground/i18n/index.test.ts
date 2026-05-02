import { describe, test, expect, beforeEach } from 'vitest';
import {
  t,
  setLang,
  getLang,
  detectLang,
  initLang,
  availableLangs,
  plural,
  pluralForm,
  _registerForTests,
  _resetForTests,
} from './index';

beforeEach(() => {
  _resetForTests();
  try { localStorage.removeItem('pg-lang'); } catch { /* ignore */ }
});

describe('availableLangs', () => {
  test('includes en and ru (shipped locales)', () => {
    const langs = availableLangs();
    expect(langs).toContain('en');
    expect(langs).toContain('ru');
  });

  test('result is sorted', () => {
    const langs = availableLangs();
    const sorted = [...langs].sort();
    expect(langs).toEqual(sorted);
  });
});

describe('t() basics', () => {
  test('returns english by default', () => {
    expect(t('btn.format')).toBe('Format');
  });

  test('returns ru after setLang(ru)', () => {
    setLang('ru');
    expect(t('btn.format')).toBe('Формат');
  });

  test('falls back to english when ru lacks the key', () => {
    _registerForTests('xx', { 'btn.format': 'XXX' });
    setLang('xx');
    // tab.errors not in xx -> fallback to english
    expect(t('tab.errors')).toBe('Errors');
    expect(t('btn.format')).toBe('XXX');
  });

  test('interpolates ${var} params', () => {
    expect(t('status.errors', { count: 3, plural: 's' })).toBe('3 errors');
    expect(t('status.errors', { count: 1, plural: '' })).toBe('1 error');
  });

  test('missing param keeps literal placeholder (so json.desc ${vars} survives)', () => {
    // status.errors = "${count} error${plural}"; passing only count leaves ${plural} literal.
    expect(t('status.errors', { count: 1 })).toBe('1 error${plural}');
    // No params at all -> raw returned untouched.
    expect(t('json.desc')).toContain('${vars}');
  });
});

describe('setLang / getLang', () => {
  test('getLang returns active', () => {
    setLang('ru');
    expect(getLang()).toBe('ru');
  });

  test('setLang ignores unknown code', () => {
    setLang('en');
    setLang('zz-not-real');
    expect(getLang()).toBe('en');
  });

  test('setLang persists to localStorage', () => {
    setLang('ru');
    expect(localStorage.getItem('pg-lang')).toBe('ru');
  });
});

describe('detectLang', () => {
  test('honors localStorage', () => {
    localStorage.setItem('pg-lang', 'ru');
    expect(detectLang()).toBe('ru');
  });

  test('honors URL ?lang= over localStorage', () => {
    localStorage.setItem('pg-lang', 'en');
    const orig = window.location.href;
    history.replaceState(null, '', '?lang=ru');
    try {
      expect(detectLang()).toBe('ru');
    } finally {
      history.replaceState(null, '', orig);
    }
  });

  test('falls back to en for unknown locale', () => {
    localStorage.setItem('pg-lang', 'klingon');
    expect(detectLang()).toBe('en');
  });

  test('initLang sets active', () => {
    localStorage.setItem('pg-lang', 'ru');
    initLang();
    expect(getLang()).toBe('ru');
  });
});

describe('plural / pluralForm', () => {
  test('english plural', () => {
    expect(plural(0)).toBe('s');
    expect(plural(1)).toBe('');
    expect(plural(2)).toBe('s');
  });

  test('pluralForm english two-form', () => {
    expect(pluralForm(1, ['error', 'errors'])).toBe('error');
    expect(pluralForm(5, ['error', 'errors'])).toBe('errors');
  });

  test('pluralForm russian three-form', () => {
    setLang('ru');
    const forms = ['а', 'и', ''];
    expect(pluralForm(1, forms)).toBe('а');   // 1 ошибка
    expect(pluralForm(2, forms)).toBe('и');   // 2 ошибки
    expect(pluralForm(5, forms)).toBe('');    // 5 ошибок
    expect(pluralForm(11, forms)).toBe('');   // 11 ошибок (special)
    expect(pluralForm(21, forms)).toBe('а');  // 21 ошибка
    expect(pluralForm(22, forms)).toBe('и');  // 22 ошибки
    expect(pluralForm(100, forms)).toBe('');  // 100 ошибок
    expect(pluralForm(101, forms)).toBe('а'); // 101 ошибка
    expect(pluralForm(112, forms)).toBe('');  // 112 ошибок
  });
});
