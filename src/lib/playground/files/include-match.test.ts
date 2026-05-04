import { describe, expect, test } from 'vitest';
import { extractIncludeTarget } from './include-match';

describe('extractIncludeTarget', () => {
  test('bare quoted string', () => {
    expect(extractIncludeTarget('"defaults.conf"')).toBe('defaults.conf');
  });
  test('classpath wrapper', () => {
    expect(extractIncludeTarget('classpath("base")')).toBe('base');
  });
  test('required wrapper', () => {
    expect(extractIncludeTarget('required("x.conf")')).toBe('x.conf');
  });
  test('file wrapper', () => {
    expect(extractIncludeTarget('file("foo")')).toBe('foo');
  });
  test('nested required(classpath(...))', () => {
    expect(extractIncludeTarget('required(classpath("nested"))')).toBe('nested');
  });
  test('whitespace tolerated', () => {
    expect(extractIncludeTarget('  classpath(  "x.conf"  )  ')).toBe('x.conf');
  });
  test('returns null on garbage', () => {
    expect(extractIncludeTarget('notQuoted')).toBeNull();
    expect(extractIncludeTarget('')).toBeNull();
  });
});
