export function countNodes(el: unknown): number {
  if (typeof Element !== 'undefined' && el instanceof Element) {
    return el.querySelectorAll('*').length;
  }
  return 0;
}
