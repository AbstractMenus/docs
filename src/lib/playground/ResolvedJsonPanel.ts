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
    pre.innerHTML = highlightJson(json);
    wrap.appendChild(btn);
    wrap.appendChild(pre);
    panel.replaceChildren(wrap);
  }
  return { update };
}

/**
 * Cheap regex-based JSON syntax highlighter. Wraps strings/numbers/keywords
 * into span classes consistent with the editor token palette.
 * HTML-escapes input first so it's safe to inject as innerHTML.
 */
export function highlightJson(json: string): string {
  const escaped = json
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Order matters: keys (string before colon) first, then plain strings,
  // then keywords/numbers.
  return escaped.replace(
    /("(?:\\.|[^"\\])*"(?=\s*:))|("(?:\\.|[^"\\])*")|\b(true|false)\b|\b(null)\b|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g,
    (_m, key, str, bool, nul, num) => {
      if (key !== undefined) return `<span class="pg-json-key">${key}</span>`;
      if (str !== undefined) return `<span class="pg-json-str">${str}</span>`;
      if (bool !== undefined) return `<span class="pg-json-bool">${bool}</span>`;
      if (nul !== undefined) return `<span class="pg-json-null">${nul}</span>`;
      if (num !== undefined) return `<span class="pg-json-num">${num}</span>`;
      return _m;
    },
  );
}
