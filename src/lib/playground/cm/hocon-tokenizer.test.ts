import { describe, test, expect } from 'vitest';
import { tokenizeLine } from './hocon-tokenizer';

describe('HOCON tokenizer', () => {
  describe('comments', () => {
    test('hash comment to end of line', () => {
      expect(tokenizeLine('# this is a comment')).toEqual([
        { token: 'comment', text: '# this is a comment' },
      ]);
    });

    test('double-slash comment', () => {
      expect(tokenizeLine('// comment')).toEqual([
        { token: 'comment', text: '// comment' },
      ]);
    });

    test('comment after value', () => {
      expect(tokenizeLine('size = 3 # rows')).toEqual([
        { token: 'key', text: 'size' },
        { token: null, text: ' ' },
        { token: 'operator', text: '=' },
        { token: null, text: ' ' },
        { token: 'number', text: '3' },
        { token: null, text: ' ' },
        { token: 'comment', text: '# rows' },
      ]);
    });
  });

  describe('strings', () => {
    test('basic double-quoted string', () => {
      expect(tokenizeLine('title = "Hello"')).toEqual([
        { token: 'key', text: 'title' },
        { token: null, text: ' ' },
        { token: 'operator', text: '=' },
        { token: null, text: ' ' },
        { token: 'string', text: '"Hello"' },
      ]);
    });

    test('string with escape', () => {
      expect(tokenizeLine('x = "a\\nb"')).toEqual([
        { token: 'key', text: 'x' },
        { token: null, text: ' ' },
        { token: 'operator', text: '=' },
        { token: null, text: ' ' },
        { token: 'string', text: '"a\\nb"' },
      ]);
    });

    test('triple-quoted string', () => {
      const tokens = tokenizeLine('s = """multi"""');
      expect(tokens.find((t) => t.token === 'string')).toEqual({
        token: 'string',
        text: '"""multi"""',
      });
    });
  });

  describe('substitutions', () => {
    test('plain substitution', () => {
      expect(tokenizeLine('x = ${a.b}')).toEqual([
        { token: 'key', text: 'x' },
        { token: null, text: ' ' },
        { token: 'operator', text: '=' },
        { token: null, text: ' ' },
        { token: 'substitution', text: '${a.b}' },
      ]);
    });

    test('optional substitution', () => {
      expect(tokenizeLine('x = ${?a.b}')).toEqual([
        { token: 'key', text: 'x' },
        { token: null, text: ' ' },
        { token: 'operator', text: '=' },
        { token: null, text: ' ' },
        { token: 'substitution', text: '${?a.b}' },
      ]);
    });
  });

  describe('numbers and constants', () => {
    test('integer', () => {
      expect(tokenizeLine('size = 3')[4]).toEqual({ token: 'number', text: '3' });
    });
    test('negative float', () => {
      expect(tokenizeLine('x = -1.5')[4]).toEqual({ token: 'number', text: '-1.5' });
    });
    test('boolean true', () => {
      expect(tokenizeLine('enabled = true')[4]).toEqual({ token: 'bool', text: 'true' });
    });
    test('boolean yes', () => {
      expect(tokenizeLine('flag = yes')[4]).toEqual({ token: 'bool', text: 'yes' });
    });
    test('null', () => {
      expect(tokenizeLine('x = null')[4]).toEqual({ token: 'null', text: 'null' });
    });
  });

  describe('brackets and lists', () => {
    test('object literal', () => {
      const tokens = tokenizeLine('items = [{ id = 1 }]');
      const types = tokens.map((t) => t.token).filter((t) => t !== null);
      expect(types).toEqual([
        'key', 'operator', 'bracket', 'bracket', 'key', 'operator', 'number', 'bracket', 'bracket',
      ]);
    });
  });

  describe('operators', () => {
    test('plus-equals', () => {
      const tokens = tokenizeLine('list += "a"');
      expect(tokens[2]).toEqual({ token: 'operator', text: '+=' });
    });
    test('colon', () => {
      const tokens = tokenizeLine('a: 1');
      expect(tokens[1]).toEqual({ token: 'operator', text: ':' });
    });
  });

  describe('includes', () => {
    test('include with file()', () => {
      const tokens = tokenizeLine('include file("a.conf")');
      const types = tokens.map((t) => t.token).filter((t) => t !== null);
      expect(types[0]).toBe('keyword');
      expect(types[1]).toBe('includeFn');
      expect(types).toContain('string');
    });
    test('include with classpath', () => {
      const tokens = tokenizeLine('include classpath("base.conf")');
      const types = tokens.map((t) => t.token).filter((t) => t !== null);
      expect(types[0]).toBe('keyword');
      expect(types[1]).toBe('includeFn');
    });
  });

  describe('durations', () => {
    test('seconds shorthand', () => {
      const tokens = tokenizeLine('cooldown = 5s');
      expect(tokens.find((t) => t.token === 'duration')).toEqual({
        token: 'duration',
        text: '5s',
      });
    });
    test('megabytes', () => {
      const tokens = tokenizeLine('size = 10MB');
      expect(tokens.find((t) => t.token === 'duration')).toEqual({
        token: 'duration',
        text: '10MB',
      });
    });
    test('seconds with space', () => {
      const tokens = tokenizeLine('t = 5 seconds');
      expect(tokens.find((t) => t.token === 'duration')).toEqual({
        token: 'duration',
        text: '5 seconds',
      });
    });
  });

  describe('keys vs values', () => {
    test('unquoted value after =', () => {
      const tokens = tokenizeLine('material = STONE');
      expect(tokens[0]).toEqual({ token: 'key', text: 'material' });
      expect(tokens[4]).toEqual({ token: 'value', text: 'STONE' });
    });
    test('key followed by `{` is still a key', () => {
      const tokens = tokenizeLine('items {');
      expect(tokens[0]).toEqual({ token: 'key', text: 'items' });
    });
    test('dotted key', () => {
      const tokens = tokenizeLine('a.b.c = 1');
      expect(tokens[0]).toEqual({ token: 'key', text: 'a.b.c' });
    });
  });
});
