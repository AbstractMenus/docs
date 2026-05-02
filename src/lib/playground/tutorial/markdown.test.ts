import { describe, test, expect } from 'vitest';
import { renderMd } from './markdown';

describe('renderMd', () => {
  test('paragraph wraps in <p>', () => {
    expect(renderMd('hello')).toBe('<p>hello</p>');
  });

  test('two paragraphs', () => {
    expect(renderMd('first\n\nsecond')).toBe('<p>first</p>\n<p>second</p>');
  });

  test('bold', () => {
    expect(renderMd('a **bold** word')).toBe('<p>a <strong>bold</strong> word</p>');
  });

  test('inline code', () => {
    expect(renderMd('use `title = "x"`')).toBe('<p>use <code>title = "x"</code></p>');
  });

  test('list block', () => {
    expect(renderMd('- one\n- two')).toBe('<ul><li>one</li><li>two</li></ul>');
  });

  test('escapes html', () => {
    expect(renderMd('<script>')).toBe('<p>&lt;script&gt;</p>');
  });
});
