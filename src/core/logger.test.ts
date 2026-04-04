import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { emitLog } from './logger.ts';
import type { VRTComponentLog } from '../types.ts';

function makeLog(overrides: Partial<VRTComponentLog> = {}): VRTComponentLog {
  return {
    type: 'vrt:component',
    component: 'TestComponent',
    timestamp: 1710000000000,
    metrics: {
      mountTimeMs: 10,
      paintTimeMs: 10,
      updateCount: 0,
      avgUpdateMs: 0,
      maxUpdateMs: 0,
      nodeCount: 100,
    },
    signals: {
      hasAsyncInSetup: false,
      dataUpdateDetected: false,
    },
    issues: [],
    ...overrides,
  };
}

describe('emitLog', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('logs with [VRT] prefix and JSON by default', () => {
    const log = makeLog();
    emitLog(log, {});

    expect(consoleSpy).toHaveBeenCalledOnce();
    expect(consoleSpy).toHaveBeenCalledWith('[VRT]', JSON.stringify(log));
  });

  it('does not log to console when logToConsole is false', () => {
    emitLog(makeLog(), { logToConsole: false });
    expect(consoleSpy).not.toHaveBeenCalled();
  });

  it('calls onLog callback with the log object', () => {
    const onLog = vi.fn();
    const log = makeLog();
    emitLog(log, { onLog });

    expect(onLog).toHaveBeenCalledOnce();
    expect(onLog).toHaveBeenCalledWith(log);
  });

  it('calls both console.log and onLog when both enabled', () => {
    const onLog = vi.fn();
    emitLog(makeLog(), { onLog });

    expect(consoleSpy).toHaveBeenCalledOnce();
    expect(onLog).toHaveBeenCalledOnce();
  });

  it('calls onLog even when logToConsole is false', () => {
    const onLog = vi.fn();
    emitLog(makeLog(), { logToConsole: false, onLog });

    expect(consoleSpy).not.toHaveBeenCalled();
    expect(onLog).toHaveBeenCalledOnce();
  });
});
