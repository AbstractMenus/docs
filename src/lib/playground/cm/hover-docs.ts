import { hoverTooltip } from '@codemirror/view';
import { findKeyDef } from '../catalog';
import { describeKeyDef } from '../catalog/i18n';

export function hoverDocs() {
  return hoverTooltip((view, pos) => {
    const text = view.state.doc.toString();
    const wordRe = /[A-Za-z_][\w-]*/;
    let start = pos;
    while (start > 0 && wordRe.test(text[start - 1] ?? '')) start--;
    let end = pos;
    while (end < text.length && wordRe.test(text[end] ?? '')) end++;
    if (start === end) return null;
    const word = text.slice(start, end);
    const def = findKeyDef(word);
    if (!def) return null;
    return {
      pos: start,
      end,
      above: true,
      create() {
        const dom = document.createElement('div');
        dom.className = 'pg-hover';
        const head = document.createElement('div');
        head.className = 'pg-hover-head';
        head.textContent = `${def.name} : ${def.valueType === 'enum' ? `enum<${def.enumRef}>` : def.valueType}`;
        const body = document.createElement('div');
        body.className = 'pg-hover-body';
        body.textContent = describeKeyDef(def);
        dom.appendChild(head);
        dom.appendChild(body);
        return { dom };
      },
    };
  });
}
