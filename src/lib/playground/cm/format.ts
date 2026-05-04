import { stripStringsAndComments } from './text-utils';

const INDENT = '  ';

export function formatHocon(input: string): string {
  const lines = input.split('\n');
  const out: string[] = [];
  let depth = 0;
  let inTriple = false;

  for (const raw of lines) {
    const line = raw.trim();
    if (line === '') { out.push(''); continue; }

    if (inTriple) {
      out.push(raw);
      if (hasOddTripleQuotes(raw)) inTriple = false;
      continue;
    }

    const opensTripleStart = hasOddTripleQuotes(line);

    let lineDepth = depth;
    if (line.startsWith('}') || line.startsWith(']')) lineDepth = Math.max(0, depth - 1);

    out.push(INDENT.repeat(lineDepth) + line);

    if (opensTripleStart) { inTriple = true; continue; }

    depth += netDepthChange(line);
    if (depth < 0) depth = 0;
  }

  return out.join('\n');
}

function netDepthChange(line: string): number {
  let n = 0;
  for (const c of stripStringsAndComments(line)) {
    if (c === '{' || c === '[') n++;
    else if (c === '}' || c === ']') n--;
  }
  return n;
}

function hasOddTripleQuotes(line: string): boolean {
  const opens = (line.match(/"""/g) ?? []).length;
  return opens % 2 === 1;
}
