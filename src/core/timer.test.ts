import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { startTimer, measurePaint } from './timer.ts';

describe('startTimer', () => {
  beforeEach(() => {
    let now = 0;
    vi.spyOn(performance, 'now').mockImplementation(() => now++);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns elapsed time in ms', () => {
    const handle = startTimer();
    const elapsed = handle.stop();
    expect(elapsed).toBe(1);
  });

  it('can be stopped multiple times returning different values', () => {
    const handle = startTimer();
    const first = handle.stop();
    const second = handle.stop();
    expect(second).toBeGreaterThan(first);
  });
});

describe('measurePaint', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('calls callback after double rAF with elapsed time', async () => {
    const callback = vi.fn();
    measurePaint(callback);

    expect(callback).not.toHaveBeenCalled();

    await vi.advanceTimersToNextFrame();
    expect(callback).not.toHaveBeenCalled();

    await vi.advanceTimersToNextFrame();
    expect(callback).toHaveBeenCalledOnce();
    expect(callback).toHaveBeenCalledWith(expect.any(Number));
  });

  it('calls callback synchronously with 0 when requestAnimationFrame is unavailable', () => {
    vi.stubGlobal('requestAnimationFrame', undefined);
    try {
      const callback = vi.fn();
      measurePaint(callback);
      expect(callback).toHaveBeenCalledOnce();
      expect(callback).toHaveBeenCalledWith(0);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
