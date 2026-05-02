import { describe, test, expect } from 'vitest';
import { listLessons, getLesson, firstLessonId } from './lessons';

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
