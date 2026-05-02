import { describe, test, expect } from 'vitest';
import { listLessons, getLesson, firstLessonId, validateLesson } from './lessons';
import { runCheck } from './engine';

describe('lessons loader', () => {
  test('finds at least 2 lessons', () => {
    expect(listLessons().length).toBeGreaterThanOrEqual(2);
  });

  test('lessons are sorted by id', () => {
    const ids = listLessons().map((l) => l.id);
    const sorted = [...ids].sort();
    expect(ids).toEqual(sorted);
  });

  test('00-introduction is first', () => {
    expect(firstLessonId()).toBe('00-introduction');
  });

  test('getLesson returns matching lesson', () => {
    expect(getLesson('00-introduction')?.title).toBe('Introduction');
  });

  test('getLesson returns undefined for unknown id', () => {
    expect(getLesson('999-nope')).toBeUndefined();
  });
});

describe('validateLesson', () => {
  const valid = {
    id: 'x',
    title: 'X',
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
