import type { EditorApi } from '../Editor';
import type { TutorialPanelApi } from '../TutorialPanel';
import { listLessons, getLesson, firstLessonId } from '../tutorial/lessons';
import { runCheck, loadProgress, saveProgress, markCompleted, markSkipped, bumpHint } from '../tutorial/engine';
import type { Lesson } from '../tutorial/types';

const COMPLETED_TEXT = "You've finished every lesson. Try the editor mode now.";

/**
 * Owns "tutorial mode" state and wires the lesson-runner UI to the editor.
 * Stateless from the outside: the host calls `enter()` / `leave()` based on
 * UI mode switching, and `refresh()` whenever the editor doc changes so the
 * "goal reached" indicator stays in sync.
 */
export class TutorialController {
  private currentLesson: Lesson | null = null;

  constructor(
    private readonly editor: EditorApi,
    private readonly panel: TutorialPanelApi,
    private readonly onLessonOpened: (id: string) => void,
  ) {
    panel.onHint(() => this.handleHint());
    panel.onReset(() => this.handleReset());
    panel.onSkip(() => this.handleSkip());
    panel.onNext(() => this.handleNext());
  }

  isActive(): boolean {
    return this.currentLesson !== null;
  }

  enter(initialLessonId?: string | null): void {
    const id = initialLessonId ?? loadProgress().current ?? firstLessonId();
    this.loadLesson(id || firstLessonId());
  }

  leave(): void {
    this.currentLesson = null;
  }

  /** Re-run the current lesson's check against editor content. No-op outside tutorial mode. */
  refresh(): void {
    if (!this.currentLesson) return;
    const passed = runCheck(this.editor.getValue(), this.currentLesson.check);
    this.panel.setPassed(passed);
  }

  private loadLesson(id: string): void {
    const lesson = getLesson(id);
    if (!lesson) {
      this.panel.showCompleted(COMPLETED_TEXT);
      this.currentLesson = null;
      return;
    }
    this.currentLesson = lesson;
    const progress = loadProgress();
    saveProgress({ ...progress, current: id });
    const hintsUsed = progress.hintsUsed[id] ?? 0;
    const passed = runCheck(lesson.starter, lesson.check);
    this.panel.showLesson(lesson, { hintsUsed, passed });
    this.editor.setValue(lesson.starter);
    this.onLessonOpened(id);
  }

  private advanceAfter(currentId: string): void {
    const lessons = listLessons();
    const idx = lessons.findIndex((l) => l.id === currentId);
    const next = lessons[idx + 1];
    if (next) this.loadLesson(next.id);
    else this.panel.showCompleted(COMPLETED_TEXT);
  }

  private handleHint(): void {
    if (!this.currentLesson) return;
    saveProgress(bumpHint(loadProgress(), this.currentLesson.id));
    this.loadLesson(this.currentLesson.id);
  }

  private handleReset(): void {
    if (!this.currentLesson) return;
    this.editor.setValue(this.currentLesson.starter);
  }

  private handleSkip(): void {
    if (!this.currentLesson) return;
    saveProgress(markSkipped(loadProgress(), this.currentLesson.id));
    this.advanceAfter(this.currentLesson.id);
  }

  private handleNext(): void {
    if (!this.currentLesson) return;
    saveProgress(markCompleted(loadProgress(), this.currentLesson.id));
    this.advanceAfter(this.currentLesson.id);
  }
}
