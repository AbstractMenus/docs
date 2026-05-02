/**
 * Tiny markdown renderer for lesson intros. Supports paragraphs (blank-line
 * separated), `**bold**`, `` `code` ``, and `- list` lines. No links, no
 * headings, no images. Swap to marked/remark if richer markup is needed
 * (~30KB bundle hit).
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

function renderInline(s: string): string {
  return escapeHtml(s)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>');
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
