import { tokenizeLine, createState } from '../cm/hocon-tokenizer';
import type { TokenWithPos } from './types';

export function tokenizeText(input: string): TokenWithPos[] {
  const lines = input.split('\n');
  const out: TokenWithPos[] = [];
  const state = createState();
  let offset = 0;

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx];
    const tokens = tokenizeLine(line, state);
    let col = 0;

    for (const t of tokens) {
      if (t.token !== null) {
        out.push({
          type: t.token,
          text: t.text,
          line: lineIdx + 1,
          column: col + 1,
          offset: offset + col,
        });
      }
      col += t.text.length;
    }

    if (lineIdx < lines.length - 1) {
      out.push({
        type: 'newline',
        text: '\n',
        line: lineIdx + 1,
        column: line.length + 1,
        offset: offset + line.length,
      });
      offset += line.length + 1;
    } else {
      offset += line.length;
    }
  }

  return out;
}
