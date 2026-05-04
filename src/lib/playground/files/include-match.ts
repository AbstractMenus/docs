/**
 * Extract the file name out of any HOCON include shape:
 *   "x.conf"
 *   classpath("x")
 *   required("x")
 *   file("x")
 *   required(classpath("x"))
 *
 * Returns null if no quoted string can be located in the raw text.
 *
 * The caller (resolve-multi) does an exact-match lookup against tab names
 * with whatever this returns. We do not normalize paths or extensions in
 * Phase 1 - exact only.
 */
export function extractIncludeTarget(raw: string): string | null {
  const m = /"([^"]*)"/.exec(raw);
  if (!m) return null;
  return m[1];
}
