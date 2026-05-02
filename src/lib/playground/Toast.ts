let activeTimer: ReturnType<typeof setTimeout> | undefined;

export function showToast(message: string, duration = 1500): void {
  let el = document.querySelector<HTMLDivElement>('.pg-toast');
  if (!el) {
    el = document.createElement('div');
    el.className = 'pg-toast';
    document.body.appendChild(el);
  }
  el.textContent = message;
  el.classList.add('is-visible');
  if (activeTimer) clearTimeout(activeTimer);
  activeTimer = setTimeout(() => {
    el!.classList.remove('is-visible');
  }, duration);
}
