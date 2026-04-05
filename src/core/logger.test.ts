import { describe, it, expect, vi, afterEach } from 'vitest';
import { emitLog } from './logger.ts';
import type { VRTComponentLog, VRTIssue } from '../types.ts';

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

function makeIssue(severity: 'info' | 'warn' | 'error'): VRTIssue {
  return { id: 'slow-mount', severity, metric: 'mountTimeMs', value: 100, threshold: 50 };
}

describe('emitLog', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('logs with [VRT] prefix and JSON by default', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const log = makeLog();
    emitLog(log, {});

    expect(spy).toHaveBeenCalledOnce();
    expect(spy).toHaveBeenCalledWith('[VRT]', JSON.stringify(log));
  });

  it('does not log to console when logToConsole is false', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    emitLog(makeLog(), { logToConsole: false });
    expect(spy).not.toHaveBeenCalled();
  });

  it('calls onLog callback with the log object', () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    const onLog = vi.fn();
    const log = makeLog();
    emitLog(log, { onLog });

    expect(onLog).toHaveBeenCalledOnce();
    expect(onLog).toHaveBeenCalledWith(log);
  });

  it('calls both console.log and onLog when both enabled', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const onLog = vi.fn();
    emitLog(makeLog(), { onLog });

    expect(spy).toHaveBeenCalledOnce();
    expect(onLog).toHaveBeenCalledOnce();
  });

  it('calls onLog even when logToConsole is false', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const onLog = vi.fn();
    emitLog(makeLog(), { logToConsole: false, onLog });

    expect(spy).not.toHaveBeenCalled();
    expect(onLog).toHaveBeenCalledOnce();
  });

  it('uses console.warn for logs with warn-severity issues', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    emitLog(makeLog({ issues: [makeIssue('warn')] }), {});

    expect(logSpy).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledOnce();
  });

  it('uses console.error for logs with error-severity issues', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    emitLog(makeLog({ issues: [makeIssue('error')] }), {});

    expect(logSpy).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledOnce();
  });

  it('uses highest severity when multiple issues exist', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    emitLog(makeLog({ issues: [makeIssue('warn'), makeIssue('error')] }), {});

    expect(warnSpy).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledOnce();
  });

  it('logLevel issues suppresses no-issue logs', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const onLog = vi.fn();
    emitLog(makeLog(), { logLevel: 'issues', onLog });

    expect(spy).not.toHaveBeenCalled();
    expect(onLog).toHaveBeenCalledOnce();
  });

  it('logLevel issues shows logs with issues', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    emitLog(makeLog({ issues: [makeIssue('warn')] }), { logLevel: 'issues' });

    expect(warnSpy).toHaveBeenCalledOnce();
  });

  it('logLevel warn suppresses info-severity logs', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    emitLog(makeLog({ issues: [makeIssue('info')] }), { logLevel: 'warn' });

    expect(spy).not.toHaveBeenCalled();
  });

  it('logLevel warn shows warn-severity logs', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    emitLog(makeLog({ issues: [makeIssue('warn')] }), { logLevel: 'warn' });

    expect(warnSpy).toHaveBeenCalledOnce();
  });

  it('logLevel silent suppresses all console output', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const onLog = vi.fn();
    emitLog(makeLog({ issues: [makeIssue('error')] }), { logLevel: 'silent', onLog });

    expect(logSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
    expect(onLog).toHaveBeenCalledOnce();
  });

  it('onLog receives all logs regardless of logLevel', () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    const onLog = vi.fn();
    emitLog(makeLog(), { logLevel: 'silent', onLog });
    emitLog(makeLog({ issues: [makeIssue('warn')] }), { logLevel: 'error', onLog });

    expect(onLog).toHaveBeenCalledTimes(2);
  });
});
