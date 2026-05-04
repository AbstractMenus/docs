import { describe, test, expect } from 'vitest';
import { encodeShare, decodeShare } from './share-url';

describe('share-url round-trip', () => {
  test('empty string', () => {
    const enc = encodeShare('');
    expect(decodeShare(enc)).toBe('');
  });

  test('simple ASCII', () => {
    const text = 'title = "Hello"';
    expect(decodeShare(encodeShare(text))).toBe(text);
  });

  test('multi-byte (Russian)', () => {
    const text = 'title = "Привет мир"';
    expect(decodeShare(encodeShare(text))).toBe(text);
  });

  test('large config compresses smaller than raw', () => {
    const text = ('item = { material = STONE }\n').repeat(200);
    const enc = encodeShare(text);
    expect(decodeShare(enc)).toBe(text);
    expect(enc.length).toBeLessThan(text.length);
  });

  test('encoded uses URL-safe alphabet only', () => {
    const enc = encodeShare('a = 1\nb = 2');
    expect(/[+/=]/.test(enc)).toBe(false);
  });

  test('decode returns null on garbage', () => {
    expect(decodeShare('not-base64!!!')).toBeNull();
  });
});
