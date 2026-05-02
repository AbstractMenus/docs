import { describe, test, expect, beforeEach } from 'vitest';
import { createTutorialPanel, type ShowLessonOpts } from './TutorialPanel';
import type { Lesson } from './tutorial/types';

const LESSON: Lesson = {
  id: '00-introduction',
  title: 'Introduction',
  topic: 'basics',
  intro: 'Welcome',
  starter: 'title = ""',
  goal: 'Set title',
  check: { type: 'regex', pattern: 'title' },
  hints: ['hint1', 'hint2', 'hint3'],
  next: '01-comments',
};

function dom(): HTMLElement {
  document.body.innerHTML = '<div data-panel="tutorial"></div>';
  return document.querySelector<HTMLElement>('[data-panel="tutorial"]')!;
}

function mkOpts(overrides: Partial<ShowLessonOpts> = {}): ShowLessonOpts {
  return {
    hintsUsed: 0,
    passed: false,
    position: 1,
    total: 1,
    allLessons: [LESSON],
    progress: { completed: new Set(), skipped: new Set() },
    hasPrev: false,
    ...overrides,
  };
}

describe('TutorialPanel', () => {
  beforeEach(() => { document.body.innerHTML = ''; });

  test('renders title, intro, goal', () => {
    const p = createTutorialPanel(dom());
    p.showLesson(LESSON, mkOpts());
    expect(document.body.textContent).toContain('Introduction');
    expect(document.body.textContent).toContain('Welcome');
    expect(document.body.textContent).toContain('Set title');
  });

  test('hint button triggers callback', () => {
    const p = createTutorialPanel(dom());
    let clicked = false;
    p.onHint(() => { clicked = true; });
    p.showLesson(LESSON, mkOpts());
    document.querySelector<HTMLButtonElement>('[data-action="hint"]')!.click();
    expect(clicked).toBe(true);
  });

  test('reveals progressively more hints based on hintsUsed', () => {
    const p = createTutorialPanel(dom());
    p.showLesson(LESSON, mkOpts({ hintsUsed: 2 }));
    expect(document.body.textContent).toContain('hint1');
    expect(document.body.textContent).toContain('hint2');
    expect(document.body.textContent).not.toContain('hint3');
  });

  test('next button disabled until passed', () => {
    const p = createTutorialPanel(dom());
    p.showLesson(LESSON, mkOpts());
    const next = document.querySelector<HTMLButtonElement>('[data-action="next"]')!;
    expect(next.disabled).toBe(true);
    p.setPassed(true);
    expect(next.disabled).toBe(false);
  });

  test('passed state shows goal-reached banner', () => {
    const p = createTutorialPanel(dom());
    p.showLesson(LESSON, mkOpts({ passed: true }));
    const banner = document.querySelector<HTMLElement>('.pg-tutorial-passed');
    expect(banner).not.toBeNull();
    expect(banner!.style.display).not.toBe('none');
  });

  test('breadcrumb shows topic + counter', () => {
    const p = createTutorialPanel(dom());
    p.showLesson(LESSON, mkOpts({ position: 3, total: 12 }));
    expect(document.body.textContent).toMatch(/Basics/);
    expect(document.body.textContent).toMatch(/3.*12|3 \/ 12/);
  });

  test('Prev disabled when no previous lesson', () => {
    const p = createTutorialPanel(dom());
    p.showLesson(LESSON, mkOpts({ hasPrev: false }));
    const prev = document.querySelector<HTMLButtonElement>('[data-action="prev"]')!;
    expect(prev.disabled).toBe(true);
  });

  test('Prev fires callback when enabled', () => {
    const p = createTutorialPanel(dom());
    let fired = false;
    p.onPrev(() => { fired = true; });
    p.showLesson(LESSON, mkOpts({ hasPrev: true }));
    document.querySelector<HTMLButtonElement>('[data-action="prev"]')!.click();
    expect(fired).toBe(true);
  });

  test('lessons popup renders all lessons grouped by topic, fires onJump', () => {
    const second: Lesson = {
      ...LESSON,
      id: '01-comments',
      title: 'Comments',
      topic: 'basics',
    };
    const p = createTutorialPanel(dom());
    let jumped: string | null = null;
    p.onJump((id) => { jumped = id; });
    p.showLesson(LESSON, mkOpts({
      position: 1,
      total: 2,
      allLessons: [LESSON, second],
      progress: { completed: new Set(['01-comments']), skipped: new Set() },
    }));

    // Open popup, then click the second lesson row
    document.querySelector<HTMLButtonElement>('[data-action="all-lessons"]')!.click();
    const items = document.querySelectorAll<HTMLButtonElement>('.pg-tutorial-popup-item');
    expect(items.length).toBe(2);
    // Completed marker is on the second lesson
    expect(items[1].classList.contains('is-completed')).toBe(true);
    // Current marker on the first
    expect(items[0].classList.contains('is-current')).toBe(true);
    items[1].click();
    expect(jumped).toBe('01-comments');
  });
});
