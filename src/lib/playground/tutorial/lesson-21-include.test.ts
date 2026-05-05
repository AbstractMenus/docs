import { describe, expect, test } from 'vitest';
import { parse } from '../hocon/parser';
import { tokenizeText } from '../hocon/tokenize';
import { resolveWorkspace } from '../files/resolve-multi';
import type { Node } from '../hocon/types';
import lesson21 from './lessons/21-include.json';
import { getLesson } from './lessons';

/**
 * Repro-test for the "include not resolved: no tab named `defaults.conf`"
 * bug reported on feature/playground-multi-file-tabs. Loads the literal
 * lesson 21 JSON and exercises the same pipeline runAnalysis() does.
 */
describe('lesson 21 include resolution', () => {
  test('lesson JSON has extraFiles with defaults.conf', () => {
    expect(lesson21.extraFiles).toBeDefined();
    expect(lesson21.extraFiles?.find((f) => f.name === 'defaults.conf')).toBeDefined();
  });

  test('getLesson preserves extraFiles after validateLesson', () => {
    const l = getLesson('21-include');
    expect(l).toBeDefined();
    expect(l?.extraFiles).toBeDefined();
    expect(l?.extraFiles?.length).toBeGreaterThan(0);
    expect(l?.extraFiles?.[0].name).toBe('defaults.conf');
  });

  test('user-typed include "defaults.conf" resolves against extraFiles content', () => {
    // Mimic the exact state after user adds the include line above the starter.
    const menuContent = 'include "defaults.conf"\n' + lesson21.starter;
    const defaultsContent = lesson21.extraFiles![0].content;

    const map = new Map<string, Node>([
      ['menu.conf', parse(tokenizeText(menuContent), menuContent).ast],
      ['defaults.conf', parse(tokenizeText(defaultsContent), defaultsContent).ast],
    ]);
    const r = resolveWorkspace(map, 'menu.conf');

    const notResolved = r.warnings.find((w) => w.code === 'parser.include-not-resolved');
    expect(notResolved, `unexpected include-not-resolved: ${JSON.stringify(notResolved)}`).toBeUndefined();
    // resolved should pick up size + title from menu, defaults from extras.
    expect(r.resolved).toMatchObject({ title: 'Shop', size: 3 });
  });
});
