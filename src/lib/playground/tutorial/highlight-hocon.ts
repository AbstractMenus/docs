import { tokenizeLine, createState } from '../cm/hocon-tokenizer';

/**
 * Render a HOCON snippet as syntax-highlighted HTML using the same token
 * classes the editor uses (`cm-tk-comment`, `cm-tk-string`, etc.). Output
 * goes inside a `<pre><code>` produced by the markdown renderer; CSS in
 * playground.css scopes the colours for `.pg-tutorial pre`.
 *
 * Always HTML-escapes; safe to drop into innerHTML.
 */
export function highlightHocon(code: string): string {
  const lines = code.split('\n');
  const state = createState();
  const out: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const tokens = tokenizeLine(lines[i], state);
    for (const t of tokens) {
      const escaped = escapeHtml(t.text);
      if (t.token === null) {
        out.push(escaped);
      } else {
        out.push(`<span class="cm-tk-${t.token}">${escaped}</span>`);
      }
    }
    if (i < lines.length - 1) out.push('\n');
  }
  return out.join('');
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
