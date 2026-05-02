/**
 * Replace every character that sits inside a string literal (single or
 * triple-quoted) or a comment (`#` / `//`) with a space, preserving overall
 * length and newline positions. Lets naive regex / bracket-balance scans
 * ignore HOCON syntax that is nested in strings or commented out, without
 * each consumer reimplementing its own state machine.
 *
 * Newlines are kept verbatim so per-line offsets stay valid.
 */
export function stripStringsAndComments(text: string): string {
  const out: string[] = [];
  let inString = false;
  let inTriple = false;
  let i = 0;
  while (i < text.length) {
    const ch = text[i];

    if (inTriple) {
      if (ch === '"' && text[i + 1] === '"' && text[i + 2] === '"') {
        out.push(' ', ' ', ' ');
        inTriple = false;
        i += 3;
        continue;
      }
      out.push(ch === '\n' ? '\n' : ' ');
      i++;
      continue;
    }

    if (inString) {
      if (ch === '\\' && i + 1 < text.length) {
        out.push(' ', ' ');
        i += 2;
        continue;
      }
      if (ch === '"') {
        inString = false;
        out.push(' ');
        i++;
        continue;
      }
      out.push(ch === '\n' ? '\n' : ' ');
      i++;
      continue;
    }

    if (ch === '"' && text[i + 1] === '"' && text[i + 2] === '"') {
      out.push(' ', ' ', ' ');
      inTriple = true;
      i += 3;
      continue;
    }
    if (ch === '"') {
      out.push(' ');
      inString = true;
      i++;
      continue;
    }
    if (ch === '#' || (ch === '/' && text[i + 1] === '/')) {
      while (i < text.length && text[i] !== '\n') {
        out.push(' ');
        i++;
      }
      continue;
    }

    out.push(ch);
    i++;
  }
  return out.join('');
}
