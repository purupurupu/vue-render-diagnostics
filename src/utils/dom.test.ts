import { describe, it, expect, vi } from 'vitest';
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
    vi.stubGlobal('Element', undefined);
    try {
      expect(countNodes({})).toBe(0);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
