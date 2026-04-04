export function countNodes(el: unknown): number {
  if (el instanceof Element) {
    return el.querySelectorAll('*').length;
  }
  return 0;
}
