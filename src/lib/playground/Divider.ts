export interface DividerOptions {
  main: HTMLElement;
  divider: HTMLElement;
  axis: 'horizontal' | 'vertical';
  minPct: number;
  maxPct: number;
  dividerSize?: number;
}

export function createDivider(opts: DividerOptions): { destroy(): void } {
  const dividerSize = opts.dividerSize ?? 6;
  let dragging = false;

  function setLayout(pct: number): void {
    const clamped = Math.min(opts.maxPct, Math.max(opts.minPct, pct));
    if (opts.axis === 'horizontal') {
      opts.main.style.gridTemplateColumns = `${clamped}% ${dividerSize}px ${100 - clamped}%`;
    } else {
      opts.main.style.gridTemplateRows = `${clamped}% ${dividerSize}px ${100 - clamped}%`;
    }
  }

  function onMove(e: MouseEvent): void {
    if (!dragging) return;
    const rect = opts.main.getBoundingClientRect();
    const pct = opts.axis === 'horizontal'
      ? ((e.clientX - rect.left) / rect.width) * 100
      : ((e.clientY - rect.top) / rect.height) * 100;
    setLayout(pct);
  }

  function onUp(): void {
    if (!dragging) return;
    dragging = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }

  function onDown(e: MouseEvent): void {
    e.preventDefault();
    dragging = true;
    document.body.style.cursor = opts.axis === 'horizontal' ? 'col-resize' : 'row-resize';
    document.body.style.userSelect = 'none';
  }

  opts.divider.addEventListener('mousedown', onDown);
  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onUp);

  return {
    destroy(): void {
      opts.divider.removeEventListener('mousedown', onDown);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    },
  };
}
