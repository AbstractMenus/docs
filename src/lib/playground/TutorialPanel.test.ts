import { describe, test, expect, beforeEach } from 'vitest';
import { createTutorialPanel } from './TutorialPanel';
import type { Lesson } from './tutorial/types';

const LESSON: Lesson = {
  id: '00-introduction',
  title: 'Introduction',
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

describe('TutorialPanel', () => {
  beforeEach(() => { document.body.innerHTML = ''; });

  test('renders title, intro, goal', () => {
    const p = createTutorialPanel(dom());
    p.showLesson(LESSON, { hintsUsed: 0, passed: false });
    expect(document.body.textContent).toContain('Introduction');
    expect(document.body.textContent).toContain('Welcome');
    expect(document.body.textContent).toContain('Set title');
  });

  test('hint button triggers callback', () => {
    const p = createTutorialPanel(dom());
    let clicked = false;
    p.onHint(() => { clicked = true; });
    p.showLesson(LESSON, { hintsUsed: 0, passed: false });
    document.querySelector<HTMLButtonElement>('[data-action="hint"]')!.click();
    expect(clicked).toBe(true);
  });

  test('reveals progressively more hints based on hintsUsed', () => {
    const p = createTutorialPanel(dom());
    p.showLesson(LESSON, { hintsUsed: 2, passed: false });
    expect(document.body.textContent).toContain('hint1');
    expect(document.body.textContent).toContain('hint2');
    expect(document.body.textContent).not.toContain('hint3');
  });

  test('next button disabled until passed', () => {
    const p = createTutorialPanel(dom());
    p.showLesson(LESSON, { hintsUsed: 0, passed: false });
    const next = document.querySelector<HTMLButtonElement>('[data-action="next"]')!;
    expect(next.disabled).toBe(true);
    p.setPassed(true);
    expect(next.disabled).toBe(false);
  });

  test('passed state shows goal-reached banner', () => {
    const p = createTutorialPanel(dom());
    p.showLesson(LESSON, { hintsUsed: 0, passed: true });
    const banner = document.querySelector<HTMLElement>('.pg-tutorial-passed');
    expect(banner).not.toBeNull();
    expect(banner!.style.display).not.toBe('none');
  });
});
