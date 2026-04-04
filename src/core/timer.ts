export interface TimerHandle {
  stop: () => number;
}

export function startTimer(): TimerHandle {
  const start = performance.now();
  return {
    stop: () => performance.now() - start,
  };
}

export function measurePaint(callback: (paintTimeMs: number) => void): void {
  if (typeof requestAnimationFrame === 'undefined') {
    // SSR: no rAF available, call back synchronously with 0
    callback(0);
    return;
  }
  const start = performance.now();
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      callback(performance.now() - start);
    });
  });
}
