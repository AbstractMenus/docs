export interface RegexCheck {
  type: 'regex';
  pattern: string;
  flags?: string;
}

export type CheckSpec = RegexCheck;

export interface Lesson {
  id: string;
  title: string;
  intro: string;
  starter: string;
  goal: string;
  check: CheckSpec;
  hints: string[];
  next?: string | null;
}

export interface Progress {
  current: string;
  completed: string[];
  skipped: string[];
  hintsUsed: Record<string, number>;
}

export const EMPTY_PROGRESS: Progress = {
  current: '',
  completed: [],
  skipped: [],
  hintsUsed: {},
};
