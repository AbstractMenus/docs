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

/**
 * Stable identifier for a diagnostic kind. The localized message lives in
 * the translation table under `diag.<code>`. Adding a new emitter site
 * means: add a member here + add the matching key to all translation files
 * (a unit test asserts the en table has every code).
 */
export type DiagCode =
  // parser.ts
  | 'parser.unexpected-token'
  | 'parser.expected-value-after-sep'
  | 'parser.expected-key-separator'
  | 'parser.expected-closing-brace'
  | 'parser.unexpected-after-array-element'
  | 'parser.unexpected-in-array'
  | 'parser.expected-closing-bracket'
  // resolve.ts
  | 'resolve.circular-substitution'
  | 'resolve.unresolved-substitution'
  // unknown-keys.ts
  | 'validate.unknown-key'
  | 'validate.expected-list-of-objects';

export type DiagParams = Record<string, string | number>;

/**
 * `code` is the canonical identifier; `params` are the named values
 * interpolated into the localized template. `message` is the pre-formatted
 * string in the active locale - emitted at construction time so consumers
 * that don't know about i18n (like the CodeMirror linter overlay) can keep
 * reading it directly. ValidationPanel re-renders via `t()` on every
 * analysis tick, so locale changes still flow through.
 */
export interface Diagnostic {
  severity: 'error' | 'warning';
  code: DiagCode;
  params?: DiagParams;
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
  /**
   * Key path segments. Empty `[]` for spread entries (where `value` is a
   * substitution to be merged into the enclosing object).
   */
  path: string[];
  value: Node;
  loc: Loc;
  /** `true` for `+=` entries; resolver concatenates instead of overwriting. */
  append: boolean;
  /**
   * Inline-spread marker. When true, `value` is a substitution Node whose
   * resolved object is merged into the enclosing object's fields. The
   * `path` field is `[]`. Consumers iterating entries should skip spreads
   * if they're indexing by key.
   */
  spread?: boolean;
}

export interface ParseResult {
  ast: Node;
  diagnostics: Diagnostic[];
}

export interface ResolveResult {
  resolved: unknown;
  warnings: Diagnostic[];
}
