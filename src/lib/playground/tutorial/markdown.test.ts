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

  test('same-origin path is allowed for links', () => {
    const out = renderMd('[docs](/docs/start/)');
    expect(out).toContain('href="/docs/start/"');
  });

  test('schemeless relative path (no leading /) is neutralised', () => {
    const out = renderMd('[oops](relative/path)');
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
  // Use `text` lang to opt out of HOCON highlighting where the test is
  // about structural rendering (escaping, blank-line preservation, etc.).
  test('single fenced block (text) renders as <pre><code>', () => {
    const out = renderMd('```text\nfoo\n```');
    expect(out).toBe('<pre><code>foo</code></pre>');
  });

  test('default lang highlights as HOCON', () => {
    // The string token should be wrapped in cm-tk-string regardless of how
    // the rest of the line is split.
    const out = renderMd('```\ntitle = "x"\n```');
    expect(out).toContain('cm-tk-string');
    expect(out).toContain('"x"');
  });

  test('explicit hocon lang highlights too', () => {
    const out = renderMd('```hocon\nsize = 3\n```');
    expect(out).toContain('cm-tk-number');
  });

  test('non-hocon lang skips highlighting', () => {
    const out = renderMd('```bash\nls -la\n```');
    expect(out).toBe('<pre><code>ls -la</code></pre>');
  });

  test('fence preserves blank lines inside content', () => {
    const out = renderMd('```text\nline1\n\nline2\n```');
    expect(out).toBe('<pre><code>line1\n\nline2</code></pre>');
  });

  test('html inside fence is escaped', () => {
    const out = renderMd('```text\n<script>\n```');
    expect(out).toBe('<pre><code>&lt;script&gt;</code></pre>');
  });

  test('paragraph + fence + paragraph all render in order', () => {
    const out = renderMd('intro text\n\n```text\ncode\n```\n\noutro text');
    expect(out).toBe('<p>intro text</p>\n<pre><code>code</code></pre>\n<p>outro text</p>');
  });

  test('fence content is not run through inline transforms', () => {
    // **bold** and `inline-code` syntax inside the fence stays literal.
    const out = renderMd('```text\n**not bold** `not code`\n```');
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

  test('image renders as <img> with alt and lazy loading', () => {
    expect(renderInlineMd('see ![diagram](/img/foo.png)')).toBe(
      'see <img src="/img/foo.png" alt="diagram" loading="lazy">',
    );
  });

  test('image with https url is allowed', () => {
    const out = renderInlineMd('![pic](https://example.com/x.png)');
    expect(out).toContain('src="https://example.com/x.png"');
  });

  test('image with javascript: url is dropped', () => {
    // Markdown image syntax doesn't allow `)` inside the URL, so we use a
    // simpler payload; the safety check rejects any non-http(s)/non-/ url.
    expect(renderInlineMd('![oops](javascript:alert)')).toBe('');
  });

  test('image is matched before link (no leftover `!`)', () => {
    expect(renderInlineMd('![alt](/p.png)')).toBe('<img src="/p.png" alt="alt" loading="lazy">');
  });

  test('link with same-origin path is allowed', () => {
    const out = renderInlineMd('see [docs](/docs/start/)');
    expect(out).toContain('href="/docs/start/"');
  });
});
