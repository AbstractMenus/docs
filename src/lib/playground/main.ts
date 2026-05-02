import { PlaygroundApp } from './PlaygroundApp';

export function boot(): void {
  const root = document.querySelector<HTMLElement>('[data-pg-root]');
  if (!root) {
    console.warn('[playground] root not found');
    return;
  }
  try {
    new PlaygroundApp(root).start();
  } catch (e) {
    console.error('[playground] failed to start', e);
  }
}
