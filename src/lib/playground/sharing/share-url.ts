import { deflate, inflate } from 'pako';
import type { TabFile, Workspace } from '../files/types';
import { newTabFile } from '../files/workspace';

export function encodeShare(text: string): string {
  const bytes = new TextEncoder().encode(text);
  const deflated = deflate(bytes);
  return urlSafeBase64Encode(deflated);
}

export function decodeShare(encoded: string): string | null {
  try {
    const bytes = urlSafeBase64Decode(encoded);
    const inflated = inflate(bytes);
    return new TextDecoder().decode(inflated);
  } catch {
    return null;
  }
}

function urlSafeBase64Encode(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  const b64 = btoa(bin);
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '~');
}

function urlSafeBase64Decode(s: string): Uint8Array {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/').replace(/~/g, '=');
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

// ---------------------------------------------------------------------------
// v2: workspace-aware share URL
// ---------------------------------------------------------------------------

export const MAX_SHARE_URL_LEN = 8000;

interface SharedV2 {
  v: 2;
  tabs: { name: string; content: string }[];
  /** Active tab name (not id - ids are regenerated on the receiver). */
  active: string;
}

/**
 * Encode a workspace into a URL-safe deflated base64 string. The payload is
 * a JSON object `{ v: 2, tabs, active }` where `active` references a tab by
 * name (ids are not transferred - the receiver re-generates them).
 */
export function encodeWorkspace(ws: Workspace): string {
  const active =
    ws.tabs.find((t) => t.id === ws.activeTabId)?.name ?? ws.tabs[0]?.name ?? 'menu.conf';
  const payload: SharedV2 = {
    v: 2,
    tabs: ws.tabs.map((t) => ({ name: t.name, content: t.content })),
    active,
  };
  return encodeShare(JSON.stringify(payload));
}

/**
 * Decode an encoded share string into a Workspace. Tries v2 (JSON payload)
 * first; if the payload isn't v2 JSON, falls back to v1 (raw config string)
 * and wraps it in a single `menu.conf` tab. Returns null on garbage input.
 */
export function decodeWorkspace(encoded: string): Workspace | null {
  if (!encoded) return null;

  const json = decodeShare(encoded);
  if (json !== null) {
    try {
      const parsed = JSON.parse(json) as Partial<SharedV2> | unknown;
      if (
        parsed &&
        typeof parsed === 'object' &&
        (parsed as SharedV2).v === 2 &&
        Array.isArray((parsed as SharedV2).tabs)
      ) {
        const p = parsed as SharedV2;
        const tabs: TabFile[] = p.tabs.map((t) => newTabFile(t.name, t.content));
        if (tabs.length === 0) return null;
        const active = tabs.find((t) => t.name === p.active) ?? tabs[0];
        return { v: 2, tabs, activeTabId: active.id };
      }
      // v2 parse succeeded but shape didn't match - fall through to legacy.
    } catch {
      // not JSON - fall through to legacy single-string handling below.
    }
    // Treat the decoded text as a legacy v1 raw config.
    const tab = newTabFile('menu.conf', json);
    return { v: 2, tabs: [tab], activeTabId: tab.id };
  }

  return null;
}

/**
 * Build the full share URL for the current page + workspace and decide if it
 * fits under MAX_SHARE_URL_LEN. Returns `{ ok: true, url }` when it fits, or
 * `{ ok: false, length }` so callers can warn the user.
 */
export function buildShareUrl(
  ws: Workspace,
): { ok: true; url: string } | { ok: false; length: number } {
  const encoded = encodeWorkspace(ws);
  const url = `${window.location.origin}${window.location.pathname}#config=${encoded}`;
  if (url.length > MAX_SHARE_URL_LEN) return { ok: false, length: url.length };
  return { ok: true, url };
}
