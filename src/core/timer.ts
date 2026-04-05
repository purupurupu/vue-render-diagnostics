export interface TimerHandle {
  stop: () => number;
}

export function startTimer(): TimerHandle {
  const start = performance.now();
  return {
    stop: () => performance.now() - start,
  };
}

export interface PaintHandle {
  cancel: () => void;
}

export function measurePaint(callback: (paintTimeMs: number) => void): PaintHandle {
  if (typeof requestAnimationFrame === 'undefined') {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) callback(0);
    });
    return {
      cancel: () => {
        cancelled = true;
      },
    };
  }
  let cancelled = false;
  const start = performance.now();
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (!cancelled) callback(performance.now() - start);
    });
  });
  return {
    cancel: () => {
      cancelled = true;
    },
  };
}
