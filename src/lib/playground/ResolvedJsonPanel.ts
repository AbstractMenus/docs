export interface ResolvedJsonPanelApi {
  update(value: unknown): void;
}

export function createResolvedJsonPanel(panel: HTMLElement): ResolvedJsonPanelApi {
  function update(value: unknown): void {
    const json = value === undefined ? 'undefined' : JSON.stringify(value, null, 2);
    const wrap = document.createElement('div');
    wrap.className = 'pg-json-wrap';

    const desc = document.createElement('div');
    desc.className = 'pg-json-desc';
    desc.textContent =
      'How AbstractMenus sees your config after HOCON resolves substitutions, dotted keys, and overrides. Use this to verify that ${vars} expand correctly and that nested objects flatten the way you expect.';
    wrap.appendChild(desc);

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'pg-btn pg-btn-secondary pg-json-copy';
    btn.textContent = 'Copy';
    btn.dataset.action = 'copy-json';
    btn.addEventListener('click', () => {
      navigator.clipboard?.writeText(json).catch(() => {});
    });
    const pre = document.createElement('pre');
    pre.className = 'pg-json';
    pre.textContent = json;
    wrap.appendChild(btn);
    wrap.appendChild(pre);
    panel.replaceChildren(wrap);
  }
  return { update };
}
