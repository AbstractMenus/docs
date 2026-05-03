import type { Lesson } from './types';
import { getLang } from '../i18n';

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
  const lang = getLang();
  return ALL.map((l) => applyTranslation(l, lang));
}

export function getLesson(id: string): Lesson | undefined {
  const base = ALL.find((l) => l.id === id);
  return base ? applyTranslation(base, getLang()) : undefined;
}

export function firstLessonId(): string {
  return ALL[0]?.id ?? '';
}

/**
 * Overlay a per-locale translation onto a lesson. Missing fields fall back
 * to the canonical (typically English) lesson, so partial translations are
 * fine. Returns the original lesson when no translation exists for the
 * active language.
 */
export function applyTranslation(lesson: Lesson, lang: string): Lesson {
  const tr = lesson.translations?.[lang];
  if (!tr) return lesson;
  return {
    ...lesson,
    title: tr.title ?? lesson.title,
    intro: tr.intro ?? lesson.intro,
    goal: tr.goal ?? lesson.goal,
    hints: tr.hints ?? lesson.hints,
  };
}

export interface SubtopicGroup {
  /** null when the parent topic has lessons without a subtopic. */
  subtopic: string | null;
  lessons: Lesson[];
}

export interface TopicGroup {
  topic: string;
  subtopics: SubtopicGroup[];
}

/**
 * Group a flat lesson list into Topic -> Subtopic -> [Lesson] for rendering
 * the navigation popup. Topic order follows the first occurrence of each
 * topic in the input (which is sorted by id), so `00-introduction` belongs
 * under whatever its topic is and that topic appears first.
 *
 * Lessons without a subtopic are collected into a single anonymous bucket
 * (`subtopic: null`) at the top of their topic.
 */
export function groupLessons(lessons: Lesson[]): TopicGroup[] {
  const topics = new Map<string, Map<string | null, Lesson[]>>();
  for (const l of lessons) {
    const t = topics.get(l.topic) ?? new Map<string | null, Lesson[]>();
    if (!topics.has(l.topic)) topics.set(l.topic, t);
    const sub = l.subtopic ?? null;
    const bucket = t.get(sub) ?? [];
    if (!t.has(sub)) t.set(sub, bucket);
    bucket.push(l);
  }
  return Array.from(topics.entries()).map(([topic, subMap]) => ({
    topic,
    subtopics: Array.from(subMap.entries()).map(([subtopic, ls]) => ({ subtopic, lessons: ls })),
  }));
}

/** 1-based position of `id` in the global lesson order. 0 if not found. */
export function lessonPosition(id: string): number {
  const lessons = listLessons();
  return lessons.findIndex((l) => l.id === id) + 1;
}

/** Total lesson count (post-translation, but count is locale-invariant). */
export function lessonCount(): number {
  return ALL.length;
}

/**
 * Returns the previous lesson id by global order, or null if `id` is the
 * first lesson (or unknown). Mirrors the implicit "next via order" used by
 * advanceAfter() in the controller.
 */
export function prevLessonId(id: string): string | null {
  const lessons = listLessons();
  const idx = lessons.findIndex((l) => l.id === id);
  if (idx <= 0) return null;
  return lessons[idx - 1].id;
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
  if (typeof r.topic !== 'string' || !r.topic) return fail('missing string field `topic`');
  if (r.subtopic !== undefined && (typeof r.subtopic !== 'string' || !r.subtopic)) {
    return fail('`subtopic` must be a non-empty string when present');
  }
  if (typeof r.intro !== 'string') return fail('missing string field `intro`');
  if (typeof r.starter !== 'string') return fail('missing string field `starter`');
  if (typeof r.goal !== 'string') return fail('missing string field `goal`');
  if (!Array.isArray(r.hints) || r.hints.some((h) => typeof h !== 'string')) {
    return fail('`hints` must be string[]');
  }
  const c = r.check;
  if (!c || typeof c !== 'object') return fail('missing `check` object');
  const ck = c as Record<string, unknown>;
  if (ck.type === 'regex') {
    if (typeof ck.pattern !== 'string') return fail('`check.pattern` must be a string');
    try {
      new RegExp(ck.pattern, typeof ck.flags === 'string' ? ck.flags : '');
    } catch (e) {
      return fail(`check.pattern is not a valid regex: ${(e as Error).message}`);
    }
  } else if (ck.type === 'shape') {
    if (!Array.isArray(ck.asserts)) return fail('`check.asserts` must be an array');
    for (let i = 0; i < ck.asserts.length; i++) {
      const a = ck.asserts[i];
      if (!a || typeof a !== 'object' || Array.isArray(a)) return fail(`check.asserts[${i}] must be an object`);
      const aa = a as Record<string, unknown>;
      if (typeof aa.path !== 'string' || !aa.path) return fail(`check.asserts[${i}].path must be a non-empty string`);
      if (aa.kind === 'has') {
        // no extra fields
      } else if (aa.kind === 'eq') {
        if (!('value' in aa)) return fail(`check.asserts[${i}] (eq) requires \`value\``);
      } else if (aa.kind === 'matches') {
        if (typeof aa.pattern !== 'string') return fail(`check.asserts[${i}] (matches) requires string \`pattern\``);
        try {
          new RegExp(aa.pattern, typeof aa.flags === 'string' ? aa.flags : '');
        } catch (e) {
          return fail(`check.asserts[${i}].pattern is not a valid regex: ${(e as Error).message}`);
        }
      } else {
        return fail(`check.asserts[${i}].kind must be "has", "eq", or "matches" (got \`${String(aa.kind)}\`)`);
      }
    }
  } else {
    return fail(`unsupported check.type \`${String(ck.type)}\` (expected "regex" or "shape")`);
  }
  if (r.next !== undefined && r.next !== null && typeof r.next !== 'string') {
    return fail('`next` must be string, null, or omitted');
  }
  if (r.translations !== undefined) {
    if (!r.translations || typeof r.translations !== 'object' || Array.isArray(r.translations)) {
      return fail('`translations` must be an object keyed by lang code');
    }
    for (const [code, tr] of Object.entries(r.translations as Record<string, unknown>)) {
      if (!tr || typeof tr !== 'object' || Array.isArray(tr)) {
        return fail(`translations.${code} must be an object`);
      }
      const t = tr as Record<string, unknown>;
      for (const k of ['title', 'intro', 'goal'] as const) {
        if (t[k] !== undefined && typeof t[k] !== 'string') {
          return fail(`translations.${code}.${k} must be a string`);
        }
      }
      if (t.hints !== undefined) {
        if (!Array.isArray(t.hints) || t.hints.some((h) => typeof h !== 'string')) {
          return fail(`translations.${code}.hints must be string[]`);
        }
      }
    }
  }
  return { ok: true, lesson: raw as Lesson };

  function fail(error: string): Validation {
    return { ok: false, error: `${source}: ${error}` };
  }
}
