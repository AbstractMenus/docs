import type { TokenWithPos, Node, Entry, Loc, Diagnostic, DiagCode, DiagParams, ParseResult } from './types';
import { formatDiagMessage } from './diag';

export function parse(tokens: TokenWithPos[]): ParseResult {
  const meaningful = tokens.filter((t) => t.type !== 'comment');
  const p = new Parser(meaningful);
  const root = p.parseRoot();
  return { ast: root, diagnostics: p.diagnostics };
}

class Parser {
  pos = 0;
  diagnostics: Diagnostic[] = [];

  constructor(private toks: TokenWithPos[]) {}

  peek(offset = 0): TokenWithPos | null {
    return this.toks[this.pos + offset] ?? null;
  }

  consume(): TokenWithPos | null {
    return this.toks[this.pos++] ?? null;
  }

  skipSeparators(): void {
    while (this.peek()) {
      const t = this.peek()!;
      if (t.type === 'newline') { this.pos++; continue; }
      if (t.type === 'punctuation' && t.text === ',') { this.pos++; continue; }
      break;
    }
  }

  emitError(code: DiagCode, params: DiagParams | undefined, t: TokenWithPos | null): void {
    const loc = t ?? this.toks[this.toks.length - 1] ?? this.makeFakeToken();
    this.diagnostics.push({
      severity: 'error',
      code,
      params,
      message: formatDiagMessage(code, params),
      line: loc.line,
      column: loc.column,
      offset: loc.offset,
      length: loc.text?.length ?? 1,
    });
  }

  emitWarning(code: DiagCode, params: DiagParams | undefined, t: TokenWithPos | null): void {
    const loc = t ?? this.makeFakeToken();
    this.diagnostics.push({
      severity: 'warning',
      code,
      params,
      message: formatDiagMessage(code, params),
      line: loc.line,
      column: loc.column,
      offset: loc.offset,
      length: loc.text?.length ?? 1,
    });
  }

  parseRoot(): Node {
    const start = this.peek() ?? this.makeFakeToken();
    const entries: Entry[] = [];
    this.skipSeparators();
    while (this.peek() !== null) {
      const before = this.pos;
      const e = this.parseEntry();
      if (e) entries.push(e);
      if (this.pos === before) this.pos++;
      this.skipSeparators();
    }
    const last = this.toks[this.toks.length - 1] ?? start;
    return {
      kind: 'object',
      entries,
      loc: this.locFromTo(start, last),
    };
  }

  parseEntry(): Entry | null {
    const first = this.peek();
    if (!first) return null;

    if (first.type === 'keyword' && first.text === 'include') {
      this.pos++;
      while (this.peek() && this.peek()!.type !== 'newline') {
        this.consume();
      }
      this.emitWarning('parser.include-not-supported', undefined, first);
      return null;
    }

    // Inline spread: `${ref}` at entry position (instead of `key = value`).
    // Consumed as a substitution Node and stored as a spread Entry; the
    // resolver merges the referenced object's fields into the enclosing
    // object. Own keys override spread fields (see resolve.ts).
    if (first.type === 'substitution') {
      const sub = this.parseValue();
      if (!sub || sub.kind !== 'substitution') return null;
      return { path: [], value: sub, loc: this.tokLoc(first), append: false, spread: true };
    }

    const path = this.parseKeyPath();
    if (path.length === 0) {
      this.emitError('parser.unexpected-token', { text: first.text }, first);
      this.pos++;
      return null;
    }

    const sep = this.peek();
    let append = false;
    let value: Node;

    if (sep?.type === 'operator' && (sep.text === '=' || sep.text === ':' || sep.text === '+=')) {
      append = sep.text === '+=';
      this.pos++;
      const v = this.parseValue();
      if (!v) {
        this.emitError('parser.expected-value-after-sep', { sep: sep.text }, sep);
        return null;
      }
      value = v;
    } else if (sep?.type === 'bracket' && sep.text === '{') {
      const obj = this.parseObject();
      if (!obj) return null;
      value = obj;
    } else {
      this.emitError('parser.expected-key-separator', undefined, sep ?? first);
      return null;
    }

    return {
      path,
      value,
      append,
      loc: this.locFromTo(first, this.toks[this.pos - 1] ?? first),
    };
  }

  parseKeyPath(): string[] {
    const t = this.peek();
    if (!t) return [];
    // Quoted string acts as a single literal key, dots inside are NOT split.
    // Per HOCON spec: `"a.b" = 1` is a top-level key named "a.b". We strip
    // the surrounding quotes only - escape sequences like \n stay literal so
    // downstream consumers (catalog lookup, validateUnknownKeys) compare
    // against the actual identifier characters the author typed.
    if (t.type === 'string') {
      this.pos++;
      return [this.stripQuotesOnly(t.text)];
    }
    if (t.type !== 'key') return [];
    this.pos++;
    return t.text.split('.');
  }

  stripQuotesOnly(raw: string): string {
    if (raw.startsWith('"""') && raw.endsWith('"""')) return raw.slice(3, -3);
    if (raw.startsWith('"') && raw.endsWith('"')) return raw.slice(1, -1);
    return raw;
  }

  parseValue(): Node | null {
    const t = this.peek();
    if (!t) return null;

    if (t.type === 'string') {
      this.pos++;
      return { kind: 'string', value: this.unquoteString(t.text), loc: this.tokLoc(t) };
    }
    if (t.type === 'number') {
      this.pos++;
      return { kind: 'number', value: Number(t.text), loc: this.tokLoc(t) };
    }
    if (t.type === 'bool') {
      this.pos++;
      const v = t.text === 'true' || t.text === 'yes' || t.text === 'on';
      return { kind: 'bool', value: v, loc: this.tokLoc(t) };
    }
    if (t.type === 'null') {
      this.pos++;
      return { kind: 'null', loc: this.tokLoc(t) };
    }
    if (t.type === 'duration') {
      this.pos++;
      return { kind: 'duration', raw: t.text, loc: this.tokLoc(t) };
    }
    if (t.type === 'value') {
      this.pos++;
      return { kind: 'value', value: t.text, loc: this.tokLoc(t) };
    }
    if (t.type === 'substitution') {
      this.pos++;
      const inner = t.text.replace(/^\$\{\??/, '').replace(/\}$/, '');
      const optional = t.text.startsWith('${?');
      return { kind: 'substitution', path: inner.split('.'), optional, loc: this.tokLoc(t) };
    }
    if (t.type === 'bracket' && t.text === '{') return this.parseObject();
    if (t.type === 'bracket' && t.text === '[') return this.parseArray();

    return null;
  }

  parseObject(): Node | null {
    const open = this.peek();
    if (!open || open.text !== '{') return null;
    this.pos++;
    const entries: Entry[] = [];
    this.skipSeparators();
    while (this.peek() && this.peek()!.text !== '}') {
      const before = this.pos;
      const e = this.parseEntry();
      if (e) entries.push(e);
      if (this.pos === before) this.pos++;
      this.skipSeparators();
    }
    const close = this.peek();
    if (!close || close.text !== '}') {
      this.emitError('parser.expected-closing-brace', undefined, open);
      return { kind: 'object', entries, loc: this.locFromTo(open, this.toks[this.pos - 1] ?? open) };
    }
    this.pos++;
    return { kind: 'object', entries, loc: this.locFromTo(open, close) };
  }

  parseArray(): Node | null {
    const open = this.peek();
    if (!open || open.text !== '[') return null;
    this.pos++;
    const items: Node[] = [];
    this.skipSeparators();
    while (this.peek() && this.peek()!.text !== ']') {
      const before = this.pos;
      const v = this.parseValue();
      if (v) {
        items.push(v);
        // After a value, the only legal continuations are `,`/`;`/newline/`]`.
        const next = this.peek();
        if (next && next.text !== ',' && next.text !== ';' && next.text !== ']' && next.type !== 'newline') {
          this.emitError(
            'parser.unexpected-after-array-element',
            { text: next.text },
            next,
          );
          this.pos++;
        }
      } else if (this.pos === before) {
        // parseValue couldn't recognise the token (e.g. it's a `key`-typed
        // identifier that belongs in an object). Emit an error and skip.
        const t = this.peek()!;
        this.emitError(
          'parser.unexpected-in-array',
          { text: t.text },
          t,
        );
        this.pos++;
      }
      this.skipSeparators();
    }
    const close = this.peek();
    if (!close || close.text !== ']') {
      this.emitError('parser.expected-closing-bracket', undefined, open);
      return { kind: 'array', items, loc: this.locFromTo(open, this.toks[this.pos - 1] ?? open) };
    }
    this.pos++;
    return { kind: 'array', items, loc: this.locFromTo(open, close) };
  }

  unquoteString(raw: string): string {
    if (raw.startsWith('"""') && raw.endsWith('"""')) return raw.slice(3, -3);
    if (raw.startsWith('"') && raw.endsWith('"')) {
      return raw.slice(1, -1).replace(/\\(.)/g, (_, c) => {
        switch (c) {
          case 'n': return '\n';
          case 't': return '\t';
          case 'r': return '\r';
          case '"': return '"';
          case '\\': return '\\';
          default: return c;
        }
      });
    }
    return raw;
  }

  tokLoc(t: TokenWithPos): Loc {
    return {
      line: t.line,
      column: t.column,
      endLine: t.line,
      endColumn: t.column + t.text.length,
      offset: t.offset,
      length: t.text.length,
    };
  }

  locFromTo(a: TokenWithPos, b: TokenWithPos): Loc {
    return {
      line: a.line,
      column: a.column,
      endLine: b.line,
      endColumn: b.column + b.text.length,
      offset: a.offset,
      length: (b.offset - a.offset) + b.text.length,
    };
  }

  makeFakeToken(): TokenWithPos {
    return { type: 'value', text: '', line: 1, column: 1, offset: 0 };
  }
}
