import { describe, test, expect } from 'vitest';
import { renderMd, renderInlineMd } from './markdown';

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

describe('fenced code blocks', () => {
  test('single fenced block renders as <pre><code>', () => {
    const out = renderMd('```\nfoo\n```');
    expect(out).toBe('<pre><code>foo</code></pre>');
  });

  test('language tag is accepted and ignored', () => {
    const out = renderMd('```hocon\ntitle = "x"\n```');
    expect(out).toBe('<pre><code>title = "x"</code></pre>');
  });

  test('fence preserves blank lines inside content', () => {
    const out = renderMd('```\nline1\n\nline2\n```');
    expect(out).toBe('<pre><code>line1\n\nline2</code></pre>');
  });

  test('html inside fence is escaped', () => {
    const out = renderMd('```\n<script>\n```');
    expect(out).toBe('<pre><code>&lt;script&gt;</code></pre>');
  });

  test('paragraph + fence + paragraph all render in order', () => {
    const out = renderMd('intro text\n\n```\ncode\n```\n\noutro text');
    expect(out).toBe('<p>intro text</p>\n<pre><code>code</code></pre>\n<p>outro text</p>');
  });

  test('fence content is not run through inline transforms', () => {
    // **bold** and `inline-code` syntax inside the fence stays literal.
    const out = renderMd('```\n**not bold** `not code`\n```');
    expect(out).toBe('<pre><code>**not bold** `not code`</code></pre>');
  });
});

describe('renderInlineMd', () => {
  test('renders code without paragraph wrap', () => {
    expect(renderInlineMd('set `size = 3`')).toBe('set <code>size = 3</code>');
  });

  test('bold + code combine', () => {
    expect(renderInlineMd('**Set** `key`')).toBe('<strong>Set</strong> <code>key</code>');
  });

  test('link works inline', () => {
    expect(renderInlineMd('see [docs](https://example.com)')).toBe(
      'see <a href="https://example.com" target="_blank" rel="noopener noreferrer">docs</a>',
    );
  });

  test('escapes raw html', () => {
    expect(renderInlineMd('<script>')).toBe('&lt;script&gt;');
  });
});
