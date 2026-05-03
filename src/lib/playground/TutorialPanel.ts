import type { Lesson } from './tutorial/types';
import { renderMd, renderInlineMd } from './tutorial/markdown';
import { groupLessons, type TopicGroup } from './tutorial/lessons';
import { t, type TranslationKey } from './i18n';

type Listener = () => void;
type IdListener = (id: string) => void;

/**
 * Read-only snapshot of progress used to decorate the lesson list. The
 * controller passes this in on every render so the popup never reads
 * progress directly.
 */
export interface LessonProgressView {
  completed: Set<string>;
  skipped: Set<string>;
}

export interface ShowLessonOpts {
  hintsUsed: number;
  passed: boolean;
  /** 1-based global position of this lesson in the sorted list. */
  position: number;
  /** Total lesson count. */
  total: number;
  /** All lessons (post-translation) for the popup tree. */
  allLessons: Lesson[];
  progress: LessonProgressView;
  /** True when this lesson has a previous lesson in the global order. */
  hasPrev: boolean;
}

export interface TutorialPanelApi {
  showLesson(lesson: Lesson, opts: ShowLessonOpts): void;
  showCompleted(text: string): void;
  setPassed(passed: boolean): void;
  onHint(fn: Listener): void;
  onReset(fn: Listener): void;
  onSkip(fn: Listener): void;
  onNext(fn: Listener): void;
  onPrev(fn: Listener): void;
  onJump(fn: IdListener): void;
}

export function createTutorialPanel(host: HTMLElement): TutorialPanelApi {
  const onHintFns: Listener[] = [];
  const onResetFns: Listener[] = [];
  const onSkipFns: Listener[] = [];
  const onNextFns: Listener[] = [];
  const onPrevFns: Listener[] = [];
  const onJumpFns: IdListener[] = [];

  function showLesson(lesson: Lesson, opts: ShowLessonOpts): void {
    const wrap = document.createElement('div');
    wrap.className = 'pg-tutorial';

    wrap.appendChild(buildBreadcrumb(lesson, opts));
    wrap.appendChild(buildHead(lesson, opts.passed));

    const intro = document.createElement('div');
    intro.className = 'pg-tutorial-intro';
    intro.innerHTML = renderMd(lesson.intro);
    wrap.appendChild(intro);

    const goal = document.createElement('div');
    goal.className = 'pg-tutorial-goal';
    const goalLabel = document.createElement('strong');
    goalLabel.textContent = t('tutorial.goalLabel');
    goal.appendChild(goalLabel);
    // The goal often references HOCON keys/snippets via backticks; render
    // them through the inline markdown pipeline so they show as <code>
    // (and any link/bold) instead of literal characters.
    const goalText = document.createElement('span');
    goalText.innerHTML = renderInlineMd(lesson.goal);
    goal.appendChild(goalText);
    wrap.appendChild(goal);

    if (opts.hintsUsed > 0) {
      const hintList = document.createElement('div');
      hintList.className = 'pg-tutorial-hints';
      const revealed = Math.min(opts.hintsUsed, lesson.hints.length);
      for (let i = 0; i < revealed; i++) {
        const item = document.createElement('div');
        item.className = 'pg-tutorial-hint';
        item.innerHTML = renderMd(lesson.hints[i]);
        hintList.appendChild(item);
      }
      wrap.appendChild(hintList);
    }

    wrap.appendChild(buildActions(lesson, opts));

    host.replaceChildren(wrap);
  }

  /**
   * Top strip: breadcrumb (Topic / Subtopic), counter (Lesson N / Total),
   * Prev arrow, and the All-lessons trigger which toggles the popup.
   */
  function buildBreadcrumb(lesson: Lesson, opts: ShowLessonOpts): HTMLElement {
    const bar = document.createElement('div');
    bar.className = 'pg-tutorial-bar';

    const crumbs = document.createElement('div');
    crumbs.className = 'pg-tutorial-crumbs';
    const topic = document.createElement('span');
    topic.className = 'pg-tutorial-crumb';
    topic.textContent = topicLabel(lesson.topic);
    crumbs.appendChild(topic);
    if (lesson.subtopic) {
      const sep = document.createElement('span');
      sep.className = 'pg-tutorial-crumb-sep';
      sep.textContent = '/';
      crumbs.appendChild(sep);
      const sub = document.createElement('span');
      sub.className = 'pg-tutorial-crumb';
      sub.textContent = subtopicLabel(lesson.subtopic);
      crumbs.appendChild(sub);
    }
    const counter = document.createElement('span');
    counter.className = 'pg-tutorial-counter';
    counter.textContent = ' · ' + t('tutorial.counter', { n: opts.position, total: opts.total });
    crumbs.appendChild(counter);
    bar.appendChild(crumbs);

    const prevBtn = mkBtn(t('tutorial.btn.prev'), 'prev');
    prevBtn.classList.add('pg-tutorial-nav');
    prevBtn.disabled = !opts.hasPrev;
    prevBtn.addEventListener('click', () => onPrevFns.forEach((fn) => fn()));
    bar.appendChild(prevBtn);

    const listBtn = mkBtn(t('tutorial.btn.allLessons'), 'all-lessons');
    listBtn.classList.add('pg-tutorial-nav');
    listBtn.title = t('tutorial.btn.allLessons.title');
    bar.appendChild(listBtn);

    const popup = buildLessonsPopup(lesson, opts);
    bar.appendChild(popup);

    listBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      popup.hidden = !popup.hidden;
    });
    document.addEventListener('click', (e) => {
      const within = (e.target as Element)?.closest?.('.pg-tutorial-bar');
      if (!within) popup.hidden = true;
    });

    return bar;
  }

  function buildHead(lesson: Lesson, passed: boolean): HTMLElement {
    const head = document.createElement('header');
    head.className = 'pg-tutorial-head';
    const h = document.createElement('h2');
    h.className = 'pg-tutorial-title';
    h.textContent = lesson.title;
    head.appendChild(h);

    const banner = document.createElement('div');
    banner.className = 'pg-tutorial-passed';
    banner.textContent = t('tutorial.passed');
    if (!passed) banner.style.display = 'none';
    head.appendChild(banner);
    return head;
  }

  function buildActions(lesson: Lesson, opts: ShowLessonOpts): HTMLElement {
    const actions = document.createElement('div');
    actions.className = 'pg-tutorial-actions';

    const hintBtn = mkBtn(t('tutorial.btn.hint'), 'hint');
    if (opts.hintsUsed >= lesson.hints.length) hintBtn.disabled = true;
    hintBtn.addEventListener('click', () => onHintFns.forEach((fn) => fn()));
    actions.appendChild(hintBtn);

    const resetBtn = mkBtn(t('tutorial.btn.reset'), 'reset');
    resetBtn.addEventListener('click', () => onResetFns.forEach((fn) => fn()));
    actions.appendChild(resetBtn);

    const skipBtn = mkBtn(t('tutorial.btn.skip'), 'skip');
    skipBtn.addEventListener('click', () => onSkipFns.forEach((fn) => fn()));
    actions.appendChild(skipBtn);

    const nextBtn = mkBtn(t('tutorial.btn.next'), 'next');
    nextBtn.classList.add('pg-btn-primary');
    nextBtn.disabled = !opts.passed;
    nextBtn.addEventListener('click', () => onNextFns.forEach((fn) => fn()));
    actions.appendChild(nextBtn);
    return actions;
  }

  /**
   * Popup tree of lessons grouped by topic -> subtopic, with progress
   * markers next to each lesson. Anchored to the All-lessons button via
   * absolute positioning in CSS; click-outside closes via a delegated
   * handler in buildBreadcrumb().
   */
  function buildLessonsPopup(currentLesson: Lesson, opts: ShowLessonOpts): HTMLElement {
    const popup = document.createElement('div');
    popup.className = 'pg-tutorial-popup';
    popup.hidden = true;

    if (opts.allLessons.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'pg-empty';
      empty.textContent = t('tutorial.popup.empty');
      popup.appendChild(empty);
      return popup;
    }

    const groups: TopicGroup[] = groupLessons(opts.allLessons);
    for (const g of groups) {
      const topicEl = document.createElement('div');
      topicEl.className = 'pg-tutorial-popup-topic';
      const topicHead = document.createElement('div');
      topicHead.className = 'pg-tutorial-popup-topic-head';
      topicHead.textContent = topicLabel(g.topic);
      topicEl.appendChild(topicHead);

      for (const sub of g.subtopics) {
        if (sub.subtopic) {
          const subHead = document.createElement('div');
          subHead.className = 'pg-tutorial-popup-subtopic';
          subHead.textContent = subtopicLabel(sub.subtopic);
          topicEl.appendChild(subHead);
        }
        const ul = document.createElement('ul');
        ul.className = 'pg-tutorial-popup-list';
        for (const ls of sub.lessons) {
          ul.appendChild(buildLessonRow(ls, currentLesson, opts.progress, popup));
        }
        topicEl.appendChild(ul);
      }
      popup.appendChild(topicEl);
    }
    return popup;
  }

  function buildLessonRow(
    lesson: Lesson,
    current: Lesson,
    progress: LessonProgressView,
    popup: HTMLElement,
  ): HTMLLIElement {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'pg-tutorial-popup-item';

    const isCurrent = lesson.id === current.id;
    const isCompleted = progress.completed.has(lesson.id);
    const isSkipped = progress.skipped.has(lesson.id);

    if (isCurrent) btn.classList.add('is-current');
    if (isCompleted) btn.classList.add('is-completed');
    if (isSkipped) btn.classList.add('is-skipped');

    const marker = document.createElement('span');
    marker.className = 'pg-tutorial-popup-marker';
    if (isCurrent) {
      marker.textContent = '●';
      marker.title = t('tutorial.marker.current');
    } else if (isCompleted) {
      marker.textContent = '✓';
      marker.title = t('tutorial.marker.completed');
    } else if (isSkipped) {
      marker.textContent = '→';
      marker.title = t('tutorial.marker.skipped');
    } else {
      marker.textContent = '·';
    }
    btn.appendChild(marker);

    const title = document.createElement('span');
    title.className = 'pg-tutorial-popup-title';
    title.textContent = lesson.title;
    btn.appendChild(title);

    btn.addEventListener('click', () => {
      popup.hidden = true;
      onJumpFns.forEach((fn) => fn(lesson.id));
    });

    li.appendChild(btn);
    return li;
  }

  function showCompleted(text: string): void {
    const wrap = document.createElement('div');
    wrap.className = 'pg-tutorial pg-tutorial-done';
    const h = document.createElement('h2');
    h.textContent = t('tutorial.done.title');
    const p = document.createElement('p');
    p.textContent = text;
    wrap.appendChild(h);
    wrap.appendChild(p);
    host.replaceChildren(wrap);
  }

  function setPassed(passed: boolean): void {
    const banner = host.querySelector<HTMLElement>('.pg-tutorial-passed');
    if (banner) banner.style.display = passed ? '' : 'none';
    const next = host.querySelector<HTMLButtonElement>('[data-action="next"]');
    if (next) next.disabled = !passed;
  }

  return {
    showLesson, showCompleted, setPassed,
    onHint(fn) { onHintFns.push(fn); },
    onReset(fn) { onResetFns.push(fn); },
    onSkip(fn) { onSkipFns.push(fn); },
    onNext(fn) { onNextFns.push(fn); },
    onPrev(fn) { onPrevFns.push(fn); },
    onJump(fn) { onJumpFns.push(fn); },
  };
}

function mkBtn(label: string, action: string): HTMLButtonElement {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'pg-btn pg-btn-secondary';
  b.dataset.action = action;
  b.textContent = label;
  return b;
}

/**
 * Resolve a topic slug to a localized label. Falls back to a humanized
 * version of the slug when the corresponding `topic.<slug>` key is missing
 * (so a brand-new topic added by a community PR shows something readable
 * even before the translation is in place).
 */
function topicLabel(slug: string): string {
  const key = `topic.${slug}` as TranslationKey;
  const v = t(key);
  return v === key ? humanize(slug) : v;
}

function subtopicLabel(slug: string): string {
  const key = `subtopic.${slug}` as TranslationKey;
  const v = t(key);
  return v === key ? humanize(slug) : v;
}

function humanize(slug: string): string {
  return slug
    .split(/[-_]/)
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ');
}
