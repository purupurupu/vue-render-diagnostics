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
  const start = performance.now();
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      callback(performance.now() - start);
    });
  });
}
