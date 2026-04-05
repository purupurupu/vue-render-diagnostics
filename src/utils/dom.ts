/**
 * Count descendant elements. Returns 0 for non-Element nodes
 * (e.g., fragment-root components where $el is a Text or Comment node).
 *
 * querySelectorAll can throw NotSupportedError in edge cases:
 * - Disconnected DOM trees
 * - Certain SVG elements in some browsers
 * - Shadow DOM boundaries
 * Returning 0 in those cases is consistent with fragment-root behavior.
 */
export function countNodes(el: unknown): number {
  if (typeof Element !== 'undefined' && el instanceof Element) {
    try {
      return el.querySelectorAll('*').length;
    } catch {
      return 0;
    }
  }
  return 0;
}
