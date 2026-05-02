import type { Lesson } from './tutorial/types';
import { renderMd } from './tutorial/markdown';
import { t } from './i18n';

type Listener = () => void;

export interface TutorialPanelApi {
  showLesson(lesson: Lesson, opts: { hintsUsed: number; passed: boolean }): void;
  showCompleted(text: string): void;
  setPassed(passed: boolean): void;
  onHint(fn: Listener): void;
  onReset(fn: Listener): void;
  onSkip(fn: Listener): void;
  onNext(fn: Listener): void;
}

export function createTutorialPanel(host: HTMLElement): TutorialPanelApi {
  const onHintFns: Listener[] = [];
  const onResetFns: Listener[] = [];
  const onSkipFns: Listener[] = [];
  const onNextFns: Listener[] = [];

  function showLesson(lesson: Lesson, opts: { hintsUsed: number; passed: boolean }): void {
    const wrap = document.createElement('div');
    wrap.className = 'pg-tutorial';

    const head = document.createElement('header');
    head.className = 'pg-tutorial-head';
    const h = document.createElement('h2');
    h.className = 'pg-tutorial-title';
    h.textContent = lesson.title;
    head.appendChild(h);

    const banner = document.createElement('div');
    banner.className = 'pg-tutorial-passed';
    banner.textContent = t('tutorial.passed');
    if (!opts.passed) banner.style.display = 'none';
    head.appendChild(banner);

    wrap.appendChild(head);

    const intro = document.createElement('div');
    intro.className = 'pg-tutorial-intro';
    intro.innerHTML = renderMd(lesson.intro);
    wrap.appendChild(intro);

    const goal = document.createElement('div');
    goal.className = 'pg-tutorial-goal';
    const goalLabel = document.createElement('strong');
    goalLabel.textContent = t('tutorial.goalLabel');
    goal.appendChild(goalLabel);
    goal.appendChild(document.createTextNode(lesson.goal));
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

    const actions = document.createElement('div');
    actions.className = 'pg-tutorial-actions';

    const hintBtn = mkBtn(t('tutorial.btn.hint'), 'hint');
    if (opts.hintsUsed >= lesson.hints.length) hintBtn.disabled = true;
    actions.appendChild(hintBtn);

    actions.appendChild(mkBtn(t('tutorial.btn.reset'), 'reset'));
    actions.appendChild(mkBtn(t('tutorial.btn.skip'), 'skip'));

    const nextBtn = mkBtn(t('tutorial.btn.next'), 'next');
    nextBtn.classList.add('pg-btn-primary');
    nextBtn.disabled = !opts.passed;
    actions.appendChild(nextBtn);

    wrap.appendChild(actions);

    host.replaceChildren(wrap);

    hintBtn.addEventListener('click', () => onHintFns.forEach((fn) => fn()));
    actions.querySelector<HTMLButtonElement>('[data-action="reset"]')!.addEventListener('click', () => onResetFns.forEach((fn) => fn()));
    actions.querySelector<HTMLButtonElement>('[data-action="skip"]')!.addEventListener('click', () => onSkipFns.forEach((fn) => fn()));
    nextBtn.addEventListener('click', () => onNextFns.forEach((fn) => fn()));
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
