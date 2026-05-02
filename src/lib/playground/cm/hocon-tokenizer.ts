export type TokenType =
  | 'comment'
  | 'string'
  | 'substitution'
  | 'key'
  | 'operator'
  | 'bracket'
  | 'punctuation'
  | 'bool'
  | 'null'
  | 'keyword'
  | 'includeFn'
  | 'number'
  | 'duration'
  | 'value';

export interface Token {
  token: TokenType | null;
  text: string;
}

export interface TokenState {
  inMultilineString: boolean;
  expectKey: boolean;
}

const BOOLS = new Set(['true', 'false', 'yes', 'no', 'on', 'off']);
const INCLUDE_FNS = new Set(['url', 'file', 'classpath', 'required']);
const DURATION_UNITS = /^(?:nanoseconds?|microseconds?|milliseconds?|seconds?|minutes?|hours?|days?|kilobytes?|megabytes?|gigabytes?|terabytes?|bytes?|ns|us|ms|kB|MB|GB|TB|KiB|MiB|GiB|TiB|s|m|h|d)\b/;

export function createState(): TokenState {
  return { inMultilineString: false, expectKey: true };
}

export function tokenizeLine(line: string, initialState?: TokenState): Token[] {
  const tokens: Token[] = [];
  const state = initialState ?? createState();
  let i = 0;
  state.expectKey = true;

  while (i < line.length) {
    const ch = line[i];

    if (ch === ' ' || ch === '\t') {
      const start = i;
      while (i < line.length && (line[i] === ' ' || line[i] === '\t')) i++;
      tokens.push({ token: null, text: line.slice(start, i) });
      continue;
    }

    if (ch === '#' || (ch === '/' && line[i + 1] === '/')) {
      tokens.push({ token: 'comment', text: line.slice(i) });
      i = line.length;
      continue;
    }

    if (ch === '$' && line[i + 1] === '{') {
      const start = i;
      i += 2;
      while (i < line.length && line[i] !== '}') i++;
      if (i < line.length) i++;
      tokens.push({ token: 'substitution', text: line.slice(start, i) });
      state.expectKey = false;
      continue;
    }

    if (ch === '"' && line[i + 1] === '"' && line[i + 2] === '"') {
      const start = i;
      i += 3;
      while (i < line.length && !(line[i] === '"' && line[i + 1] === '"' && line[i + 2] === '"')) i++;
      if (i < line.length) i += 3;
      tokens.push({ token: 'string', text: line.slice(start, i) });
      state.expectKey = false;
      continue;
    }
    if (ch === '"') {
      const start = i;
      i++;
      while (i < line.length && line[i] !== '"') {
        if (line[i] === '\\' && i + 1 < line.length) i++;
        i++;
      }
      if (i < line.length) i++;
      tokens.push({ token: 'string', text: line.slice(start, i) });
      state.expectKey = false;
      continue;
    }

    if (ch === '+' && line[i + 1] === '=') {
      tokens.push({ token: 'operator', text: '+=' });
      i += 2;
      state.expectKey = false;
      continue;
    }
    if (ch === '=' || ch === ':') {
      tokens.push({ token: 'operator', text: ch });
      i++;
      state.expectKey = false;
      continue;
    }

    if (ch === '{' || ch === '}' || ch === '[' || ch === ']') {
      tokens.push({ token: 'bracket', text: ch });
      i++;
      state.expectKey = ch === '{' || ch === '}';
      continue;
    }
    if (ch === ',') {
      tokens.push({ token: 'punctuation', text: ',' });
      i++;
      state.expectKey = true;
      continue;
    }

    const numMatch = /^-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/.exec(line.slice(i));
    if (numMatch) {
      const numText = numMatch[0];
      const after = line.slice(i + numText.length);
      const wsMatch = /^[ \t]*/.exec(after)!;
      const wsLen = wsMatch[0].length;
      const unitMatch = DURATION_UNITS.exec(after.slice(wsLen));
      if (unitMatch) {
        const totalLen = numText.length + wsLen + unitMatch[0].length;
        tokens.push({ token: 'duration', text: line.slice(i, i + totalLen) });
        i += totalLen;
        state.expectKey = false;
        continue;
      }
      tokens.push({ token: 'number', text: numText });
      i += numText.length;
      state.expectKey = false;
      continue;
    }

    const idMatch = /^[A-Za-z_][\w\-.]*/.exec(line.slice(i));
    if (idMatch) {
      const id = idMatch[0];
      let token: TokenType;

      if (id === 'include') {
        token = 'keyword';
      } else if (INCLUDE_FNS.has(id)) {
        token = 'includeFn';
      } else if (BOOLS.has(id)) {
        token = 'bool';
        state.expectKey = false;
      } else if (id === 'null') {
        token = 'null';
        state.expectKey = false;
      } else {
        const tail = line.slice(i + id.length).replace(/^[ \t]+/, '');
        const isKey = state.expectKey && (
          tail.startsWith(':') ||
          tail.startsWith('=') ||
          tail.startsWith('+=') ||
          tail.startsWith('{')
        );
        token = isKey ? 'key' : 'value';
        if (!isKey) state.expectKey = false;
      }
      tokens.push({ token, text: id });
      i += id.length;
      continue;
    }

    tokens.push({ token: null, text: ch });
    i++;
  }

  return tokens;
}
