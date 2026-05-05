import { resolve } from '../hocon/resolve';
import type { Node, ResolveResult } from '../hocon/types';

/**
 * Resolve `activeName` against `parsedAsts` with cross-tab include support.
 *
 * Cycle detection lives inside resolve.ts via `opts.includeStack`. This
 * function only provides the AST lookup. The stack is seeded with
 * `activeName` so an include of the active file is also flagged as a cycle.
 *
 * If `activeName` is not in the map, returns an empty resolved object with
 * no warnings.
 */
export function resolveWorkspace(
  parsedAsts: Map<string, Node>,
  activeName: string,
): ResolveResult {
  const activeAst = parsedAsts.get(activeName);
  if (!activeAst) return { resolved: {}, warnings: [] };

  // Diagnostic: enable in DevTools with `__pgDebugIncludes = true` then
  // retrigger analysis (type any char). Logs the full set of tab names
  // resolveWorkspace was called with, alongside the active tab name.
  if (typeof console !== 'undefined' && (globalThis as { __pgDebugIncludes?: boolean }).__pgDebugIncludes) {
    console.warn('[playground] resolveWorkspace called:', {
      activeName,
      availableNames: Array.from(parsedAsts.keys()),
    });
  }

  return resolve(activeAst, {
    includeStack: [activeName],
    lookupInclude: (target) => parsedAsts.get(target),
  });
}
