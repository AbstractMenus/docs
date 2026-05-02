import type { TokenType } from '../cm/hocon-tokenizer';

export interface TokenWithPos {
  type: TokenType | 'newline';
  text: string;
  line: number;
  column: number;
  offset: number;
}

export interface Loc {
  line: number;
  column: number;
  endLine: number;
  endColumn: number;
  offset: number;
  length: number;
}

export interface Diagnostic {
  severity: 'error' | 'warning';
  message: string;
  line: number;
  column: number;
  endLine?: number;
  endColumn?: number;
  offset?: number;
  length?: number;
}

export type Node =
  | { kind: 'object'; entries: Entry[]; loc: Loc }
  | { kind: 'array'; items: Node[]; loc: Loc }
  | { kind: 'string'; value: string; loc: Loc }
  | { kind: 'number'; value: number; loc: Loc }
  | { kind: 'bool'; value: boolean; loc: Loc }
  | { kind: 'null'; loc: Loc }
  | { kind: 'substitution'; path: string[]; optional: boolean; loc: Loc }
  | { kind: 'duration'; raw: string; loc: Loc }
  | { kind: 'value'; value: string; loc: Loc }
  | { kind: 'include'; raw: string; loc: Loc };

export interface Entry {
  path: string[];
  value: Node;
  loc: Loc;
  append: boolean;
}

export interface ParseResult {
  ast: Node;
  diagnostics: Diagnostic[];
}

export interface ResolveResult {
  resolved: unknown;
  warnings: Diagnostic[];
}
