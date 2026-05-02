import type { Lesson } from './types';

const lessonModules = import.meta.glob<unknown>('./lessons/*.json', {
  import: 'default',
  eager: true,
});

const ALL: Lesson[] = Object.entries(lessonModules)
  .sort(([a], [b]) => a.localeCompare(b))
  .flatMap(([path, raw]) => {
    const v = validateLesson(raw, path);
    if (!v.ok) {
      console.warn(`[playground] skipping malformed lesson ${path}: ${v.error}`);
      return [];
    }
    return [v.lesson];
  });

export function listLessons(): Lesson[] {
  return ALL;
}

export function getLesson(id: string): Lesson | undefined {
  return ALL.find((l) => l.id === id);
}

export function firstLessonId(): string {
  return ALL[0]?.id ?? '';
}

type Validation = { ok: true; lesson: Lesson } | { ok: false; error: string };

/**
 * Strict structural check. Bad lessons are dropped at load time so a typo
 * in one JSON can't crash the tutorial mid-course. Build-time test exercises
 * every shipped lesson through this same function.
 */
export function validateLesson(raw: unknown, source = '<inline>'): Validation {
  if (!raw || typeof raw !== 'object') return fail('lesson is not an object');
  const r = raw as Record<string, unknown>;
  if (typeof r.id !== 'string' || !r.id) return fail('missing string field `id`');
  if (typeof r.title !== 'string' || !r.title) return fail('missing string field `title`');
  if (typeof r.intro !== 'string') return fail('missing string field `intro`');
  if (typeof r.starter !== 'string') return fail('missing string field `starter`');
  if (typeof r.goal !== 'string') return fail('missing string field `goal`');
  if (!Array.isArray(r.hints) || r.hints.some((h) => typeof h !== 'string')) {
    return fail('`hints` must be string[]');
  }
  const c = r.check;
  if (!c || typeof c !== 'object') return fail('missing `check` object');
  const ck = c as Record<string, unknown>;
  if (ck.type !== 'regex') return fail(`unsupported check.type \`${String(ck.type)}\` (expected "regex")`);
  if (typeof ck.pattern !== 'string') return fail('`check.pattern` must be a string');
  try {
    new RegExp(ck.pattern, typeof ck.flags === 'string' ? ck.flags : '');
  } catch (e) {
    return fail(`check.pattern is not a valid regex: ${(e as Error).message}`);
  }
  if (r.next !== undefined && r.next !== null && typeof r.next !== 'string') {
    return fail('`next` must be string, null, or omitted');
  }
  return { ok: true, lesson: raw as Lesson };

  function fail(error: string): Validation {
    return { ok: false, error: `${source}: ${error}` };
  }
}
