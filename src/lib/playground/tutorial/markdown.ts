/**
 * Tiny markdown renderer for lesson intros. Supports paragraphs (blank-line
 * separated), `**bold**`, `` `code` ``, `[text](https://...)` links, and
 * `- list` lines. No headings, no images. Swap to marked/remark if richer
 * markup is needed (~30KB bundle hit).
 *
 * Link safety: only http(s) URLs render as anchors; anything else (e.g. a
 * `javascript:` scheme) is replaced with `#`. Links open in a new tab with
 * `noopener noreferrer` so the target page can't reach back into us.
 */
export function renderMd(input: string): string {
  const blocks = input.split(/\n{2,}/);
  return blocks.map(renderBlock).join('\n');
}

function renderBlock(block: string): string {
  const lines = block.split('\n');
  const allList = lines.length > 0 && lines.every((l) => /^\s*-\s+/.test(l));
  if (allList) {
    const items = lines
      .map((l) => `<li>${renderInline(l.replace(/^\s*-\s+/, ''))}</li>`)
      .join('');
    return `<ul>${items}</ul>`;
  }
  return `<p>${renderInline(block)}</p>`;
}

// Control-char placeholders used to stash code-span contents out of band
// while link/bold/escape transforms run. SOH/STX (0x01/0x02) are not valid
// in any reasonable lesson source - collisions aren't a real concern.
const STASH_OPEN = '';
const STASH_CLOSE = '';
const STASH_RE = new RegExp(`${STASH_OPEN}(\\d+)${STASH_CLOSE}`, 'g');

function renderInline(s: string): string {
  // Pull code spans out first so other transforms don't rewrite them.
  // Restored at the end with their original text intact (and HTML-escaped).
  const codeStash: string[] = [];
  const withoutCode = s.replace(/`([^`]+)`/g, (_m, code) => {
    codeStash.push(code);
    return `${STASH_OPEN}${codeStash.length - 1}${STASH_CLOSE}`;
  });

  const transformed = escapeHtml(withoutCode)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, label, url) => {
      const safe = /^https?:\/\/[^\s"<>]+$/.test(url) ? url : '#';
      return `<a href="${safe}" target="_blank" rel="noopener noreferrer">${label}</a>`;
    })
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>');

  return transformed.replace(
    STASH_RE,
    (_m, idx) => `<code>${escapeHtml(codeStash[Number(idx)])}</code>`,
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
