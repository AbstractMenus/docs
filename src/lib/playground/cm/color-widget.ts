import { Decoration, type DecorationSet, EditorView, ViewPlugin, type ViewUpdate, WidgetType } from '@codemirror/view';
import { RangeSetBuilder } from '@codemirror/state';

type ColorKind = 'hex-quoted' | 'rgb-list' | 'empty';

interface ColorMatch {
  /** start of the value (inclusive); equal to `to` when value is empty */
  from: number;
  /** end of the value (exclusive) */
  to: number;
  hex: string;
  kind: ColorKind;
}

const COLOR_PREFIX_RE = /\bcolor\s*[=:]\s*/g;
const HEX_QUOTED_RE = /^"#([0-9A-Fa-f]{6})"$/;
const RGB_LIST_RE = /^\[\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\]$/;
const EMPTY_VALUE_RE = /^[ \t]*(?:#|\/\/|$)/;
const DEFAULT_HEX = '#ffffff';

export function findColorMatches(text: string, baseOffset = 0): ColorMatch[] {
  const out: ColorMatch[] = [];
  COLOR_PREFIX_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = COLOR_PREFIX_RE.exec(text)) !== null) {
    const valueStart = m.index + m[0].length;
    const lineEnd = nextLineBreak(text, valueStart);
    const rest = text.slice(valueStart, lineEnd);

    const hexM = /^"#[0-9A-Fa-f]{6}"/.exec(rest);
    if (hexM) {
      const parsed = parseColorValue(hexM[0])!;
      out.push({
        from: baseOffset + valueStart,
        to: baseOffset + valueStart + hexM[0].length,
        hex: parsed.hex,
        kind: parsed.kind,
      });
      continue;
    }

    const rgbM = /^\[\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\]/.exec(rest);
    if (rgbM) {
      const parsed = parseColorValue(rgbM[0])!;
      out.push({
        from: baseOffset + valueStart,
        to: baseOffset + valueStart + rgbM[0].length,
        hex: parsed.hex,
        kind: parsed.kind,
      });
      continue;
    }

    if (EMPTY_VALUE_RE.test(rest)) {
      // No value yet, or only whitespace before a comment / newline.
      // Show a swatch anyway so the user can pick one and we'll insert a hex.
      out.push({
        from: baseOffset + valueStart,
        to: baseOffset + valueStart,
        hex: DEFAULT_HEX,
        kind: 'empty',
      });
      continue;
    }

    // Otherwise the value is something else (named color, substitution, etc.)
    // - leave it alone, no swatch.
  }
  return out;
}

function nextLineBreak(text: string, from: number): number {
  const i = text.indexOf('\n', from);
  return i === -1 ? text.length : i;
}

export function parseColorValue(value: string): { hex: string; kind: ColorKind } | null {
  const hexM = HEX_QUOTED_RE.exec(value);
  if (hexM) return { hex: '#' + hexM[1].toLowerCase(), kind: 'hex-quoted' };
  const rgbM = RGB_LIST_RE.exec(value);
  if (rgbM) {
    const r = clamp(+rgbM[1]);
    const g = clamp(+rgbM[2]);
    const b = clamp(+rgbM[3]);
    return { hex: rgbToHex(r, g, b), kind: 'rgb-list' };
  }
  return null;
}

export function formatColorValue(hex: string, kind: ColorKind): string {
  if (kind === 'rgb-list') {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `[${r}, ${g}, ${b}]`;
  }
  // 'hex-quoted' and 'empty' both write hex form; hex is the priority/default.
  return `"${hex}"`;
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('');
}

function clamp(n: number): number {
  return Math.max(0, Math.min(255, n));
}

class ColorSwatchWidget extends WidgetType {
  constructor(
    readonly hex: string,
    readonly from: number,
    readonly to: number,
    readonly kind: ColorKind,
  ) {
    super();
  }

  eq(other: ColorSwatchWidget): boolean {
    return other.hex === this.hex && other.from === this.from && other.to === this.to;
  }

  toDOM(view: EditorView): HTMLElement {
    const el = document.createElement('span');
    el.className = 'pg-color-swatch';
    if (this.kind === 'empty') el.classList.add('is-empty');
    el.style.background = this.hex;
    el.title = this.kind === 'empty' ? 'Click to pick a color' : `${this.hex} - click to change`;
    el.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const input = document.createElement('input');
      input.type = 'color';
      input.value = this.hex;
      input.style.position = 'fixed';
      input.style.left = '-9999px';
      document.body.appendChild(input);
      input.addEventListener('change', () => {
        const newHex = input.value;
        const replacement = formatColorValue(newHex, this.kind);
        view.dispatch({
          changes: { from: this.from, to: this.to, insert: replacement },
        });
        document.body.removeChild(input);
      });
      input.addEventListener('blur', () => {
        if (input.parentNode) document.body.removeChild(input);
      }, { once: true });
      input.click();
    });
    return el;
  }

  ignoreEvent(): boolean {
    return false;
  }
}

function buildDecorations(view: EditorView): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();
  for (const { from, to } of view.visibleRanges) {
    const text = view.state.doc.sliceString(from, to);
    const matches = findColorMatches(text, from);
    for (const m of matches) {
      const widget = Decoration.widget({
        widget: new ColorSwatchWidget(m.hex, m.from, m.to, m.kind),
        side: 1,
      });
      builder.add(m.to, m.to, widget);
    }
  }
  return builder.finish();
}

export function colorSwatches() {
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;
      constructor(view: EditorView) {
        this.decorations = buildDecorations(view);
      }
      update(u: ViewUpdate): void {
        if (u.docChanged || u.viewportChanged) {
          this.decorations = buildDecorations(u.view);
        }
      }
    },
    {
      decorations: (v) => v.decorations,
    },
  );
}
