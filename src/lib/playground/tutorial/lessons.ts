import type { Lesson } from './types';

const lessonModules = import.meta.glob<Lesson>('./lessons/*.json', {
  import: 'default',
  eager: true,
});

const ALL: Lesson[] = Object.entries(lessonModules)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([, lesson]) => lesson);

export function listLessons(): Lesson[] {
  return ALL;
}

export function getLesson(id: string): Lesson | undefined {
  return ALL.find((l) => l.id === id);
}

export function firstLessonId(): string {
  return ALL[0]?.id ?? '';
}
