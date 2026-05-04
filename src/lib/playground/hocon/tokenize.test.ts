import { describe, test, expect } from 'vitest';
import { tokenizeText } from './tokenize';

describe('tokenizeText', () => {
  test('single line', () => {
    const tokens = tokenizeText('size = 3');
    const sigs = tokens
      .filter((t) => t.type !== null)
      .map((t) => `${t.type}:${t.text}@${t.line}:${t.column}`);
    expect(sigs).toEqual(['key:size@1:1', 'operator:=@1:6', 'number:3@1:8']);
  });

  test('two lines have correct line numbers', () => {
    const tokens = tokenizeText('a = 1\nb = 2');
    const lineByText: Record<string, number> = {};
    for (const t of tokens) lineByText[t.text] = t.line;
    expect(lineByText.a).toBe(1);
    expect(lineByText.b).toBe(2);
    expect(lineByText['1']).toBe(1);
    expect(lineByText['2']).toBe(2);
  });

  test('emits newline tokens', () => {
    const tokens = tokenizeText('a = 1\nb = 2');
    const newlines = tokens.filter((t) => t.type === 'newline');
    expect(newlines.length).toBe(1);
    expect(newlines[0].line).toBe(1);
  });

  test('offset matches input slice for strings', () => {
    const input = 'foo = "bar"';
    const tokens = tokenizeText(input);
    const stringTok = tokens.find((t) => t.type === 'string')!;
    expect(input.slice(stringTok.offset, stringTok.offset + stringTok.text.length)).toBe('"bar"');
  });

  test('whitespace-only tokens not emitted', () => {
    const tokens = tokenizeText('a = 1');
    const nullCount = tokens.filter((t) => t.type === null).length;
    expect(nullCount).toBe(0);
  });

  test('column for second token on same line', () => {
    const tokens = tokenizeText('xy = 7');
    const eq = tokens.find((t) => t.text === '=')!;
    expect(eq.column).toBe(4);
  });
});
