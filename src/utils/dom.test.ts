import { describe, it, expect } from 'vitest';
import { countNodes } from './dom.ts';

describe('countNodes', () => {
  it('counts child elements of a DOM Element', () => {
    const el = document.createElement('div');
    el.innerHTML = '<span><a></a></span><p></p>';
    expect(countNodes(el)).toBe(3);
  });

  it('returns 0 for non-Element values', () => {
    expect(countNodes(null)).toBe(0);
    expect(countNodes('string')).toBe(0);
    expect(countNodes(42)).toBe(0);
  });

  it('returns 0 when Element is not defined (SSR)', () => {
    const original = globalThis.Element;
    // @ts-expect-error -- simulating SSR environment
    delete globalThis.Element;
    try {
      expect(countNodes({})).toBe(0);
    } finally {
      globalThis.Element = original;
    }
  });
});
