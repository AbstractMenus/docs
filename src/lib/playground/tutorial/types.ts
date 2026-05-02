export interface RegexCheck {
  type: 'regex';
  pattern: string;
  flags?: string;
}

export type CheckSpec = RegexCheck;

/**
 * Per-locale overrides for the human-readable parts of a lesson. `starter`
 * and `check` stay in the base lesson because they're code/regex, not prose.
 * Community contributors add a translation by dropping a new key into
 * `translations` - no loader change required.
 */
export interface LessonTranslation {
  title?: string;
  intro?: string;
  goal?: string;
  hints?: string[];
}

export interface Lesson {
  id: string;
  title: string;
  /**
   * Topic slug (required). Used to group lessons in the navigation popup
   * and as a translation-key suffix: `topic.<slug>` is rendered to the
   * user-facing label. Keep slugs ascii-kebab-case (e.g. "basics").
   */
  topic: string;
  /**
   * Optional sub-grouping within a topic. Same conventions as `topic`.
   * Lessons without a subtopic appear directly under their topic.
   */
  subtopic?: string;
  intro: string;
  starter: string;
  goal: string;
  check: CheckSpec;
  hints: string[];
  next?: string | null;
  translations?: Record<string, LessonTranslation>;
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
