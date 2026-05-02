import { StreamLanguage, HighlightStyle, syntaxHighlighting, type StreamParser } from '@codemirror/language';
import { tags, type Tag } from '@lezer/highlight';
import { tokenizeLine, createState, type TokenType, type TokenState } from './hocon-tokenizer';

const TAG_TABLE: Record<TokenType, Tag> = {
  comment: tags.lineComment,
  string: tags.string,
  substitution: tags.special(tags.string),
  key: tags.propertyName,
  operator: tags.operator,
  bracket: tags.bracket,
  punctuation: tags.punctuation,
  bool: tags.bool,
  null: tags.null,
  keyword: tags.keyword,
  includeFn: tags.function(tags.keyword),
  number: tags.number,
  duration: tags.unit,
  value: tags.atom,
};

const hoconParser: StreamParser<TokenState> = {
  name: 'hocon',

  startState(): TokenState {
    return createState();
  },

  token(stream, state) {
    if (stream.eatSpace()) return null;
    const rest = stream.string.slice(stream.pos);
    if (rest.length === 0) return null;

    const tokens = tokenizeLine(rest, state);
    if (tokens.length === 0) {
      stream.next();
      return null;
    }

    const first = tokens[0];
    stream.pos += first.text.length;
    if (first.token === null) return null;
    return first.token;
  },

  tokenTable: TAG_TABLE,

  indent(_state, textAfter, context) {
    const lineNo = context.state.doc.lineAt(context.pos).number;
    const prevLineNo = lineNo - 1;
    if (prevLineNo < 1) return 0;
    const prevLine = context.state.doc.line(prevLineNo);
    const prevText = stripStringsAndComments(prevLine.text);
    const prevIndent = /^[ \t]*/.exec(prevLine.text)![0].length;
    const indentUnit = context.unit;

    const trimmed = prevText.trimEnd();
    const opens = /[{[]$/.test(trimmed);
    const closesNext = /^[ \t]*[}\]]/.test(textAfter);

    let result = prevIndent;
    if (opens) result += indentUnit;
    if (closesNext) result = Math.max(0, result - indentUnit);
    return result;
  },

  languageData: {
    commentTokens: { line: '#' },
    closeBrackets: { brackets: ['(', '[', '{', '"'] },
    indentOnInput: /^\s*[}\]]$/,
  },
};

/**
 * Strip string literals and comments from a line so we don't count brackets
 * inside `"..."` or after `#`/`//`.
 */
function stripStringsAndComments(line: string): string {
  let out = '';
  let inString = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inString) {
      if (c === '\\') { i++; continue; }
      if (c === '"') inString = false;
      continue;
    }
    if (c === '"') { inString = true; continue; }
    if (c === '#') break;
    if (c === '/' && line[i + 1] === '/') break;
    out += c;
  }
  return out;
}

const highlightStyle = HighlightStyle.define([
  { tag: tags.lineComment, class: 'cm-tk-comment' },
  { tag: tags.string, class: 'cm-tk-string' },
  { tag: tags.special(tags.string), class: 'cm-tk-substitution' },
  { tag: tags.propertyName, class: 'cm-tk-key' },
  { tag: tags.operator, class: 'cm-tk-operator' },
  { tag: tags.bracket, class: 'cm-tk-bracket' },
  { tag: tags.punctuation, class: 'cm-tk-punctuation' },
  { tag: tags.bool, class: 'cm-tk-bool' },
  { tag: tags.null, class: 'cm-tk-null' },
  { tag: tags.keyword, class: 'cm-tk-keyword' },
  { tag: tags.function(tags.keyword), class: 'cm-tk-include-fn' },
  { tag: tags.number, class: 'cm-tk-number' },
  { tag: tags.unit, class: 'cm-tk-duration' },
  { tag: tags.atom, class: 'cm-tk-value' },
]);

export function hoconLanguage() {
  return [
    StreamLanguage.define(hoconParser),
    syntaxHighlighting(highlightStyle),
  ];
}
