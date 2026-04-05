/**
 * Count descendant elements. Returns 0 for non-Element nodes
 * (e.g., fragment-root components where $el is a Text or Comment node).
 */
export function countNodes(el: unknown): number {
  if (typeof Element !== 'undefined' && el instanceof Element) {
    return el.querySelectorAll('*').length;
  }
  return 0;
}
