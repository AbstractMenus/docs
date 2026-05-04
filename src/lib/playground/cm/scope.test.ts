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

  test('inside enchantments {} → enchantments', () => {
    const text = 'enchantments {\n  ';
    expect(detectScope(text, text.length)).toBe('enchantments');
  });

  test('inside slot {} → slot', () => {
    const text = 'slot {\n  ';
    expect(detectScope(text, text.length)).toBe('slot');
  });

  test('inside firework {} → firework', () => {
    const text = 'firework {\n  ';
    expect(detectScope(text, text.length)).toBe('firework');
  });

  test('inside firework.effects [{}] → firework-effect', () => {
    const text = 'firework {\n  effects = [\n    {\n      ';
    expect(detectScope(text, text.length)).toBe('firework-effect');
  });

  test('inside bindings [{}] → binding', () => {
    const text = 'bindings = [\n  {\n    ';
    expect(detectScope(text, text.length)).toBe('binding');
  });

  test('inside items array but outside any object → item-list', () => {
    const text = 'items = [\n  ';
    expect(detectScope(text, text.length)).toBe('item-list');
  });

  test('inside bindings array but outside any object → binding-list', () => {
    const text = 'bindings = [\n  ';
    expect(detectScope(text, text.length)).toBe('binding-list');
  });

  test('inside binding.props {} → item', () => {
    const text = 'bindings = [\n  {\n    props {\n      ';
    expect(detectScope(text, text.length)).toBe('item');
  });

  test('unknown parent key → unknown (fallback to all keys)', () => {
    const text = 'myCustomBlock {\n  ';
    expect(detectScope(text, text.length)).toBe('unknown');
  });

  test('cursor inside triple-quoted string returns outer scope', () => {
    // The string body, including the `{` inside, should not open a frame.
    const text = 'items = [{ name = """has { brace""" }]';
    const cursorInString = text.indexOf('has') + 1;
    expect(detectScope(text, cursorInString)).toBe('item');
  });

  test('cursor inside line comment ignores comment text', () => {
    const text = 'activators {\n  # inside { brace and = colon\n  ';
    expect(detectScope(text, text.length)).toBe('activators');
  });

  test('escaped quote inside string does not break tracking', () => {
    const text = 'name = "she said \\"go\\"" \nactivators {\n  ';
    expect(detectScope(text, text.length)).toBe('activators');
  });
});
