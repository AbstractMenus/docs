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

  test('http link renders as anchor with safe attrs', () => {
    expect(renderMd('see [the spec](https://example.com/foo) here')).toBe(
      '<p>see <a href="https://example.com/foo" target="_blank" rel="noopener noreferrer">the spec</a> here</p>',
    );
  });

  test('http (non-https) link is allowed', () => {
    const out = renderMd('[old](http://example.com)');
    expect(out).toContain('href="http://example.com"');
  });

  test('non-http scheme is neutralised to #', () => {
    const out = renderMd('[evil](javascript:alert(1))');
    expect(out).toContain('href="#"');
    expect(out).not.toContain('javascript:');
  });

  test('relative link without scheme is neutralised', () => {
    const out = renderMd('[oops](/local/path)');
    expect(out).toContain('href="#"');
  });

  test('link inside code is left alone', () => {
    const out = renderMd('use `[label](url)` syntax');
    // Code wraps first, so the brackets+parens stay literal inside the
    // <code> tag and the link regex never matches.
    expect(out).toBe('<p>use <code>[label](url)</code> syntax</p>');
  });
});
