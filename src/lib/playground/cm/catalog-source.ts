import { snippetCompletion, type Completion, type CompletionContext, type CompletionResult } from '@codemirror/autocomplete';
import { getKeysForScope, getEnumValues, findKeyDef, type KeyDef } from '../catalog';
import { describeKeyDef } from '../catalog/i18n';
import { detectScope } from './scope';
import { hoconSnippets } from './snippets';

export interface CatalogSourceOptions {
  fallbackSnippets?: Completion[];
}

/**
 * In an array context (cursor inside `items = [│]`) the only legal element
 * is an object literal of the matching shape - dumping all object fields
 * here would just generate invalid HOCON. Map list-scopes to the snippet
 * that inserts a skeleton.
 */
const LIST_SCOPE_TO_SNIPPET: Record<string, string> = {
  'item-list': 'item',
  'binding-list': 'binding',
  'firework-effect-list': 'fireworkEffect',
};

export function createCatalogSource(opts: CatalogSourceOptions = {}) {
  return function catalogSource(context: CompletionContext): CompletionResult | null {
    const text = context.state.doc.toString();
    const pos = context.pos;

    const enumComps = enumCompletionsForCursor(text, pos);
    if (enumComps) return enumComps;

    const word = context.matchBefore(/[\w-]*/);
    if (!word || (word.from === word.to && !context.explicit)) return null;

    const scope = detectScope(text, pos);

    const skeletonName = LIST_SCOPE_TO_SNIPPET[scope];
    if (skeletonName) {
      const snip = hoconSnippets.find((s) => s.label === skeletonName);
      if (snip) {
        return {
          from: word.from,
          options: [snippetCompletion(snip.template, { label: snip.label, info: snip.info, type: 'snippet' })],
          validFor: /^[\w-]*$/,
        };
      }
      return null;
    }

    const keyDefs = getKeysForScope(scope);
    const keyComps = keyDefs.map(keyToCompletion);

    return {
      from: word.from,
      options: [...keyComps, ...(opts.fallbackSnippets ?? [])],
      validFor: /^[\w-]*$/,
    };
  };
}

function keyToCompletion(k: KeyDef): Completion {
  const detail = k.valueType === 'enum' ? `enum:${k.enumRef}` : k.valueType;
  return {
    label: k.name,
    type: 'property',
    detail,
    info: describeKeyDef(k),
    apply: k.name,
    boost: k.valueType === 'enum' ? 2 : 1,
  };
}

interface EnumContext {
  enumName: 'materials' | 'sounds';
  from: number;
  to: number;
}

export function findEnumContextAtCursor(text: string, pos: number): EnumContext | null {
  const lineStart = text.lastIndexOf('\n', pos - 1) + 1;
  const linePrefix = text.slice(lineStart, pos);
  const m = /([A-Za-z_][\w-]*)\s*[=:]\s*"?([A-Za-z_][\w_]*)?$/.exec(linePrefix);
  if (!m) return null;
  const keyName = m[1];
  const partial = m[2] ?? '';
  const def = findKeyDef(keyName);
  if (!def || def.valueType !== 'enum' || !def.enumRef) return null;
  const partialStart = lineStart + linePrefix.length - partial.length;
  return { enumName: def.enumRef, from: partialStart, to: pos };
}

function enumCompletionsForCursor(text: string, pos: number): CompletionResult | null {
  const ctx = findEnumContextAtCursor(text, pos);
  if (!ctx) return null;
  const values = getEnumValues(ctx.enumName);
  return {
    from: ctx.from,
    to: ctx.to,
    options: values.map((v) => ({ label: v, type: 'enum', boost: 1 })),
    validFor: /^[A-Z_0-9]*$/i,
  };
}
