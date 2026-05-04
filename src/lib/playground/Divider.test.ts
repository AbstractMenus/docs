import { describe, test, expect, beforeEach } from 'vitest';
import { createDivider } from './Divider';

function setupDom(): { main: HTMLElement; divider: HTMLElement } {
  document.body.innerHTML = `
    <div class="pg-main" style="display:grid;grid-template-columns:1fr 6px 1fr;width:1000px;">
      <section class="pg-pane pg-pane-editor"></section>
      <div class="pg-divider" data-pg-divider></div>
      <section class="pg-pane pg-pane-output"></section>
    </div>`;
  const main = document.querySelector<HTMLElement>('.pg-main')!;
  const divider = document.querySelector<HTMLElement>('[data-pg-divider]')!;
  return { main, divider };
}

function stubRect(el: HTMLElement, width: number, height: number): void {
  Object.defineProperty(el, 'getBoundingClientRect', {
    value: () => ({
      left: 0, top: 0, width, height, right: width, bottom: height, x: 0, y: 0,
      toJSON() { return {}; },
    }),
  });
}

describe('Divider', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  test('drag updates grid-template-columns horizontally', () => {
    const { main, divider } = setupDom();
    stubRect(main, 1000, 600);
    createDivider({ main, divider, axis: 'horizontal', minPct: 10, maxPct: 90 });

    divider.dispatchEvent(new MouseEvent('mousedown', { clientX: 500, clientY: 300, bubbles: true }));
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 700, clientY: 300, bubbles: true }));
    window.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));

    expect(main.style.gridTemplateColumns).toMatch(/70%/);
  });

  test('clamps to minPct/maxPct', () => {
    const { main, divider } = setupDom();
    stubRect(main, 1000, 600);
    createDivider({ main, divider, axis: 'horizontal', minPct: 20, maxPct: 80 });

    divider.dispatchEvent(new MouseEvent('mousedown', { clientX: 500, clientY: 300, bubbles: true }));
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 50, clientY: 300, bubbles: true }));
    window.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));

    expect(main.style.gridTemplateColumns).toMatch(/20%/);
  });

  test('vertical axis updates grid-template-rows', () => {
    const { main, divider } = setupDom();
    stubRect(main, 600, 1000);
    createDivider({ main, divider, axis: 'vertical', minPct: 10, maxPct: 90 });

    divider.dispatchEvent(new MouseEvent('mousedown', { clientX: 300, clientY: 500, bubbles: true }));
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 300, clientY: 300, bubbles: true }));
    window.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));

    expect(main.style.gridTemplateRows).toMatch(/30%/);
  });
});
