import { deflate, inflate } from 'pako';

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
