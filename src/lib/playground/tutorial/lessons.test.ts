import { describe, test, expect } from 'vitest';
import {
  listLessons,
  getLesson,
  firstLessonId,
  validateLesson,
  applyTranslation,
  groupLessons,
  prevLessonId,
  lessonPosition,
  lessonCount,
} from './lessons';
import { runCheck } from './engine';
import type { Lesson } from './types';

describe('lessons loader', () => {
  test('finds at least 2 lessons', () => {
    expect(listLessons().length).toBeGreaterThanOrEqual(2);
  });

  test('lessons are sorted by id', () => {
    const ids = listLessons().map((l) => l.id);
    const sorted = [...ids].sort();
    expect(ids).toEqual(sorted);
  });

  test('01-introduction is first', () => {
    expect(firstLessonId()).toBe('01-introduction');
  });

  test('getLesson returns matching lesson', () => {
    expect(getLesson('01-introduction')?.title).toBe('Introduction');
  });

  test('getLesson returns undefined for unknown id', () => {
    expect(getLesson('999-nope')).toBeUndefined();
  });
});

describe('validateLesson', () => {
  const valid = {
    id: 'x',
    title: 'X',
    topic: 'basics',
    intro: 'i',
    starter: 's',
    goal: 'g',
    hints: ['a', 'b'],
    check: { type: 'regex', pattern: 'foo' },
  };

  test('valid lesson passes', () => {
    const r = validateLesson(valid);
    expect(r.ok).toBe(true);
  });

  test('missing field fails', () => {
    const { id, ...rest } = valid;
    void id;
    expect(validateLesson(rest).ok).toBe(false);
  });

  test('unknown check.type fails', () => {
    const r = validateLesson({ ...valid, check: { type: 'ast', pattern: 'x' } });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/regex/);
  });

  test('invalid regex pattern fails', () => {
    const r = validateLesson({ ...valid, check: { type: 'regex', pattern: '(' } });
    expect(r.ok).toBe(false);
  });

  test('null next is allowed (terminal lesson)', () => {
    expect(validateLesson({ ...valid, next: null }).ok).toBe(true);
  });

  test('numeric next is rejected', () => {
    expect(validateLesson({ ...valid, next: 5 }).ok).toBe(false);
  });

  test('hints must be string[]', () => {
    expect(validateLesson({ ...valid, hints: ['ok', 7] }).ok).toBe(false);
  });

  test('translations object is allowed', () => {
    const r = validateLesson({
      ...valid,
      translations: { ru: { title: 'X-ru', hints: ['a-ru'] } },
    });
    expect(r.ok).toBe(true);
  });

  test('translations as array is rejected', () => {
    expect(validateLesson({ ...valid, translations: [] }).ok).toBe(false);
  });

  test('translations.<lang>.title non-string is rejected', () => {
    expect(validateLesson({ ...valid, translations: { ru: { title: 5 } } }).ok).toBe(false);
  });

  test('translations.<lang>.hints non-string[] is rejected', () => {
    expect(validateLesson({ ...valid, translations: { ru: { hints: [1] } } }).ok).toBe(false);
  });

  test('missing topic is rejected', () => {
    const { topic, ...rest } = valid;
    void topic;
    expect(validateLesson(rest).ok).toBe(false);
  });

  test('empty topic is rejected', () => {
    expect(validateLesson({ ...valid, topic: '' }).ok).toBe(false);
  });

  test('subtopic when present must be non-empty string', () => {
    expect(validateLesson({ ...valid, subtopic: 'syntax' }).ok).toBe(true);
    expect(validateLesson({ ...valid, subtopic: '' }).ok).toBe(false);
    expect(validateLesson({ ...valid, subtopic: 5 }).ok).toBe(false);
  });

  test('shape check is accepted', () => {
    const r = validateLesson({
      ...valid,
      check: { type: 'shape', asserts: [{ kind: 'has', path: 'title' }] },
    });
    expect(r.ok).toBe(true);
  });

  test('shape check requires asserts array', () => {
    expect(validateLesson({
      ...valid,
      check: { type: 'shape', asserts: 'nope' },
    }).ok).toBe(false);
  });

  test('shape check rejects unknown assert kind', () => {
    expect(validateLesson({
      ...valid,
      check: { type: 'shape', asserts: [{ kind: 'whatever', path: 'x' }] },
    }).ok).toBe(false);
  });

  test('shape eq requires value field', () => {
    expect(validateLesson({
      ...valid,
      check: { type: 'shape', asserts: [{ kind: 'eq', path: 'x' }] },
    }).ok).toBe(false);
  });

  test('shape matches validates pattern as regex', () => {
    expect(validateLesson({
      ...valid,
      check: { type: 'shape', asserts: [{ kind: 'matches', path: 'x', pattern: '(' }] },
    }).ok).toBe(false);
  });

  test('unknown check.type rejected', () => {
    expect(validateLesson({
      ...valid,
      check: { type: 'whatever' },
    }).ok).toBe(false);
  });
});

describe('groupLessons / position helpers', () => {
  const lessons: Lesson[] = [
    { id: 'a', title: 'A', topic: 'basics', intro: '', starter: '', goal: '', hints: [], check: { type: 'regex', pattern: 'x' } },
    { id: 'b', title: 'B', topic: 'basics', subtopic: 'syntax', intro: '', starter: '', goal: '', hints: [], check: { type: 'regex', pattern: 'x' } },
    { id: 'c', title: 'C', topic: 'advanced', intro: '', starter: '', goal: '', hints: [], check: { type: 'regex', pattern: 'x' } },
    { id: 'd', title: 'D', topic: 'basics', subtopic: 'syntax', intro: '', starter: '', goal: '', hints: [], check: { type: 'regex', pattern: 'x' } },
  ];

  test('groups by topic preserving first-seen order', () => {
    const groups = groupLessons(lessons);
    expect(groups.map((g) => g.topic)).toEqual(['basics', 'advanced']);
  });

  test('groups subtopics within a topic, anonymous bucket goes first', () => {
    const groups = groupLessons(lessons);
    const basics = groups.find((g) => g.topic === 'basics')!;
    expect(basics.subtopics.map((s) => s.subtopic)).toEqual([null, 'syntax']);
    expect(basics.subtopics[0].lessons.map((l) => l.id)).toEqual(['a']);
    expect(basics.subtopics[1].lessons.map((l) => l.id)).toEqual(['b', 'd']);
  });

  test('lessonPosition is 1-based, 0 for unknown', () => {
    expect(lessonPosition('01-introduction')).toBe(1);
    expect(lessonPosition('02-comments')).toBe(2);
    expect(lessonPosition('999-nope')).toBe(0);
  });

  test('lessonCount matches shipped count', () => {
    expect(lessonCount()).toBe(listLessons().length);
  });

  test('prevLessonId returns previous or null at the boundary', () => {
    expect(prevLessonId('01-introduction')).toBeNull();
    expect(prevLessonId('02-comments')).toBe('01-introduction');
    expect(prevLessonId('999-nope')).toBeNull();
  });
});

describe('applyTranslation', () => {
  const base: Lesson = {
    id: 'demo',
    title: 'Title',
    topic: 'basics',
    intro: 'Intro',
    starter: 'starter',
    goal: 'Goal',
    hints: ['h1', 'h2'],
    check: { type: 'regex', pattern: 'x' },
    translations: {
      ru: { title: 'Заголовок', goal: 'Цель' },
    },
  };

  test('overlays known fields, keeps the rest from base', () => {
    const r = applyTranslation(base, 'ru');
    expect(r.title).toBe('Заголовок');
    expect(r.goal).toBe('Цель');
    expect(r.intro).toBe('Intro');     // not translated -> base
    expect(r.hints).toEqual(['h1', 'h2']);
    expect(r.starter).toBe('starter'); // never translated
  });

  test('returns base when no translation exists', () => {
    const r = applyTranslation(base, 'de');
    expect(r).toBe(base);
  });

  test('returns base when lesson has no translations field', () => {
    const noTr: Lesson = { ...base, translations: undefined };
    expect(applyTranslation(noTr, 'ru')).toBe(noTr);
  });
});

describe('shipped lessons sanity', () => {
  test('every shipped lesson has a usable starter and check', () => {
    for (const lesson of listLessons()) {
      expect(typeof runCheck(lesson.starter, lesson.check)).toBe('boolean');
    }
  });

  test('next references either exist or are null', () => {
    const ids = new Set(listLessons().map((l) => l.id));
    for (const lesson of listLessons()) {
      if (lesson.next != null) {
        expect(ids.has(lesson.next)).toBe(true);
      }
    }
  });
});
