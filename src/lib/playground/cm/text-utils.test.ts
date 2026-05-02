import { describe, test, expect } from 'vitest';
import { stripStringsAndComments } from './text-utils';

describe('stripStringsAndComments', () => {
  test('preserves length', () => {
    const input = 'a = "hello" # tail';
    expect(stripStringsAndComments(input).length).toBe(input.length);
  });

  test('strips string contents', () => {
    expect(stripStringsAndComments('a = "{x}" b')).toBe('a =       b');
  });

  test('strips line comment with #', () => {
    expect(stripStringsAndComments('a = 1 # nope')).toBe('a = 1       ');
  });

  test('strips line comment with //', () => {
    expect(stripStringsAndComments('a = 1 // nope')).toBe('a = 1        ');
  });

  test('preserves newlines', () => {
    expect(stripStringsAndComments('a\n"x"\nb')).toBe('a\n   \nb');
  });

  test('triple-quoted spans multiple lines', () => {
    const input = '"""multi\nline"""x';
    expect(stripStringsAndComments(input)).toBe('        \n       x');
  });

  test('escaped quote inside string is also stripped', () => {
    expect(stripStringsAndComments('"a\\"b"')).toBe('      ');
  });

  test('hash inside string is preserved as part of the strip, not a comment', () => {
    expect(stripStringsAndComments('"# not a comment"')).toBe('                 ');
  });

  test('brackets inside string vanish', () => {
    expect(stripStringsAndComments('a = "{ }" b')).toBe('a =       b');
  });

  test('non-string non-comment passes through unchanged', () => {
    expect(stripStringsAndComments('items = [{ slot = 0 }]')).toBe('items = [{ slot = 0 }]');
  });
});
