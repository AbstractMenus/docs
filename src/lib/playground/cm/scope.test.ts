import { describe, test, expect } from 'vitest';
import { detectScope } from './scope';

describe('detectScope', () => {
  test('empty input → menu-root', () => {
    expect(detectScope('', 0)).toBe('menu-root');
  });

  test('top level → menu-root', () => {
    expect(detectScope('title = "x"\n', 12)).toBe('menu-root');
  });

  test('inside items[]/{} → item', () => {
    const text = 'items = [\n  {\n    ';
    expect(detectScope(text, text.length)).toBe('item');
  });

  test('inside click {} → click', () => {
    const text = 'items = [\n  {\n    click {\n      ';
    expect(detectScope(text, text.length)).toBe('click');
  });

  test('inside actions {} → actions', () => {
    const text = 'click {\n  actions {\n    ';
    expect(detectScope(text, text.length)).toBe('actions');
  });

  test('inside rules {} → rules', () => {
    const text = 'click {\n  rules {\n    ';
    expect(detectScope(text, text.length)).toBe('rules');
  });

  test('inside activators {} → activators', () => {
    const text = 'activators {\n  ';
    expect(detectScope(text, text.length)).toBe('activators');
  });

  test('left {} inside click is click-like (children are actions/rules)', () => {
    const text = 'click {\n  left {\n    ';
    expect(detectScope(text, text.length)).toBe('click');
  });

  test('after closing inner block, scope returns to outer', () => {
    const text = 'items = [\n  { click { actions { message = "x" } } }\n]\n';
    expect(detectScope(text, text.length)).toBe('menu-root');
  });

  test('strings with braces are ignored', () => {
    const text = 'a = "{ not a block }"\n';
    expect(detectScope(text, text.length)).toBe('menu-root');
  });

  test('comments with braces are ignored', () => {
    const text = '# {{{ comment\nactivators {\n  ';
    expect(detectScope(text, text.length)).toBe('activators');
  });
});
