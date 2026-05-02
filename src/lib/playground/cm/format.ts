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
      if (closesTriple(raw)) inTriple = false;
      continue;
    }

    const opensTripleStart = opensTripleNotClosing(line);

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
  let inStr = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"' && line.slice(i, i + 3) === '"""') return n;
    if (c === '#' && !inStr) break;
    if (c === '/' && line[i + 1] === '/' && !inStr) break;
    if (c === '\\' && inStr) { i++; continue; }
    if (c === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (c === '{' || c === '[') n++;
    else if (c === '}' || c === ']') n--;
  }
  return n;
}

function opensTripleNotClosing(line: string): boolean {
  const opens = (line.match(/"""/g) ?? []).length;
  return opens % 2 === 1;
}

function closesTriple(line: string): boolean {
  const opens = (line.match(/"""/g) ?? []).length;
  return opens % 2 === 1;
}
