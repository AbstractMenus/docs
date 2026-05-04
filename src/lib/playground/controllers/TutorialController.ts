import type { EditorApi } from '../Editor';
import type { TutorialPanelApi } from '../TutorialPanel';
import { listLessons, getLesson, firstLessonId, prevLessonId, lessonPosition, lessonCount } from '../tutorial/lessons';
import { runCheck, loadProgress, saveProgress, markCompleted, markSkipped, bumpHint } from '../tutorial/engine';
import type { Lesson } from '../tutorial/types';
import { t } from '../i18n';

/**
 * Owns "tutorial mode" state and wires the lesson-runner UI to the editor.
 * The host calls `enter()` / `leave()` based on UI mode switching, and
 * `refresh()` whenever the editor doc changes so the "goal reached"
 * indicator stays in sync.
 *
 * In-flight edits to the current lesson are preserved in `currentDraft`
 * across mode switches (editor <-> tutorial), so toggling mode never
 * silently throws away work. Drafts are NOT persisted to localStorage -
 * a page reload still re-loads the lesson starter.
 */
export class TutorialController {
  private currentLesson: Lesson | null = null;
  /**
   * Draft of the most recently active lesson (id + content). Stored as a
   * pair so the draft is only restored when re-entering THAT lesson - going
   * to a different lesson always loads its starter, never another lesson's
   * leftovers. At most one draft is held at any time.
   */
  private lastDraft: { id: string; content: string } | null = null;

  constructor(
    private readonly editor: EditorApi,
    private readonly panel: TutorialPanelApi,
    private readonly onLessonOpened: (id: string) => void,
  ) {
    panel.onHint(() => this.handleHint());
    panel.onReset(() => this.handleReset());
    panel.onSkip(() => this.handleSkip());
    panel.onNext(() => this.handleNext());
    panel.onPrev(() => this.handlePrev());
    panel.onJump((id) => this.handleJump(id));
  }

  isActive(): boolean {
    return this.currentLesson !== null;
  }

  enter(initialLessonId?: string | null): void {
    const requested = initialLessonId ?? loadProgress().current ?? firstLessonId();
    // If the saved/url id no longer exists (lesson was renamed or removed in
    // a content refactor), fall back to the first lesson rather than show
    // "Course complete" - that screen is for actual completion, not for
    // stale state.
    const id = (requested && getLesson(requested)) ? requested : firstLessonId();
    this.loadLesson(id);
  }

  leave(): void {
    // Snapshot the editor for the lesson so re-entering tutorial mode
    // (without a lesson swap) restores the user's in-flight edits instead
    // of resetting them to the starter.
    if (this.currentLesson) {
      this.lastDraft = { id: this.currentLesson.id, content: this.editor.getValue() };
    }
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
      this.panel.showCompleted(t('tutorial.done.body'));
      this.currentLesson = null;
      this.lastDraft = null;
      return;
    }
    this.currentLesson = lesson;
    const progress = loadProgress();
    saveProgress({ ...progress, current: id });
    const hintsUsed = progress.hintsUsed[id] ?? 0;
    // Restore the draft only if it belongs to THIS lesson; otherwise it's
    // leftovers from a different lesson the user was working on.
    const draftMatches = this.lastDraft && this.lastDraft.id === id;
    const initialContent = draftMatches ? this.lastDraft!.content : lesson.starter;
    if (!draftMatches) this.lastDraft = null;
    const passed = runCheck(initialContent, lesson.check);
    this.panel.showLesson(lesson, {
      hintsUsed,
      passed,
      position: lessonPosition(id),
      total: lessonCount(),
      allLessons: listLessons(),
      progress: {
        completed: new Set(progress.completed),
        skipped: new Set(progress.skipped),
      },
      hasPrev: prevLessonId(id) !== null,
    });
    this.editor.setValue(initialContent);
    this.onLessonOpened(id);
  }

  private advanceAfter(currentId: string): void {
    // Advancing leaves the current lesson behind - drop its draft.
    this.lastDraft = null;
    const lessons = listLessons();
    const idx = lessons.findIndex((l) => l.id === currentId);
    const next = lessons[idx + 1];
    if (next) this.loadLesson(next.id);
    else this.panel.showCompleted(t('tutorial.done.body'));
  }

  private handleHint(): void {
    if (!this.currentLesson) return;
    saveProgress(bumpHint(loadProgress(), this.currentLesson.id));
    // Preserve the user's edits when re-rendering the panel for the new hint.
    this.lastDraft = { id: this.currentLesson.id, content: this.editor.getValue() };
    this.loadLesson(this.currentLesson.id);
  }

  private handleReset(): void {
    if (!this.currentLesson) return;
    if (!window.confirm(t('confirm.reset.tutorial'))) return;
    this.lastDraft = null;
    this.editor.setValue(this.currentLesson.starter);
    // Re-run check so the "Next" button state reflects the fresh starter.
    const passed = runCheck(this.currentLesson.starter, this.currentLesson.check);
    this.panel.setPassed(passed);
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

  /**
   * Navigate to the previous lesson WITHOUT mutating progress. Unlike Skip
   * (which marks the current lesson as skipped) or Next (which marks it
   * completed), Prev is pure navigation - the user is just paging back.
   * No-op at the first lesson.
   */
  private handlePrev(): void {
    if (!this.currentLesson) return;
    const prev = prevLessonId(this.currentLesson.id);
    if (!prev) return;
    this.lastDraft = null; // discard current lesson's draft on navigation
    this.loadLesson(prev);
  }

  /**
   * Jump directly to any lesson by id (called from the lessons popup).
   * Same semantics as Prev: pure navigation, no progress mutation. The
   * destination lesson loads its starter (drafts only survive on the
   * exact lesson they belong to).
   */
  private handleJump(id: string): void {
    if (!id || (this.currentLesson && this.currentLesson.id === id)) return;
    this.lastDraft = null;
    this.loadLesson(id);
  }
}
