import type { TutorialPanelApi } from '../TutorialPanel';
import { listLessons, getLesson, firstLessonId, prevLessonId, lessonPosition, lessonCount } from '../tutorial/lessons';
import { runCheck, loadProgress, saveProgress, markCompleted, markSkipped, bumpHint } from '../tutorial/engine';
import type { Lesson } from '../tutorial/types';
import type { Workspace } from '../files/types';
import { DEFAULT_TAB_NAME, WORKSPACE_VERSION } from '../files/types';
import { newTabFile } from '../files/workspace';
import { t } from '../i18n';

/**
 * Host abstraction the tutorial controller talks to instead of the editor
 * directly. Letting the controller swap whole workspaces (multi-tab) instead
 * of single doc strings lets lessons seed extra files (e.g. `defaults.conf`
 * for the include lesson) and lets per-lesson drafts capture tab state.
 *
 * `setWorkspace` replaces editor + tab bar + active tab in one shot.
 * `getWorkspace` reads back the current state so the controller can snapshot
 * a draft before the user navigates away.
 */
export interface WorkspaceHost {
  setWorkspace(ws: Workspace): void;
  getWorkspace(): Workspace;
}

/**
 * Owns "tutorial mode" state and wires the lesson-runner UI to the workspace.
 * The host calls `enter()` / `leave()` based on UI mode switching, and
 * `refresh()` whenever the editor doc changes so the "goal reached"
 * indicator stays in sync.
 *
 * In-flight edits to the current lesson are preserved as a full Workspace
 * snapshot in `lessonDrafts` (keyed by lesson id) across mode switches and
 * lesson navigation. Drafts are NOT persisted to localStorage - a page
 * reload still re-loads the lesson starter for the current lesson.
 */
export class TutorialController {
  private currentLesson: Lesson | null = null;
  /**
   * Per-lesson workspace drafts. We keep a snapshot per visited lesson id
   * so the user can flip back and forth between lessons without losing
   * in-flight edits in either direction. Cleared per-id on Reset and
   * cleared for the OUTGOING lesson on Skip / Next (advancing implies the
   * user is done with that lesson's draft).
   */
  private lessonDrafts = new Map<string, Workspace>();

  constructor(
    private readonly host: WorkspaceHost,
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
    // Snapshot the workspace for the lesson so re-entering tutorial mode
    // (without a lesson swap) restores the user's in-flight edits instead
    // of resetting them to the starter.
    if (this.currentLesson) {
      this.lessonDrafts.set(this.currentLesson.id, this.host.getWorkspace());
    }
    this.currentLesson = null;
  }

  /** Re-run the current lesson's check against the menu.conf tab. No-op outside tutorial mode. */
  refresh(): void {
    if (!this.currentLesson) return;
    const main = this.mainTabContent();
    if (main === null) return;
    const passed = runCheck(main, this.currentLesson.check);
    this.panel.setPassed(passed);
  }

  /**
   * Reset the current lesson back to a fresh workspace built from its
   * starter + extraFiles. Drops the persisted draft for this lesson so a
   * subsequent leave/enter doesn't bring the old edits back. No-op outside
   * tutorial mode.
   */
  reset(): void {
    if (!this.currentLesson) return;
    const fresh = this.makeFreshLessonWorkspace(this.currentLesson);
    this.lessonDrafts.set(this.currentLesson.id, fresh);
    this.host.setWorkspace(fresh);
    const passed = runCheck(this.currentLesson.starter, this.currentLesson.check);
    this.panel.setPassed(passed);
  }

  private loadLesson(id: string): void {
    const lesson = getLesson(id);
    if (!lesson) {
      this.panel.showCompleted(t('tutorial.done.body'));
      this.currentLesson = null;
      this.lessonDrafts.clear();
      return;
    }
    this.currentLesson = lesson;
    const progress = loadProgress();
    saveProgress({ ...progress, current: id });
    const hintsUsed = progress.hintsUsed[id] ?? 0;
    // Restore the draft if we have one for this lesson; otherwise build a
    // fresh workspace from the lesson's starter + extraFiles.
    const draft = this.lessonDrafts.get(id);
    const ws = draft ?? this.makeFreshLessonWorkspace(lesson);
    const mainContent = this.findMainContent(ws) ?? lesson.starter;
    const passed = runCheck(mainContent, lesson.check);
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
    this.host.setWorkspace(ws);
    this.onLessonOpened(id);
  }

  private advanceAfter(currentId: string): void {
    // Advancing leaves the current lesson behind - drop its draft.
    this.lessonDrafts.delete(currentId);
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
    this.lessonDrafts.set(this.currentLesson.id, this.host.getWorkspace());
    this.loadLesson(this.currentLesson.id);
  }

  private handleReset(): void {
    if (!this.currentLesson) return;
    if (!window.confirm(t('confirm.reset.tutorial'))) return;
    this.reset();
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
   * No-op at the first lesson. Snapshots the current lesson's draft before
   * navigating so flipping back forward restores in-flight edits.
   */
  private handlePrev(): void {
    if (!this.currentLesson) return;
    const prev = prevLessonId(this.currentLesson.id);
    if (!prev) return;
    this.lessonDrafts.set(this.currentLesson.id, this.host.getWorkspace());
    this.loadLesson(prev);
  }

  /**
   * Jump directly to any lesson by id (called from the lessons popup).
   * Same semantics as Prev: pure navigation, no progress mutation. The
   * destination lesson loads its draft if there is one, else a fresh
   * workspace from its starter + extraFiles.
   */
  private handleJump(id: string): void {
    if (!id || (this.currentLesson && this.currentLesson.id === id)) return;
    if (this.currentLesson) {
      this.lessonDrafts.set(this.currentLesson.id, this.host.getWorkspace());
    }
    this.loadLesson(id);
  }

  /** Build a fresh workspace for a lesson: menu.conf (starter) + extraFiles. */
  private makeFreshLessonWorkspace(lesson: Lesson): Workspace {
    const main = newTabFile(DEFAULT_TAB_NAME, lesson.starter);
    const extras = (lesson.extraFiles ?? []).map((f) => newTabFile(f.name, f.content));
    return { v: WORKSPACE_VERSION, tabs: [main, ...extras], activeTabId: main.id };
  }

  /** Read the current menu.conf tab content from the host. null when no tabs. */
  private mainTabContent(): string | null {
    return this.findMainContent(this.host.getWorkspace());
  }

  private findMainContent(ws: Workspace): string | null {
    const main = ws.tabs.find((t) => t.name === DEFAULT_TAB_NAME) ?? ws.tabs[0];
    return main ? main.content : null;
  }
}
