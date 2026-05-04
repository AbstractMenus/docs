import { highlightHocon } from './highlight-hocon';
import { resolveWikiUrl } from './wiki-links';

/**
 * Tiny markdown renderer for lesson intros. Supports paragraphs (blank-line
 * separated), `**bold**`, `` `code` ``, `[text](https://...)` links,
 * `![alt](url)` images, `- list` lines, and triple-backtick fenced code
 * blocks. No headings. Swap to marked/remark if richer markup is needed
 * (~30KB bundle).
 *
 * Fenced blocks with the default language (no tag) or an explicit `hocon`
 * tag are syntax-highlighted using the same tokeniser the editor uses;
 * other lang tags fall through to plain text.
 *
 * URL safety: only http(s) URLs and same-origin paths starting with `/`
 * are accepted for links and images; anything else (e.g. `javascript:`)
 * collapses to `#`. Links open in a new tab with `noopener noreferrer`.
 */
// 0x03 (ETX) - never appears in lesson sources; used as a placeholder
// sentinel so blank lines inside fenced code blocks don't get mistaken for
// paragraph breaks during the split below.
const FENCE_MARK = String.fromCharCode(3);

interface Fence {
  lang: string;
  content: string;
}

export function renderMd(input: string): string {
  // Stash fenced code blocks first so blank lines INSIDE them don't split
  // them when we paragraph-split below. Each fence becomes a single token
  // that we recognise after splitting and render as <pre><code>.
  const fences: Fence[] = [];
  const stashed = input.replace(/```([^\n]*)\n([\s\S]*?)\n```/g, (_m, lang, content) => {
    fences.push({ lang: lang.trim(), content });
    return `\n\n${FENCE_MARK}${fences.length - 1}${FENCE_MARK}\n\n`;
  });

  // Drop empty blocks introduced by the fence-stash padding (`\n\n...\n\n`)
  // so the output doesn't get sprinkled with `<p></p>` around fences.
  const blocks = stashed.split(/\n{2,}/).filter((b) => b.trim().length > 0);
  return blocks.map((b) => {
    const m = b.trim().match(new RegExp(`^${FENCE_MARK}(\\d+)${FENCE_MARK}$`));
    if (m) {
      const fence = fences[Number(m[1])];
      const isHocon = fence.lang === '' || fence.lang === 'hocon';
      const inner = isHocon ? highlightHocon(fence.content) : escapeHtml(fence.content);
      return `<pre><code>${inner}</code></pre>`;
    }
    return renderBlock(b);
  }).join('\n');
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

/**
 * Inline-only variant of renderMd for one-liners (lesson goal text, etc.).
 * Same code/bold/link pipeline as paragraphs, but doesn't wrap in `<p>` so
 * the result drops cleanly into a host element with its own layout.
 */
export function renderInlineMd(s: string): string {
  return renderInline(s);
}

function renderInline(s: string): string {
  // Pull code spans out first so other transforms don't rewrite them.
  // Restored at the end with their original text intact (and HTML-escaped).
  const codeStash: string[] = [];
  const withoutCode = s.replace(/`([^`]+)`/g, (_m, code) => {
    codeStash.push(code);
    return `${STASH_OPEN}${codeStash.length - 1}${STASH_CLOSE}`;
  });

  const transformed = escapeHtml(withoutCode)
    // Image must come before link: `![alt](url)` would otherwise match the
    // link regex with the literal `!` left dangling outside the anchor.
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_m, alt, url) => {
      const safe = isSafeUrl(url) ? url : '';
      if (!safe) return '';
      return `<img src="${safe}" alt="${alt}" loading="lazy">`;
    })
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, label, url) => {
      // Custom `wiki:concept` scheme - resolve to a per-locale docs URL.
      // Unknown concepts collapse to `#` so the broken link is visible.
      if (url.startsWith('wiki:')) {
        const resolved = resolveWikiUrl(url.slice(5));
        const safe = resolved && isSafeUrl(resolved) ? resolved : '#';
        return `<a href="${safe}" target="_blank" rel="noopener noreferrer">${label}</a>`;
      }
      const safe = isSafeUrl(url) ? url : '#';
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

/**
 * Allow http(s) absolute URLs and same-origin paths starting with `/`.
 * Anything else (javascript:, data:, vbscript:, relative `./`, ...) is
 * rejected so an untrusted lesson contributor can't inject an XSS vector.
 */
function isSafeUrl(url: string): boolean {
  if (/^https?:\/\/[^\s"<>]+$/.test(url)) return true;
  if (/^\/[^\s"<>]*$/.test(url)) return true;
  return false;
}
