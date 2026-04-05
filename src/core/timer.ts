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
  let cancelled = false;
  const handle: PaintHandle = {
    cancel: () => {
      cancelled = true;
    },
  };

  if (typeof requestAnimationFrame === 'undefined') {
    queueMicrotask(() => {
      if (!cancelled) callback(0);
    });
  } else {
    const start = performance.now();
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!cancelled) callback(performance.now() - start);
      });
    });
  }

  return handle;
}
